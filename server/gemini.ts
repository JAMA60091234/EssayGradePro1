// Integration with Gemini AI blueprint for essay evaluation
import { GoogleGenAI } from "@google/genai";
import type { RubricCategory, CategoryScore } from "@shared/schema";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or "gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface EssayEvaluationResult {
  overallScore: number;
  maxScore: number;
  categoryScores: CategoryScore[];
  strengths: string;
  weaknesses: string;
  suggestions: string;
  detailedFeedback: string;
}

/**
 * Evaluates an essay based on a rubric using Gemini AI
 */
export async function evaluateEssay(
  essayContent: string,
  essayTitle: string,
  rubricContent: string,
  rubricCategories: RubricCategory[],
  gradeLevel: string
): Promise<EssayEvaluationResult> {
  // Check if API key is configured
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured. Please add GEMINI_API_KEY to your environment variables.");
  }

  try {
    const systemPrompt = `You are an experienced teacher and essay evaluator. Your role is to provide constructive, supportive, and detailed feedback on student essays.

IMPORTANT: This essay is for a ${gradeLevel} student. Adjust your expectations, vocabulary, and feedback complexity to be appropriate for this grade level. Your evaluation should reflect grade-appropriate standards.

Your feedback should:
1. Be encouraging and supportive while being honest about areas for improvement
2. Provide specific examples from the essay
3. Offer concrete, actionable suggestions for improvement appropriate for ${gradeLevel}
4. Help students understand not just what to improve, but HOW to improve at their level
5. Balance criticism with recognition of strengths
6. Use a warm, educational tone that reduces student anxiety
7. Apply ${gradeLevel} writing standards and expectations

Remember: You're helping students grow as writers at the ${gradeLevel} level, not just assigning grades.`;

    const prompt = `Please evaluate the following essay based on the provided rubric.

GRADE LEVEL: ${gradeLevel}
NOTE: Apply ${gradeLevel} standards and expectations when evaluating this essay. Your scoring and feedback should be appropriate for this grade level.

ESSAY TITLE: "${essayTitle}"

ESSAY CONTENT:
${essayContent}

RUBRIC:
${rubricContent}

RUBRIC CATEGORIES (for scoring):
${rubricCategories.map((cat, i) => `${i + 1}. ${cat.name} (${cat.maxPoints} points): ${cat.description}`).join("\n")}

Please provide a comprehensive evaluation in the following JSON format:
{
  "categoryScores": [
    {
      "category": "Category Name",
      "score": number (points earned),
      "maxScore": number (max possible points),
      "feedback": "Specific feedback for this category with examples from the essay"
    }
  ],
  "strengths": "A warm, encouraging paragraph highlighting what the student did well, with specific examples",
  "weaknesses": "A supportive paragraph about areas needing improvement, framed constructively",
  "suggestions": "Concrete, actionable advice on how to improve for the next essay",
  "detailedFeedback": "A comprehensive analysis of the essay, discussing writing quality, argumentation, organization, and other relevant aspects"
}

Important scoring guidelines:
- Be fair but encouraging
- Look for evidence of critical thinking and effort
- Consider the rubric criteria carefully
- Provide scores that reflect genuine quality while recognizing potential
- Each category score should be between 0 and its maximum points`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.7, // Some creativity while maintaining consistency
      },
      contents: prompt,
    });

    const rawJson = response.text;

    if (!rawJson) {
      throw new Error("Empty response from Gemini AI");
    }

    const evaluation = JSON.parse(rawJson);

    // Validate and calculate overall score
    let overallScore = 0;
    let maxScore = 0;

    const categoryScores: CategoryScore[] = [];

    for (const rubricCat of rubricCategories) {
      const evalCategory = evaluation.categoryScores.find(
        (c: CategoryScore) => 
          c.category.toLowerCase().includes(rubricCat.name.toLowerCase()) ||
          rubricCat.name.toLowerCase().includes(c.category.toLowerCase())
      );

      if (evalCategory) {
        const score = Math.min(Math.max(0, evalCategory.score), rubricCat.maxPoints);
        categoryScores.push({
          category: rubricCat.name,
          score,
          maxScore: rubricCat.maxPoints,
          feedback: evalCategory.feedback || "Good work in this area.",
        });
        overallScore += score;
        maxScore += rubricCat.maxPoints;
      } else {
        // If AI didn't provide score for a category, give partial credit
        const defaultScore = Math.floor(rubricCat.maxPoints * 0.7);
        categoryScores.push({
          category: rubricCat.name,
          score: defaultScore,
          maxScore: rubricCat.maxPoints,
          feedback: "This area shows promise. Consider reviewing the rubric criteria for more detail.",
        });
        overallScore += defaultScore;
        maxScore += rubricCat.maxPoints;
      }
    }

    return {
      overallScore,
      maxScore,
      categoryScores,
      strengths: evaluation.strengths || "Your essay shows effort and potential.",
      weaknesses: evaluation.weaknesses || "Consider reviewing the rubric for areas to develop further.",
      suggestions: evaluation.suggestions || "Keep practicing and seek feedback on your next draft.",
      detailedFeedback: evaluation.detailedFeedback || "Overall, this essay demonstrates your writing abilities. Continue to refine your skills with each assignment.",
    };
  } catch (error) {
    console.error("Gemini evaluation error:", error);
    throw new Error(`Failed to evaluate essay: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Parses rubric content to extract categories and point values
 */
export function parseRubric(rubricContent: string): RubricCategory[] {
  // Simple parsing - looks for patterns like "Category Name (X points): description"
  // or "Category Name - X points"
  const categories: RubricCategory[] = [];
  const lines = rubricContent.split("\n");

  for (const line of lines) {
    // Pattern 1: "Category (10 points): description"
    const match1 = line.match(/^(.+?)\s*\((\d+)\s*points?\s*\)\s*:?\s*(.*)$/i);
    if (match1) {
      categories.push({
        name: match1[1].trim(),
        maxPoints: parseInt(match1[2]),
        description: match1[3].trim() || match1[1].trim(),
      });
      continue;
    }

    // Pattern 2: "Category - 10 points"
    const match2 = line.match(/^(.+?)\s*[-–—]\s*(\d+)\s*points?\s*:?\s*(.*)$/i);
    if (match2) {
      categories.push({
        name: match2[1].trim(),
        maxPoints: parseInt(match2[2]),
        description: match2[3].trim() || match2[1].trim(),
      });
      continue;
    }

    // Pattern 3: "10 points - Category"
    const match3 = line.match(/^(\d+)\s*points?\s*[-–—]\s*(.+?)\s*:?\s*(.*)$/i);
    if (match3) {
      categories.push({
        name: match3[2].trim(),
        maxPoints: parseInt(match3[1]),
        description: match3[3].trim() || match3[2].trim(),
      });
      continue;
    }
  }

  // If no categories found, create default ones
  if (categories.length === 0) {
    return [
      {
        name: "Content & Ideas",
        maxPoints: 25,
        description: "Quality and depth of ideas, analysis, and argumentation",
      },
      {
        name: "Organization",
        maxPoints: 25,
        description: "Structure, flow, and logical progression of ideas",
      },
      {
        name: "Language & Style",
        maxPoints: 25,
        description: "Word choice, sentence variety, and writing clarity",
      },
      {
        name: "Grammar & Mechanics",
        maxPoints: 25,
        description: "Spelling, punctuation, and grammatical correctness",
      },
    ];
  }

  return categories;
}
