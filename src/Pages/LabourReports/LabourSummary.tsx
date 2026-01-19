import PageHeader from "@/components/ui/PageHeader";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import { useEffect, useState, useCallback } from "react";
import { DateFilter } from "@/components/DateFilter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronRight,
  Loader2,
  FolderKanban,
  FolderTree,
  Building2,
  Users,
  Wrench,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Project {
  project_id: number;
  name: string;
  total_count: number;
}

interface Caterogy {
  category_id: number;
  category_name: string;
  total_count: number;
}

interface Department {
  department_id: number;
  department_name: string;
  total_count: number;
}

interface People {
  people_id: number;
  people_name: string;
  total_count: number;
}

interface SkillType {
  skill_type_id: number;
  skill_type_name: string;
  total_count: number;
}

interface Skill {
  skill_id: number;
  skill_name: string;
  total_count: number;
}

interface NavigationState {
  selectedProject: Project | null;
  selectedCategory: Caterogy | null;
  selectedDepartment: Department | null;
  selectedPeople: People | null;
  selectedSkillType: SkillType | null;
  selectedSkill: Skill | null;
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

export default function LabourSummary() {
  // navigation state
  const [navigationState, setNavigationState] = useState<NavigationState>({
    selectedProject: null,
    selectedCategory: null,
    selectedDepartment: null,
    selectedPeople: null,
    selectedSkillType: null,
    selectedSkill: null,
  });

  const [dateFilter, setDateFilter] = useState<{
    type: "yearly" | "monthly" | "weekly";
    year: number;
    month?: number;
    week?: number;
    date?: Date;
  }>({
    type: "yearly",
    year: new Date().getFullYear(),
  });

  //   data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Caterogy[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [people, setPeople] = useState<People[]>([]);
  const [skillTypes, setSkillTypes] = useState<SkillType[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  //   loading data state
  const [isLoading, setIsLoading] = useState(true);

  //   query parameter builder
  const buildQueryParams = useCallback(() => {
    let params = `type=${dateFilter.type}&year=${dateFilter.year}`;
    if (dateFilter.month) {
      params += `&month=${dateFilter.month}`;
    }

    if (dateFilter.type === "weekly" && dateFilter.date) {
      const day = dateFilter.date.getDate();
      params += `&date=${day}`;
    }

    return params;
  }, [dateFilter]);

  //   api function calls

  const fetchProject = useCallback(async () => {
    const source = axios.CancelToken.source();
    try {
      const response = await apiClient.get(
        `/manpower_project/summary?${buildQueryParams()}`,
        {
          cancelToken: source.token,
        }
      );

      if (response.status === 200) {
        setProjects(response.data);
        return response.data;
      } else {
        toast.error(response.data?.message || "Failed to fetch projects");
        return null;
      }
    } catch (err: unknown) {
      if (!axios.isCancel(err)) {
        toast.error(getErrorMessage(err, "projects"));
      }
      return null;
    }
  }, [buildQueryParams]);

  //   fetch categories
  const fetchCategories = useCallback(
    async (projectId: number) => {
      const source = axios.CancelToken.source();
      try {
        const response = await apiClient.get(
          `manpower_project/summary/h1?project_id=${projectId}&${buildQueryParams()}`,
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          const categories = response.data.categories || [];
          setCategories(categories);
          return categories;
        } else {
          toast.error(response.data?.message || "Failed to fetch categories");
          return null;
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "categories"));
        }
        return null;
      }
    },
    [buildQueryParams]
  );

