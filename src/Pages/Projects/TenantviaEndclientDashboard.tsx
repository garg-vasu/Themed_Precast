import { useState, useEffect, useCallback, useContext } from "react";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { UserContext } from "@/Provider/UserProvider";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { PlusIcon, Loader2, Building2, Ban } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type EndClient = {
  id: number;
  email: string;
  contact_person: string;
  address: string;
  attachment: string[];
  cin: string;
  gst_number: string;
  phone_no: string;
  profile_picture: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  client_id: number;
  organization: string;
  phone_code: number;
  phone_code_name: string;
  abbreviation: string;
};

export type Project = {
  name: string;
  priority: string;
  project_status: string;
  start_date: string;
  end_date: string;
  logo: string;
  description: string;
  created_at: string;
  updated_at: string;
  last_updated: string;
  last_updated_by: string;
  client_id: number;
  budget: string;
  suspend: boolean;
  template_id: number;
  subscription_start_date: string;
  subscription_end_date: string;
  project_id: number;
  total_elements: number;
  erected_elements: number;
  casted_elements: number;
  in_stock: number;
  in_production: number;
  element_type_count: number;
  project_members_count: number;
  stockyards: null;
};

type Aggregates = {
  casted_elements: number;
  element_type_count: number;
  in_production: number;
  in_stock: number;
  not_in_production: number;
  project_members_count: number;
  total_elements: number;
};

export type ProjectsOverviewResponse = {
  projects: Project[];
  aggregates: Aggregates;
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getStatusStyles = (status: string | undefined) => {
  const normalized = status?.toLowerCase() ?? "";

  switch (normalized) {
    case "active":
      return {
        badge:
          "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
        dot: "bg-emerald-500",
        cardAccent: "border-l-4 border-emerald-500/70",
      };
    case "suspended":
      return {
        badge:
          "border border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
        dot: "bg-amber-500",
        cardAccent: "border-l-4 border-amber-500/70",
      };
    case "closed":
    case "inactive":
      return {
        badge:
          "border border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-950/40 dark:text-slate-300",
        dot: "bg-slate-400",
        cardAccent: "border-l-4 border-slate-400/70",
      };
    default:
      return {
        badge:
          "border border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
        dot: "bg-blue-500",
        cardAccent: "border-l-4 border-blue-500/70",
      };
  }
};

const getErrorMessage = (error: AxiosError | unknown, data: string): string => {
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
    return error.response?.data?.message || `Failed to fetch ${data}.`;
  }
  return "An unexpected error occurred. Please try again later.";
};

