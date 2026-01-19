import { useEffect } from "react";
import {
  useForm,
  useFieldArray,
  Controller,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiClient } from "@/utils/apiClient";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { AxiosError } from "axios";
import axios from "axios";

type TemplateDialogProps = {
  onClose?: () => void;
  template?: {
    template_name: string;
    template_id: number;
    stages: {
      name: string;
      id: number;
      order: number;
      qc_assign: boolean;
      inventory_deduction: boolean;
      completion_stage: boolean;
    }[];
  };
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
    // Check both 'error' and 'message' fields in the response
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      `Failed to ${data}.`;
    return errorMessage;
  }
  return "An unexpected error occurred. Please try again later.";
};

const stageSchema = z.object({
  name: z.string().min(1, "Stage name is required"),
  order: z.coerce.number().min(1, "Order is required"),
  qc_assign: z.boolean().default(true),
  inventory_deduction: z.boolean().default(false),
  completion_stage: z.boolean().default(false),
});

const templateSchema = z.object({
  template_name: z.string().min(1, "Template name is required"),
  stages: z.array(stageSchema).min(1, "At least one stage is required"),
});
type FormData = z.infer<typeof templateSchema>;

const getDefaultStages = (
  template?: TemplateDialogProps["template"]
): FormData["stages"] => {
  if (!template?.stages || template.stages.length === 0) {
    return [
      {
        name: "",
        order: 1,
        qc_assign: true,
        inventory_deduction: false,
        completion_stage: false,
      },
    ];
  }
  return template.stages.map((stage, idx) => ({
    name: stage.name || "",
    order: stage.order ?? idx + 1,
    qc_assign: stage.qc_assign ?? true,
    inventory_deduction: stage.inventory_deduction ?? false,
    completion_stage: stage.completion_stage ?? false,
  }));
};

export default function AddTemplate({
  onClose,
  template,
}: TemplateDialogProps) {
  const isEditMode = !!template;
  const navigate = useNavigate();

  const getDefaultValues = (): FormData => ({
    template_name: template?.template_name || "",
    stages: getDefaultStages(template),
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(templateSchema) as Resolver<FormData>,
    defaultValues: getDefaultValues(),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "stages",
  });

  console.log(errors);
  // Reset form when template changes (edit mode)
  useEffect(() => {
    reset(getDefaultValues());
  }, [template, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload: any = {
        template_name: data.template_name,
        stages: data.stages.map((stage) => ({
          name: stage.name,
          order: stage.order,
          qc_assign: stage.qc_assign,
          inventory_deduction: stage.inventory_deduction,
          completion_stage: stage.completion_stage,
        })),
      };
      if (isEditMode) {
        const response = await apiClient.put(
          `/update_template/${template?.template_id}`,
          payload
        );
        if (response.status === 200 || response.status === 201) {
          toast.success("Template updated successfully!");
          if (onClose) {
            onClose();
          } else {
            navigate("/templates");
          }
        }
      } else {
        const response = await apiClient.post("/create_template", payload);
        if (response.status === 200 || response.status === 201) {
          toast.success("Template created successfully!");
          if (onClose) {
            onClose();
          } else {
            navigate("/templates");
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        isEditMode ? "update template" : "create template"
      );
      toast.error(errorMessage);
    }
  };

  return (
    <div className="flex flex-col gap-2 py-4 ">
      <form
        onSubmit={handleSubmit(onSubmit as any)}
        className="flex flex-col gap-2"
      >
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="template_name">
            Template Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="template_name"
            placeholder="Template Name"
            {...register("template_name")}
            aria-invalid={!!errors.template_name}
          />
          <p className="text-sm text-red-600 min-h-[20px]">
            {errors.template_name?.message || "\u00A0"}
          </p>
        </div>

        <div className="flex items-center justify-between mt-2">
          <Label className="font-semibold">Stages</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                name: "",
                order: fields.length + 1,
                qc_assign: true,
                inventory_deduction: false,
                completion_stage: false,
              })
            }
          >
            Add Stage
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="border rounded-md p-3 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">Stage {index + 1}</div>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor={`stages.${index}.name`}>
                    Stage Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`stages.${index}.name`}
                    placeholder="Enter stage name"
                    {...register(`stages.${index}.name` as const)}
                    aria-invalid={!!errors.stages?.[index]?.name}
                  />
                  <p className="text-sm text-red-600 min-h-[20px]">
                    {errors.stages?.[index]?.name?.message || "\u00A0"}
                  </p>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`stages.${index}.order`}>
                    Order <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`stages.${index}.order`}
                    type="number"
                    min={1}
                    {...register(`stages.${index}.order` as const, {
                      valueAsNumber: true,
                    })}
                    aria-invalid={!!errors.stages?.[index]?.order}
                  />
                  <p className="text-sm text-red-600 min-h-[20px]">
                    {errors.stages?.[index]?.order?.message || "\u00A0"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center space-x-2">
                  <Controller
                    control={control}
                    name={`stages.${index}.qc_assign` as const}
                    render={({ field }) => (
                      <Checkbox
                        id={`stages.${index}.qc_assign`}
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(!!checked)}
                      />
                    )}
                  />
                  <Label htmlFor={`stages.${index}.qc_assign`}>QC Assign</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Controller
                    control={control}
                    name={`stages.${index}.inventory_deduction` as const}
                    render={({ field }) => (
                      <Checkbox
                        id={`stages.${index}.inventory_deduction`}
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(!!checked)}
                      />
                    )}
                  />
                  <Label htmlFor={`stages.${index}.inventory_deduction`}>
                    Inventory Deduction
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Controller
                    control={control}
                    name={`stages.${index}.completion_stage` as const}
                    render={({ field }) => (
                      <Checkbox
                        id={`stages.${index}.completion_stage`}
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(!!checked)}
                      />
                    )}
                  />
                  <Label htmlFor={`stages.${index}.completion_stage`}>
                    Completion Stage
                  </Label>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (onClose) {
                onClose();
              } else {
                navigate("/templates");
              }
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : isEditMode
              ? "Update Template"
              : "Create Template"}
          </Button>
        </div>
      </form>
    </div>
  );
}
