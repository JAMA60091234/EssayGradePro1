import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
          <h2 className="text-2xl font-semibold">Page Not Found</h2>
          <p className="text-muted-foreground text-center">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Button asChild className="mt-4" data-testid="button-home">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
