import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { TrendingUp, Award, Target, Calendar } from "lucide-react";
import type { EvaluationWithDetails, CategoryScore } from "@shared/schema";

export default function Analytics() {
  const { data: evaluations, isLoading } = useQuery<EvaluationWithDetails[]>({
    queryKey: ["/api/evaluations"],
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!evaluations || evaluations.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Analytics Available Yet</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Submit at least two essays to see detailed analytics and track your progress over
              time.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate statistics
  const totalEssays = evaluations.length;
  const averageScore = Math.round(
    evaluations.reduce((acc, e) => acc + (e.overallScore / e.maxScore) * 100, 0) /
      evaluations.length
  );

  const latestScore =
    evaluations.length > 0
      ? Math.round((evaluations[0].overallScore / evaluations[0].maxScore) * 100)
      : 0;

  const improvement =
    evaluations.length >= 2
      ? Math.round(
          ((evaluations[0].overallScore / evaluations[0].maxScore) -
            (evaluations[evaluations.length - 1].overallScore /
              evaluations[evaluations.length - 1].maxScore)) *
            100
        )
      : 0;

  // Prepare score trend data
  const scoreTrendData = [...evaluations]
    .reverse()
    .map((e, index) => ({
      name: `Essay ${index + 1}`,
      score: Math.round((e.overallScore / e.maxScore) * 100),
      date: new Date(e.evaluatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      title: e.essay.title.substring(0, 20) + (e.essay.title.length > 20 ? "..." : ""),
    }));

  // Calculate average category scores
  const categoryAverages: { [key: string]: { total: number; count: number } } = {};

  evaluations.forEach((e) => {
    const scores = e.categoryScores as CategoryScore[];
    scores.forEach((cat) => {
      if (!categoryAverages[cat.category]) {
        categoryAverages[cat.category] = { total: 0, count: 0 };
      }
      categoryAverages[cat.category].total += (cat.score / cat.maxScore) * 100;
      categoryAverages[cat.category].count += 1;
    });
  });

  const categoryData = Object.entries(categoryAverages).map(([category, data]) => ({
    category: category.length > 15 ? category.substring(0, 15) + "..." : category,
    fullCategory: category,
    average: Math.round(data.total / data.count),
  }));

  // Prepare radar chart data (latest vs average)
  const latestCategoryScores = evaluations[0].categoryScores as CategoryScore[];
  const radarData = latestCategoryScores.map((cat) => {
    const avgData = categoryAverages[cat.category];
    const avgScore = avgData ? Math.round(avgData.total / avgData.count) : 0;
    
    return {
      category: cat.category.length > 12 ? cat.category.substring(0, 12) + "..." : cat.category,
      latest: Math.round((cat.score / cat.maxScore) * 100),
      average: avgScore,
    };
  });

  // Category trend over time (for line chart)
  const categoryTrendData = [...evaluations]
    .reverse()
    .map((e, index) => {
      const scores = e.categoryScores as CategoryScore[];
      const dataPoint: any = {
        name: `Essay ${index + 1}`,
      };
      
      scores.forEach((cat) => {
        dataPoint[cat.category] = Math.round((cat.score / cat.maxScore) * 100);
      });
      
      return dataPoint;
    });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Writing Analytics</h1>
        <p className="text-muted-foreground">
          Track your progress and identify areas for improvement with detailed analytics.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Essays</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalEssays}</div>
            <p className="text-xs text-muted-foreground mt-1">Submitted and evaluated</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{averageScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">Across all essays</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{latestScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">Most recent essay</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Improvement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${improvement >= 0 ? "text-chart-1" : "text-destructive"}`}
            >
              {improvement > 0 ? "+" : ""}
              {improvement}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Since first essay</p>
          </CardContent>
        </Card>
      </div>

      {/* Score Progression */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Overall Score Progression
          </CardTitle>
          <CardDescription>Your score trend across all essays</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreTrendData}>
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
                  label={{ value: "Score (%)", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return payload[0].payload.title;
                    }
                    return label;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Average Performance by Category</CardTitle>
            <CardDescription>Your strengths and areas for improvement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="category"
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
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        return payload[0].payload.fullCategory;
                      }
                      return label;
                    }}
                  />
                  <Bar dataKey="average" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest vs Average Performance</CardTitle>
            <CardDescription>How your most recent essay compares</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                  />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Radar
                    name="Latest Essay"
                    dataKey="latest"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="Your Average"
                    dataKey="average"
                    stroke="hsl(var(--chart-1))"
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Trends Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Development Over Time</CardTitle>
          <CardDescription>Track how each category score has evolved</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={categoryTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="name"
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
                <Legend />
                {latestCategoryScores.map((cat, index) => {
                  const colors = [
                    "hsl(var(--chart-1))",
                    "hsl(var(--chart-2))",
                    "hsl(var(--chart-3))",
                    "hsl(var(--chart-4))",
                    "hsl(var(--chart-5))",
                  ];
                  return (
                    <Line
                      key={cat.category}
                      type="monotone"
                      dataKey={cat.category}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
          <CardDescription>What the data tells us about your writing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Badge className={improvement >= 0 ? "bg-chart-1" : "bg-chart-3"}>
              {improvement >= 0 ? "Improving" : "Focus Area"}
            </Badge>
            <div>
              <p className="font-medium">Overall Progress</p>
              <p className="text-sm text-muted-foreground">
                {improvement >= 0
                  ? `You've improved by ${improvement}% since your first essay. Keep up the great work!`
                  : `Your recent scores are ${Math.abs(improvement)}% lower than your first essay. Review your feedback to identify areas for improvement.`}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Badge className="bg-chart-2">Strength</Badge>
            <div>
              <p className="font-medium">Best Category: {categoryData.sort((a, b) => b.average - a.average)[0]?.fullCategory}</p>
              <p className="text-sm text-muted-foreground">
                Your strongest area with an average score of {categoryData.sort((a, b) => b.average - a.average)[0]?.average}%
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Badge className="bg-chart-3">Growth Opportunity</Badge>
            <div>
              <p className="font-medium">Focus on: {categoryData.sort((a, b) => a.average - b.average)[0]?.fullCategory}</p>
              <p className="text-sm text-muted-foreground">
                This area has room for improvement with an average score of {categoryData.sort((a, b) => a.average - b.average)[0]?.average}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
