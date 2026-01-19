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
import { Input } from "@/components/ui/input";

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

type BomProps = {
  refresh: () => void;
  initialData?: any;
  id?: number;
  onClose?: () => void;
};

const schema = z.object({
  bom_name: z.string().min(1, "Material name is required"),
  bom_type: z.string().min(1, "Material type is required"),
  unit: z.string().min(1, "Unit is required"),
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

export default function AddBom({
  refresh,
  initialData: propInitialData,
  id,
  onClose,
}: BomProps) {
  const navigate = useNavigate();
  const location = useLocation();
  // Get initialData from props or location state
  const initialData = propInitialData || (location.state as any)?.initialData;
  const isEditMode = !!initialData?.bom_id;
  const { projectId } = useParams<{ projectId: string }>();

  const getDefaultValues = (): Partial<FormData> => {
    if (!initialData) {
      return {
        bom_name: "",
        bom_type: "",
        unit: "",
      };
    }
    return {
      bom_name: initialData.bom_name || "",
      bom_type: initialData.bom_type || "",
      unit: initialData.unit || "",
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
    if (initialData) {
      const defaultValues = getDefaultValues();
      reset(defaultValues);
    }
  }, [initialData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload: any = {
        bom_name: data.bom_name,
        bom_type: data.bom_type,
        unit: data.unit,
        project_id: projectId ? Number(projectId) : 0,
      };

      if (isEditMode) {
        // Update existing stockyard assign
        const response = await apiClient.put(
          `/update_bom_products/${initialData?.bom_id}`,
          payload
        );
        if (response.status === 200 || response.status === 201) {
          toast.success("Bom updated successfully!");
          if (onClose) {
            onClose();
          }
        }
      } else {
        // Create new stockyard assign
        if (!initialData?.stockyard_id) {
          toast.error("Bom ID is required");
          return;
        }
        const response = await apiClient.post(`/create_bom_products`, payload);
        if (response.status === 200 || response.status === 201) {
          toast.success("Bom created successfully!");
          if (onClose) {
            onClose();
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        isEditMode ? "update bom" : "create bom"
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
            {/* material name */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="bom_name">
                Material Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bom_name"
                placeholder="Material Name"
                {...register("bom_name")}
                aria-invalid={!!errors.bom_name}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.bom_name?.message || "\u00A0"}
              </p>
            </div>
            {/* material type */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="bom_type">
                Material Type <span className="text-red-500">*</span>
              </Label>
              <Input
                id="bom_type"
                placeholder="Material Type"
                {...register("bom_type")}
                aria-invalid={!!errors.bom_type}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.bom_type?.message || "\u00A0"}
              </p>
            </div>
            {/* units */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="unit">
                Unit <span className="text-red-500">*</span>
              </Label>
              <Input
                id="unit"
                placeholder="Unit"
                {...register("unit")}
                aria-invalid={!!errors.unit}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.unit?.message || "\u00A0"}
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
              ? "Update Bom"
              : "Create Bom"}
          </Button>
        </div>
      </form>
    </div>
  );
}
