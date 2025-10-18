import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Upload, FileText, X, Loader2, CheckCircle2 } from "lucide-react";
import { SiGoogledrive } from "react-icons/si";
import { Badge } from "@/components/ui/badge";

const submitSchema = z.object({
  essayTitle: z.string().min(1, "Essay title is required"),
  essayContent: z.string().min(50, "Essay must be at least 50 characters"),
  rubricName: z.string().min(1, "Rubric name is required"),
  rubricContent: z.string().min(10, "Rubric content is required"),
});

type SubmitFormData = z.infer<typeof submitSchema>;

export default function Submit() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [essayFile, setEssayFile] = useState<File | null>(null);
  const [rubricFile, setRubricFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<SubmitFormData>({
    resolver: zodResolver(submitSchema),
    defaultValues: {
      essayTitle: "",
      essayContent: "",
      rubricName: "",
      rubricContent: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SubmitFormData) => {
      setCurrentStep(3); // Move to submission step
      return await apiRequest("POST", "/api/evaluations/submit", data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/evaluations/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/evaluations"] });
      toast({
        title: "Success!",
        description: "Your essay has been evaluated successfully.",
      });
      setLocation(`/results/${data.evaluationId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit essay. Please try again.",
        variant: "destructive",
      });
      setCurrentStep(2); // Reset on error
    },
  });

  const handleEssayFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEssayFile(file);
    
    // Handle DOCX files specially
    if (file.name.toLowerCase().endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      form.setValue("essayContent", `DOCX_FILE:${base64}`);
    } else {
      const text = await file.text();
      form.setValue("essayContent", text);
    }
    
    if (!form.getValues("essayTitle")) {
      form.setValue("essayTitle", file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleRubricFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRubricFile(file);
    
    // Handle DOCX files specially
    if (file.name.toLowerCase().endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      form.setValue("rubricContent", `DOCX_FILE:${base64}`);
    } else {
      const text = await file.text();
      form.setValue("rubricContent", text);
    }
    
    if (!form.getValues("rubricName")) {
      form.setValue("rubricName", file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const onSubmit = (data: SubmitFormData) => {
    submitMutation.mutate(data);
  };

  const steps = [
    { number: 1, title: "Upload Essay" },
    { number: 2, title: "Upload Rubric" },
    { number: 3, title: "Submit" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Submit Essay for Evaluation</h1>
        <p className="text-muted-foreground">
          Upload your essay and rubric to receive detailed AI-powered feedback.
        </p>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-center gap-4">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep >= step.number
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {currentStep > step.number ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-semibold">{step.number}</span>
                )}
              </div>
              <span
                className={`text-sm font-medium ${currentStep >= step.number ? "text-foreground" : "text-muted-foreground"}`}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 ${currentStep > step.number ? "bg-primary" : "bg-border"}`}
              />
            )}
          </div>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Essay Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Essay
                </CardTitle>
                <CardDescription>Upload or paste your essay content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Upload from Computer</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".txt,.doc,.docx"
                      onChange={handleEssayFileUpload}
                      className="hidden"
                      id="essay-file-upload"
                      data-testid="input-essay-file"
                    />
                    <label
                      htmlFor="essay-file-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover-elevate"
                    >
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">TXT, DOC, DOCX</p>
                    </label>
                  </div>
                  {essayFile && (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm flex-1 truncate">{essayFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          setEssayFile(null);
                          form.setValue("essayContent", "");
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Google Drive Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  data-testid="button-google-drive-essay"
                >
                  <SiGoogledrive className="w-4 h-4 mr-2" />
                  Import from Google Drive
                </Button>

                {/* Title Field */}
                <FormField
                  control={form.control}
                  name="essayTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Essay Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter essay title"
                          {...field}
                          data-testid="input-essay-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Content Field */}
                <FormField
                  control={form.control}
                  name="essayContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Essay Content</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste your essay here..."
                          className="min-h-[200px] font-serif"
                          {...field}
                          data-testid="textarea-essay-content"
                          onFocus={() => setCurrentStep(Math.max(currentStep, 1))}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value.length} characters (minimum 50)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Rubric Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Grading Rubric
                </CardTitle>
                <CardDescription>Upload or paste your rubric criteria</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Upload from Computer</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".txt,.doc,.docx"
                      onChange={handleRubricFileUpload}
                      className="hidden"
                      id="rubric-file-upload"
                      data-testid="input-rubric-file"
                    />
                    <label
                      htmlFor="rubric-file-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover-elevate"
                    >
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">TXT, DOC, DOCX</p>
                    </label>
                  </div>
                  {rubricFile && (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm flex-1 truncate">{rubricFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          setRubricFile(null);
                          form.setValue("rubricContent", "");
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Google Drive Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  data-testid="button-google-drive-rubric"
                >
                  <SiGoogledrive className="w-4 h-4 mr-2" />
                  Import from Google Drive
                </Button>

                {/* Name Field */}
                <FormField
                  control={form.control}
                  name="rubricName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rubric Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter rubric name"
                          {...field}
                          data-testid="input-rubric-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Content Field */}
                <FormField
                  control={form.control}
                  name="rubricContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rubric Criteria</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste your rubric criteria here..."
                          className="min-h-[200px] font-mono text-sm"
                          {...field}
                          data-testid="textarea-rubric-content"
                          onFocus={() => setCurrentStep(Math.max(currentStep, 2))}
                        />
                      </FormControl>
                      <FormDescription>{field.value.length} characters</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Submit Button */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Ready to submit?</h3>
                  <p className="text-sm text-muted-foreground">
                    Your essay will be evaluated using AI against the provided rubric.
                  </p>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitMutation.isPending}
                  data-testid="button-submit-for-grading"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Submit for Grading
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      {/* AI Evaluation Progress Indicator */}
      {submitMutation.isPending && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary flex-shrink-0 mt-1" />
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">AI is Evaluating Your Essay</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Our AI is carefully analyzing your work against the rubric criteria. This may
                    take a few moments...
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-chart-1" />
                    <span className="text-muted-foreground">Reading your essay</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-chart-1" />
                    <span className="text-muted-foreground">Analyzing rubric criteria</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="font-medium">Generating detailed feedback</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
