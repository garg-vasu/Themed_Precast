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

export type TowerData = {
  id: number;
  project_id: number;
  name: string;
  description: string;
  child_count: number;
};

export type Tower = {
  total_towers: number;
  towers: TowerData[];
};

export type DepartmentData = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

export type SkillData = {
  id: number;
  name: string;
  skill_type_id: number;
  created_at: string;
  updated_at: string;
};

export interface ProjectView {
  project_id: number;
  description: string;
  name: string;
  priority: string;
  project_status: string;
  logo: string;
  start_date: string;
  end_date: string;
  budget: string;
  client_name: string;
  client_id: number;
  total_elements: number;
  completed_elements: number;
  progress: number;
  suspend: boolean;
}

export type FilterStateAttendance = {
  selectedTower: number;
  selectedProject: number;
  selectedDepartment: number;
  selectedCategory: number;
  selectedTotalPeople: number;
  selectedSkilltype: number;
  selectedSkill: number;
};

export type CategoryData = {
  id: number;
  name: string;
  project_id: number;
  project_name: string;
  created_at: string;
  updated_at: string;
};

export type PeopleData = {
  id: number;
  name: string;
  email: string;
  phone_no: string;
  project_name: string;
  department_id: number;
  category_id: number;
  project_id: number;
  created_at: string;
  updated_at: string;
};

