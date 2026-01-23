import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { useParams } from "react-router-dom";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/utils/apiClient";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Building2, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Record schema for each hierarchy item
const recordSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  prefix: z.string().min(1, "Prefix is required"),
});

// Main form schema
const schema = z.object({
  parent_id: z.string(), // Empty string means creating a Tower (root level)
  records: z
    .array(recordSchema)
    .min(1, "At least one record is required"),
});

type FormData = z.infer<typeof schema>;

type ParentOption = {
  id: number;
  name: string;
  prefix: string;
};

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
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      `Failed to ${data}.`;
    return errorMessage;
  }
  return "An unexpected error occurred. Please try again later.";
};

type AddHierarchyProps = {
  refresh: () => void;
  onClose?: () => void;
};

export default function AddHierarchy({ refresh, onClose }: AddHierarchyProps) {
  const { projectId } = useParams();
  const [parentOptions, setParentOptions] = useState<ParentOption[]>([]);
  const [loadingParents, setLoadingParents] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      parent_id: "none",
      records: [{ name: "", description: "", prefix: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "records",
  });

  const selectedParentId = watch("parent_id");
  const isCreatingTower = !selectedParentId || selectedParentId === "" || selectedParentId === "none";

  // Fetch available parent options (towers)
  useEffect(() => {
    const fetchParents = async () => {
      if (!projectId) return;
      
      setLoadingParents(true);
      try {
        const response = await apiClient.get(`/get_precast_project/${projectId}`);
        if (response.status === 200) {
          // Extract towers as parent options
          const towers = response.data.map((tower: any) => ({
            id: tower.id,
            name: tower.name,
            prefix: tower.prefix,
          }));
          setParentOptions(towers);
        }
      } catch (err) {
        console.error("Failed to fetch parent options:", err);
      } finally {
        setLoadingParents(false);
      }
    };

    fetchParents();
  }, [projectId]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        project_id: Number(projectId),
        parent_id: data.parent_id && data.parent_id !== "none" ? Number(data.parent_id) : null,
        records: data.records,
      };

      const response = await apiClient.post("/create_precast", payload);

      if (response.status === 200 || response.status === 201) {
        toast.success(
          isCreatingTower
            ? "Tower(s) created successfully!"
            : "Floor(s) created successfully!"
        );
        // Close dialog first, then refresh data
        if (onClose) {
          onClose();
        }
        refresh();
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        isCreatingTower ? "create tower" : "create floor"
      );
      toast.error(errorMessage);
    }
  };

  const addRecord = () => {
    append({ name: "", description: "", prefix: "" });
  };

  const removeRecord = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <div className="flex flex-col gap-4 py-4 px-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Parent Selection */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="parent_id">
            Parent (Leave empty to create Tower)
          </Label>
          <Select
            value={selectedParentId}
            onValueChange={(value) => setValue("parent_id", value)}
            disabled={loadingParents}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select parent tower (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span>No Parent (Create Tower)</span>
                </div>
              </SelectItem>
              {parentOptions.map((parent) => (
                <SelectItem key={parent.id} value={parent.id.toString()}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{parent.name}</span>
                    {parent.prefix && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {parent.prefix}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {isCreatingTower
              ? "Creating new Tower(s) at root level"
              : "Creating Floor(s) under selected Tower"}
          </p>
        </div>

        {/* Type Indicator */}
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
          {isCreatingTower ? (
            <>
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Adding Tower(s)</span>
            </>
          ) : (
            <>
              <Layers className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Adding Floor(s)</span>
            </>
          )}
        </div>

        {/* Records Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>
              {isCreatingTower ? "Towers" : "Floors"}{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={addRecord}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add {isCreatingTower ? "Tower" : "Floor"}
            </Button>
          </div>

          {errors.records?.message && (
            <p className="text-sm text-red-600">{errors.records.message}</p>
          )}

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="border rounded-md p-3 space-y-3 bg-card"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {isCreatingTower ? "Tower" : "Floor"} {index + 1}
                  </Badge>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => removeRecord(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Name */}
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor={`records.${index}.name`} className="text-xs">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`records.${index}.name`}
                      placeholder={isCreatingTower ? "Tower A" : "Floor 1"}
                      {...register(`records.${index}.name`)}
                      aria-invalid={!!errors.records?.[index]?.name}
                      className="h-8 text-sm"
                    />
                    {errors.records?.[index]?.name && (
                      <p className="text-xs text-red-600">
                        {errors.records[index]?.name?.message}
                      </p>
                    )}
                  </div>

                  {/* Prefix */}
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor={`records.${index}.prefix`} className="text-xs">
                      Prefix <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`records.${index}.prefix`}
                      placeholder={isCreatingTower ? "T1" : "F1"}
                      {...register(`records.${index}.prefix`)}
                      aria-invalid={!!errors.records?.[index]?.prefix}
                      className="h-8 text-sm"
                    />
                    {errors.records?.[index]?.prefix && (
                      <p className="text-xs text-red-600">
                        {errors.records[index]?.prefix?.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor={`records.${index}.description`} className="text-xs">
                    Description
                  </Label>
                  <Textarea
                    id={`records.${index}.description`}
                    placeholder="Optional description..."
                    {...register(`records.${index}.description`)}
                    className="min-h-[60px] text-sm resize-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Creating..."
              : `Create ${isCreatingTower ? "Tower(s)" : "Floor(s)"}`}
          </Button>
        </div>
      </form>
    </div>
  );
}