  //   fetch departments
  const fetchDepartments = useCallback(
    async (categoryId: number) => {
      const source = axios.CancelToken.source();
      try {
        const response = await apiClient.get(
          `manpower_project/summary/h2?category_id=${categoryId}&${buildQueryParams()}`,
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          const departments = response.data.departments || [];
          setDepartments(departments);
          return departments;
        } else {
          toast.error(response.data?.message || "Failed to fetch departments");
          return null;
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "departments"));
        }
        return null;
      }
    },
    [buildQueryParams]
  );

  //   fetch people
  const fetchPeople = useCallback(
    async (departmentId: number, projectId: number) => {
      const source = axios.CancelToken.source();
      try {
        const response = await apiClient.get(
          `manpower_project/summary/h3?department_id=${departmentId}&${buildQueryParams()}&project_id=${projectId}`,
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          const people = response.data.people || [];
          setPeople(people);
          return people;
        } else {
          toast.error(response.data?.message || "Failed to fetch people");
          return null;
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "people"));
        }
        return null;
      }
    },
    [buildQueryParams]
  );

  //   fetch skill types
  const fetchSkillTypes = useCallback(
    async (peopleId: number, projectId: number) => {
      const source = axios.CancelToken.source();
      try {
        const response = await apiClient.get(
          `manpower_project/summary/h4?people_id=${peopleId}&${buildQueryParams()}&project_id=${projectId}`,
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          const skillTypes = response.data.skill_types || [];
          setSkillTypes(skillTypes);
          return skillTypes;
        } else {
          toast.error(response.data?.message || "Failed to fetch skill types");
          return null;
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "skill types"));
        }
        return null;
      }
    },
    [buildQueryParams]
  );

  //   fetch skills
  const fetchSkills = useCallback(
    async (skillTypeId: number, projectId: number) => {
      const source = axios.CancelToken.source();
      try {
        const response = await apiClient.get(
          `manpower_project/summary/h5?skill_type_id=${skillTypeId}&${buildQueryParams()}&project_id=${projectId}`,
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          const skills = response.data.skills || [];
          setSkills(skills);
          return skills;
        } else {
          toast.error(response.data?.message || "Failed to fetch skills");
          return null;
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "skills"));
        }
        return null;
      }
    },
    [buildQueryParams]
  );

  const handleDateFilterChange = async (filter: {
    type: "yearly" | "monthly" | "weekly";
    year: number;
    month?: number;
    date?: Date;
  }) => {
    setDateFilter(filter);
    // reset all navigation state
    setNavigationState({
      selectedProject: null,
      selectedCategory: null,
      selectedDepartment: null,
      selectedPeople: null,
      selectedSkillType: null,
      selectedSkill: null,
    });
    // clear all data
    setCategories([]);
    setDepartments([]);
    setPeople([]);
    setSkillTypes([]);
    setSkills([]);
  };

  // load initial data when date filter changes
  useEffect(() => {
    setIsLoading(true);
    fetchProject().finally(() => setIsLoading(false));
  }, [fetchProject]);

  //   navigation function
  const selectProject = async (project: Project) => {
    setIsLoading(true);
    setNavigationState({
      selectedProject: project,
      selectedCategory: null,
      selectedDepartment: null,
      selectedPeople: null,
      selectedSkillType: null,
      selectedSkill: null,
    });
    setDepartments([]);
    setPeople([]);
    setSkillTypes([]);
    setSkills([]);

    try {
      await fetchCategories(project.project_id);
    } finally {
      setIsLoading(false);
    }
  };

  //   select category
  const selectCategory = async (category: Caterogy) => {
    setIsLoading(true);
    setNavigationState((prevState) => ({
      ...prevState,
      selectedCategory: category,
      selectedDepartment: null,
      selectedPeople: null,
      selectedSkillType: null,
      selectedSkill: null,
    }));
    setPeople([]);
    setSkillTypes([]);
    setSkills([]);

    try {
      await fetchDepartments(category.category_id);
    } finally {
      setIsLoading(false);
    }
  };

  //   select department
  const selectDepartment = async (department: Department) => {
    if (!navigationState.selectedProject) {
      toast.error("Please select a project first");
      return;
    }

    setIsLoading(true);
    setNavigationState((prevState) => ({
      ...prevState,
      selectedDepartment: department,
      selectedPeople: null,
      selectedSkillType: null,
      selectedSkill: null,
    }));
    setSkillTypes([]);
    setSkills([]);

    try {
      await fetchPeople(
        department.department_id,
        navigationState.selectedProject.project_id
      );
    } finally {
      setIsLoading(false);
    }
  };

  //   select people
  const selectPeople = async (people: People) => {
    if (!navigationState.selectedProject) {
      toast.error("Please select a project first");
      return;
    }

    setIsLoading(true);
    setNavigationState((prevState) => ({
      ...prevState,
      selectedPeople: people,
      selectedSkillType: null,
      selectedSkill: null,
    }));
    setSkills([]);

    try {
      await fetchSkillTypes(
        people.people_id,
        navigationState.selectedProject.project_id
      );
    } finally {
      setIsLoading(false);
    }
  };

  //   select skill type
  const selectSkillType = async (skillType: SkillType) => {
    if (!navigationState.selectedProject) {
      toast.error("Please select a project first");
      return;
    }

    setIsLoading(true);
    setNavigationState((prevState) => ({
      ...prevState,
      selectedSkillType: skillType,
      selectedSkill: null,
    }));

    try {
      await fetchSkills(
        skillType.skill_type_id,
        navigationState.selectedProject.project_id
      );
    } finally {
      setIsLoading(false);
    }
  };

  //   select skill
  const selectSkill = (skill: Skill) => {
    setNavigationState((prevState) => ({
      ...prevState,
      selectedSkill: skill,
    }));
  };

  // Breadcrumb navigation handler
  const handleBreadcrumbClick = (level: number) => {
    if (level === 0) {
      // Reset to projects
      setNavigationState({
        selectedProject: null,
        selectedCategory: null,
        selectedDepartment: null,
        selectedPeople: null,
        selectedSkillType: null,
        selectedSkill: null,
      });
      setCategories([]);
      setDepartments([]);
      setPeople([]);
      setSkillTypes([]);
      setSkills([]);
    } else if (level === 1 && navigationState.selectedProject) {
      // Go back to categories
      setNavigationState((prev) => ({
        ...prev,
        selectedCategory: null,
        selectedDepartment: null,
        selectedPeople: null,
        selectedSkillType: null,
        selectedSkill: null,
      }));
      setDepartments([]);
      setPeople([]);
      setSkillTypes([]);
      setSkills([]);
    } else if (level === 2 && navigationState.selectedCategory) {
      // Go back to departments
      setNavigationState((prev) => ({
        ...prev,
        selectedDepartment: null,
        selectedPeople: null,
        selectedSkillType: null,
        selectedSkill: null,
      }));
      setPeople([]);
      setSkillTypes([]);
      setSkills([]);
    } else if (level === 3 && navigationState.selectedDepartment) {
      // Go back to people
      setNavigationState((prev) => ({
        ...prev,
        selectedPeople: null,
        selectedSkillType: null,
        selectedSkill: null,
      }));
      setSkillTypes([]);
      setSkills([]);
    } else if (level === 4 && navigationState.selectedPeople) {
      // Go back to skill types
      setNavigationState((prev) => ({
        ...prev,
        selectedSkillType: null,
        selectedSkill: null,
      }));
      setSkills([]);
    } else if (level === 5 && navigationState.selectedSkillType) {
      // Go back to skills
      setNavigationState((prev) => ({
        ...prev,
        selectedSkill: null,
      }));
    }
  };

  // Determine what to display based on navigation state
  const getCurrentItems = () => {
    if (navigationState.selectedSkillType) {
      return { type: "skills", items: skills, label: "Skills" };
    }
    if (navigationState.selectedPeople) {
      return { type: "skillTypes", items: skillTypes, label: "Skill Types" };
    }
    if (navigationState.selectedDepartment) {
      return { type: "people", items: people, label: "People" };
    }
    if (navigationState.selectedCategory) {
      return { type: "departments", items: departments, label: "Departments" };
    }
    if (navigationState.selectedProject) {
      return { type: "categories", items: categories, label: "Categories" };
    }
    return { type: "projects", items: projects, label: "Projects" };
  };

  const currentItems = getCurrentItems();

  // Render item card
  const renderItemCard = (
    item: Project | Caterogy | Department | People | SkillType | Skill,
    index: number
  ) => {
    const isProject = "project_id" in item;
    const isCategory = "category_id" in item;
    const isDepartment = "department_id" in item;
    const isPeople = "people_id" in item;
    const isSkillType = "skill_type_id" in item;
    const isSkill = "skill_id" in item;

    const name = isSkill
      ? (item as Skill).skill_name
      : isProject
      ? (item as Project).name
      : isPeople
      ? (item as People).people_name
      : isCategory
      ? (item as Caterogy).category_name
      : isDepartment
      ? (item as Department).department_name
      : isSkillType
      ? (item as SkillType).skill_type_name
      : "";

    const count = item.total_count || 0;
    const isSelected =
      (isProject &&
        navigationState.selectedProject?.project_id === item.project_id) ||
      (isCategory &&
        navigationState.selectedCategory?.category_id === item.category_id) ||
      (isDepartment &&
        navigationState.selectedDepartment?.department_id ===
          item.department_id) ||
      (isPeople &&
        navigationState.selectedPeople?.people_id === item.people_id) ||
      (isSkillType &&
        navigationState.selectedSkillType?.skill_type_id ===
          item.skill_type_id) ||
      (isSkill && navigationState.selectedSkill?.skill_id === item.skill_id);

    const handleClick = () => {
      if (isProject) selectProject(item as Project);
      else if (isCategory) selectCategory(item as Caterogy);
      else if (isDepartment) selectDepartment(item as Department);
      else if (isPeople) selectPeople(item as People);
      else if (isSkillType) selectSkillType(item as SkillType);
      else if (isSkill) selectSkill(item as Skill);
    };

    // Get icon and color based on item type
    const getItemStyle = () => {
      if (isProject) {
        return {
          icon: FolderKanban,
          gradient: "from-blue-500/10 to-blue-600/5",
          borderColor: "border-blue-500/30",
          hoverBorder: "hover:border-blue-500/60",
          countBg: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
          accentBorder: "border-l-2 border-blue-500",
        };
      } else if (isCategory) {
        return {
          icon: FolderTree,
          gradient: "from-purple-500/10 to-purple-600/5",
          borderColor: "border-purple-500/30",
          hoverBorder: "hover:border-purple-500/60",
          countBg: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
          accentBorder: "border-l-2 border-purple-500",
        };
      } else if (isDepartment) {
        return {
          icon: Building2,
          gradient: "from-emerald-500/10 to-emerald-600/5",
          borderColor: "border-emerald-500/30",
          hoverBorder: "hover:border-emerald-500/60",
          countBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
          accentBorder: "border-l-2 border-emerald-500",
        };
      } else if (isPeople) {
        return {
          icon: Users,
          gradient: "from-orange-500/10 to-orange-600/5",
          borderColor: "border-orange-500/30",
          hoverBorder: "hover:border-orange-500/60",
          countBg: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
          accentBorder: "border-l-2 border-orange-500",
        };
      } else if (isSkillType) {
        return {
          icon: Wrench,
          gradient: "from-rose-500/10 to-rose-600/5",
          borderColor: "border-rose-500/30",
          hoverBorder: "hover:border-rose-500/60",
          countBg: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
          accentBorder: "border-l-2 border-rose-500",
        };
      } else {
        return {
          icon: CheckSquare,
          gradient: "from-indigo-500/10 to-indigo-600/5",
          borderColor: "border-indigo-500/30",
          hoverBorder: "hover:border-indigo-500/60",
          countBg: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
          accentBorder: "border-l-2 border-indigo-500",
        };
      }
    };

    const style = getItemStyle();
    const Icon = style.icon;

    return (
      <Card
        key={index}
        className={cn(
          "cursor-pointer transition-all duration-200 group relative overflow-hidden",
          "bg-gradient-to-br",
          style.gradient,
          "border",
          style.borderColor,
          style.accentBorder,
          style.hoverBorder,
          "hover:shadow-lg hover:shadow-primary/5 sm:hover:-translate-y-0.5",
          isSelected &&
            "ring-2 ring-primary/50 border-primary shadow-md shadow-primary/10",
          "!py-0 !px-0"
        )}
        onClick={handleClick}
      >
        <div className="p-2 sm:p-3">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Icon */}
            <div
              className={cn(
                "flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg flex items-center justify-center",
                style.countBg,
                "group-hover:scale-110 transition-transform duration-200"
              )}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>

            {/* Name and Count - Mobile: single line, Desktop: stacked */}
            <div className="flex-1 min-w-0 flex items-center justify-between gap-2 sm:flex-col sm:items-start sm:gap-1">
              <CardTitle className="text-xs sm:text-sm font-semibold line-clamp-1 sm:line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                {name}
              </CardTitle>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 sm:w-full sm:justify-between">
                {/* Hide "Total" label on mobile */}
                <span className="hidden sm:inline text-xs text-muted-foreground font-medium">
                  Total
                </span>
                <span
                  className={cn(
                    "text-xs sm:text-base font-bold px-1.5 py-0.5 sm:px-2 rounded whitespace-nowrap",
                    style.countBg
                  )}
                >
                  {count.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // Build breadcrumb path
  const breadcrumbs = [
    { label: "Projects", level: 0, active: !navigationState.selectedProject },
    navigationState.selectedProject && {
      label: navigationState.selectedProject.name,
      level: 1,
      active: !navigationState.selectedCategory,
    },
    navigationState.selectedCategory && {
      label: navigationState.selectedCategory.category_name,
      level: 2,
      active: !navigationState.selectedDepartment,
    },
    navigationState.selectedDepartment && {
      label: navigationState.selectedDepartment.department_name,
      level: 3,
      active: !navigationState.selectedPeople,
    },
    navigationState.selectedPeople && {
      label: navigationState.selectedPeople.people_name,
      level: 4,
      active: !navigationState.selectedSkillType,
    },
    navigationState.selectedSkillType && {
      label: navigationState.selectedSkillType.skill_type_name,
      level: 5,
      active: !navigationState.selectedSkill,
    },
    navigationState.selectedSkill && {
      label: navigationState.selectedSkill.skill_name,
      level: 6,
      active: true,
    },
  ].filter(Boolean) as Array<{ label: string; level: number; active: boolean }>;

  return (
    <div className="flex flex-col gap-4 py-4 px-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <PageHeader title="Labour Summary" />
        <DateFilter onChange={handleDateFilterChange} />
      </div>

      {/* Breadcrumb Navigation */}
      {breadcrumbs.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-auto p-1 text-sm font-normal",
                  crumb.active
                    ? "text-foreground cursor-default"
                    : "text-muted-foreground hover:text-foreground cursor-pointer"
                )}
                onClick={() =>
                  !crumb.active && handleBreadcrumbClick(crumb.level)
                }
                disabled={crumb.active}
              >
                {crumb.label}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Current Level Items */}
          {currentItems.items.length > 0 ? (
            <div>
              <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">
                {currentItems.label}
              </h2>
              <div className="grid gap-2 sm:gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {currentItems.items.map((item, index) =>
                  renderItemCard(item, index)
                )}
              </div>
            </div>
          ) : (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-center text-base">
                  No {currentItems.label.toLowerCase()} found
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center text-sm text-muted-foreground">
                {navigationState.selectedProject
                  ? `No ${currentItems.label.toLowerCase()} available for the selected filters.`
                  : "Select a date filter to view projects."}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
