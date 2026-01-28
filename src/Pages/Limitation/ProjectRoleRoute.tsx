import {
  useContext,
  useMemo,
  useState,
  useEffect,
  type PropsWithChildren,
} from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ShieldX, Loader2, AlertTriangle, ArrowLeft, Home } from "lucide-react";

import { ProjectContext } from "@/Provider/ProjectProvider";
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

interface ProjectRoleRouteProps extends PropsWithChildren {
  allowedPermissions: string[];
  redirectTo?: string;
  /** Custom message to show when access is denied */
  accessDeniedMessage?: string;
  /** Whether to show detailed permission info (useful for debugging) */
  showPermissionDetails?: boolean;
}

/**
 * A route guard component that checks if the user has the required permissions
 * to access a specific route within a project context.
 */
export default function ProjectRoleRoute({
  allowedPermissions,
  redirectTo = "/",
  accessDeniedMessage = "You do not have the required permissions to access this page.",
  showPermissionDetails = false,
  children,
}: ProjectRoleRouteProps) {
  const projectCtx = useContext(ProjectContext);
  const navigate = useNavigate();
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  // If context is unavailable, redirect to home
  if (!projectCtx) {
    return <Navigate to="/" replace />;
  }

  const { permissions, loading, error } = projectCtx;

  const isAllowed = useMemo(() => {
    if (!permissions || permissions.length === 0) {
      return false;
    }

    // Check if user has any of the required permissions
    return allowedPermissions.some((permission) =>
      permissions.includes(permission),
    );
  }, [permissions, allowedPermissions]);

  // Show access denied screen after loading completes and user doesn't have permission
  useEffect(() => {
    if (!loading && !error && !isAllowed && permissions.length > 0) {
      setShowAccessDenied(true);
    }
  }, [loading, error, isAllowed, permissions]);

  // Loading state with elegant UI
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full min-h-screen bg-background">
        <Card className="w-full max-w-md mx-4 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Verifying Access
            </CardTitle>
            <CardDescription>
              Please wait while we check your permissions...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <LoadingState label="Loading permissions..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state - redirect to home for any errors
  if (error) {
    return <Navigate to="/" replace />;
  }

  // Access denied state with improved UX
  if (showAccessDenied || (!isAllowed && permissions.length > 0)) {
    return (
      <div className="flex items-center justify-center w-full min-h-screen bg-background p-4">
        <Card className="w-full max-w-lg shadow-lg border-destructive/20">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-destructive/10 p-4">
                <ShieldX className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl text-destructive">
              Access Denied
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {accessDeniedMessage}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Permission Required</AlertTitle>
              <AlertDescription>
                This page requires specific permissions that are not assigned to
                your account. Please contact your administrator if you believe
                this is an error.
              </AlertDescription>
            </Alert>

            {showPermissionDetails && (
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Required permissions (any one):
                </p>
                <div className="flex flex-wrap gap-2">
                  {allowedPermissions.map((permission) => (
                    <span
                      key={permission}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
                {permissions.length > 0 && (
                  <>
                    <p className="text-sm font-medium text-muted-foreground mt-4">
                      Your current permissions:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {permissions.map((permission) => (
                        <span
                          key={permission}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </>
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

  // No permissions loaded yet - show loading
  if (permissions.length === 0) {
    return (
      <div className="flex items-center justify-center w-full min-h-screen bg-background">
        <LoadingState label="Loading permissions..." className="py-8" />
      </div>
    );
  }

  // User has permission - render children
  return <>{children}</>;
}
