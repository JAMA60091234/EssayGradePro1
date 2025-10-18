
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  googleId: text("google_id").unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Essay submissions
export const essays = pgTable("essays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  driveFileId: text("drive_file_id"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

// Rubrics for grading
export const rubrics = pgTable("rubrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  categories: jsonb("categories").notNull(), // Array of {name, maxPoints, description}
  driveFileId: text("drive_file_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Essay evaluations/grades
export const evaluations = pgTable("evaluations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  essayId: varchar("essay_id").notNull().references(() => essays.id),
  rubricId: varchar("rubric_id").notNull().references(() => rubrics.id),
  overallScore: integer("overall_score").notNull(),
  maxScore: integer("max_score").notNull(),
  categoryScores: jsonb("category_scores").notNull(), // Array of {category, score, maxScore, feedback}
  strengths: text("strengths").notNull(),
  weaknesses: text("weaknesses").notNull(),
  suggestions: text("suggestions").notNull(),
  detailedFeedback: text("detailed_feedback").notNull(),
  evaluatedAt: timestamp("evaluated_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertEssaySchema = createInsertSchema(essays).omit({
  id: true,
  submittedAt: true,
});

export const insertRubricSchema = createInsertSchema(rubrics).omit({
  id: true,
  createdAt: true,
});

export const insertEvaluationSchema = createInsertSchema(evaluations).omit({
  id: true,
  evaluatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertEssay = z.infer<typeof insertEssaySchema>;
export type Essay = typeof essays.$inferSelect;

export type InsertRubric = z.infer<typeof insertRubricSchema>;
export type Rubric = typeof rubrics.$inferSelect;

export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type Evaluation = typeof evaluations.$inferSelect;

// Rubric category structure
export interface RubricCategory {
  name: string;
  maxPoints: number;
  description: string;
}

// Category score structure
export interface CategoryScore {
  category: string;
  score: number;
  maxScore: number;
  feedback: string;
}

// Combined evaluation with essay and rubric details
export interface EvaluationWithDetails extends Evaluation {
  essay: Essay;
  rubric: Rubric;
}
