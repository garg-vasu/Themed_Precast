import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/utils/apiClient";
import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useParams } from "react-router";
import { Input } from "@/components/ui/input";
import MultiStage from "@/components/MultiStage/MultiStage";

export interface ProjectView {
  project_id: number;
  name: string;
  suspend: boolean;
}

export type FilterStateUser = {
  selectedProject: number;
  email: string;
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  selectedRole: number;
  phone_no: string;
};

export interface RoleView {
  role_id: number;
  role_name: string;
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

interface AdvanceFilterProps {
  onFilterChange: (filter: FilterStateUser) => void;
  onClose: () => void;
  currentFilter?: FilterStateUser;
}
export default function AdvanceUserFilter({
  onFilterChange,
  onClose,
  currentFilter,
}: AdvanceFilterProps) {
  const [projectData, setProjectData] = useState<ProjectView[]>([]);
  const [roleData, setRoleData] = useState<RoleView[]>([]);

  // Filter state
  const [selectedProject, setSelectedProject] = useState<number>(
    currentFilter?.selectedProject || 0,
  );
  const [email, setEmail] = useState<string>(currentFilter?.email || "");
  const [first_name, setFirst_name] = useState<string>(
    currentFilter?.first_name || "",
  );
  const [last_name, setLast_name] = useState<string>(
    currentFilter?.last_name || "",
  );
  const [address, setAddress] = useState<string>(currentFilter?.address || "");
  const [city, setCity] = useState<string>(currentFilter?.city || "");
  const [state, setState] = useState<string>(currentFilter?.state || "");
  const [country, setCountry] = useState<string>(currentFilter?.country || "");
  const [zip_code, setZip_code] = useState<string>(
    currentFilter?.zip_code || "",
  );
  const [selectedRole, setSelectedRole] = useState<number>(
    currentFilter?.selectedRole || 0,
  );
  const [phone_no, setPhone_no] = useState<string>(
    currentFilter?.phone_no || "",
  );

  // Loading states
  const [projectLoading, setProjectLoading] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);

  // Fetch projects
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchProjects = async () => {
      setProjectLoading(true);
      try {
        const response = await apiClient.get("/projects_overview", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setProjectData(response.data.projects);
          setProjectLoading(false);
        } else {
          toast.error(response.data?.message || "Failed to fetch projects");
          setProjectLoading(false);
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

  //   fetch roles
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchRoles = async () => {
      setRoleLoading(true);
      try {
        const response = await apiClient.get("/roles", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setRoleData(response.data);
          setRoleLoading(false);
        } else {
          toast.error(response.data?.message || "Failed to fetch roles");
          setRoleLoading(false);
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "roles data"));
        }
      }
    };

    fetchRoles();

    return () => {
      source.cancel();
    };
  }, []);
  // Sync local state with currentFilter prop when it changes
  useEffect(() => {
    if (currentFilter) {
      setSelectedProject(currentFilter.selectedProject || 0);
      setEmail(currentFilter.email || "");
      setFirst_name(currentFilter.first_name || "");
      setLast_name(currentFilter.last_name || "");
      setAddress(currentFilter.address || "");
      setCity(currentFilter.city || "");
      setState(currentFilter.state || "");
      setCountry(currentFilter.country || "");
      setZip_code(currentFilter.zip_code || "");
      setSelectedRole(currentFilter.selectedRole || 0);
      setPhone_no(currentFilter.phone_no || "");
    }
  }, [currentFilter]);

  const handleApplyFilter = () => {
    const filter: FilterStateUser = {
      selectedProject,
      email,
      first_name,
      last_name,
      address,
      city,
      state,
      country,
      zip_code,
      selectedRole,
      phone_no,
    };
    onFilterChange(filter);
    // Don't close - keep filter open for "Apply & Keep Open"
  };

  const handleApplyAndClose = () => {
    const filter: FilterStateUser = {
      selectedProject,
      email,
      first_name,
      last_name,
      address,
      city,
      state,
      country,
      zip_code,
      selectedRole,
      phone_no,
    };
    onFilterChange(filter);
    onClose();
  };

  const handleResetFilter = () => {
    setSelectedProject(0);
    setEmail("");
    setFirst_name("");
    setLast_name("");
    setAddress("");
    setCity("");
    setState("");
    setCountry("");
    setZip_code("");
    setSelectedRole(0);
    setPhone_no("");
  };
  return (
    <div className="w-full space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Advance Filter</h2>
      </div>
      {/* filter form grid  */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Project Name */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="project_name">
            Project Name <span className="text-red-500">*</span>
          </Label>
          <Select
            value={selectedProject ? selectedProject.toString() : ""}
            disabled={projectLoading}
            onValueChange={(value) => setSelectedProject(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={projectLoading ? "Loading..." : "Select a project"}
              />
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
        {/* ROLE NAME */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="role_name">
            Role Name <span className="text-red-500">*</span>
          </Label>
          <Select
            value={selectedRole ? selectedRole.toString() : ""}
            disabled={roleLoading}
            onValueChange={(value) => setSelectedRole(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={roleLoading ? "Loading..." : "Select a role"}
              />
            </SelectTrigger>
            <SelectContent>
              {roleData?.map((role) => (
                <SelectItem key={role.role_id} value={role.role_id.toString()}>
                  {role.role_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* workorder number */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="email">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* first name */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="first_name">
            First Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="first_name"
            placeholder="First Name"
            value={first_name}
            onChange={(e) => setFirst_name(e.target.value)}
          />
        </div>

        {/* last name */}
        {/* revision number */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="last_name">
            Last Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="last_name"
            placeholder="Last Name"
            value={last_name}
            onChange={(e) => setLast_name(e.target.value)}
          />
        </div>

        {/* contact person */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="address">
            Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="address"
            placeholder="Contact Person"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        {/* City */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>

        {/* Work Order Valid Till */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
          />
        </div>

        {/* Country */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>

        {/* zip code */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="zip_code">Zip Code</Label>
          <Input
            id="zip_code"
            value={zip_code}
            onChange={(e) => setZip_code(e.target.value)}
          />
        </div>
        {/* phone no */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="phone_no">Phone No</Label>
          <Input
            id="phone_no"
            value={phone_no}
            onChange={(e) => setPhone_no(e.target.value)}
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
