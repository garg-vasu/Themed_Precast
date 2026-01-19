import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { apiClient } from "@/utils/apiClient";
import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export type FilterStateLog = {
  selectedProject: number;
  user_name: string;
  event_name: string;
  ip_address: string;
  host_name: string;
  affected_user_name: string;
  affected_user_email: string;
  event_context: string;
  event_context_mode?: "contains" | "exact";
};

export interface ProjectView {
  project_id: number;
  name: string;
  suspend: boolean;
}

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

interface LogAdvanceFilterProps {
  onFilterChange: (filter: FilterStateLog) => void;
  onClose: () => void;
  currentFilter?: FilterStateLog;
}
export default function LogAdvanceFilter({
  onFilterChange,
  onClose,
  currentFilter,
}: LogAdvanceFilterProps) {
  // Available stages for selection

  const [projectData, setProjectData] = useState<ProjectView[]>([]);

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchProjects = async () => {
      try {
        const response = await apiClient.get("/projects_overview", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setProjectData(response.data.projects);
        } else {
          toast.error(response.data?.message || "Failed to fetch projects");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "projects data"));
        }
      }
    };

    fetchProjects();

    return () => {
      source.cancel();
    };
  }, []);

  // Filter state
  const [selectedProject, setSelectedProject] = useState<number>(
    currentFilter?.selectedProject || 0
  );

  const [userName, setUserName] = useState<string>(
    currentFilter?.user_name || ""
  );
  const [eventName, setEventName] = useState<string>(
    currentFilter?.event_name || ""
  );
  const [ipAddress, setIpAddress] = useState<string>(
    currentFilter?.ip_address || ""
  );
  const [hostName, setHostName] = useState<string>(
    currentFilter?.host_name || ""
  );
  const [affectedUserName, setAffectedUserName] = useState<string>(
    currentFilter?.affected_user_name || ""
  );
  const [affectedUserEmail, setAffectedUserEmail] = useState<string>(
    currentFilter?.affected_user_email || ""
  );
  const [eventContext, setEventContext] = useState<string>(
    currentFilter?.event_context || ""
  );
  const [eventContextSearchMode, setEventContextSearchMode] = useState<
    "contains" | "exact"
  >(currentFilter?.event_context_mode || "contains");

  // Sync local state with currentFilter prop when it changes
  useEffect(() => {
    if (currentFilter) {
      setSelectedProject(currentFilter.selectedProject || 0);
      setUserName(currentFilter.user_name || "");
      setEventName(currentFilter.event_name || "");
      setIpAddress(currentFilter.ip_address || "");
      setHostName(currentFilter.host_name || "");
      setAffectedUserName(currentFilter.affected_user_name || "");
      setAffectedUserEmail(currentFilter.affected_user_email || "");
      setEventContext(currentFilter.event_context || "");
      setEventContextSearchMode(currentFilter.event_context_mode || "contains");
    }
  }, [currentFilter]);

  const handleApplyFilter = () => {
    const filter: FilterStateLog = {
      selectedProject,
      user_name: userName,
      event_name: eventName,
      ip_address: ipAddress,
      host_name: hostName,
      affected_user_name: affectedUserName,
      affected_user_email: affectedUserEmail,
      event_context: eventContext,
      event_context_mode: eventContextSearchMode,
    };
    onFilterChange(filter);
    // Don't close - keep filter open for "Apply & Keep Open"
  };

  const handleApplyAndClose = () => {
    const filter: FilterStateLog = {
      selectedProject,
      user_name: userName,
      event_name: eventName,
      ip_address: ipAddress,
      host_name: hostName,
      affected_user_name: affectedUserName,
      affected_user_email: affectedUserEmail,
      event_context: eventContext,
      event_context_mode: eventContextSearchMode,
    };
    onFilterChange(filter);
    onClose();
  };

  const handleResetFilter = () => {
    setSelectedProject(0);
    setUserName("");
    setEventName("");
    setIpAddress("");
    setHostName("");
    setAffectedUserName("");
    setAffectedUserEmail("");
    setEventContext("");
    setEventContextSearchMode("contains");
  };
  return (
    <div className="w-full space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Advance Filter</h2>
      </div>
      {/* filter form grid  */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* element type */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="user_name">
            User Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="user_name"
            placeholder="User Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>

        {/* type name */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="event_name">
            Event Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="event_name"
            placeholder="Event Name"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
          />
        </div>
        {/* project name */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="project_name">
            Project Name <span className="text-red-500">*</span>
          </Label>
          <Select
            value={selectedProject ? selectedProject.toString() : ""}
            onValueChange={(value) => setSelectedProject(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projectData?.map((project) => (
                <SelectItem
                  key={project.project_id}
                  value={project.project_id.toString()}
                >
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* ip address  */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="ip_address">
            IP Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="ip_address"
            placeholder="IP Address"
            value={ipAddress}
            onChange={(e) => setIpAddress(e.target.value)}
          />
        </div>
        {/* host name  */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="host_name">
            Host Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="host_name"
            placeholder="Host Name"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
          />
        </div>
        {/* affected user name  */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="affected_user_name">
            Affected User Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="affected_user_name"
            placeholder="Affected User Name"
            value={affectedUserName}
            onChange={(e) => setAffectedUserName(e.target.value)}
          />
        </div>
        {/* affected user email  */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="affected_user_email">
            Affected User Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="affected_user_email"
            placeholder="Affected User Email"
            value={affectedUserEmail}
            onChange={(e) => setAffectedUserEmail(e.target.value)}
          />
        </div>
        {/* event context  */}
        <div className="grid w-full items-center gap-1.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="event_context">
              Event Context <span className="text-red-500">*</span>
            </Label>
            <Switch
              checked={eventContextSearchMode === "exact"}
              onCheckedChange={(checked) =>
                setEventContextSearchMode(checked ? "exact" : "contains")
              }
            />
            <Label className="text-sm font-normal text-muted-foreground cursor-pointer">
              {eventContextSearchMode === "exact" ? "Exact" : "Contains"}
            </Label>
          </div>
          <Input
            id="event_context"
            placeholder="Event Context"
            value={eventContext}
            onChange={(e) => setEventContext(e.target.value)}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={handleResetFilter}>
          Reset
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="outline" onClick={handleApplyFilter}>
          Apply & Keep Open
        </Button>
        <Button onClick={handleApplyAndClose}>Apply & Close</Button>
      </div>
    </div>
  );
}
