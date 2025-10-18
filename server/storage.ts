import {
  type Essay,
  type InsertEssay,
  type Rubric,
  type InsertRubric,
  type Evaluation,
  type InsertEvaluation,
  type EvaluationWithDetails,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Essays
  getEssay(id: string): Promise<Essay | undefined>;
  createEssay(essay: InsertEssay): Promise<Essay>;
  getAllEssays(): Promise<Essay[]>;

  // Rubrics
  getRubric(id: string): Promise<Rubric | undefined>;
  createRubric(rubric: InsertRubric): Promise<Rubric>;
  getAllRubrics(): Promise<Rubric[]>;

  // Evaluations
  getEvaluation(id: string): Promise<Evaluation | undefined>;
  getEvaluationWithDetails(id: string): Promise<EvaluationWithDetails | undefined>;
  createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  getAllEvaluations(): Promise<Evaluation[]>;
  getAllEvaluationsWithDetails(): Promise<EvaluationWithDetails[]>;
  getRecentEvaluationsWithDetails(limit?: number): Promise<EvaluationWithDetails[]>;
}

export class MemStorage implements IStorage {
  private essays: Map<string, Essay>;
  private rubrics: Map<string, Rubric>;
  private evaluations: Map<string, Evaluation>;

  constructor() {
    this.essays = new Map();
    this.rubrics = new Map();
    this.evaluations = new Map();
  }

  // Essays
  async getEssay(id: string): Promise<Essay | undefined> {
    return this.essays.get(id);
  }

  async createEssay(insertEssay: InsertEssay): Promise<Essay> {
    const id = randomUUID();
    const essay: Essay = {
      ...insertEssay,
      id,
      submittedAt: new Date(),
    };
    this.essays.set(id, essay);
    return essay;
  }

  async getAllEssays(): Promise<Essay[]> {
    return Array.from(this.essays.values());
  }

  // Rubrics
  async getRubric(id: string): Promise<Rubric | undefined> {
    return this.rubrics.get(id);
  }

  async createRubric(insertRubric: InsertRubric): Promise<Rubric> {
    const id = randomUUID();
    const rubric: Rubric = {
      ...insertRubric,
      id,
      createdAt: new Date(),
    };
    this.rubrics.set(id, rubric);
    return rubric;
  }

  async getAllRubrics(): Promise<Rubric[]> {
    return Array.from(this.rubrics.values());
  }

  // Evaluations
  async getEvaluation(id: string): Promise<Evaluation | undefined> {
    return this.evaluations.get(id);
  }

  async getEvaluationWithDetails(id: string): Promise<EvaluationWithDetails | undefined> {
    const evaluation = this.evaluations.get(id);
    if (!evaluation) return undefined;

    const essay = await this.getEssay(evaluation.essayId);
    const rubric = await this.getRubric(evaluation.rubricId);

    if (!essay || !rubric) return undefined;

    return {
      ...evaluation,
      essay,
      rubric,
    };
  }

  async createEvaluation(insertEvaluation: InsertEvaluation): Promise<Evaluation> {
    const id = randomUUID();
    const evaluation: Evaluation = {
      ...insertEvaluation,
      id,
      evaluatedAt: new Date(),
    };
    this.evaluations.set(id, evaluation);
    return evaluation;
  }

  async getAllEvaluations(): Promise<Evaluation[]> {
    return Array.from(this.evaluations.values());
  }

  async getAllEvaluationsWithDetails(): Promise<EvaluationWithDetails[]> {
    const evaluations = Array.from(this.evaluations.values());
    const evaluationsWithDetails: EvaluationWithDetails[] = [];

    for (const evaluation of evaluations) {
      const essay = await this.getEssay(evaluation.essayId);
      const rubric = await this.getRubric(evaluation.rubricId);

      if (essay && rubric) {
        evaluationsWithDetails.push({
          ...evaluation,
          essay,
          rubric,
        });
      }
    }

    return evaluationsWithDetails.sort(
      (a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime()
    );
  }

  async getRecentEvaluationsWithDetails(limit: number = 10): Promise<EvaluationWithDetails[]> {
    const all = await this.getAllEvaluationsWithDetails();
    return all.slice(0, limit);
  }
}

export const storage = new MemStorage();
