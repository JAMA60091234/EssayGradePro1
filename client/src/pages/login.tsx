
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { FileText } from "lucide-react";

export default function Login() {
  const handleLogin = () => {
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground">
              <FileText className="w-8 h-8" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">EssayGrade AI</CardTitle>
            <CardDescription className="text-lg mt-2">
              Intelligent Essay Evaluation Assistant
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-center text-muted-foreground">
              Sign in to access your essay evaluations and receive AI-powered feedback
            </p>
            <Button
              onClick={handleLogin}
              className="w-full h-12 text-lg"
              size="lg"
              data-testid="button-auth0-signin"
            >
              <LogIn className="w-5 h-5 mr-3" />
              Sign in with Auth0
            </Button>
          </div>
          
          <div className="pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
