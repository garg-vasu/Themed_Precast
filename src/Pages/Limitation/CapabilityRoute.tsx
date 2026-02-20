import {
  useContext,
  useMemo,
  useState,
  useEffect,
  type PropsWithChildren,
} from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ShieldX,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Home,
  UserX,
  LogIn,
} from "lucide-react";

import { UserContext } from "@/Provider/UserProvider";
import type { Capabilities } from "@/Provider/UserProvider";
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
import { LoadingState } from "@/components/ui/loading-state";

interface CapabilityRouteProps extends PropsWithChildren {
  /** The capability key to check (e.g. "hra", "work_order", "invoice", "calculator") */
  capability: keyof Capabilities;
  redirectTo?: string;
  accessDeniedMessage?: string;
}

/**
 * A route guard that checks if the tenant has a specific capability enabled.
 * If the capability is false or missing, access is denied.
 */
export default function CapabilityRoute({
  capability,
  redirectTo = "/",
  accessDeniedMessage = "This feature is not available for your organization.",
  children,
}: CapabilityRouteProps) {
  const userCtx = useContext(UserContext);
  const navigate = useNavigate();
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  if (!userCtx) {
    return <Navigate to="/login" replace />;
  }

  const { user, capabilities, loading, error } = userCtx;

  const isAllowed = useMemo(() => {
    if (!capabilities) return false;
    return capabilities[capability] === true;
  }, [capabilities, capability]);

  useEffect(() => {
    if (!loading && !error && user && !isAllowed) {
      setShowAccessDenied(true);
    }
  }, [loading, error, user, isAllowed]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full min-h-screen bg-background px-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="flex items-center justify-center gap-2 text-lg sm:text-xl">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Verifying Access
            </CardTitle>
            <CardDescription className="text-sm">
              Please wait while we verify your access...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6 sm:py-8">
            <LoadingState label="Checking capabilities..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center w-full min-h-screen bg-background px-4">
        <Card className="w-full max-w-md shadow-lg border-muted">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-muted p-3 sm:p-4">
                <UserX className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl">
              Authentication Required
            </CardTitle>
            <CardDescription className="text-sm sm:text-base mt-2">
              Please log in to access this page.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Session Expired</AlertTitle>
              <AlertDescription>
                Your session may have expired or you are not logged in. Please
                log in to continue.
              </AlertDescription>
            </Alert>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => navigate("/login")}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Log In
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (showAccessDenied || !isAllowed) {
    return (
      <div className="flex items-center justify-center w-full min-h-screen bg-background p-4">
        <Card className="w-full max-w-lg shadow-lg border-destructive/20">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-destructive/10 p-3 sm:p-4">
                <ShieldX className="h-10 w-10 sm:h-12 sm:w-12 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl text-destructive">
              Feature Not Available
            </CardTitle>
            <CardDescription className="text-sm sm:text-base mt-2">
              {accessDeniedMessage}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Access Restricted</AlertTitle>
              <AlertDescription>
                This feature is not enabled for your organization. Please
                contact your administrator if you need access.
              </AlertDescription>
            </Alert>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => navigate(redirectTo)}
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
