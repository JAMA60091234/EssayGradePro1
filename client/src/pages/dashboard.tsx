import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, TrendingUp, FileText, Award } from "lucide-react";
import type { EvaluationWithDetails } from "@shared/schema";

export default function Dashboard() {
  const { data: recentEvaluations, isLoading } = useQuery<EvaluationWithDetails[]>({
    queryKey: ["/api/evaluations/recent"],
  });

  const stats = {
    totalEssays: recentEvaluations?.length || 0,
    averageScore: recentEvaluations?.length
      ? Math.round(
          recentEvaluations.reduce((acc, e) => acc + (e.overallScore / e.maxScore) * 100, 0) /
            recentEvaluations.length
        )
      : 0,
    improvement: recentEvaluations?.length >= 2
      ? Math.round(
          ((recentEvaluations[0].overallScore / recentEvaluations[0].maxScore) -
            (recentEvaluations[recentEvaluations.length - 1].overallScore /
              recentEvaluations[recentEvaluations.length - 1].maxScore)) *
            100
        )
      : 0,
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-5xl font-bold text-foreground" data-testid="text-welcome">
          Welcome to EssayGrade AI
        </h1>
        <p className="text-lg text-muted-foreground">
          Get intelligent feedback on your essays and track your progress over time.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Essays</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-total-essays">
              {stats.totalEssays}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Submissions evaluated</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="text-average-score">
              {stats.averageScore}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all essays</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Improvement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${stats.improvement >= 0 ? "text-chart-1" : "text-destructive"}`}
              data-testid="text-improvement"
            >
              {stats.improvement > 0 ? "+" : ""}
              {stats.improvement}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Since your first essay</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with your next essay submission</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button asChild size="lg" data-testid="button-submit-essay">
            <Link href="/submit">
              <Upload className="w-4 h-4 mr-2" />
              Submit New Essay
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" data-testid="button-view-history">
            <Link href="/history">View All Submissions</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Recent Submissions</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : recentEvaluations && recentEvaluations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentEvaluations.slice(0, 4).map((evaluation) => {
              const scorePercent = Math.round(
                (evaluation.overallScore / evaluation.maxScore) * 100
              );
              const scoreColor =
                scorePercent >= 85
                  ? "bg-chart-1 text-white"
                  : scorePercent >= 70
                    ? "bg-chart-2 text-white"
                    : "bg-chart-3 text-white";

              return (
                <Card
                  key={evaluation.id}
                  className="hover-elevate cursor-pointer"
                  data-testid={`card-essay-${evaluation.id}`}
                >
                  <Link href={`/results/${evaluation.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">
                            {evaluation.essay.title}
                          </CardTitle>
                          <CardDescription>
                            {new Date(evaluation.evaluatedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </CardDescription>
                        </div>
                        <Badge className={scoreColor} data-testid={`badge-score-${evaluation.id}`}>
                          {scorePercent}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        Score: {evaluation.overallScore}/{evaluation.maxScore} points
                      </p>
                    </CardContent>
                  </Link>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No essays yet</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Get started by submitting your first essay for AI-powered evaluation and feedback.
              </p>
              <Button asChild data-testid="button-submit-first-essay">
                <Link href="/submit">
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Your First Essay
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
