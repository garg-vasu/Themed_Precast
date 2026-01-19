import { zodResolver } from "@hookform/resolvers/zod";

import { useForm } from "react-hook-form";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import axios, { AxiosError } from "axios";
import { useEffect } from "react";
import { toast } from "sonner";
import { apiClient } from "@/utils/apiClient";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const schema = z.object({
  yard_name: z.string().min(1, "Stockyard name is required"),
  location: z.string().min(1, "Location is required"),
  carpet_area: z.number().min(1, "Carpet area is required"),
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

type WarehouseProps = {
  refresh: () => void;
  initialData?: any;
  onClose?: () => void;
};

export default function AddWarehouse({
  refresh,
  initialData: propInitialData,
  onClose,
}: WarehouseProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();
  // Get initialData from props or location state
  const initialData = propInitialData || (location.state as any)?.initialData;
  const isEditMode = !!initialData;
  const getDefaultValues = (): Partial<FormData> => {
    if (!initialData) {
      return {
        yard_name: "",
        location: "",
        carpet_area: 0,
      };
    }

    return {
      yard_name: initialData.yard_name || "",
      location: initialData.location || "",
      carpet_area: initialData.carpet_area || 0,
    };
  };

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    const defaultValues = getDefaultValues();
    reset(defaultValues);
    // Set project_id from URL params if available
  }, [initialData, reset, projectId, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload: any = {
        yard_name: data.yard_name,
        location: data.location,
        carpet_area: data.carpet_area,
      };

      if (isEditMode) {
        // Update existing warehouse
        const warehouseId = initialData?.id || 0;
        if (!warehouseId) {
          toast.error("Warehouse ID is missing");
          return;
        }
        const response = await apiClient.put(
          `/stockyards/${warehouseId}`,
          payload
        );
        if (response.status === 200 || response.status === 201) {
          toast.success("Warehouse updated successfully!");
          refresh();
          if (onClose) {
            onClose();
          }
        }
      } else {
        // Create new warehouse
        const response = await apiClient.post("/stockyards", payload);
        if (response.status === 200 || response.status === 201) {
          toast.success("Warehouse created successfully!");
          refresh();
          if (onClose) {
            onClose();
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        isEditMode ? "update warehouse" : "create warehouse"
      );
      toast.error(errorMessage);
      // Refresh even on error to ensure data is up to date
      refresh();
    }
  };
  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* 2 row layout  */}
        <div>
          {/* two grid layout */}
          <div className="grid grid-cols-1 gap-4 mt-4">
            {/* name */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="yard_name">
                Yard Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="yard_name"
                placeholder="Yard Name"
                {...register("yard_name")}
                aria-invalid={!!errors.yard_name}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.yard_name?.message || "\u00A0"}
              </p>
            </div>
            {/* location */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="location">
                Location <span className="text-red-500">*</span>
              </Label>
              <Input
                id="location"
                placeholder="Location"
                {...register("location")}
                aria-invalid={!!errors.location}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.location?.message || "\u00A0"}
              </p>
            </div>
            {/* carpet area */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="carpet_area">
                Carpet Area <span className="text-red-500">*</span>
              </Label>
              <Input
                id="carpet_area"
                placeholder="Carpet Area"
                {...register("carpet_area")}
                aria-invalid={!!errors.carpet_area}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.carpet_area?.message || "\u00A0"}
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
                refresh();
              }
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : isEditMode
              ? "Update Warehouse"
              : "Create Warehouse"}
          </Button>
        </div>
      </form>
    </div>
  );
}
