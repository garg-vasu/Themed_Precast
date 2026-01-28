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
import { Badge } from "@/components/ui/badge";

interface RoleRouteProps extends PropsWithChildren {
  allowedRoles: string[];
  redirectTo?: string;
  /** Custom message to show when access is denied */
  accessDeniedMessage?: string;
  /** Whether to show detailed role info (useful for debugging) */
  showRoleDetails?: boolean;
}

/**
 * A route guard component that checks if the user has the required role
 * to access a specific route. Uses case-insensitive role matching.
 */
export default function RoleRoute({
  allowedRoles,
  redirectTo = "/",
  accessDeniedMessage = "You do not have access to this page.",
  showRoleDetails = false,
  children,
}: RoleRouteProps) {
  const userCtx = useContext(UserContext);
  const navigate = useNavigate();
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  // If context is unavailable, redirect to login
  if (!userCtx) {
    return <Navigate to="/login" replace />;
  }

  const { user, loading, error } = userCtx;

  // Case-insensitive role matching
  const isAllowed = useMemo(() => {
    const roleName = user?.role_name?.toLowerCase();
    return roleName
      ? allowedRoles.map((r) => r.toLowerCase()).includes(roleName)
      : false;
  }, [user, allowedRoles]);

  // Show access denied screen after loading completes and user doesn't have role
  useEffect(() => {
    if (!loading && !error && user && !isAllowed) {
      setShowAccessDenied(true);
    }
  }, [loading, error, user, isAllowed]);

  // Loading state with elegant UI
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
              Please wait while we verify your credentials...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6 sm:py-8">
            <LoadingState label="Checking user role..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state - redirect to login
  if (error) {
    return <Navigate to="/login" replace />;
  }

  // No user found - show unauthenticated state
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

  // Access denied state with improved UX
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
              Access Denied
            </CardTitle>
            <CardDescription className="text-sm sm:text-base mt-2">
              {accessDeniedMessage}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Insufficient Role</AlertTitle>
              <AlertDescription>
                This page is restricted to users with specific roles. Please
                contact your administrator if you believe this is an error.
              </AlertDescription>
            </Alert>

            {showRoleDetails && (
              <div className="rounded-lg bg-muted p-3 sm:p-4 space-y-3">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">
                    Required roles (any one):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {allowedRoles.map((role) => (
                      <Badge
                        key={role}
                        variant="destructive"
                        className="text-xs capitalize"
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>

                {user?.role_name && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">
                      Your current role:
                    </p>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {user.role_name}
                    </Badge>
                  </div>
                )}

                {user && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">
                      Logged in as:
                    </p>
                    <p className="text-xs sm:text-sm text-foreground">
                      {user.first_name} {user.last_name}
                      <span className="text-muted-foreground ml-1">
                        ({user.email})
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
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

  // User has required role - render children
  return <>{children}</>;
}
