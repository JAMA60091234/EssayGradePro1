import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Calendar, TrendingUp, FileText } from "lucide-react";
import type { EvaluationWithDetails } from "@shared/schema";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function History() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: evaluations, isLoading } = useQuery<EvaluationWithDetails[]>({
    queryKey: ["/api/evaluations"],
  });

  const filteredEvaluations = evaluations?.filter((e) =>
    e.essay.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chartData = evaluations
    ? [...evaluations]
        .reverse()
        .map((e, index) => ({
          name: `Essay ${index + 1}`,
          score: Math.round((e.overallScore / e.maxScore) * 100),
          date: new Date(e.evaluatedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
        }))
    : [];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Essay History</h1>
        <p className="text-muted-foreground">
          Track your progress and view all your evaluated essays.
        </p>
      </div>

      {/* Progress Chart */}
      {evaluations && evaluations.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Score Progression
            </CardTitle>
            <CardDescription>Your performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search essays by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-essays"
        />
      </div>

      {/* Essays List */}
      <div className="space-y-4">
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
                  <div className="h-4 bg-muted rounded w-2/3 mt-2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredEvaluations && filteredEvaluations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEvaluations.map((evaluation) => {
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
                  data-testid={`card-history-${evaluation.id}`}
                >
                  <Link href={`/results/${evaluation.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-xl truncate">
                            {evaluation.essay.title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(evaluation.evaluatedAt).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </CardDescription>
                        </div>
                        <Badge
                          className={scoreColor}
                          data-testid={`badge-history-score-${evaluation.id}`}
                        >
                          {scorePercent}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Score</span>
                        <span className="font-semibold">
                          {evaluation.overallScore}/{evaluation.maxScore} points
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Rubric</span>
                        <span className="font-medium truncate max-w-[200px]">
                          {evaluation.rubric.name}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                        {evaluation.essay.content.substring(0, 120)}...
                      </p>
                    </CardContent>
                  </Link>
                </Card>
              );
            })}
          </div>
        ) : searchQuery ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground text-center max-w-md">
                No essays match your search. Try a different search term.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No essays yet</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Your essay history will appear here once you submit your first essay.
              </p>
              <Button asChild data-testid="button-submit-from-history">
                <Link href="/submit">Submit Your First Essay</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
