import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { evaluateEssay, parseRubric } from "./gemini";
import { getFileContent } from "./google-drive";
import { isDocxMarker, extractDocxBase64, parseDocxFromBase64 } from "./file-parser";
import { z } from "zod";
import { auth } from "express-openid-connect";

// Extend session data to include user info
declare module 'express-openid-connect' {
  interface SessionData {
    userId?: string;
    userEmail?: string;
    userName?: string;
  }
}

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || "";
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID || "";
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET || "";
const BASE_URL = process.env.REPL_SLUG 
  ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` 
  : "http://localhost:5000";

// Middleware to check if user is authenticated
function requireAuth(req: any, res: any, next: any) {
  if (!req.oidc.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Auth0 middleware
  const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.SESSION_SECRET || "your-secret-key-change-this",
    baseURL: BASE_URL,
    clientID: AUTH0_CLIENT_ID,
    issuerBaseURL: `https://${AUTH0_DOMAIN}`,
    clientSecret: AUTH0_CLIENT_SECRET,
    authorizationParams: {
      response_type: 'code',
      scope: 'openid profile email',
    },
  };

  app.use(auth(config));

  // Middleware to sync Auth0 user with database
  app.use(async (req, res, next) => {
    if (req.oidc.isAuthenticated() && req.oidc.user) {
      const { sub, email, name } = req.oidc.user;

      if (email) {
        let user = await storage.getUserByGoogleId(sub);

        if (!user) {
          user = await storage.createUser({
            email,
            name: name || null,
            googleId: sub,
          });
        }

        (req as any).userId = user.id;
        (req as any).userEmail = user.email;
        (req as any).userName = user.name;
      }
    }
    next();
  });

  // GET /auth/logout - Logout user
  app.get("/auth/logout", (req, res) => {
    res.oidc.logout({ returnTo: `${BASE_URL}/login` });
  });

  // GET /api/auth/status - Check authentication status
  app.get("/api/auth/status", (req, res) => {
    if (req.oidc.isAuthenticated() && (req as any).userId) {
      res.json({
        authenticated: true,
        user: {
          id: (req as any).userId,
          email: (req as any).userEmail,
          name: (req as any).userName,
        },
      });
    } else {
      res.json({ authenticated: false });
    }
  });

  // Schema for essay submission
  const submitEvaluationSchema = z.object({
    essayTitle: z.string().min(1),
    essayContent: z.string().min(50),
    rubricName: z.string().min(1),
    rubricContent: z.string().min(10),
    gradeLevel: z.string().min(1),
    essayDriveFileId: z.string().optional(),
    rubricDriveFileId: z.string().optional(),
  });

  // POST /api/evaluations/submit - Submit essay and rubric for evaluation
  app.post("/api/evaluations/submit", requireAuth, async (req, res) => {
    try {
      const data = submitEvaluationSchema.parse(req.body);
      const userId = (req as any).userId;

      // Get essay content (from Drive if file ID provided, or parse DOCX if needed)
      let essayContent = data.essayContent;
      if (isDocxMarker(essayContent)) {
        const base64 = extractDocxBase64(essayContent);
        essayContent = await parseDocxFromBase64(base64);
      } else if (data.essayDriveFileId) {
        try {
          essayContent = await getFileContent(data.essayDriveFileId);
        } catch (error) {
          console.error("Failed to fetch essay from Drive:", error);
        }
      }

      // Get rubric content (from Drive if file ID provided, or parse DOCX if needed)
      let rubricContent = data.rubricContent;
      if (isDocxMarker(rubricContent)) {
        const base64 = extractDocxBase64(rubricContent);
        rubricContent = await parseDocxFromBase64(base64);
      } else if (data.rubricDriveFileId) {
        try {
          rubricContent = await getFileContent(data.rubricDriveFileId);
        } catch (error) {
          console.error("Failed to fetch rubric from Drive:", error);
        }
      }

      // Parse rubric to extract categories
      const rubricCategories = parseRubric(rubricContent);

      // Create essay record
      const essay = await storage.createEssay({
        userId,
        title: data.essayTitle,
        content: essayContent,
        driveFileId: data.essayDriveFileId || null,
      });

      // Create rubric record
      const rubric = await storage.createRubric({
        userId,
        name: data.rubricName,
        categories: rubricCategories as any,
        driveFileId: data.rubricDriveFileId || null,
      });

      // Evaluate essay using Gemini AI
      const evaluationResult = await evaluateEssay(
        essayContent,
        data.essayTitle,
        rubricContent,
        rubricCategories,
        data.gradeLevel
      );

      // Create evaluation record
      const evaluation = await storage.createEvaluation({
        userId,
        essayId: essay.id,
        rubricId: rubric.id,
        overallScore: evaluationResult.overallScore,
        maxScore: evaluationResult.maxScore,
        categoryScores: evaluationResult.categoryScores as any,
        strengths: evaluationResult.strengths,
        weaknesses: evaluationResult.weaknesses,
        suggestions: evaluationResult.suggestions,
        detailedFeedback: evaluationResult.detailedFeedback,
      });

      res.status(200).json({
        success: true,
        evaluationId: evaluation.id,
        message: "Essay evaluated successfully",
      });
    } catch (error) {
      console.error("Error submitting evaluation:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation error",
          details: error.errors,
        });
      } else {
        const errorMessage = error instanceof Error ? error.message : "Failed to evaluate essay";

        if (errorMessage.includes("API key") || errorMessage.includes("GEMINI_API_KEY")) {
          res.status(503).json({
            error: "AI service not configured. Please contact support to enable essay evaluation.",
          });
        } else if (errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("403")) {
          res.status(503).json({
            error: "AI service authentication failed. Please contact support.",
          });
        } else {
          res.status(500).json({
            error: errorMessage,
          });
        }
      }
    }
  });

  // GET /api/evaluations/recent - Get recent evaluations
  app.get("/api/evaluations/recent", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const evaluations = await storage.getRecentEvaluationsWithDetails(userId, limit);
      res.json(evaluations);
    } catch (error) {
      console.error("Error fetching recent evaluations:", error);
      res.status(500).json({
        error: "Failed to fetch recent evaluations",
      });
    }
  });

  // GET /api/evaluations - Get all evaluations
  app.get("/api/evaluations", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const evaluations = await storage.getAllEvaluationsWithDetails(userId);
      res.json(evaluations);
    } catch (error) {
      console.error("Error fetching evaluations:", error);
      res.status(500).json({
        error: "Failed to fetch evaluations",
      });
    }
  });

  // GET /api/evaluations/:id - Get specific evaluation with details
  app.get("/api/evaluations/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const evaluation = await storage.getEvaluationWithDetails(id);

      if (!evaluation) {
        res.status(404).json({
          error: "Evaluation not found",
        });
        return;
      }

      // Verify the evaluation belongs to the current user
      if (evaluation.userId !== (req as any).userId) {
        res.status(403).json({
          error: "Access denied",
        });
        return;
      }

      res.json(evaluation);
    } catch (error) {
      console.error("Error fetching evaluation:", error);
      res.status(500).json({
        error: "Failed to fetch evaluation",
      });
    }
  });

  // GET /api/google-drive/files - List recent Google Drive files (for file picker)
  app.get("/api/google-drive/files", requireAuth, async (req, res) => {
    try {
      const { listRecentFiles } = await import("./google-drive");
      const files = await listRecentFiles(20);
      res.json(files);
    } catch (error) {
      console.error("Error listing Drive files:", error);
      res.status(500).json({
        error: "Failed to list Google Drive files",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}