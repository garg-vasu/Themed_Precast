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
  name: z.string().min(1, "Name is required"),
  color_code: z.string().min(1, "Color code is required"),
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

type TagsProps = {
  refresh: () => void;
  initialData?: any;
  onClose?: () => void;
};

export default function AddTags({
  refresh,
  initialData: propInitialData,
  onClose,
}: TagsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();
  // Get initialData from props or location state
  const initialData = propInitialData || (location.state as any)?.initialData;
  const isEditMode = !!initialData;
  const getDefaultValues = (): Partial<FormData> => {
    if (!initialData) {
      return {
        name: "",
        color_code: "",
      };
    }

    return {
      name: initialData.name || "",
      color_code: initialData.color_code || "",
    };
  };

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(),
  });

  const colorCode = watch("color_code") || "#000000";

  useEffect(() => {
    const defaultValues = getDefaultValues();
    reset(defaultValues);
    // Set project_id from URL params if available
    if (!initialData) {
      setValue("color_code", "#000000");
    } else {
      // Ensure color_code has a default value if missing
      if (!defaultValues.color_code) {
        setValue("color_code", "#000000");
      }
    }
  }, [initialData, reset, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload: any = {
        name: data.name,
        color_code: data.color_code,
        project_id: projectId ? Number(projectId) : 0,
      };

      if (isEditMode) {
        // Update existing drawing type
        const tagId = initialData?.id;
        if (!tagId) {
          toast.error("Tag ID is missing");
          return;
        }
        const response = await apiClient.put(
          `/update_tasktype/${tagId}`,
          payload
        );
        if (response.status === 200 || response.status === 201) {
          toast.success("Tag updated successfully!");
          if (onClose) {
            onClose();
          } else {
            refresh();
          }
        }
      } else {
        // Create new skill type
        const response = await apiClient.post("/create_tasktype", payload);
        if (response.status === 200 || response.status === 201) {
          toast.success("Tag created successfully!");
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
        isEditMode ? "update tag" : "create tag"
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
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Name"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.name?.message || "\u00A0"}
              </p>
            </div>
            {/* color_code */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="color_code">
                Color <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Input
                    id="color_code"
                    type="color"
                    {...register("color_code")}
                    className="h-10 w-20 cursor-pointer border rounded-md"
                    aria-invalid={!!errors.color_code}
                    onChange={(e) => {
                      setValue("color_code", e.target.value, {
                        shouldValidate: true,
                      });
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="h-10 w-20 rounded-md border border-input shadow-sm"
                    style={{ backgroundColor: colorCode }}
                  />
                  <Input
                    type="text"
                    value={colorCode}
                    readOnly
                    className="w-24 font-mono text-sm"
                    placeholder="#000000"
                  />
                </div>
              </div>
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.color_code?.message || "\u00A0"}
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
              ? "Update Tag"
              : "Create Tag"}
          </Button>
        </div>
      </form>
    </div>
  );
}
