import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { apiClient } from "@/utils/apiClient";
import axios, { AxiosError } from "axios";
import {
  Loader2,
  Truck,
  Package,
  Weight,
  Building2,
  Layers,
} from "lucide-react";

import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import PageHeader from "@/components/ui/PageHeader";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Constants
const API_ENDPOINTS = {
  DISPATCH_ORDER: "/stock_erection",
} as const;

// Types
export type Element = {
  id: number;
  element_type_name: string;
  element_name: string;
  element_id: number;
  element_type: string;
  element_type_id: number;
  stockyard_id: number;
  thickness: number;
  length: number;
  height: number;
  volume: number;
  mass: number;
  area: number;
  width: number;
  production_date: string;
  storage_location: string;
  dispatch_status: boolean;
  created_at: string;
  updated_at: string;
  stockyard: boolean;
  project_id: number;
  target_location: number;
  tower_name: string;
  floor_name: string;
  floor_id: number;
  disable: boolean;
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
    return error.response?.data?.message || `Failed to fetch ${data}.`;
  }
  return "An unexpected error occurred. Please try again later.";
};

const vehicleSchema = z.object({
  type: z.string().min(1, "Trailer type is required"),
  capacity: z.string().min(1, "Capacity must be greater than 0"),
  incharge_name: z
    .string()
    .min(2, "Incharge name must be at least 2 characters"),
  gate_no: z.string().min(1, "Gate number is required"),
  tower_name: z.string().min(1, "Tower name is required"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  contact_no: z.string().min(10, "Phone number must be at least 10 digits"),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

const trailerTypes = [
  "Flatbed Trailer",
  "Step Deck Trailer",
  "Lowboy Trailer",
  "Dry Van",
  "Refrigerated (Reefer)",
  "Drop Deck",
  "Other",
];

const capacity = ["25", "35"];

export default function NewRequestHandler() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const [data, setData] = useState<Element[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset,
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema) as any,
    defaultValues: {
      type: "",
      capacity: "",
      incharge_name: "",
      gate_no: "",
      address: "",
      contact_no: "",
    },
  });

  const vehicleCapacity = watch("capacity") || 0;

  // Fetch elements
  useEffect(() => {
    if (!projectId) return;

    const source = axios.CancelToken.source();

    const fetchStockyards = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(
          `/precast_stock/all/${projectId}`,
          {
            cancelToken: source.token,
          },
        );

        if (response.status === 200) {
          setData(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch stockyards");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "stockyards data"));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStockyards();

    return () => {
      source.cancel();
    };
  }, [projectId]);

  // Item selection toggle
  const handleItemSelection = useCallback((elementId: number) => {
    setSelectedItems((prev) => {
      const newSelectedItems = new Set(prev);
      if (newSelectedItems.has(elementId)) {
        newSelectedItems.delete(elementId);
      } else {
        newSelectedItems.add(elementId);
      }
      return newSelectedItems;
    });
  }, []);

  // Select all items
  const handleSelectAll = useCallback(() => {
    if (selectedItems.size === data.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(data.map((e) => e.element_id)));
    }
  }, [data, selectedItems.size]);

  // Calculate capacities
  const calculateSelectedCapacity = useCallback(() => {
    return Array.from(selectedItems).reduce((total, elementId) => {
      const foundElement = data.find((e) => e.element_id === elementId);
      return total + (foundElement?.mass || 0);
    }, 0);
  }, [selectedItems, data]);

  const calculateLeftCapacity = useCallback(() => {
    const total = Number(vehicleCapacity) || 0;
    const selected = calculateSelectedCapacity();
    return Number((total - selected).toFixed(2));
  }, [vehicleCapacity, calculateSelectedCapacity]);

  // Validate and submit dispatch
  const onSendDispatch = async (formData: VehicleFormValues) => {
    if (selectedItems.size === 0) {
      toast.error("Please select at least one item to dispatch.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        items: Array.from(selectedItems),
        vehicle_details: formData,
      };

      const response = await apiClient.post(
        API_ENDPOINTS.DISPATCH_ORDER,
        payload,
      );

      if (response.status === 200 || response.status === 201) {
        toast.success("Dispatch order sent successfully!");
        setSelectedItems(new Set());
        reset();
        navigate(`/project/${projectId}/errection-receving`);
      }
    } catch (error) {
      console.error("Error sending dispatch:", error);
      toast.error("Failed to send dispatch. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCapacity = calculateSelectedCapacity();
  const leftCapacity = calculateLeftCapacity();
  const isOverCapacity = leftCapacity < 0;

  return (
    <div className="flex flex-col gap-2 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader title="Load Creation" />
        <Badge variant="outline" className="w-fit">
          <Truck className="mr-1 h-3 w-3" />
          {data.length} Elements
        </Badge>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-4">
        {/* Vehicle Selector - Top Panel */}
        <Card className="shadow-sm border-muted">
          <CardHeader className="">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Truck className="h-4 w-4" />
              Trailer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="">
            <form id="vehicle-form" onSubmit={handleSubmit(onSendDispatch)}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                <div className="grid gap-1.5">
                  <Label
                    htmlFor="type"
                    className="text-xs font-semibold uppercase text-muted-foreground">
                    Trailer Type <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    control={control}
                    name="type"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}>
                        <SelectTrigger className="w-full h-9">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Trailer Types</SelectLabel>
                            {trailerTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.type && (
                    <p className="text-xs text-red-600">
                      {errors.type.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-1.5">
                  <Label
                    htmlFor="capacity"
                    className="text-xs font-semibold uppercase text-muted-foreground">
                    Capacity <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    control={control}
                    name="capacity"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}>
                        <SelectTrigger className="w-full h-9">
                          <SelectValue placeholder="Select capacity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Capacity</SelectLabel>
                            {capacity.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type} ton
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.capacity && (
                    <p className="text-xs text-red-600">
                      {errors.capacity.message}
                    </p>
                  )}
                </div>
              </div>

              {/* make a different section for site details */}

              <div className="flex items-center gap-1 mt-2 mb-4 flex-col items-start">
                <h4 className="text-sm font-semibold  text-primary  text-md">
                  Site Details
                </h4>
                <Separator />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                <div className="grid gap-1.5">
                  <Label
                    htmlFor="incharge_name"
                    className="text-xs font-semibold uppercase text-muted-foreground">
                    Incharge <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="h-9"
                    id="incharge_name"
                    placeholder="Incharge Name"
                    {...register("incharge_name")}
                  />
                  {errors.incharge_name && (
                    <p className="text-xs text-red-600">
                      {errors.incharge_name.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-1.5">
                  <Label
                    htmlFor="gate_no"
                    className="text-xs font-semibold uppercase text-muted-foreground">
                    Gate No <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="h-9"
                    id="gate_no"
                    placeholder="Gate Number"
                    {...register("gate_no")}
                  />
                  {errors.gate_no && (
                    <p className="text-xs text-red-600">
                      {errors.gate_no.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-1.5">
                  <Label
                    htmlFor="address"
                    className="text-xs font-semibold uppercase text-muted-foreground">
                    Delivery Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="h-9"
                    id="address"
                    placeholder="Delivery Address"
                    {...register("address")}
                  />
                  {errors.address && (
                    <p className="text-xs text-red-600">
                      {errors.address.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-1.5">
                  <Label
                    htmlFor="contact_no"
                    className="text-xs font-semibold uppercase text-muted-foreground">
                    Phone No <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="h-9"
                    id="contact_no"
                    placeholder="Contact Number"
                    {...register("contact_no")}
                  />
                  {errors.contact_no && (
                    <p className="text-xs text-red-600">
                      {errors.contact_no.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-1.5">
                  <Label
                    htmlFor="tower_name"
                    className="text-xs font-semibold uppercase text-muted-foreground">
                    Tower Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="h-9"
                    id="tower_name"
                    placeholder="Tower Name"
                    {...register("tower_name")}
                  />
                  {errors.tower_name && (
                    <p className="text-xs text-red-600">
                      {errors.tower_name.message}
                    </p>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Elements List - Bottom Panel */}
        <div className="flex flex-col gap-2">
          <Card>
            <CardHeader className="">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Package className="h-4 w-4" />
                  Available Elements ({data.length})
                </CardTitle>
                {data.length > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSelectAll}
                    className="h-8 text-xs font-semibold">
                    {selectedItems.size === data.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="">
              {loading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : data.length > 0 ? (
                <ScrollArea className="h-[calc(100vh-600px)] w-full ">
                  <div className="flex flex-col gap-1 pr-3 pb-2 grid grid-cols-1 md:grid-cols-2">
                    {data.map((item) => {
                      const isSelected = selectedItems.has(item.element_id);
                      return (
                        <div
                          key={item.element_id}
                          className={`group flex items-center gap-3 rounded-md border px-2 py-1.5 transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border bg-card hover:bg-accent/50 hover:border-primary/50"
                          }`}>
                          <Checkbox
                            className="flex-shrink-0"
                            checked={isSelected}
                            onCheckedChange={() =>
                              handleItemSelection(item.element_id)
                            }
                            aria-label={`Select ${item.element_type_name}`}
                          />
                          <div
                            className="flex flex-1 items-center gap-2 sm:gap-4 min-w-0 cursor-pointer overflow-hidden"
                            onClick={() =>
                              handleItemSelection(item.element_id)
                            }>
                            <div className="flex items-center gap-2 shrink-0 w-[120px] sm:w-[160px]">
                              <span className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                                {item.element_type_name}
                              </span>
                              <Badge
                                variant={isSelected ? "default" : "secondary"}
                                className="text-[10px] h-4 px-1 py-0 font-mono leading-none flex items-center shrink-0">
                                {item.element_id}
                              </Badge>
                            </div>

                            <div className="flex flex-1 items-center justify-between gap-2 sm:gap-4 text-xs text-muted-foreground min-w-0">
                              <span className="flex items-center gap-1 whitespace-nowrap shrink-0">
                                <Weight className="h-3 w-3 shrink-0" />
                                {item.mass != null
                                  ? item.mass.toFixed(2)
                                  : "0.00"}{" "}
                                kg
                              </span>
                              <span className="flex items-center gap-1 truncate">
                                <Building2 className="h-3 w-3 shrink-0" />
                                <span className="truncate">
                                  {item.tower_name || "-"}
                                </span>
                              </span>
                              <span className="flex items-center gap-1 truncate w-[50px] sm:w-auto">
                                <Layers className="h-3 w-3 shrink-0" />
                                <span className="truncate">
                                  {item.floor_name || "-"}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground rounded-lg border border-dashed">
                  <Package className="h-8 w-8 opacity-50" />
                  <p className="text-sm font-medium">No elements available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Capacity Summary Bar */}
          <Card className="sticky bottom-4 shadow-md overflow-hidden border-primary/20 mx-2">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />
            <CardContent className="p-2 relative">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Total Capacity
                    </span>
                    <span className="font-bold font-mono">
                      {vehicleCapacity}{" "}
                      <span className="text-xs font-normal">ton</span>
                    </span>
                  </div>
                  <Separator
                    orientation="vertical"
                    className="h-8 hidden sm:block"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Selected Mass
                    </span>
                    <span className="font-bold font-mono text-primary">
                      {selectedCapacity.toFixed(2)}{" "}
                      <span className="text-xs font-normal">ton</span>
                    </span>
                  </div>
                  <Separator
                    orientation="vertical"
                    className="h-8 hidden sm:block"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Remaining Space
                    </span>
                    <span
                      className={`font-bold font-mono ${
                        isOverCapacity ? "text-destructive" : "text-emerald-600"
                      }`}>
                      {leftCapacity}{" "}
                      <span className="text-xs font-normal">ton</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                  {isOverCapacity && (
                    <span className="text-xs font-medium text-destructive hidden md:block px-3 py-1 bg-destructive/10 rounded-full animate-pulse">
                      Exceeds vehicle capacity
                    </span>
                  )}
                  <Button
                    type="submit"
                    form="vehicle-form"
                    disabled={selectedItems.size === 0 || submitting}
                    size="sm"
                    className="w-full sm:w-auto font-semibold  transition-all shadow-sm active:scale-95">
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Truck className="mr-2 h-4 w-4" />
                        Dispatch Load ({selectedItems.size})
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