export type SkilltypeData = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
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
  onFilterChange: (filter: FilterStateAttendance) => void;
  onClose: () => void;
  currentFilter?: FilterStateAttendance;
}
export default function AdvanceAttendanceFilter({
  onFilterChange,
  onClose,
  currentFilter,
}: AdvanceFilterProps) {
  const [towerData, setTowerData] = useState<TowerData[]>([]);
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [peopleData, setPeopleData] = useState<PeopleData[]>([]);
  const [skilltypeData, setSkilltypeData] = useState<SkilltypeData[]>([]);
  const [skillData, setSkillData] = useState<SkillData[]>([]);
  const [projectData, setProjectData] = useState<ProjectView[]>([]);

  // Filter state
  const [selectedProject, setSelectedProject] = useState<number>(
    currentFilter?.selectedProject || 0
  );
  const [selectedTower, setSelectedTower] = useState<number>(
    currentFilter?.selectedTower || 0
  );
  const [selectedDepartment, setSelectedDepartment] = useState<number>(
    currentFilter?.selectedDepartment || 0
  );
  const [selectedCategory, setSelectedCategory] = useState<number>(
    currentFilter?.selectedCategory || 0
  );
  const [selectedTotalPeople, setSelectedTotalPeople] = useState<number>(
    currentFilter?.selectedTotalPeople || 0
  );
  const [selectedSkilltype, setSelectedSkilltype] = useState<number>(
    currentFilter?.selectedSkilltype || 0
  );
  const [selectedSkill, setSelectedSkill] = useState<number>(
    currentFilter?.selectedSkill || 0
  );

  // Loading states
  const [projectLoading, setProjectLoading] = useState(false);
  const [towerLoading, setTowerLoading] = useState(false);
  const [departmentLoading, setDepartmentLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [skilltypeLoading, setSkilltypeLoading] = useState(false);
  const [skillLoading, setSkillLoading] = useState(false);

  // Fetch projects
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchProject = async () => {
      setProjectLoading(true);
      try {
        const response = await apiClient.get(`/projects`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setProjectData(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch projects");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "projects data"));
        }
      } finally {
        setProjectLoading(false);
      }
    };
    fetchProject();

    return () => {
      source.cancel();
    };
  }, []);

  // Fetch towers when project is selected
  useEffect(() => {
    if (!selectedProject) {
      setTowerData([]);
      setSelectedTower(0);
      return;
    }

    const source = axios.CancelToken.source();

    const fetchTower = async (projectId: number) => {
      setTowerLoading(true);
      try {
        const response = await apiClient.get(`/dashboard/towers/${projectId}`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setTowerData(response.data.towers);
        } else if (response.status === 404 || response.status === 204) {
          setTowerData([]);
        } else {
          toast.error(response.data?.message || "Failed to fetch towers");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "towers data"));
        }
      } finally {
        setTowerLoading(false);
      }
    };
    fetchTower(selectedProject);

    return () => {
      source.cancel();
    };
  }, [selectedProject]);

  // Fetch departments
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchDepartment = async () => {
      setDepartmentLoading(true);
      try {
        const response = await apiClient.get(`/departments`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setDepartmentData(response.data.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch departments");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "departments data"));
        }
      } finally {
        setDepartmentLoading(false);
      }
    };
    fetchDepartment();

    return () => {
      source.cancel();
    };
  }, []);

  // Fetch categories
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchCategory = async () => {
      setCategoryLoading(true);
      try {
        const response = await apiClient.get(`/categories`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setCategoryData(response.data.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch categories");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "categories data"));
        }
      } finally {
        setCategoryLoading(false);
      }
    };
    fetchCategory();

    return () => {
      source.cancel();
    };
  }, []);

  // Fetch people when project, department, and category are selected
  useEffect(() => {
    if (!selectedProject) {
      setPeopleData([]);
      setSelectedTotalPeople(0);
      return;
    }

    const source = axios.CancelToken.source();

    const fetchPeople = async () => {
      setPeopleLoading(true);
      try {
        const response = await apiClient.get(`/people`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setPeopleData(response.data.data);
        } else if (response.status === 404 || response.status === 204) {
          setPeopleData([]);
        } else {
          toast.error(response.data?.message || "Failed to fetch people");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "people data"));
        }
      } finally {
        setPeopleLoading(false);
      }
    };
    fetchPeople();

    return () => {
      source.cancel();
    };
  }, [selectedProject]);

  // Fetch skill types
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchSkilltype = async () => {
      setSkilltypeLoading(true);
      try {
        const response = await apiClient.get(`/skill-types`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setSkilltypeData(response.data.data);
        } else if (response.status === 404 || response.status === 204) {
          setSkilltypeData([]);
        } else {
          toast.error(response.data?.message || "Failed to fetch skill types");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "skill types data"));
        }
      } finally {
        setSkilltypeLoading(false);
      }
    };
    fetchSkilltype();

    return () => {
      source.cancel();
    };
  }, []);

  // Fetch skills when skill type is selected
  useEffect(() => {
    if (!selectedSkilltype) {
      setSkillData([]);
      setSelectedSkill(0);
      return;
    }

    const source = axios.CancelToken.source();

    const fetchSkill = async (skilltypeId: number) => {
      setSkillLoading(true);
      try {
        const response = await apiClient.get(
          `/skills?skill_type_id=${skilltypeId}`,
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          setSkillData(response.data.data);
        } else if (response.status === 404 || response.status === 204) {
          setSkillData([]);
        } else {
          toast.error(response.data?.message || "Failed to fetch skills");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "skills data"));
        }
      } finally {
        setSkillLoading(false);
      }
    };
    fetchSkill(selectedSkilltype);

    return () => {
      source.cancel();
    };
  }, [selectedSkilltype]);

  // Sync local state with currentFilter prop when it changes
  useEffect(() => {
    if (currentFilter) {
      setSelectedProject(currentFilter.selectedProject || 0);
      setSelectedTower(currentFilter.selectedTower || 0);
      setSelectedDepartment(currentFilter.selectedDepartment || 0);
      setSelectedCategory(currentFilter.selectedCategory || 0);
      setSelectedTotalPeople(currentFilter.selectedTotalPeople || 0);
      setSelectedSkilltype(currentFilter.selectedSkilltype || 0);
      setSelectedSkill(currentFilter.selectedSkill || 0);
    }
  }, [currentFilter]);

  const handleApplyFilter = () => {
    const filter: FilterStateAttendance = {
      selectedProject,
      selectedTower,
      selectedDepartment,
      selectedCategory,
      selectedTotalPeople,
      selectedSkilltype,
      selectedSkill,
    };
    onFilterChange(filter);
    // Don't close - keep filter open for "Apply & Keep Open"
  };

  const handleApplyAndClose = () => {
    const filter: FilterStateAttendance = {
      selectedProject,
      selectedTower,
      selectedDepartment,
      selectedCategory,
      selectedTotalPeople,
      selectedSkilltype,
      selectedSkill,
    };
    onFilterChange(filter);
    onClose();
  };

  const handleResetFilter = () => {
    setSelectedProject(0);
    setSelectedTower(0);
    setSelectedDepartment(0);
    setSelectedCategory(0);
    setSelectedTotalPeople(0);
    setSelectedSkilltype(0);
    setSelectedSkill(0);
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
            onValueChange={(value) => {
              setSelectedProject(Number(value));
              // Reset dependent fields
              setSelectedTower(0);
              setSelectedCategory(0);
              setSelectedTotalPeople(0);
            }}
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

        {/* Tower */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="tower">Tower</Label>
          <Select
            value={selectedTower ? selectedTower.toString() : ""}
            disabled={towerLoading || !selectedProject}
            onValueChange={(value) => setSelectedTower(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  !selectedProject
                    ? "Select project first"
                    : towerLoading
                    ? "Loading..."
                    : "Select a tower"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {towerData?.map((tower) => (
                <SelectItem key={tower.id} value={tower.id.toString()}>
                  {tower.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Department */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="department">Department</Label>
          <Select
            value={selectedDepartment ? selectedDepartment.toString() : ""}
            disabled={departmentLoading || !selectedTower}
            onValueChange={(value) => setSelectedDepartment(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  departmentLoading ? "Loading..." : "Select a department"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {departmentData?.map((dept) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="category">Category</Label>
          <Select
            value={selectedCategory ? selectedCategory.toString() : ""}
            disabled={categoryLoading}
            onValueChange={(value) => setSelectedCategory(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  !selectedProject
                    ? "Select project first"
                    : categoryLoading
                    ? "Loading..."
                    : "Select a category"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {categoryData?.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Total People */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="total_people">Total People</Label>
          <Select
            value={selectedTotalPeople ? selectedTotalPeople.toString() : ""}
            disabled={peopleLoading}
            onValueChange={(value) => setSelectedTotalPeople(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  !selectedProject
                    ? "Select project first"
                    : peopleLoading
                    ? "Loading..."
                    : "Select total people"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {peopleData?.map((person) => (
                <SelectItem key={person.id} value={person.id.toString()}>
                  {person.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Skill Type */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="skill_type">Skill Type</Label>
          <Select
            value={selectedSkilltype ? selectedSkilltype.toString() : ""}
            disabled={skilltypeLoading}
            onValueChange={(value) => {
              setSelectedSkilltype(Number(value));
              setSelectedSkill(0);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  skilltypeLoading ? "Loading..." : "Select a skill type"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {skilltypeData?.map((skilltype) => (
                <SelectItem key={skilltype.id} value={skilltype.id.toString()}>
                  {skilltype.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Skill */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="skill">Skill</Label>
          <Select
            value={selectedSkill ? selectedSkill.toString() : ""}
            disabled={skillLoading || !selectedSkilltype}
            onValueChange={(value) => setSelectedSkill(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  !selectedSkilltype
                    ? "Select skill type first"
                    : skillLoading
                    ? "Loading..."
                    : "Select a skill"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {skillData?.map((skill) => (
                <SelectItem key={skill.id} value={skill.id.toString()}>
                  {skill.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
