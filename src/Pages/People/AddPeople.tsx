import axios, { AxiosError } from "axios";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useLocation } from "react-router";
import { useContext, useEffect, useState } from "react";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import { UserContext } from "@/Provider/UserProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project } from "../Projects/ProjectTable";
import type { Category } from "../Department/Categorytable";
import type { Department } from "../Department/Departmenttable";

export interface Phonecode {
  id: number;
  country_name: string;
  phone_code: string;
}

type PeopleProps = {
  refresh: () => void;
  initialData?: any;
  id?: number;
  onClose?: () => void;
};

const schema = z.object({
  name: z.string().nonempty("Name is required"),
  email: z.string().email("Invalid email address"),
  phone_no: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must not exceed 15 digits")
    .regex(/^\d+$/, "Phone number must contain only digits"),
  phone_code: z.number().min(1, "Phone code is required"),
  department_id: z.number().min(1, "Department is required"),
  category_id: z.number().min(1, "Category is required"),
  project_id: z.number().min(1, "Project is required"),
});

type FormData = z.infer<typeof schema>;

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
    // Check both 'error' and 'message' fields in the response
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      `Failed to ${data}.`;
    return errorMessage;
  }
  return "An unexpected error occurred. Please try again later.";
};

export default function AddPeople({
  refresh,
  initialData: propInitialData,
  id,
  onClose,
}: PeopleProps) {
  const navigate = useNavigate();
  const location = useLocation();
  // Get initialData from props or location state
  const initialData = propInitialData || (location.state as any)?.initialData;
  const isEditMode = !!initialData;
  const [projects, setProjects] = useState<Project[]>([]);
  const [phonecodes, setPhonecodes] = useState<Phonecode[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const { user } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(false);

  const getDefaultValues = (): Partial<FormData> => {
    if (!initialData) {
      return {
        name: "",
        project_id: 0,
        email: "",
        phone_no: "",
        phone_code: 0,
        department_id: 0,
        category_id: 0,
      };
    }

    return {
      name: initialData.name || "",
      project_id: initialData.project_id || 0,
      email: initialData.email || "",
      phone_no: initialData.phone_no || "",
      phone_code: initialData.phone_code || 0,
      department_id: initialData.department_id || 0,
      category_id: initialData.category_id || 0,
    };
  };

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchProjects = async () => {
      try {
        const response = await apiClient.get("/projects", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setProjects(response.data.data || response.data || []);
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

  //   departments data
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchDepartments = async () => {
      try {
        const response = await apiClient.get("/departments", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setDepartments(response.data.data || response.data || []);
        } else {
          toast.error(response.data?.message || "Failed to fetch departments");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "departments data"));
        }
      }
    };

    fetchDepartments();

    return () => {
      source.cancel();
    };
  }, []);

  //   phones code
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchPhonecodes = async () => {
      try {
        const response = await apiClient.get("/phonecodes", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setPhonecodes(response.data.data || response.data || []);
        } else {
          toast.error(response.data?.message || "Failed to fetch phonecodes");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "phonecodes data"));
        }
      }
    };

    fetchPhonecodes();

    return () => {
      source.cancel();
    };
  }, []);

  //   categories data
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchCategories = async () => {
      try {
        const response = await apiClient.get("/categories", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setCategories(response.data.data || response.data || []);
        } else {
          toast.error(response.data?.message || "Failed to fetch categories");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "categories data"));
        }
      }
    };

    fetchCategories();

    return () => {
      source.cancel();
    };
  }, []);

  useEffect(() => {
    if (initialData) {
      const defaultValues = getDefaultValues();
      reset(defaultValues);
    }
  }, [initialData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload: any = {
        name: data.name,
        project_id: data.project_id,
        email: data.email,
        phone_no: data.phone_no,
        phone_code: data.phone_code,
        department_id: data.department_id,
        category_id: data.category_id,
      };

      if (isEditMode && user) {
        // Update existing people
        const response = await apiClient.put(
          `/people/${initialData?.id}`,
          payload
        );
        if (response.status === 200 || response.status === 201) {
          toast.success("People updated successfully!");
          if (onClose) {
            onClose();
          } else {
            navigate("/people");
          }
        }
      } else {
        // Create new people
        const response = await apiClient.post("/people", payload);
        if (response.status === 200 || response.status === 201) {
          toast.success("People created successfully!");
          if (onClose) {
            onClose();
          } else {
            navigate("/people");
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        isEditMode ? "update people" : "create people"
      );
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      refresh();
    }
  };

  return (
    <div className="flex flex-col w-full py-2">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* 2 row layout  */}
        <div>
          {/* two grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* name */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="people_name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="people_name"
                placeholder="Enter name"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.name?.message || "\u00A0"}
              </p>
            </div>
            {/* email */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                {...register("email")}
                aria-invalid={!!errors.email}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.email?.message || "\u00A0"}
              </p>
            </div>
            {/* phone code + phone number */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="phone">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Controller
                  control={control}
                  name="phone_code"
                  render={({ field }) => (
                    <Select
                      value={field.value ? field.value.toString() : ""}
                      onValueChange={(val) => {
                        field.onChange(Number(val));
                      }}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Code" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Country Code</SelectLabel>
                          {phonecodes.map((code) => (
                            <SelectItem
                              key={code.id}
                              value={code.id.toString()}
                            >
                              {code.phone_code} {code.country_name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                <div className="flex-1">
                  <Input
                    id="phone_no"
                    type="tel"
                    placeholder="Enter phone number"
                    {...register("phone_no")}
                    aria-invalid={!!errors.phone_no}
                    maxLength={15}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <p className="text-sm text-red-600 min-h-[20px] flex-1">
                  {errors.phone_code?.message || "\u00A0"}
                </p>
                <p className="text-sm text-red-600 min-h-[20px] flex-1">
                  {errors.phone_no?.message || "\u00A0"}
                </p>
              </div>
            </div>
            {/* select a project */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="select_project">
                Select a Project <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={control}
                name="project_id"
                render={({ field }) => (
                  <Select
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(val) => {
                      field.onChange(Number(val));
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a Project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Projects</SelectLabel>
                        {projects.map((project) => (
                          <SelectItem
                            key={project.project_id}
                            value={project.project_id.toString()}
                          >
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.project_id?.message || "\u00A0"}
              </p>
            </div>
            {/* category */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="select_category">
                Select a Category <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={control}
                name="category_id"
                render={({ field }) => (
                  <Select
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(val) => {
                      field.onChange(Number(val));
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Categories</SelectLabel>
                        {categories.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id.toString()}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.category_id?.message || "\u00A0"}
              </p>
            </div>
            {/* department */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="select_department">
                Select a Department <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={control}
                name="department_id"
                render={({ field }) => (
                  <Select
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(val) => {
                      field.onChange(Number(val));
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Departments</SelectLabel>
                        {departments.map((department) => (
                          <SelectItem
                            key={department.id}
                            value={department.id.toString()}
                          >
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.department_id?.message || "\u00A0"}
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3  pt-2 border-t ">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (onClose) {
                onClose();
              } else {
                navigate("/people");
              }
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || isLoading}>
            {isSubmitting || isLoading
              ? "Saving..."
              : isEditMode
              ? "Update People"
              : "Create People"}
          </Button>
        </div>
      </form>
    </div>
  );
}
