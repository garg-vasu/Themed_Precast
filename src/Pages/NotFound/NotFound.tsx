import { useNavigate } from "react-router-dom";
import { FileQuestion, Home, ArrowLeft, Search, RefreshCw } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface NotFoundProps {
  /** Custom title for the 404 page */
  title?: string;
  /** Custom description message */
  description?: string;
  /** Show suggestions section */
  showSuggestions?: boolean;
}

/**
 * A beautiful 404 Not Found page with helpful navigation options.
 */
export default function NotFound({
  title = "Page Not Found",
  description = "Sorry, the page you're looking for doesn't exist or has been moved.",
  showSuggestions = true,
}: NotFoundProps) {
  const navigate = useNavigate();

  const suggestions = [
    { label: "Dashboard", path: "/", icon: Home },
    { label: "Projects", path: "/projects", icon: Search },
  ];

  return (
    <div className="flex items-center justify-center w-full min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
      <Card className="w-full max-w-lg shadow-xl border-muted">
        <CardHeader className="text-center pb-2">
          {/* Animated 404 Display */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="text-[120px] sm:text-[150px] font-bold text-muted-foreground/20 leading-none select-none">
                404
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-primary/10 p-4 sm:p-5 animate-pulse">
                  <FileQuestion className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
                </div>
              </div>
            </div>
          </div>

          <CardTitle className="text-2xl sm:text-3xl font-bold">
            {title}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base mt-2 max-w-sm mx-auto">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert>
            <Search className="h-4 w-4" />
            <AlertTitle>What happened?</AlertTitle>
            <AlertDescription>
              The URL you entered may be incorrect, the page may have been
              removed, or you might not have permission to view it.
            </AlertDescription>
          </Alert>

          {showSuggestions && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground text-center">
                  Here are some helpful links:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {suggestions.map((suggestion) => (
                    <Button
                      key={suggestion.path}
                      variant="outline"
                      className="w-full justify-start gap-2 h-auto py-3"
                      onClick={() => navigate(suggestion.path)}
                    >
                      <suggestion.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{suggestion.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              variant="outline"
              className="w-full sm:w-auto flex-1"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button
              className="w-full sm:w-auto flex-1"
              onClick={() => navigate("/")}
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Refresh Page
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
