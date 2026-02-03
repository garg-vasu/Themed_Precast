import { zodResolver } from "@hookform/resolvers/zod";

import { useForm, type Resolver } from "react-hook-form";
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
  email: z.string().min(1, "Email is required"),
  name: z.string().min(1, "Name is required"),
  location: z.string().min(1, "Location is required"),
  contact_number: z.string().min(1, "Contact number is required"),
  capacity: z.number().min(1, "Capacity is required"),
  used_capacity: z.number().default(0),
  description: z.string().min(1, "Description is required"),
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

type StoreWarehouseProps = {
  refresh: () => void;
  initialData?: any;
  onClose?: () => void;
};

export default function AddStoreWarehouse({
  refresh,
  initialData: propInitialData,
  onClose,
}: StoreWarehouseProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();
  // Get initialData from props or location state
  const initialData = propInitialData || (location.state as any)?.initialData;
  const isEditMode = !!initialData;
  const getDefaultValues = (): Partial<FormData> => {
    if (!initialData) {
      return {
        email: "",
        name: "",
        location: "",
        contact_number: "",
        capacity: 0,
        used_capacity: 0,
        description: "",
      };
    }

    return {
      email: initialData.email || "",
      name: initialData.name || "",
      location: initialData.location || "",
      contact_number: initialData.contact_number || "",
      capacity: initialData.capacity || 0,
      used_capacity: initialData.used_capacity || 0,
      description: initialData.description || "",
    };
  };

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
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
        email: data.email,
        name: data.name,
        location: data.location,
        contact_number: data.contact_number,
        capacity: data.capacity,
        used_capacity: data.used_capacity,
        description: data.description,
        project_id: projectId,
      };

      if (isEditMode) {
        // Update existing warehouse
        const storeWarehouseId = initialData?.id || 0;
        if (!storeWarehouseId) {
          toast.error("Warehouse ID is missing");
          return;
        }
        const response = await apiClient.put(
          `/update_warehouses/${storeWarehouseId}`,
          payload,
        );
        if (response.status === 200 || response.status === 201) {
          toast.success("Store / Warehouse Updated Successfully!");
          refresh();
          if (onClose) {
            onClose();
          }
        }
      } else {
        // Create new warehouse
        const response = await apiClient.post("/create_warehouses", payload);
        if (response.status === 200 || response.status === 201) {
          toast.success("Store / Warehouse Created Successfully!");
          refresh();
          if (onClose) {
            onClose();
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        isEditMode ? "update store / warehouse" : "create store / warehouse",
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
                placeholder="Enter  Email"
                {...register("email")}
                aria-invalid={!!errors.email}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.email?.message || "\u00A0"}
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
            {/* name */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter Name"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.name?.message || "\u00A0"}
              </p>
            </div>
            {/* contact number */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="contact_number">
                Contact Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contact_number"
                placeholder="Enter Contact Number"
                {...register("contact_number")}
                aria-invalid={!!errors.contact_number}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.contact_number?.message || "\u00A0"}
              </p>
            </div>
            {/* capacity */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="capacity">
                Capacity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="capacity"
                placeholder="Enter Capacity"
                {...register("capacity")}
                aria-invalid={!!errors.capacity}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.capacity?.message || "\u00A0"}
              </p>
            </div>
            {/* used capacity */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="used_capacity">
                Used Capacity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="used_capacity"
                placeholder="Enter Used Capacity"
                {...register("used_capacity")}
                aria-invalid={!!errors.used_capacity}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.used_capacity?.message || "\u00A0"}
              </p>
            </div>
            {/* description */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Input
                id="description"
                placeholder="Enter Description"
                {...register("description")}
                aria-invalid={!!errors.description}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.description?.message || "\u00A0"}
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
              ? "Update Store / Warehouse"
              : "Create Store / Warehouse"}
          </Button>
        </div>
      </form>
    </div>
  );
}
