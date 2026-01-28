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

export type FilterStateWorkOrder = {
  selectedProject: number;
  workordernumber: string;
  revisionnumber: number;
  contactperson: string; 
  wo_date: string;
  wo_validate: string;
  totalvalue: number;
  totalvalueFilterType: "upto" | "exact";
  createdat: string;
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
  onFilterChange: (filter: FilterStateWorkOrder) => void;
  onClose: () => void;
  currentFilter?: FilterStateWorkOrder;
}
export default function AdvanceWorkOrderFilter({
  onFilterChange,
  onClose,
  currentFilter,
}: AdvanceFilterProps) {
 
  const [projectData, setProjectData] = useState<ProjectView[]>([]);
  

  // Filter state
  const [selectedProject, setSelectedProject] = useState<number>(
    currentFilter?.selectedProject || 0
  );
  const [workordernumber, setWorkordernumber] = useState<string>(
    currentFilter?.workordernumber || ""
  );
  const [revisionnumber, setRevisionnumber] = useState<number>(
    currentFilter?.revisionnumber || 0
  );
  const [contactperson, setContactperson] = useState<string>(
    currentFilter?.contactperson || ""
  );
  const [wo_date, setWo_date] = useState<string>(
    currentFilter?.wo_date || ""
  );
  const [wo_validate, setWo_validate] = useState<string>(
    currentFilter?.wo_validate || ""
  );
  const [totalvalue, setTotalvalue] = useState<number>(
    currentFilter?.totalvalue || 0
  );
  const [totalvalueFilterType, setTotalvalueFilterType] = useState<"upto" | "exact">(
    currentFilter?.totalvalueFilterType || "exact"
  );
  const [createdat, setCreatedat] = useState<string>(
    currentFilter?.createdat || ""
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
      setWorkordernumber(currentFilter.workordernumber || "");
      setRevisionnumber(currentFilter.revisionnumber || 0);
      setContactperson(currentFilter.contactperson || "");
      setWo_date(currentFilter.wo_date || "");
      setWo_validate(currentFilter.wo_validate || "");
      setTotalvalue(currentFilter.totalvalue || 0);
      setTotalvalueFilterType(currentFilter.totalvalueFilterType || "exact");
      setCreatedat(currentFilter.createdat || "");
    }
  }, [currentFilter]);

  const handleApplyFilter = () => {
    const filter: FilterStateWorkOrder = {
      selectedProject,
      workordernumber,
      revisionnumber,
      contactperson,
      wo_date,
      wo_validate,
      totalvalue,
      totalvalueFilterType,
      createdat,
    };
    onFilterChange(filter);
    // Don't close - keep filter open for "Apply & Keep Open"
  };

  const handleApplyAndClose = () => {
    const filter: FilterStateWorkOrder = {
      selectedProject,
      workordernumber,
      revisionnumber,
      contactperson,
      wo_date,
      wo_validate,
      totalvalue,
      totalvalueFilterType,
      createdat,
    };
    onFilterChange(filter);
    onClose();
  };

  const handleResetFilter = () => {
    setSelectedProject(0);
    setWorkordernumber("");
    setRevisionnumber(0);
    setContactperson("");
    setWo_date("");
    setWo_validate("");
    setTotalvalue(0);
    setTotalvalueFilterType("exact");
    setCreatedat("");
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
                <SelectItem key={project.project_id} value={project.project_id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

              

        {/* workorder number */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="workorder_number">
            Workorder Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="workorder_number"
            placeholder="Workorder Number"
            value={workordernumber}
            onChange={(e) => setWorkordernumber(e.target.value)}
          />
        </div>

        {/* revision number */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="revision_number">
            Revision Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="revision_number"
            placeholder="Revision Number"
            value={revisionnumber}
            onChange={(e) => setRevisionnumber(Number(e.target.value))}
          />
        </div>

        {/* contact person */}
         <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="contact_person">
            Contact Person <span className="text-red-500">*</span>
          </Label>
          <Input
            id="contact_person"
            placeholder="Contact Person"
            value={contactperson}
            onChange={(e) => setContactperson(e.target.value)}
          />
        </div>

        {/* total value  */}
        <div className="grid w-full items-center gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="total_value">
              Total Value
            </Label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="totalvalueFilterType"
                  value="exact"
                  checked={totalvalueFilterType === "exact"}
                  onChange={() => setTotalvalueFilterType("exact")}
                  className="h-3 w-3"
                />
                <span className="text-xs">Exact</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="totalvalueFilterType"
                  value="upto"
                  checked={totalvalueFilterType === "upto"}
                  onChange={() => setTotalvalueFilterType("upto")}
                  className="h-3 w-3"
                />
                <span className="text-xs">Upto</span>
              </label>
            </div>
          </div>
          <Input
            id="total_value"
            type="number"
            placeholder="Total Value"
            value={totalvalue}
            onChange={(e) => setTotalvalue(Number(e.target.value))}
          />
        </div>

        {/* Work Order Date */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="wo_date">
            Work Order Date
          </Label>
          <Input
            id="wo_date"
            type="date"
            value={wo_date}
            onChange={(e) => setWo_date(e.target.value)}
          />
        </div>

        {/* Work Order Valid Till */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="wo_validate">
            Work Order Valid Till
          </Label>
          <Input
            id="wo_validate"
            type="date"
            value={wo_validate}
            onChange={(e) => setWo_validate(e.target.value)}
          />
        </div>

        {/* Created At */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="createdat">
            Created At
          </Label>
          <Input
            id="createdat"
            type="date"
            value={createdat}
            onChange={(e) => setCreatedat(e.target.value)}
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
