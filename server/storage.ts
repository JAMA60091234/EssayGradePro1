
import type {
  InsertUser,
  User,
  InsertEssay,
  Essay,
  InsertRubric,
  Rubric,
  InsertEvaluation,
  Evaluation,
  EvaluationWithDetails,
} from "../shared/schema";

interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserByGoogleId(googleId: string): Promise<User | null>;
  
  // Essay operations
  createEssay(essay: InsertEssay): Promise<Essay>;
  getEssayById(id: string): Promise<Essay | null>;

  // Rubric operations
  createRubric(rubric: InsertRubric): Promise<Rubric>;
  getRubricById(id: string): Promise<Rubric | null>;

  // Evaluation operations
  createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  getEvaluationById(id: string): Promise<Evaluation | null>;
  getEvaluationWithDetails(id: string): Promise<EvaluationWithDetails | null>;
  getRecentEvaluationsWithDetails(userId: string, limit: number): Promise<EvaluationWithDetails[]>;
  getAllEvaluationsWithDetails(userId: string): Promise<EvaluationWithDetails[]>;
}

// In-memory storage implementation
class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private essays: Map<string, Essay> = new Map();
  private rubrics: Map<string, Rubric> = new Map();
  private evaluations: Map<string, Evaluation> = new Map();

  // User operations
  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: crypto.randomUUID(),
      ...insertUser,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async getUserByGoogleId(googleId: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.googleId === googleId) {
        return user;
      }
    }
    return null;
  }

  // Essay operations
  async createEssay(insertEssay: InsertEssay): Promise<Essay> {
    const essay: Essay = {
      id: crypto.randomUUID(),
      ...insertEssay,
      submittedAt: new Date(),
    };
    this.essays.set(essay.id, essay);
    return essay;
  }

  async getEssayById(id: string): Promise<Essay | null> {
    return this.essays.get(id) || null;
  }

  // Rubric operations
  async createRubric(insertRubric: InsertRubric): Promise<Rubric> {
    const rubric: Rubric = {
      id: crypto.randomUUID(),
      ...insertRubric,
      createdAt: new Date(),
    };
    this.rubrics.set(rubric.id, rubric);
    return rubric;
  }

  async getRubricById(id: string): Promise<Rubric | null> {
    return this.rubrics.get(id) || null;
  }

  // Evaluation operations
  async createEvaluation(insertEvaluation: InsertEvaluation): Promise<Evaluation> {
    const evaluation: Evaluation = {
      id: crypto.randomUUID(),
      ...insertEvaluation,
      evaluatedAt: new Date(),
    };
    this.evaluations.set(evaluation.id, evaluation);
    return evaluation;
  }

  async getEvaluationById(id: string): Promise<Evaluation | null> {
    return this.evaluations.get(id) || null;
  }

  async getEvaluationWithDetails(id: string): Promise<EvaluationWithDetails | null> {
    const evaluation = this.evaluations.get(id);
    if (!evaluation) return null;

    const essay = this.essays.get(evaluation.essayId);
    const rubric = this.rubrics.get(evaluation.rubricId);

    if (!essay || !rubric) return null;

    return {
      ...evaluation,
      essay,
      rubric,
    };
  }

  async getRecentEvaluationsWithDetails(userId: string, limit: number): Promise<EvaluationWithDetails[]> {
    const userEvaluations = Array.from(this.evaluations.values())
      .filter(e => e.userId === userId)
      .sort((a, b) => b.evaluatedAt.getTime() - a.evaluatedAt.getTime())
      .slice(0, limit);

    const results: EvaluationWithDetails[] = [];
    for (const evaluation of userEvaluations) {
      const essay = this.essays.get(evaluation.essayId);
      const rubric = this.rubrics.get(evaluation.rubricId);
      if (essay && rubric) {
        results.push({ ...evaluation, essay, rubric });
      }
    }
    return results;
  }

  async getAllEvaluationsWithDetails(userId: string): Promise<EvaluationWithDetails[]> {
    const userEvaluations = Array.from(this.evaluations.values())
      .filter(e => e.userId === userId)
      .sort((a, b) => b.evaluatedAt.getTime() - a.evaluatedAt.getTime());

    const results: EvaluationWithDetails[] = [];
    for (const evaluation of userEvaluations) {
      const essay = this.essays.get(evaluation.essayId);
      const rubric = this.rubrics.get(evaluation.rubricId);
      if (essay && rubric) {
        results.push({ ...evaluation, essay, rubric });
      }
    }
    return results;
  }
}

export const storage: IStorage = new MemStorage();
