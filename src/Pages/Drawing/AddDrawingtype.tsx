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
  drawing_type_name: z.string().min(1, "Drawing type name is required"),
  project_id: z.number().min(1, "Project ID is required"),
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

type DrawingProps = {
  refresh: () => void;
  initialData?: any;
  onClose?: () => void;
};

export default function AddDrawingtype({
  refresh,
  initialData: propInitialData,
  onClose,
}: DrawingProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();
  // Get initialData from props or location state
  const initialData = propInitialData || (location.state as any)?.initialData;
  const isEditMode = !!initialData;
  const getDefaultValues = (): Partial<FormData> => {
    if (!initialData) {
      return {
        drawing_type_name: "",
        project_id: projectId ? Number(projectId) : 0,
      };
    }

    return {
      drawing_type_name: initialData.drawing_type_name || "",
      project_id: initialData.project_id || (projectId ? Number(projectId) : 0),
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
    if (projectId && !initialData) {
      setValue("project_id", Number(projectId));
    }
  }, [initialData, reset, projectId, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload: any = {
        drawing_type_name: data.drawing_type_name,
        project_id: data.project_id,
      };

      if (isEditMode) {
        // Update existing drawing type
        const drawingTypeId = initialData?.drawings_type_id || initialData?.id;
        if (!drawingTypeId) {
          toast.error("Drawing type ID is missing");
          return;
        }
        const response = await apiClient.put(
          `/drawingtype_update/${drawingTypeId}`,
          payload
        );
        if (response.status === 200 || response.status === 201) {
          toast.success("Drawing type updated successfully!");
          if (onClose) {
            onClose();
          } else {
            navigate("/drawing_types");
          }
        }
      } else {
        // Create new skill type
        const response = await apiClient.post("/drawingtype_create", payload);
        if (response.status === 200 || response.status === 201) {
          toast.success("Drawing type created successfully!");
          if (onClose) {
            onClose();
          } else {
            navigate("/drawing_types");
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        isEditMode ? "update drawing type" : "create drawing type"
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
          <div className="grid grid-cols-1 gap-4 mt-4">
            {/* name */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="drawing_type_name">
                Drawing Type Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="drawing_type_name"
                placeholder="Drawing Type Name"
                {...register("drawing_type_name")}
                aria-invalid={!!errors.drawing_type_name}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.drawing_type_name?.message || "\u00A0"}
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