export function TenantviaEndclientDashboard() {
  const [endClients, setEndClients] = useState<EndClient[]>([]);
  const [selectedEndClientId, setSelectedEndClientId] = useState<number | null>(
    null
  );
  const { client_id } = useParams<{ client_id: string }>();
  const [data, setData] = useState<ProjectsOverviewResponse>();
  const [isLoadingEndClients, setIsLoadingEndClients] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("active");
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  // Fetch all end clients
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchEndClients = async () => {
      try {
        setIsLoadingEndClients(true);
        const response = await apiClient.get(`/end_client/${client_id}`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          const clients = response.data;
          setEndClients(clients);
          // Auto-select first end client
          if (clients && clients.length > 0) {
            setSelectedEndClientId(clients[0].id);
          }
        } else {
          toast.error(response.data?.message || "Failed to fetch end clients");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "end clients data"));
        }
      } finally {
        setIsLoadingEndClients(false);
      }
    };

    fetchEndClients();

    return () => {
      source.cancel();
    };
  }, []);

  // Fetch projects for selected end client
  const fetchProjectData = useCallback(async () => {
    if (!selectedEndClientId) {
      return;
    }

    const source = axios.CancelToken.source();

    try {
      setIsLoadingProjects(true);
      const endpoint = `/endclient_projects/${selectedEndClientId}`;
      const url = selectedFilter
        ? `${endpoint}?type=${encodeURIComponent(selectedFilter)}`
        : endpoint;

      const response = await apiClient.get(url, {
        cancelToken: source.token,
      });

      if (response.status === 200) {
        setData(response.data);
      } else {
        toast.error(response.data?.message || "Failed to fetch project data");
      }
    } catch (err: unknown) {
      if (!axios.isCancel(err)) {
        toast.error(getErrorMessage(err, "project data"));
      }
    } finally {
      setIsLoadingProjects(false);
    }

    return () => {
      source.cancel();
    };
  }, [selectedEndClientId, selectedFilter]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const handleEndClientChange = (endClientId: number) => {
    setSelectedEndClientId(endClientId);
    setData(undefined); // Clear previous data
  };

  const selectedEndClient = endClients.find(
    (ec) => ec.id === selectedEndClientId
  );

  // Loading state for end clients
  if (isLoadingEndClients) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading end clients...
          </p>
        </div>
      </div>
    );
  }

  // No end clients found
  if (!endClients || endClients.length === 0) {
    return (
      <div className="w-full p-4">
        <PageHeader title="Tenant via End Client Dashboard" />
        <Card className="mt-4 border-dashed text-center">
          <CardHeader>
            <CardTitle className="text-base">No End Clients Found</CardTitle>
            <CardDescription>
              There are no end clients available. Please add an end client
              first.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      {/* Header section */}
      <div className="flex items-center justify-between gap-3">
        <PageHeader
          title="Tenant via End Client Dashboard"
          ResponsivefontSize={true}
        />
      </div>

      {/* End Client Pills Section */}
      <div className="flex flex-col gap-2">
        {/* Desktop/Tablet - Button Pills */}
        <div className="hidden md:flex flex-wrap gap-2">
          {endClients.map((endClient) => (
            <Button
              key={endClient.id}
              variant={
                selectedEndClientId === endClient.id ? "default" : "outline"
              }
              className={
                selectedEndClientId === endClient.id ? "text-white" : ""
              }
              onClick={() => handleEndClientChange(endClient.id)}
            >
              <Building2 className="w-4 h-4 mr-2" />
              {endClient.organization ||
                endClient.contact_person ||
                `End Client ${endClient.id}`}
            </Button>
          ))}
        </div>

        {/* Mobile - Select Dropdown */}
        <div className="md:hidden w-full">
          <Select
            value={selectedEndClientId?.toString() || ""}
            onValueChange={(value) => handleEndClientChange(Number(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an end client" />
            </SelectTrigger>
            <SelectContent>
              {endClients.map((endClient) => (
                <SelectItem key={endClient.id} value={endClient.id.toString()}>
                  {endClient.organization ||
                    endClient.contact_person ||
                    `End Client ${endClient.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selected End Client Info */}

      {/* Loading state for projects */}
      {isLoadingProjects && (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      )}

      {/* Stats summary section */}
      {!isLoadingProjects && data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-primary">
                  In Planned
                </CardTitle>
                <CardDescription>
                  Currently in production pipeline
                </CardDescription>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                {data?.aggregates.in_production ?? "-"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-primary">
                  In Stock
                </CardTitle>
                <CardDescription>
                  Ready to be dispatched / erected
                </CardDescription>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                {data?.aggregates.in_stock ?? "-"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-primary">
                  Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                {data
                  ? data.aggregates.total_elements -
                    (data.aggregates.casted_elements ?? 0)
                  : "-"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-primary">
                  Casted
                </CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                {data?.aggregates.casted_elements ?? "-"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-primary">
                  Element Types
                </CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                {data?.aggregates.element_type_count ?? "-"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-primary">
                  Project Members
                </CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">
                {data?.aggregates.project_members_count ?? "-"}
              </CardContent>
            </Card>
          </div>

          {/* Project cards grid */}
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {data?.projects?.length ?? 0} projects
              </span>
            </div>
            {data?.projects?.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.projects.map((project) => (
                  <ProjectCard
                    key={project.project_id}
                    project={project}
                    fetchProjectData={fetchProjectData}
                  />
                ))}
              </div>
            ) : (
              <Card className="mt-2 border-dashed text-center">
                <CardHeader>
                  <CardTitle className="text-base">
                    No projects found for this filter
                  </CardTitle>
                  <CardDescription>
                    Try changing the filter or create a new project.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        </>
      )}

      {/* No data state */}
      {!isLoadingProjects && !data && selectedEndClientId && (
        <Card className="mt-4 border-dashed text-center">
          <CardHeader>
            <CardTitle className="text-base">
              No Project Data Available
            </CardTitle>
            <CardDescription>
              Unable to load project data for the selected end client.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}

function ProjectCard({
  project,
  fetchProjectData,
}: {
  project: Project;
  fetchProjectData: () => void;
}) {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const isSuspended = project.suspend;
  const isSuperAdmin = user?.role_name === "superadmin";
  const statusStyles = getStatusStyles(project.project_status);
  // overlay + block interaction ONLY when project is suspended AND user is not superadmin
  const isDisabledForUser = isSuspended && !isSuperAdmin;
  const canOpenProject = !isDisabledForUser;
  const cardClass =
    "relative flex h-full flex-col rounded-xl border bg-gradient-to-br from-background via-background to-muted/60 text-card-foreground shadow-sm transition hover:shadow-md " +
    statusStyles.cardAccent;

  const getErrorMessageForSuspend = (error: AxiosError | unknown): string => {
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
      return error.response?.data?.message || "Failed to suspend project.";
    }
    return "An unexpected error occurred. Please try again later.";
  };

  const handleSuspend = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      const response = await apiClient.put(
        `/project/${project.project_id}/suspend`,
        { suspend: !isSuspended }
      );

      if (response.status === 200) {
        toast.success(
          isSuspended
            ? "Project activated successfully"
            : "Project suspended successfully"
        );
        await fetchProjectData();
      } else {
        toast.error(getErrorMessageForSuspend(response.data));
      }
    } catch (err: unknown) {
      if (!axios.isCancel(err)) {
        toast.error(getErrorMessageForSuspend(err));
      }
    }
  };

  const handleOpenProject = () => {
    if (!canOpenProject) return;
    navigate(`/project/${project.project_id}/dashboard`);
  };

  return (
    <Card
      className={`${cardClass} ${
        canOpenProject ? "cursor-pointer" : "cursor-not-allowed"
      }`}
      onClick={canOpenProject ? handleOpenProject : undefined}
      role={canOpenProject ? "button" : undefined}
      tabIndex={canOpenProject ? 0 : -1}
    >
      {isDisabledForUser && (
        // Only when project is suspended AND user is not superadmin:
        // show a blocking overlay and disallow interaction
        <div className="absolute inset-0 z-10 rounded-xl bg-background/50 backdrop-blur-[1px] cursor-not-allowed" />
      )}

      {/* Suspend Icon - Top Right */}
      {isSuspended && (
        <div
          className="absolute top-3 right-3 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-destructive/10 border border-destructive/30"
          title="Project Suspended"
        >
          <Ban className="w-4 h-4 text-destructive" />
        </div>
      )}

      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1 pr-8">
          <CardTitle className="truncate text-base font-semibold">
            {project.name}
          </CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${statusStyles.badge}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${statusStyles.dot}`}
              />
              {project.project_status || "Unknown"}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Priority:{" "}
              <span className="font-medium capitalize">{project.priority}</span>
            </span>
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-xs">
        <div className="grid grid-cols-[1.1fr_1.2fr] gap-3">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground">
              Schedule
            </p>
            <p className="text-xs">
              <span className="font-medium">{project.start_date || "N/A"}</span>
              – <span>{project.end_date || "N/A"}</span>
            </p>
          </div>
          <div className="space-y-1 rounded-md bg-muted/60 px-2 py-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">
              Elements
            </p>
            <p className="text-xs">
              <span className="font-semibold">
                {project.casted_elements}/{project.total_elements}
              </span>{" "}
              casted
            </p>
            <p className="text-[11px] text-muted-foreground">
              In stock: <span className="font-medium">{project.in_stock}</span>,
              In production:{" "}
              <span className="font-medium">{project.in_production}</span>
            </p>
          </div>
        </div>

        {project.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {project.description}
          </p>
        )}
      </CardContent>

      <CardFooter className="mt-auto flex items-center justify-between border-t py-3">
        <div className="flex flex-col text-[11px] text-muted-foreground">
          <span>
            Last updated:{" "}
            <span className="font-medium">
              {formatDateTime(project.last_updated)}
            </span>
          </span>
          {project.last_updated_by && <span>By {project.last_updated_by}</span>}
        </div>
        <div className="flex items-center gap-2 relative z-20">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            disabled={isDisabledForUser}
            onClick={(e) => {
              e.stopPropagation();
              if (canOpenProject) {
                handleOpenProject();
              }
            }}
          >
            Open
          </Button>
          {/* Show Suspend button only for superadmin when project is NOT suspended */}
          {isSuperAdmin && !isSuspended && (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleSuspend(e);
              }}
            >
              Suspend
            </Button>
          )}
          {/* Show Activate button only for superadmin when project IS suspended */}
          {isSuperAdmin && isSuspended && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
              onClick={(e) => {
                e.stopPropagation();
                handleSuspend(e);
              }}
            >
              Activate
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
