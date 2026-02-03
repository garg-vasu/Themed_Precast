import axios, { AxiosError } from "axios";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Ban, Home } from "lucide-react";

import { apiClient } from "@/utils/apiClient";
import { UserContext } from "./UserProvider";
import { Button } from "@/components/ui/button";

export interface ProjectDetails {
  project_id: number;
  name: string;
  priority: string;
  project_status: string;
  start_date: string;
  end_date: string;
  logo: string;
  description: string;
  suspend: boolean;
  budget: string;
  client_name: string;
  client_id: number;
  total_elements: number;
  completed_elements: number;
  progress: number;
  permissions?: Array<{ permission_name: string }>;
}

interface ProjectContextType {
  projectId: string;
  projectDetails: ProjectDetails | null;
  permissions: string[];
  loading: boolean;
  error: string | null;
  retry: () => void;
}

export const ProjectContext = createContext<ProjectContextType>({
  projectId: "",
  projectDetails: null,
  permissions: [],
  loading: false,
  error: null,
  retry: () => {},
});

interface ProjectProviderProps {
  children: ReactNode;
}

// Utility function to handle the error
const getErrorMessage = (error: AxiosError | unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Unauthorized. Please log in.";
    }
    if (error.response?.status === 403) {
      return "Access denied. Please contact your administrator.";
    }
    if (error.code === "ECONNABORTED") {
      return "Request timed out. Please try again later.";
    }
    return error.response?.data?.message || "Failed to fetch project data.";
  }
  return "An unexpected error occurred. Please try again later.";
};

// Fallback component for access denied
function AccessDeniedFallback() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
      <p className="mb-6 text-gray-700">
        You do not have permission to view this project.
      </p>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded"
        onClick={() => navigate("/")}
      >
        Go to Home
      </button>
    </div>
  );
}

// Fallback component for suspended project
function ProjectSuspendedFallback({ projectName }: { projectName?: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] p-8">
      <div className="flex flex-col items-center max-w-md text-center">
        {/* Suspended Icon */}
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 border-2 border-destructive/30 mb-6">
          <Ban className="w-10 h-10 text-destructive" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-destructive mb-2">
          Project Suspended
        </h2>

        {/* Project Name */}
        {projectName && (
          <p className="text-lg font-medium text-foreground mb-4">
            "{projectName}"
          </p>
        )}

        {/* Description */}
        <p className="text-muted-foreground mb-6">
          This project has been suspended and is currently not accessible.
          Please contact your administrator or project manager for more
          information.
        </p>

        {/* Action Button */}
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => navigate("/")}
        >
          <Home className="w-4 h-4" />
          Go to Home
        </Button>
      </div>
    </div>
  );
}

export const ProjectProvider = ({ children }: ProjectProviderProps) => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useContext(UserContext);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(
    null
  );
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check if user is superadmin
  const isSuperAdmin = user?.role_name === "superadmin";
  // Check if project is suspended and user is not superadmin
  const isProjectSuspendedForUser =
    projectDetails?.suspend === true && !isSuperAdmin;

  const handleUnauthorized = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      setError("Project ID is missing");
      return;
    }

    const source = axios.CancelToken.source();

    const fetchProjectDetails = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/project_fetch/${projectId}`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          const projectData = response.data as ProjectDetails;
          setProjectDetails(projectData);
          setPermissions(
            projectData.permissions
              ? projectData.permissions.map(
                  (perm: { permission_name: string }) => perm.permission_name
                )
              : []
          );
          setError(null);
        } else if (response.status === 403) {
          setError("access_denied");
        } else {
          const message =
            (response.data as any)?.message ||
            "Failed to fetch project data. Please try again.";
          setError(message);
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          if (axios.isAxiosError(err) && err.response?.status === 403) {
            setError("access_denied");
          } else if (axios.isAxiosError(err) && err.response?.status === 404) {
            // Project does not exist - show toast and redirect to home
            const errorMessage =
              err.response?.data?.error || "Project not found.";
            toast.error(errorMessage);
            navigate("/", { replace: true });
          } else {
            setError(getErrorMessage(err));
            // Only navigate to login for 401 errors
            if (axios.isAxiosError(err) && err.response?.status === 401) {
              handleUnauthorized();
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();

    return () => {
      source.cancel();
    };
  }, [projectId, navigate]);

  // Retry function
  const retry = () => {
    setLoading(true);
    if (projectId) {
      const source = axios.CancelToken.source();
      const fetchProjectDetails = async () => {
        try {
          const response = await apiClient.get(`/project_fetch/${projectId}`, {
            cancelToken: source.token,
          });

          if (response.status === 200) {
            const projectData = response.data as ProjectDetails;
            setProjectDetails(projectData);
            setPermissions(
              projectData.permissions
                ? projectData.permissions.map(
                    (perm: { permission_name: string }) => perm.permission_name
                  )
                : []
            );
            setError(null);
          } else if (response.status === 403) {
            setError("access_denied");
          } else {
            const message =
              (response.data as any)?.message ||
              "Failed to fetch project data. Please try again.";
            setError(message);
          }
        } catch (err: unknown) {
          if (!axios.isCancel(err)) {
            if (axios.isAxiosError(err) && err.response?.status === 403) {
              setError("access_denied");
            } else if (
              axios.isAxiosError(err) &&
              err.response?.status === 404
            ) {
              // Project does not exist - show toast and redirect to home
              const errorMessage =
                err.response?.data?.error || "Project not found.";
              toast.error(errorMessage);
              navigate("/", { replace: true });
            } else {
              setError(getErrorMessage(err));
              if (axios.isAxiosError(err) && err.response?.status === 401) {
                handleUnauthorized();
              }
            }
          }
        } finally {
          setLoading(false);
        }
      };
      fetchProjectDetails();
    }
  };

  useEffect(() => {
    if (error && error !== "access_denied") {
      toast.error(error);
    }
  }, [error]);

  // Render Access Denied fallback if error is access_denied
  if (error === "access_denied") {
    return <AccessDeniedFallback />;
  }

  // Render Project Suspended fallback if project is suspended and user is not superadmin
  if (!loading && isProjectSuspendedForUser) {
    return <ProjectSuspendedFallback projectName={projectDetails?.name} />;
  }

  return (
    <ProjectContext.Provider
      value={{
        projectId: projectId || "",
        projectDetails,
        permissions,
        loading,
        error: error === "access_denied" ? null : error,
        retry,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

// Custom hook to use the context
export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
};
