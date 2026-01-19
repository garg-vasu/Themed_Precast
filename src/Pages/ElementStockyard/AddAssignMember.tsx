import axios, { AxiosError } from "axios";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/utils/apiClient";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type User = {
  id: number;
  employee_id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
  first_access: string;
  last_access: string;
  profile_picture: string;
  is_admin: boolean;
  ip?: string;
  address: string;
  city: string;
  state: string;
  user_id: number;
  country: string;
  zip_code?: string;
  phone_no: string;
  role: string;
};

type AssignMemberProps = {
  refresh: () => void;
  initialData?: any;
  id?: number;
  onClose?: () => void;
};

const schema = z.object({
  user_id: z.number().min(1, "User is required"),
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

export default function AddAssignMember({
  refresh,
  initialData: propInitialData,
  id,
  onClose,
}: AssignMemberProps) {
  const navigate = useNavigate();
  const location = useLocation();
  // Get initialData from props or location state
  const initialData = propInitialData || (location.state as any)?.initialData;
  const isEditMode = !!initialData?.user_id;
  const { projectId } = useParams<{ projectId: string }>();
  const [users, setUsers] = useState<User[]>([]);

  const getDefaultValues = (): Partial<FormData> => {
    if (!initialData) {
      return {
        user_id: 0,
      };
    }
    return {
      user_id: initialData.user_id || 0,
    };
  };

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchUsers = async () => {
      try {
        const response = await apiClient.get(`/project/${projectId}/members`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setUsers(response.data || []);
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
  }, [projectId]);

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
    if (initialData) {
      const defaultValues = getDefaultValues();
      reset(defaultValues);
    }
  }, [initialData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload: any = {
        user_id: data.user_id,
      };

      if (isEditMode) {
        // Update existing stockyard assign
        const response = await apiClient.put(
          `/project-stockyards/${initialData?.id}/manager`,
          payload
        );
        if (response.status === 200 || response.status === 201) {
          toast.success("Stockyard Member assign updated successfully!");
          if (onClose) {
            onClose();
          }
        }
      } else {
        // Create new stockyard assign
        if (!initialData?.stockyard_id) {
          toast.error("Stockyard ID is required");
          return;
        }
        const response = await apiClient.post(
          `/project-stockyards/${initialData.id}/manager`,
          payload
        );
        if (response.status === 200 || response.status === 201) {
          toast.success("Stockyard Member assign created successfully!");
          if (onClose) {
            onClose();
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        isEditMode ? "update stockyard assign" : "create stockyard assign"
      );
      toast.error(errorMessage);
    } finally {
      refresh();
    }
  };
  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* 2 row layout  */}
        <div>
          {/* two grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mt-4">
            {/* select a project */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="select_user">
                Select a user <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={control}
                name="user_id"
                render={({ field }) => (
                  <Select
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(val) => {
                      field.onChange(Number(val));
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a User" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Users</SelectLabel>
                        {users && users.length > 0 ? (
                          users.map((user) => (
                            <SelectItem
                              key={user.id}
                              value={user.id.toString()}
                            >
                              {`${user.first_name || ""} ${
                                user.last_name || ""
                              }`.trim() || user.email}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-users" disabled>
                            No users available
                          </SelectItem>
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.user_id?.message || "\u00A0"}
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-2 pt-2 border-t">
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
              ? "Update Stockyard Member assign"
              : "Create Stockyard Member assign"}
          </Button>
        </div>
      </form>
    </div>
  );
}
