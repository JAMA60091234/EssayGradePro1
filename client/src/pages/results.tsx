import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft, Download, TrendingUp, TrendingDown, Award, CheckCircle2 } from "lucide-react";
import type { EvaluationWithDetails, CategoryScore } from "@shared/schema";

export default function Results() {
  const [, params] = useRoute("/results/:id");
  const evaluationId = params?.id;

  const { data: evaluation, isLoading } = useQuery<EvaluationWithDetails>({
    queryKey: ["/api/evaluations", evaluationId],
    enabled: !!evaluationId,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-1/3 mt-2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-xl font-semibold mb-2">Evaluation not found</h3>
            <Button asChild className="mt-4">
              <Link href="/history">Back to History</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scorePercent = Math.round((evaluation.overallScore / evaluation.maxScore) * 100);
  const categoryScores = evaluation.categoryScores as CategoryScore[];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild data-testid="button-back">
          <Link href="/history">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold" data-testid="text-essay-title">
            {evaluation.essay.title}
          </h1>
          <p className="text-muted-foreground">
            Evaluated on{" "}
            {new Date(evaluation.evaluatedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
        <Button variant="outline" data-testid="button-download-feedback">
          <Download className="w-4 h-4 mr-2" />
          Download Report
        </Button>
      </div>

      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Overall Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="flex-shrink-0">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="hsl(var(--muted))"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={
                      scorePercent >= 85
                        ? "hsl(var(--chart-1))"
                        : scorePercent >= 70
                          ? "hsl(var(--chart-2))"
                          : "hsl(var(--chart-3))"
                    }
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(scorePercent / 100) * 351.86} 351.86`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold" data-testid="text-overall-score">
                    {scorePercent}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {evaluation.overallScore}/{evaluation.maxScore}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                {scorePercent >= 85 ? (
                  <Badge className="bg-chart-1 text-white">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Excellent
                  </Badge>
                ) : scorePercent >= 70 ? (
                  <Badge className="bg-chart-2 text-white">Good</Badge>
                ) : (
                  <Badge className="bg-chart-3 text-white">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    Needs Improvement
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Your essay scored {evaluation.overallScore} out of {evaluation.maxScore} points
                based on the rubric criteria.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="scores" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scores" data-testid="tab-scores">
            Detailed Scores
          </TabsTrigger>
          <TabsTrigger value="feedback" data-testid="tab-feedback">
            Feedback
          </TabsTrigger>
          <TabsTrigger value="essay" data-testid="tab-essay">
            Essay View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
              <CardDescription>Scores for each rubric category</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryScores.map((category, index) => {
                const categoryPercent = Math.round((category.score / category.maxScore) * 100);
                return (
                  <div
                    key={index}
                    className="space-y-2"
                    data-testid={`category-${index}`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{category.category}</h4>
                      <span className="text-sm font-medium">
                        {category.score}/{category.maxScore} points
                      </span>
                    </div>
                    <Progress value={categoryPercent} className="h-2" />
                    <p className="text-sm text-muted-foreground">{category.feedback}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-chart-1" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-serif leading-relaxed whitespace-pre-wrap">
                {evaluation.strengths}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-chart-3" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-serif leading-relaxed whitespace-pre-wrap">
                {evaluation.weaknesses}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Suggestions for Next Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-serif leading-relaxed whitespace-pre-wrap">
                {evaluation.suggestions}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-serif leading-relaxed whitespace-pre-wrap">
                {evaluation.detailedFeedback}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="essay" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Essay</CardTitle>
              <CardDescription>Original submission</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="font-serif leading-relaxed whitespace-pre-wrap p-4 bg-muted/50 rounded-lg">
                {evaluation.essay.content}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rubric Used</CardTitle>
              <CardDescription>{evaluation.rubric.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {categoryScores.map((category, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger>
                      <div className="flex items-center justify-between w-full pr-4">
                        <span>{category.category}</span>
                        <Badge variant="outline">{category.maxScore} points</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">{category.feedback}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
