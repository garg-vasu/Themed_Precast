import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingState } from "@/components/ui/loading-state";

// Icons
import {
  CalendarIcon,
  Plus,
  X,
  Users,
  Building2,
  HardHat,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

// API Client
import { apiClient } from "@/utils/apiClient";
import PageHeader from "@/components/ui/PageHeader";

// Types
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

export interface ProjectView {
  project_id: number;
  name: string;
  suspend: boolean;
}

export interface Advisor {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: number;
  name: string;
  email: string;
  phone_no: string;
  department_id: number;
  category_id: number;
  project_id: number;
  project_name: string;
  created_at: string;
  updated_at: string;
}

export interface SkillType {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
  skill_type_id: number;
  created_at: string;
  updated_at: string;
}

// Zod schema for validation
const skillSchema = z.object({
  skill_id: z.number(),
  skill_type_id: z.number(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

const vendorSkillSchema = z.object({
  vendor_id: z.number().min(1, "Vendor is required"),
  selected_skill_id: z.number().optional(),
  skills: z.array(skillSchema).min(1, "At least one skill must be selected"),
});

const formSchema = z.object({
  project_id: z.number().min(1, "Project is required"),
  tower_id: z.number().min(1, "Tower is required"),
  advisor_id: z.number().min(1, "Department is required"),
  date: z.date({ message: "Date is required" }),
  skills: z
    .array(vendorSkillSchema)
    .min(1, "At least one vendor must be added"),
});

type FormData = z.infer<typeof formSchema>;

// Helper function for error handling
const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || "An error occurred";
  }
  return "An unexpected error occurred";
};

// Format a Date to local-midnight with timezone offset
const formatLocalMidnightWithOffset = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const hours = String(Math.floor(abs / 60)).padStart(2, "0");
  const minutes = String(abs % 60).padStart(2, "0");
  return `${year}-${month}-${day}T00:00:00${sign}${hours}:${minutes}`;
};

export default function AddAttendance() {
  const navigate = useNavigate();

  // Form setup
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    criteriaMode: "all",
    defaultValues: {
      project_id: 0,
      tower_id: 0,
      advisor_id: 0,
      date: undefined,
      skills: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "skills",
  });

  // State variables
  const [tower, setTower] = useState<Tower>();
  const [towerLoading, setTowerLoading] = useState(false);
  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [projectLoading, setProjectLoading] = useState(false);
  const [advisor, setAdvisor] = useState<Advisor[]>([]);
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [skillType, setSkillType] = useState<SkillType[]>([]);
  const [skillTypeLoading, setSkillTypeLoading] = useState(false);
  const [allSkills, setAllSkills] = useState<Category[]>([]);
  const [dateOpen, setDateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Watch form values for dependencies
  const watchedProjectId = form.watch("project_id");
  const watchedTowerId = form.watch("tower_id");
  const watchedAdvisorId = form.watch("advisor_id");
  const watchedDate = form.watch("date");

  // Calculate form progress
  const getFormProgress = () => {
    let steps = 0;
    if (watchedProjectId > 0) steps++;
    if (watchedTowerId > 0) steps++;
    if (watchedAdvisorId > 0) steps++;
    if (watchedDate) steps++;
    return steps;
  };

  // Fetch projects list
  const fetchProjectData = async () => {
    setProjectLoading(true);
    try {
      const response = await apiClient.get("/projects/basic");
      if (response.status === 200) {
        setProjects(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
      setProjects([]);
    } finally {
      setProjectLoading(false);
    }
  };

  // Fetch advisors (departments)
  const fetchAdvisor = async () => {
    try {
      setAdvisorLoading(true);
      const response = await apiClient.get("/departments");
      if (response.status === 200) {
        setAdvisor(response.data.data);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setAdvisorLoading(false);
    }
  };

  // Fetch skill types
  const fetchSkillType = async () => {
    try {
      setSkillTypeLoading(true);
      const response = await apiClient.get("/skill-types");
      if (response.status === 200) {
        setSkillType(response.data.data);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSkillTypeLoading(false);
    }
  };

  // Fetch categories based on selected skill type
  const fetchCategory = async (skillTypeId: number): Promise<Category[]> => {
    try {
      const response = await apiClient.get(`/skills/skill-type/${skillTypeId}`);
      if (response.status === 200) {
        const responseData = response.data.data;
        let newSkills: Category[] = [];

        if (Array.isArray(responseData)) {
          newSkills = responseData;
        } else if (responseData && typeof responseData === "object") {
          newSkills = [responseData];
        } else {
          newSkills = [];
        }

        // Append new skills to allSkills (avoiding duplicates)
        setAllSkills((prevSkills) => {
          const existingSkillIds = new Set(prevSkills.map((s) => s.id));
          const uniqueNewSkills = newSkills.filter(
            (skill) => !existingSkillIds.has(skill.id)
          );
          return [...prevSkills, ...uniqueNewSkills];
        });

        return newSkills;
      }
      return [];
    } catch (error) {
      toast.error(getErrorMessage(error));
      return [];
    }
  };

  // Fetch tower data when project changes
  const fetchTowerData = async (projectId: number) => {
    if (!projectId) return;

    setTowerLoading(true);
    try {
      const response = await apiClient.get(`/dashboard/towers/${projectId}`);
      if (response.status === 200) {
        if (!response.data.towers || response.data.towers.length === 0) {
          setTower({ total_towers: 0, towers: [] });
        } else {
          setTower(response.data);
        }
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setTowerLoading(false);
    }
  };

  // Fetch vendors when project changes
  const fetchVendor = async (projectId: number) => {
    if (!projectId) return;

    try {
      setVendorLoading(true);
      const response = await apiClient.get(`/projects/${projectId}/people`);
      if (response.status === 200 && response.data.data.length > 0) {
        setVendors(response.data.data);
      } else {
        setVendors([]);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setVendorLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchProjectData();
    fetchAdvisor();
    fetchSkillType();
  }, []);

  useEffect(() => {
    if (watchedProjectId) {
      fetchTowerData(watchedProjectId);
      fetchVendor(watchedProjectId);
      // Reset dependent fields
      form.setValue("tower_id", 0);
      form.setValue("skills", []);
      setAllSkills([]);
    }
  }, [watchedProjectId]);

  useEffect(() => {
    if (watchedTowerId) {
      form.setValue("skills", []);
      setAllSkills([]);
    }
  }, [watchedTowerId]);

  // Form submission
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const transformedData = {
        project_id: data.project_id,
        tower_id: data.tower_id,
        date: formatLocalMidnightWithOffset(data.date),
        skills: data.skills.map((vendor) => {
          const skillTypeGroups: { [key: number]: { skill_id: number; quantity: number }[] } = {};

          vendor.skills.forEach((skill) => {
            if (!skillTypeGroups[skill.skill_type_id]) {
              skillTypeGroups[skill.skill_type_id] = [];
            }
            skillTypeGroups[skill.skill_type_id].push({
              skill_id: skill.skill_id,
              quantity: skill.quantity,
            });
          });

          const skillTypes = Object.entries(skillTypeGroups).map(
            ([skillTypeId, skills]) => ({
              skill_type_id: parseInt(skillTypeId),
              count: skills,
            })
          );

          return {
            people_id: vendor.vendor_id,
            skill_types: skillTypes,
          };
        }),
      };

      const response = await apiClient.post("/manpower-count/bulk", transformedData);
      
      if (response.status === 200 || response.status === 201) {
        toast.success("Attendance recorded successfully!");
        navigate("/attendance");
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = () => {
    toast.error("Please complete all required fields before submitting.");
  };

  // Add new vendor
  const addVendor = () => {
    append({
      vendor_id: 0,
      selected_skill_id: undefined,
      skills: [],
    });
  };

  // Remove vendor
  const removeVendor = (index: number) => {
    remove(index);
  };

  // Add all skills of a specific skill type to vendor
  const addAllSkillsOfType = (
    vendorIndex: number,
    skillTypeId: number,
    skills: Category[]
  ) => {
    const currentSkills = form.getValues(`skills.${vendorIndex}.skills`) || [];
    const existingSkillIds = new Set(currentSkills.map((s) => s.skill_id));
    const newSkills = skills
      .filter((skill) => !existingSkillIds.has(skill.id))
      .map((skill) => ({
        skill_id: skill.id,
        skill_type_id: skillTypeId,
        quantity: 1,
      }));

    if (newSkills.length > 0) {
      form.setValue(`skills.${vendorIndex}.skills`, [...currentSkills, ...newSkills]);
      toast.success(`Added ${newSkills.length} skill(s)`);
    } else {
      toast.info("All skills from this type are already added");
    }
  };

  // Remove skill from vendor
  const removeSkill = (vendorIndex: number, skillIndex: number) => {
    const currentSkills = form.getValues(`skills.${vendorIndex}.skills`) || [];
    const updatedSkills = currentSkills.filter((_, index) => index !== skillIndex);
    form.setValue(`skills.${vendorIndex}.skills`, updatedSkills);
  };

  // Check if form is ready to submit
  const isFormReady = () => {
    const skills = form.watch("skills");
    if (!watchedProjectId || !watchedTowerId || !watchedAdvisorId || !watchedDate || skills.length === 0) {
      return false;
    }
    return skills.every((vendor) => vendor.vendor_id > 0 && vendor.skills.length > 0);
  };

  // Get step status for progress indicator
  const getStepStatus = (step: number) => {
    const progress = getFormProgress();
    if (step < progress) return "completed";
    if (step === progress) return "current";
    return "pending";
  };

  return (
    <div className="w-full p-4">
      <PageHeader title="Mark Attendance" />
      
        {/* Progress Steps */}
        <Card className="mb-2 mt-2 py-2">
          <CardContent className="py-2 px-3">
            <div className="flex items-center justify-between">
              {[
                { icon: Building2, label: "Project", step: 0 },
                { icon: HardHat, label: "Tower", step: 1 },
                { icon: Users, label: "Department", step: 2 },
                { icon: CalendarIcon, label: "Date", step: 3 },
              ].map((item, index) => {
                const status = getStepStatus(item.step);
                return (
                  <div key={index} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`
                          flex items-center justify-center w-8 h-8 rounded-full transition-all
                          ${status === "completed" ? "bg-primary text-primary-foreground" : ""}
                          ${status === "current" ? "bg-primary/20 text-primary border-2 border-primary" : ""}
                          ${status === "pending" ? "bg-muted text-muted-foreground" : ""}
                        `}
                      >
                        {status === "completed" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <item.icon className="h-4 w-4" />
                        )}
                      </div>
                      <span
                        className={`text-xs mt-0.5 font-medium hidden sm:block
                          ${status === "completed" ? "text-primary" : ""}
                          ${status === "current" ? "text-primary" : ""}
                          ${status === "pending" ? "text-muted-foreground" : ""}
                        `}
                      >
                        {item.label}
                      </span>
                    </div>
                    {index < 3 && (
                      <div
                        className={`h-0.5 w-6 sm:w-12 md:w-20 lg:w-28 mx-1 transition-all
                          ${status === "completed" ? "bg-primary" : "bg-muted"}
                        `}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-3">
          {/* Primary Selection Card */}
          <Card className="py-3">
            <CardHeader className="py-2 px-4">
              <CardTitle className="text-base">Project Details</CardTitle>
              <CardDescription className="text-xs">
                Select the project, tower, department, and date
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Project Selection */}
                <div className="space-y-1">
                  <Label htmlFor="project" className="flex items-center gap-1 text-sm">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    Project
                  </Label>
                  <Select
                    value={watchedProjectId ? watchedProjectId.toString() : ""}
                    onValueChange={(value) => form.setValue("project_id", Number(value))}
                    disabled={projectLoading || isSubmitting}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={projectLoading ? "Loading..." : "Select project"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-60">
                        {projects.map((p) => (
                          <SelectItem key={p.project_id} value={p.project_id.toString()}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.project_id && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {form.formState.errors.project_id.message}
                    </p>
                  )}
                </div>

                {/* Tower Selection */}
                <div className="space-y-1">
                  <Label htmlFor="tower" className="flex items-center gap-1 text-sm">
                    <HardHat className="h-3.5 w-3.5 text-muted-foreground" />
                    Tower
                  </Label>
                  <Select
                    value={watchedTowerId ? watchedTowerId.toString() : ""}
                    onValueChange={(value) => {
                      if (value !== "no-towers") {
                        form.setValue("tower_id", Number(value));
                      }
                    }}
                    disabled={!watchedProjectId || towerLoading || isSubmitting}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          !watchedProjectId
                            ? "Select project first"
                            : towerLoading
                            ? "Loading..."
                            : "Select tower"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(!tower?.towers || tower.towers.length === 0) && (
                        <SelectItem value="no-towers" disabled>
                          No towers found
                        </SelectItem>
                      )}
                      {tower?.towers?.map((t) => (
                        <SelectItem key={t.id} value={t.id.toString()}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.tower_id && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {form.formState.errors.tower_id.message}
                    </p>
                  )}
                </div>

                {/* Department Selection */}
                <div className="space-y-1">
                  <Label htmlFor="advisor" className="flex items-center gap-1 text-sm">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    Department
                  </Label>
                  <Select
                    value={watchedAdvisorId ? watchedAdvisorId.toString() : ""}
                    onValueChange={(value) => form.setValue("advisor_id", Number(value))}
                    disabled={!watchedTowerId || advisorLoading || isSubmitting}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          !watchedTowerId
                            ? "Select tower first"
                            : advisorLoading
                            ? "Loading..."
                            : "Select department"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-60">
                        {advisor?.map((a) => (
                          <SelectItem key={a.id} value={a.id.toString()}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.advisor_id && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {form.formState.errors.advisor_id.message}
                    </p>
                  )}
                </div>

                {/* Date Selection */}
                <div className="space-y-1">
                  <Label htmlFor="date" className="flex items-center gap-1 text-sm">
                    <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    Date
                  </Label>
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        disabled={!watchedAdvisorId || isSubmitting}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        {watchedDate
                          ? watchedDate.toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : !watchedAdvisorId
                          ? "Select department first"
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={watchedDate}
                        captionLayout="dropdown"
                        onSelect={(date) => {
                          if (date) {
                            form.setValue("date", date);
                            setDateOpen(false);
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.date && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {form.formState.errors.date.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendor Skills Section */}
          {watchedProjectId > 0 &&
            watchedTowerId > 0 &&
            watchedAdvisorId > 0 &&
            watchedDate && (
              <Card className="py-3">
                <CardHeader className="py-2 px-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">Vendor Skills Configuration</CardTitle>
                      <CardDescription className="text-xs">
                        Add vendors and configure their skills
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {allSkills.length > 0 && (
                        <Badge variant="secondary" className="text-xs py-0">
                          {allSkills.length} skills
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs py-0">
                        {fields.length} vendor(s)
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 px-4 py-2">
                  {vendorLoading ? (
                    <LoadingState label="Loading vendors..." className="py-4" />
                  ) : fields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <Users className="h-10 w-10 text-muted-foreground/50 mb-2" />
                      <h3 className="font-medium text-base mb-0.5">No Vendors Added</h3>
                      <p className="text-muted-foreground text-xs mb-3">
                        Add vendors and configure their skills
                      </p>
                      <Button
                        type="button"
                        onClick={addVendor}
                        className="gap-1.5 h-8 text-sm"
                        disabled={isSubmitting}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add First Vendor
                      </Button>
                    </div>
                  ) : (
                    <>
                      {fields.map((field, vendorIndex) => {
                        const vendorSkills = form.watch(`skills.${vendorIndex}.skills`) || [];
                        const selectedVendorId = form.watch(`skills.${vendorIndex}.vendor_id`);
                        const selectedVendor = vendors.find((v) => v.id === selectedVendorId);

                        return (
                          <Card key={field.id} className="border-muted py-0">
                            <CardHeader className="py-2 px-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                    {vendorIndex + 1}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {selectedVendor?.name || "Select Vendor"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {vendorSkills.length} skill(s)
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeVendor(vendorIndex)}
                                  disabled={isSubmitting}
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </CardHeader>
                            <Separator />
                            <CardContent className="py-3 px-3 space-y-3">
                              {/* Vendor and Skill Type Selection */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-sm">Vendor</Label>
                                  <Select
                                    value={selectedVendorId ? selectedVendorId.toString() : ""}
                                    onValueChange={(value) => {
                                      if (value !== "no-vendors") {
                                        form.setValue(
                                          `skills.${vendorIndex}.vendor_id`,
                                          Number(value)
                                        );
                                      }
                                    }}
                                    disabled={vendors.length === 0 || isSubmitting}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select vendor" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {vendors.length === 0 && (
                                        <SelectItem value="no-vendors" disabled>
                                          No vendors found
                                        </SelectItem>
                                      )}
                                      {vendors.map((v) => (
                                        <SelectItem key={v.id} value={v.id.toString()}>
                                          {v.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {selectedVendorId === 0 && (
                                    <p className="text-xs text-destructive">Vendor is required</p>
                                  )}
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-sm">Add Skills by Type</Label>
                                  <Select
                                    onValueChange={async (value) => {
                                      const skillTypeId = Number(value);
                                      const fetchedSkills = await fetchCategory(skillTypeId);
                                      if (fetchedSkills.length > 0) {
                                        addAllSkillsOfType(vendorIndex, skillTypeId, fetchedSkills);
                                      }
                                    }}
                                    disabled={skillTypeLoading || isSubmitting}
                                  >
                                    <SelectTrigger>
                                      <SelectValue
                                        placeholder={
                                          skillTypeLoading ? "Loading..." : "Select skill type"
                                        }
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {skillType.map((s) => (
                                        <SelectItem key={s.id} value={s.id.toString()}>
                                          {s.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {vendorSkills.length === 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      Select a skill type to add skills
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Selected Skills Display */}
                              {vendorSkills.length > 0 && (
                                <div className="space-y-1.5">
                                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                                    Assigned Skills
                                  </Label>
                                  <div className="flex flex-wrap gap-1.5">
                                    {vendorSkills.map((skillField, skillIndex) => {
                                      const skillName =
                                        allSkills.find((c) => c.id === skillField.skill_id)?.name ||
                                        "Unknown";
                                      const skillTypeName =
                                        skillType.find((s) => s.id === skillField.skill_type_id)
                                          ?.name || "";

                                      return (
                                        <div
                                          key={skillIndex}
                                          className="flex items-center gap-1.5 px-2 py-1 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                                        >
                                          <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-medium truncate">
                                              {skillName}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground truncate">
                                              {skillTypeName}
                                            </span>
                                          </div>
                                          <Input
                                            type="number"
                                            min="1"
                                            value={skillField.quantity || ""}
                                            onChange={(e) => {
                                              const parsed = Math.max(
                                                1,
                                                parseInt(e.target.value || "1", 10)
                                              );
                                              form.setValue(
                                                `skills.${vendorIndex}.skills.${skillIndex}.quantity`,
                                                parsed
                                              );
                                            }}
                                            className="w-14 h-7 text-center text-sm"
                                            disabled={isSubmitting}
                                          />
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeSkill(vendorIndex, skillIndex)}
                                            disabled={isSubmitting}
                                            className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}

                      {/* Add Vendor Button */}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addVendor}
                        disabled={isSubmitting}
                        className="w-full border-dashed py-4 text-muted-foreground hover:text-primary hover:border-primary"
                      >
                        <Plus className="h-4 w-4 mr-1.5" />
                        Add Another Vendor
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

          {/* Submit Section */}
          {watchedProjectId > 0 &&
            watchedTowerId > 0 &&
            watchedAdvisorId > 0 &&
            watchedDate && (
              <Card className="py-2">
                <CardContent className="py-2 px-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {isFormReady() ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-xs text-green-600 font-medium">
                            Ready to submit
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          <span className="text-xs text-amber-600">
                            Complete all required fields
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/attendance")}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!isFormReady() || isSubmitting}
                        className="min-w-28"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Attendance"
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
        </form>
   
    </div>
  );
}
