import { zodResolver } from "@hookform/resolvers/zod";

import { Controller, useForm } from "react-hook-form";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/utils/apiClient";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProject } from "@/Provider/ProjectProvider";

export type User = {
  id: number;
  employee_id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  created_at: string;
  user_id: number;
  updated_at: string;
  first_access: string;
  last_access: string;
  profile_picture: string;
  is_admin: boolean;
  ip?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code?: string;
  phone_no: string;
  role_name: string;
};

export type Paper = {
  project_id: number;
  id: number;
  name: string;
};

const schema = z.object({
  name: z.string().min(1, "Stage name is required"),
  completion_stage: z.boolean().default(false),
  assigned_to: z.number().min(1, "Assigned to is required"),
  paper_id: z.number().min(1, "Paper ID is required"),
  order: z.number().min(1, "Order is required"),
  qc_id: z.number().min(1, "QC ID is required"),
  qc_assign: z.boolean().default(false),
  inventory_deduction: z.boolean().default(false),
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

type StageProps = {
  refresh: () => void;
  initialData?: any;
  onClose?: () => void;
};

export default function EditStage({
  refresh,
  initialData: propInitialData,
  onClose,
}: StageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { markSetupStepDone } = useProject();
  const { projectId } = useParams();
  // Get initialData from props or location state
  const initialData = propInitialData || (location.state as any)?.initialData;
  const isEditMode = !!initialData;
  const [users, setUsers] = useState<User[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const getDefaultValues = (): Partial<FormData> => {
    if (!initialData) {
      return {
        name: "",
        completion_stage: false,
        assigned_to: 0,
        paper_id: 0,
        order: 0,
        qc_id: 0,
        qc_assign: false,
        inventory_deduction: false,
      };
    }

    return {
      name: initialData.name || "",
      completion_stage: initialData.completion_stage || false,
      assigned_to: initialData.assigned_to || 0,
      paper_id: initialData.paper_id || 0,
      order: initialData.order || 0,
      qc_id: initialData.qc_id || 0,
      qc_assign: initialData.qc_assign || false,
      inventory_deduction: initialData.inventory_deduction || false,
    };
  };

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: getDefaultValues(),
  });

  const qcAssign = watch("qc_assign");

  useEffect(() => {
    const defaultValues = getDefaultValues();
    reset(defaultValues);
  }, [initialData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload: any = {
        name: data.name,
        completion_stage: data.completion_stage,
        assigned_to: data.assigned_to,
        paper_id: data.paper_id,
        order: data.order,
        qc_id: data.qc_id,
        qc_assign: data.qc_assign,
        inventory_deduction: data.inventory_deduction,
        project_id: projectId ? Number(projectId) : 0,
      };

      if (isEditMode) {
        // Update existing drawing type
        const stageId = initialData?.id;
        if (!stageId) {
          toast.error("Stage ID is missing");
          return;
        }
        const response = await apiClient.put(
          `/update_project_stage/${stageId}`,
          payload,
        );
        if (response.status === 200 || response.status === 201) {
          toast.success("Stage updated successfully!");
          if (onClose) {
            onClose();
          } else {
            refresh();
          }
        }
      } else {
        // Create new skill type
        const response = await apiClient.post("/create_projectstage", payload);
        if (response.status === 200 || response.status === 201) {
          toast.success("Stage created successfully!");
          markSetupStepDone("is_stage_member");
          if (onClose) {
            onClose();
          } else {
            refresh();
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        isEditMode ? "update stage" : "create stage",
      );
      toast.error(errorMessage);
    } finally {
      refresh();
    }
  };

  //   users api call
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchUsers = async () => {
      try {
        const response = await apiClient.get(`/project/${projectId}/members`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setUsers(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch users");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "users data"));
        }
      }
    };

    fetchUsers();

    return () => {
      source.cancel();
    };
  }, []);

  //   paper api call
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchPapers = async () => {
      try {
        const response = await apiClient.get(`/questions/papers/${projectId}`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setPapers(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch papers");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "papers data"));
        }
      }
    };

    fetchPapers();

    return () => {
      source.cancel();
    };
  }, []);
  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* 2 row layout  */}
        <div>
          {/* two grid layout */}
          <div className="grid grid-cols-1 gap-2 mt-4">
            {/* name */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="name">
                Stage Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Stage Name"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.name?.message || "\u00A0"}
              </p>
            </div>
            {/* stage order */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="order">
                Order <span className="text-red-500">*</span>
              </Label>
              <Input
                id="order"
                placeholder="Order"
                type="number"
                min={1}
                {...register("order", { valueAsNumber: true })}
                aria-invalid={!!errors.order}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.order?.message || "\u00A0"}
              </p>
            </div>
            {/* paper selector  */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="paper">
                Paper <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={control}
                name="paper_id"
                render={({ field }) => (
                  <Select
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(value) =>
                      field.onChange(Number(value) || 0)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Paper" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Papers</SelectLabel>
                        {papers.map((paper) => (
                          <SelectItem
                            key={paper.id}
                            value={paper.id.toString()}
                          >
                            {paper.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.paper_id?.message || "\u00A0"}
              </p>
            </div>
            {/* assign to selector  */}

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="assign_to">
                Assign To <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={control}
                name="assigned_to"
                render={({ field }) => (
                  <Select
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(value) =>
                      field.onChange(Number(value) || 0)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Assign To" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Assign To</SelectLabel>
                        {users.map((user) => (
                          <SelectItem
                            key={user.user_id}
                            value={user.user_id.toString()}
                          >
                            {user.first_name} {user.last_name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.assigned_to?.message || "\u00A0"}
              </p>
            </div>

            {/* QC Assign / Inventory Deduction / Completion Stage */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center space-x-2">
                <Controller
                  control={control}
                  name="qc_assign"
                  render={({ field }) => (
                    <Checkbox
                      id="qc_assign"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(!!checked)}
                    />
                  )}
                />
                <Label htmlFor="qc_assign">QC Assign</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Controller
                  control={control}
                  name="inventory_deduction"
                  render={({ field }) => (
                    <Checkbox
                      id="inventory_deduction"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(!!checked)}
                    />
                  )}
                />
                <Label htmlFor="inventory_deduction">Inventory Deduction</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Controller
                  control={control}
                  name="completion_stage"
                  render={({ field }) => (
                    <Checkbox
                      id="completion_stage"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(!!checked)}
                    />
                  )}
                />
                <Label htmlFor="completion_stage">Completion Stage</Label>
              </div>
            </div>

            {/* QC selector - only when QC Assign is true */}
            {qcAssign && (
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="qc">
                  QC <span className="text-red-500">*</span>
                </Label>
                <Controller
                  control={control}
                  name="qc_id"
                  render={({ field }) => (
                    <Select
                      value={field.value ? field.value.toString() : ""}
                      onValueChange={(value) =>
                        field.onChange(Number(value) || 0)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select QC" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>QC Users</SelectLabel>
                          {users.map((user) => (
                            <SelectItem
                              key={user.user_id}
                              value={user.user_id.toString()}
                            >
                              {user.first_name} {user.last_name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-sm text-red-600 min-h-[20px]">
                  {errors.qc_id?.message || "\u00A0"}
                </p>
              </div>
            )}
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : isEditMode
                ? "Update Drawing Type"
                : "Create Drawing Type"}
          </Button>
        </div>
      </form>
    </div>
  );
}
