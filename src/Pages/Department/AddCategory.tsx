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

type CategoryProps = {
  refresh: () => void;
  initialData?: any;
  id?: number;
  onClose?: () => void;
};

const schema = z.object({
  name: z.string().nonempty("Category name is required"),
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

export default function AddCategory({
  refresh,
  initialData: propInitialData,
  id,
  onClose,
}: CategoryProps) {
  const navigate = useNavigate();
  const location = useLocation();
  // Get initialData from props or location state
  const initialData = propInitialData || (location.state as any)?.initialData;
  const isEditMode = !!initialData;
  const [projects, setProjects] = useState<Project[]>([]);
  const { user } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(false);

  const getDefaultValues = (): Partial<FormData> => {
    if (!initialData) {
      return {
        name: "",
        project_id: 0,
      };
    }

    return {
      name: initialData.name || "",
      project_id: initialData.project_id || 0,
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
      };

      if (isEditMode && user) {
        // Update existing skill type
        const response = await apiClient.put(
          `/categories/${initialData?.id}`,
          payload
        );
        if (response.status === 200 || response.status === 201) {
          toast.success("Category updated successfully!");
          if (onClose) {
            onClose();
          } else {
            navigate("/categories");
          }
        }
      } else {
        // Create new skill type
        const response = await apiClient.post("/categories", payload);
        if (response.status === 200 || response.status === 201) {
          toast.success("Category created successfully!");
          if (onClose) {
            onClose();
          } else {
            navigate("/categories");
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        isEditMode ? "update category" : "create category"
      );
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      refresh();
    }
  };

  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* 2 row layout  */}
        <div>
          {/* two grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-2  gap-4 mt-4">
            {/* name */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="category_name">
                Category Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="category_name"
                placeholder="Category Name"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.name?.message || "\u00A0"}
              </p>
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
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (onClose) {
                onClose();
              } else {
                navigate("/categories");
              }
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || isLoading}>
            {isSubmitting || isLoading
              ? "Saving..."
              : isEditMode
              ? "Update Category"
              : "Create Category"}
          </Button>
        </div>
      </form>
    </div>
  );
}
