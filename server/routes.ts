
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { evaluateEssay, parseRubric } from "./gemini";
import { getFileContent } from "./google-drive";
import { isDocxMarker, extractDocxBase64, parseDocxFromBase64 } from "./file-parser";
import { z } from "zod";
import { OAuth2Client } from "google-auth-library";
import session from "express-session";

// Extend session data to include user info
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    userEmail?: string;
    userName?: string;
  }
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

const oauth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/auth/google/callback` : "http://localhost:5000/auth/google/callback"
);

// Middleware to check if user is authenticated
function requireAuth(req: any, res: any, next: any) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "your-secret-key-change-this",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    })
  );

  // GET /auth/google - Initiate Google OAuth
  app.get("/auth/google", (req, res) => {
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
    });
    res.redirect(authorizeUrl);
  });

  // GET /auth/google/callback - Handle Google OAuth callback
  app.get("/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    
    if (!code || typeof code !== "string") {
      return res.redirect("/?error=no_code");
    }

    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      // Get user info from Google
      const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      if (!payload) {
        return res.redirect("/?error=invalid_token");
      }

      const { sub: googleId, email, name } = payload;

      if (!email) {
        return res.redirect("/?error=no_email");
      }

      // Check if user exists
      let user = await storage.getUserByGoogleId(googleId);
      
      if (!user) {
        // Create new user
        user = await storage.createUser({
          email,
          name: name || null,
          googleId,
        });
      }

      // Set session
      req.session.userId = user.id;
      req.session.userEmail = user.email;
      req.session.userName = user.name || undefined;

      res.redirect("/");
    } catch (error) {
      console.error("Error during Google OAuth:", error);
      res.redirect("/?error=auth_failed");
    }
  });

  // GET /auth/logout - Logout user
  app.get("/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
      }
      res.redirect("/login");
    });
  });

  // GET /api/auth/status - Check authentication status
  app.get("/api/auth/status", (req, res) => {
    if (req.session.userId) {
      res.json({
        authenticated: true,
        user: {
          id: req.session.userId,
          email: req.session.userEmail,
          name: req.session.userName,
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
      const userId = req.session.userId!;

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
      const userId = req.session.userId!;
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
      const userId = req.session.userId!;
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
      if (evaluation.userId !== req.session.userId) {
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
