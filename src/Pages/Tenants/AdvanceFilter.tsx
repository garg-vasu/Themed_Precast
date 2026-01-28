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

export type FilterStateTenant = {
  organization: string;
  employee_id: string;
  email: string;
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  phone_no: string;
  selectedProject: number;
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

interface AdvanceFilterProps {
  onFilterChange: (filter: FilterStateTenant) => void;
  onClose: () => void;
  currentFilter?: FilterStateTenant;
}
export default function AdvanceTenantFilter({
  onFilterChange,
  onClose,
  currentFilter,
}: AdvanceFilterProps) {
  const [projectData, setProjectData] = useState<ProjectView[]>([]);

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
  const [organization, setOrganization] = useState<string>(
    currentFilter?.organization || "",
  );
  const [employee_id, setEmployee_id] = useState<string>(
    currentFilter?.employee_id || "",
  );
  const [state, setState] = useState<string>(currentFilter?.state || "");
  const [country, setCountry] = useState<string>(currentFilter?.country || "");
  const [zip_code, setZip_code] = useState<string>(
    currentFilter?.zip_code || "",
  );
  const [phone_no, setPhone_no] = useState<string>(
    currentFilter?.phone_no || "",
  );

  // Loading states
  const [projectLoading, setProjectLoading] = useState(false);

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
      setPhone_no(currentFilter.phone_no || "");
      setOrganization(currentFilter.organization || "");
      setEmployee_id(currentFilter.employee_id || "");
    }
  }, [currentFilter]);

  const handleApplyFilter = () => {
    const filter: FilterStateTenant = {
      selectedProject,
      email,
      first_name,
      last_name,
      address,
      city,
      state,
      country,
      zip_code,
      organization,
      employee_id,
      phone_no,
    };
    onFilterChange(filter);
    // Don't close - keep filter open for "Apply & Keep Open"
  };

  const handleApplyAndClose = () => {
    const filter: FilterStateTenant = {
      selectedProject,
      email,
      first_name,
      last_name,
      address,
      city,
      state,
      country,
      zip_code,
      organization,
      employee_id,
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
    setOrganization("");
    setEmployee_id("");
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

        {/* email */}
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
        {/* organization */}
        {/* email */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="organization">
            Organization <span className="text-red-500">*</span>
          </Label>
          <Input
            id="organization"
            placeholder="Organization"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
          />
        </div>
        {/* employee id */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="employee_id">
            Employee ID <span className="text-red-500">*</span>
          </Label>
          <Input
            id="employee_id"
            placeholder="Employee ID"
            value={employee_id}
            onChange={(e) => setEmployee_id(e.target.value)}
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
