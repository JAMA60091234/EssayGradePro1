import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { evaluateEssay, parseRubric } from "./gemini";
import { getFileContent } from "./google-drive";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Schema for essay submission
  const submitEvaluationSchema = z.object({
    essayTitle: z.string().min(1),
    essayContent: z.string().min(50),
    rubricName: z.string().min(1),
    rubricContent: z.string().min(10),
    essayDriveFileId: z.string().optional(),
    rubricDriveFileId: z.string().optional(),
  });

  // POST /api/evaluations/submit - Submit essay and rubric for evaluation
  app.post("/api/evaluations/submit", async (req, res) => {
    try {
      const data = submitEvaluationSchema.parse(req.body);

      // Get essay content (from Drive if file ID provided)
      let essayContent = data.essayContent;
      if (data.essayDriveFileId) {
        try {
          essayContent = await getFileContent(data.essayDriveFileId);
        } catch (error) {
          console.error("Failed to fetch essay from Drive:", error);
          // Continue with provided content if Drive fetch fails
        }
      }

      // Get rubric content (from Drive if file ID provided)
      let rubricContent = data.rubricContent;
      if (data.rubricDriveFileId) {
        try {
          rubricContent = await getFileContent(data.rubricDriveFileId);
        } catch (error) {
          console.error("Failed to fetch rubric from Drive:", error);
          // Continue with provided content if Drive fetch fails
        }
      }

      // Parse rubric to extract categories
      const rubricCategories = parseRubric(rubricContent);

      // Create essay record
      const essay = await storage.createEssay({
        title: data.essayTitle,
        content: essayContent,
        driveFileId: data.essayDriveFileId || null,
      });

      // Create rubric record
      const rubric = await storage.createRubric({
        name: data.rubricName,
        categories: rubricCategories as any,
        driveFileId: data.rubricDriveFileId || null,
      });

      // Evaluate essay using Gemini AI
      const evaluationResult = await evaluateEssay(
        essayContent,
        data.essayTitle,
        rubricContent,
        rubricCategories
      );

      // Create evaluation record
      const evaluation = await storage.createEvaluation({
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

      res.json({
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
        
        // Provide helpful error message for common issues
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
  app.get("/api/evaluations/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const evaluations = await storage.getRecentEvaluationsWithDetails(limit);
      res.json(evaluations);
    } catch (error) {
      console.error("Error fetching recent evaluations:", error);
      res.status(500).json({
        error: "Failed to fetch recent evaluations",
      });
    }
  });

  // GET /api/evaluations - Get all evaluations
  app.get("/api/evaluations", async (req, res) => {
    try {
      const evaluations = await storage.getAllEvaluationsWithDetails();
      res.json(evaluations);
    } catch (error) {
      console.error("Error fetching evaluations:", error);
      res.status(500).json({
        error: "Failed to fetch evaluations",
      });
    }
  });

  // GET /api/evaluations/:id - Get specific evaluation with details
  app.get("/api/evaluations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const evaluation = await storage.getEvaluationWithDetails(id);

      if (!evaluation) {
        res.status(404).json({
          error: "Evaluation not found",
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
  app.get("/api/google-drive/files", async (req, res) => {
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
