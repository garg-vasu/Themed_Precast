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

import { apiClient } from "@/utils/apiClient";

export interface ProjectDetails {
  project_id: number;
  name: string;
  priority: string;
  project_status: string;
  start_date: string;
  end_date: string;
  logo: string;
  description: string;
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

export const ProjectProvider = ({ children }: ProjectProviderProps) => {
  const { projectId } = useParams<{ projectId: string }>();
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(
    null
  );
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
  }, [projectId]);

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
