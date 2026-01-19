import { useCallback, useContext, useEffect, useState } from "react";
import { UserContext } from "@/Provider/UserProvider";
import { useNavigate, useParams } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
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

export const getErrorMessage = (error: AxiosError | unknown): string => {
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

export default function EndClientProjectDashboard() {
  const [data, setData] = useState<ProjectsOverviewResponse>();
  const { user } = useContext(UserContext);
  const { end_client_id } = useParams<{ end_client_id: string }>();
  const [selectedfilter, setSelectedfilter] = useState<string>("active");
  const navigate = useNavigate();

  const WithFilterParam = (endpoint: string) => {
    return selectedfilter
      ? `${endpoint}?${`type=${encodeURIComponent(selectedfilter)}`}`
      : endpoint;
  };

  const fetchProjectData = useCallback(async () => {
    try {
      const response = await apiClient.get(
        WithFilterParam(`/endclient_projects/${end_client_id}`)
      );

      if (response.status === 200) {
        setData(response.data);
      } else {
        toast.error(response.data?.message || "Failed to fetch project data");
      }
    } catch (err: unknown) {
      if (!axios.isCancel(err)) {
        toast.error(getErrorMessage(err));
      }
    }
  }, [selectedfilter]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      {/* header section  */}
      <div className="flex items-center justify-between gap-3">
        <PageHeader title="Project Overview" ResponsivefontSize={true} />
        <div className="flex items-center gap-2">
          <Select
            value={selectedfilter}
            onValueChange={(value: string) => setSelectedfilter(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspend">Suspended</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="inactive">In Active</SelectItem>
            </SelectContent>
          </Select>
          {user?.role_name === "superadmin" && (
            <Button
              variant="outline"
              onClick={() => navigate("/projects/create")}
              className="gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Project
            </Button>
          )}
        </div>
      </div>

      {/* stats summary section */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-primary">
              In Planned
            </CardTitle>
            <CardDescription>Currently in production pipeline</CardDescription>
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
            <CardDescription>Ready to be dispatched / erected</CardDescription>
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

      {/* project cards grid */}
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
  const cardDisabled = project.suspend;
  const statusStyles = getStatusStyles(project.project_status);
  // overlay + block interaction ONLY when project is suspended AND user is not superadmin
  const isSuspendedForUser =
    cardDisabled && user && user.role_name !== "superadmin";
  const canOpenProject = !isSuspendedForUser;
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
        { suspend: !cardDisabled }
      );

      if (response.status === 200) {
        toast.success("Project suspended successfully");
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
    navigate(`/projects/${project.project_id}`);
  };

  return (
    <Card
      className={cardClass}
      onClick={canOpenProject ? handleOpenProject : undefined}
      role={canOpenProject ? "button" : undefined}
      tabIndex={canOpenProject ? 0 : -1}
    >
      {isSuspendedForUser && (
        // Only when project is suspended AND user is not superadmin:
        // show a blocking overlay and disallow interaction
        <div className="absolute inset-0 z-10 rounded-xl bg-background/40 backdrop-blur-[1px] cursor-not-allowed" />
      )}

      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
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
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenProject();
            }}
          >
            Open
          </Button>
          {user?.role_name === "superadmin" && (
            <Button
              type="button"
              size="sm"
              variant={cardDisabled ? "outline" : "destructive"}
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleSuspend(e);
              }}
            >
              {cardDisabled ? "Activate" : "Suspend"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
