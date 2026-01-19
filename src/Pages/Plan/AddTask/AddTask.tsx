import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import axios, { AxiosError } from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import PageHeader from "@/components/ui/PageHeader";
import { toast } from "sonner";
import { apiClient } from "@/utils/apiClient";
import type { SelectedItem as DialogSelectedItem } from "./types";
import TowerFloorSelectionDialog from "./TowerFloorSelectionDialog";

const TaskSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  towerSelections: z
    .array(z.any())
    .min(1, "At least one tower selection is required"),
});

type FormFields = z.infer<typeof TaskSchema>;

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
    return (
      error.response?.data?.error ||
      error.response?.data?.message ||
      `Failed to ${data}.`
    );
  }
  return "An unexpected error occurred. Please try again later.";
};

type SelectedItem = DialogSelectedItem;

export default function AddTask() {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({
    resolver: zodResolver(TaskSchema),
    defaultValues: {
      towerSelections: [],
    },
  });
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [openStartDate, setOpenStartDate] = useState(false);
  const [openEndDate, setOpenEndDate] = useState(false);
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);
  const [selection, setSelection] = useState<Record<string, SelectedItem[]>>(
    {}
  );

  const handleSelectionSave = (
    newSelection: Record<string, SelectedItem[]>
  ) => {
    setSelection(newSelection);

    const formattedSelections = Object.entries(newSelection).map(
      ([floorId, items]) => ({
        floor_id: parseInt(floorId),
        items: items.map((item) => ({
          element_type_id: item.element_type_id,
          element_type_name: item.element_type_name,
          quantity: item.quantity,
          stockyard_id: item.stockyard_id,
          billable: item.billable,
        })),
      })
    );

    setValue("towerSelections", formattedSelections);
  };

  const handleSelectionReset = () => {
    setSelection({});
    setValue("towerSelections", []);
  };

  const onSubmit = async (formData: FormFields) => {
    if (Object.keys(selection).length === 0) {
      toast.error("Please select at least one tower and floor element");
      return;
    }

    try {
      const result = {
        name: formData.name,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date,
        project_id: Number(projectId),
        Selection: Object.entries(selection).reduce((acc, [floorId, items]) => {
          acc[String(floorId)] = items.map((item) => ({
            element_type_id: item.element_type_id,
            quantity: item.quantity,
            stockyard_id: item.stockyard_id,
            billable: item.billable,
          }));
          return acc;
        }, {} as Record<string, any[]>),
      };

      const response = await apiClient.post("/create_task/", result);

      if (response.status === 200 || response.status === 201) {
        toast.success("Task created successfully!");
        navigate(`/project/${projectId}/plan`);
      } else {
        toast.error(response.data?.message || "Failed to create task");
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, "create task");
      toast.error(errorMessage);
    }
  };

  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex items-center justify-between">
        <PageHeader title="Add New Task" />
      </div>
      <Separator />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {/* Task Name */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="task_name">
              Task Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="task_name"
              placeholder="Enter task name"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.name?.message || "\u00A0"}
            </p>
          </div>

          {/* Description */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="task_description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="task_description"
              placeholder="Enter task description"
              {...register("description")}
              aria-invalid={!!errors.description}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.description?.message || "\u00A0"}
            </p>
          </div>

          {/* Start Date */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="start_date">
              Start Date <span className="text-red-500">*</span>
            </Label>
            <Controller
              control={control}
              name="start_date"
              render={({ field }) => (
                <Popover open={openStartDate} onOpenChange={setOpenStartDate}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(new Date(field.value), "PPP")
                      ) : (
                        <span>Select start date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(format(date, "yyyy-MM-dd"));
                          setOpenStartDate(false);
                        }
                      }}
                      initialFocus
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.start_date?.message || "\u00A0"}
            </p>
          </div>

          {/* End Date */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="end_date">
              End Date <span className="text-red-500">*</span>
            </Label>
            <Controller
              control={control}
              name="end_date"
              render={({ field }) => (
                <Popover open={openEndDate} onOpenChange={setOpenEndDate}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(new Date(field.value), "PPP")
                      ) : (
                        <span>Select end date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(format(date, "yyyy-MM-dd"));
                          setOpenEndDate(false);
                        }
                      }}
                      initialFocus
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.end_date?.message || "\u00A0"}
            </p>
          </div>
        </div>

        {/* Tower & Floor Selection */}
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">
              Tower & Floor Selection <span className="text-red-500">*</span>
            </Label>
            {Object.keys(selection).length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSelectionDialog(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add More Elements
              </Button>
            )}
          </div>

          {Object.keys(selection).length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(selection).map(([floorId, items]) => (
                <div
                  key={floorId}
                  className="flex flex-col gap-2 border rounded-lg p-4 bg-muted/50"
                >
                  <Label className="font-semibold">
                    {items[0]?.floor_name
                      ? `${
                          items[0]?.floor_name?.startsWith("Floor")
                            ? items[0]?.floor_name
                            : `Floor ${items[0]?.floor_name}`
                        } (ID: ${floorId})`
                      : `Floor ${floorId}`}
                  </Label>
                  <div className="grid grid-cols-1 gap-2">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-3 bg-background p-3 rounded-lg border"
                      >
                        <div className="flex flex-col gap-1 flex-1">
                          <span className="font-medium">
                            {item.element_type_name}
                          </span>
                          <div className="flex items-center gap-4 text-muted-foreground">
                            <span>Qty: {item.quantity}</span>
                            <span>
                              Stockyard:{" "}
                              {item.stockyard_name ?? item.stockyard_id}
                            </span>
                            <span>
                              Billable: {item.billable ? "Yes" : "No"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] border rounded-lg">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSelectionDialog(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Choose Tower & Floor Elements
              </Button>
            </div>
          )}
          <p className="text-sm text-red-600 min-h-[20px]">
            {errors.towerSelections?.message || "\u00A0"}
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/project/${projectId}/plan`)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || Object.keys(selection).length === 0}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Task"
            )}
          </Button>
        </div>
      </form>

      {/* Tower Selection Dialog */}
      <TowerFloorSelectionDialog
        open={showSelectionDialog}
        onOpenChange={setShowSelectionDialog}
        projectId={projectId || ""}
        onSave={handleSelectionSave}
        onReset={handleSelectionReset}
      />
    </div>
  );
}
