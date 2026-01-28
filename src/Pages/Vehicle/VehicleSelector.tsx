import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import axios from "axios";
import { apiClient } from "@/utils/apiClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, RotateCcw, Search, Check } from "lucide-react";
import { useParams } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export type Vehicle = {
  id: number;
  vehicle_number: string;
  status: string;
  created_at: string;
  updated_at: string;
  driver_name: string;
  truck_type: string;
  driver_contact_no: string;
  transporter_id: number;
  capacity: number;
};

export const newVehicleSchema = z.object({
  vehicle_number: z.string().min(1, "Vehicle number is required"),
  transporter_id: z
    .number({
      error: "Transporter is required",
    })
    .min(1, "Transporter is required"),
  capacity: z
    .number({
      error: "Capacity is required",
    })
    .positive("Capacity must be greater than zero"),
  truck_type: z
    .string()
    .refine(
      (val) => val === "flatbed" || val === "type A",
      "Truck type is required"
    ),
  driver_name: z.string().min(1, "Driver name is required"),
  driver_phone_no: z.string().min(1, "Driver phone number is required"),
  emergency_contact_phone_no: z
    .string()
    .min(1, "Emergency contact phone number is required"),
});

export type NewVehicle = z.infer<typeof newVehicleSchema>;

type VehicleSelectorProps = {
  onChanging: (id: number, capacity: string) => void;
  onVehicleDataChange?: (data: NewVehicle) => void;
  driverName?: (value: string) => void;
  driverPhoneNo?: (value: string) => void;
  emergencyContactPhoneNo?: (value: string) => void;
};

type Transporter = {
  id: number;
  name: string;
  address: string;
  phone_no: string;
  phone_code: string;
  gst_no: string;
  created_at: string;
  updated_at: string;
};

export default function VehicleSelector({
  onChanging,
  onVehicleDataChange,
  driverName,
  driverPhoneNo,
  emergencyContactPhoneNo,
}: VehicleSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<Vehicle[]>([]);
  const [transporterData, setTransporterData] = useState<Transporter[]>([]);
  const { projectId } = useParams<{ projectId: string }>();
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NewVehicle>({
    resolver: zodResolver(newVehicleSchema),
  });

  // Fetch transporters
  const fetchTransporters = async () => {
    if (!projectId || isNaN(Number(projectId))) {
      return;
    }

    try {
      const response = await apiClient.get("/transporters");
      if (response.status === 200) {
        if (Array.isArray(response.data.data)) {
          setTransporterData(response.data.data);
        } else {
          setTransporterData([response.data.data]);
        }
      }
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error("Error fetching transporters:", error);
        toast.error("Failed to fetch transporters");
      }
    }
  };

  // Fetch vehicles
  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/vehicles");
      if (response.status === 200) {
        setAllVehicles(response.data);
      } else {
        setAllVehicles([]);
      }
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error("Error fetching vehicles:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchTransporters();
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setShowSuggestions(true);
    const trimmedValue = value.trim();

    if (trimmedValue === "") {
      setSuggestions([]);
      setShowCreateNew(false);
      return;
    }

    const filteredVehicles = allVehicles.filter((vehicle) =>
      vehicle.vehicle_number.toLowerCase().includes(trimmedValue.toLowerCase())
    );

    setSuggestions(filteredVehicles);
    setShowCreateNew(filteredVehicles.length === 0);
  };

  const handleReset = () => {
    setSelectedVehicle(null);
    setSearchTerm("");
    setSuggestions([]);
    setShowSuggestions(false);
    setShowCreateNew(false);
    reset();
    onChanging(0, "0");
    driverName?.("");
    driverPhoneNo?.("");
    emergencyContactPhoneNo?.("");
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setSearchTerm(vehicle.vehicle_number);
    setSuggestions([]);
    setShowSuggestions(false);
    setShowCreateNew(false);

    // Populate form with selected vehicle data
    setValue("vehicle_number", vehicle.vehicle_number);
    setValue("transporter_id", vehicle.transporter_id);
    setValue("capacity", vehicle.capacity);
    setValue("truck_type", vehicle.truck_type as "flatbed" | "type A");

    onChanging(vehicle.id, String(vehicle.capacity));
    
    // Sync vehicle data to parent
    if (onVehicleDataChange) {
      onVehicleDataChange({
        vehicle_number: vehicle.vehicle_number,
        transporter_id: vehicle.transporter_id,
        capacity: vehicle.capacity,
        truck_type: vehicle.truck_type as "flatbed" | "type A",
        driver_name: "",
        driver_phone_no: "",
        emergency_contact_phone_no: "",
      });
    }
    
    toast.success(`Vehicle ${vehicle.vehicle_number} selected`);
  };

  const handleCreateNew = () => {
    setSelectedVehicle(null);
    setValue("vehicle_number", searchTerm);
    reset();
    setSearchTerm("");
    setSuggestions([]);
    setShowSuggestions(false);
    setShowCreateNew(false);
  };

  const onSubmit: SubmitHandler<NewVehicle> = async (data) => {
    try {
      setLoading(true);
      const response = await apiClient.post("/vehicles", data);

      if (response.status === 201 || response.status === 200) {
        await fetchVehicles();
        setSearchTerm("");
        setSelectedVehicle(null);
        onChanging(response.data.id, response.data.capacity);
        toast.success("Vehicle created successfully!");
      }
    } catch (error) {
      toast.error("Failed to create vehicle");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Search Section */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Search Vehicle</Label>
          <Button variant="ghost" size="sm" onClick={handleReset} type="button" className="h-6 px-2 text-xs">
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset
          </Button>
        </div>

        <div className="relative">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search vehicle..."
              className="h-8 pl-7 text-sm"
            />
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && (suggestions.length > 0 || showCreateNew) && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
              {suggestions.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="flex cursor-pointer items-center justify-between px-2 py-1.5 hover:bg-accent text-sm"
                  onClick={() => handleVehicleSelect(vehicle)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{vehicle.vehicle_number}</span>
                    <span className="text-xs text-muted-foreground">
                      {vehicle.capacity} kg
                    </span>
                  </div>
                  {selectedVehicle?.id === vehicle.id && (
                    <Check className="h-3 w-3 text-primary" />
                  )}
                </div>
              ))}

              {showCreateNew && searchTerm && (
                <div
                  className="flex cursor-pointer items-center gap-1 border-t px-2 py-1.5 text-primary hover:bg-accent text-sm"
                  onClick={handleCreateNew}
                >
                  <Plus className="h-3 w-3" />
                  <span>Create "{searchTerm}"</span>
                </div>
              )}
            </div>
          )}
        </div>

        {selectedVehicle && (
          <div className="flex items-center gap-1 rounded border border-primary/30 bg-primary/5 px-2 py-1 text-xs">
            <Check className="h-3 w-3 text-primary" />
            <span>Selected: <strong>{selectedVehicle.vehicle_number}</strong></span>
          </div>
        )}
      </div>

      <Separator />

      {/* Vehicle Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
        <div className="grid gap-2">
          {/* Transporter */}
          <div className="space-y-1">
            <Label htmlFor="transporter" className="text-xs">
              Transporter <span className="text-destructive">*</span>
            </Label>
            <Select
              value={
                watch("transporter_id") !== undefined && watch("transporter_id") !== null
                  ? String(watch("transporter_id"))
                  : ""
              }
              onValueChange={(value) =>
                setValue(
                  "transporter_id",
                  value === "" ? (undefined as any) : Number(value),
                  { shouldValidate: true, shouldDirty: true }
                )
              }
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select transporter" />
              </SelectTrigger>
              <SelectContent>
                {transporterData.map((transporter) => (
                  <SelectItem key={transporter.id} value={String(transporter.id)}>
                    {transporter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.transporter_id?.message && (
              <p className="text-xs text-destructive">{errors.transporter_id.message}</p>
            )}
          </div>

          {/* Vehicle Number & Capacity - 2 columns */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="vehicle_number" className="text-xs">
                Vehicle No. <span className="text-destructive">*</span>
              </Label>
              <Input
                id="vehicle_number"
                placeholder="Vehicle no."
                className="h-8 text-sm"
                {...register("vehicle_number")}
              />
              {errors.vehicle_number && (
                <p className="text-xs text-destructive">{errors.vehicle_number.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="capacity" className="text-xs">
                Capacity (kg) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="capacity"
                type="number"
                placeholder="Capacity"
                className="h-8 text-sm"
                {...register("capacity", { valueAsNumber: true })}
              />
              {errors.capacity && (
                <p className="text-xs text-destructive">{errors.capacity.message}</p>
              )}
            </div>
          </div>

          {/* Truck Type */}
          <div className="space-y-1">
            <Label htmlFor="truck_type" className="text-xs">
              Truck Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watch("truck_type") || ""}
              onValueChange={(value) =>
                setValue("truck_type", value as "flatbed" | "type A", {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flatbed">Flatbed</SelectItem>
                <SelectItem value="type A">Type A</SelectItem>
              </SelectContent>
            </Select>
            {errors.truck_type && (
              <p className="text-xs text-destructive">{errors.truck_type.message}</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Driver Details Section */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Driver Details</Label>

          {/* Driver Name */}
          <div className="space-y-1">
            <Label htmlFor="driver_name" className="text-xs">
              Driver Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="driver_name"
              placeholder="Driver name"
              className="h-8 text-sm"
              {...register("driver_name", {
                onChange: (e) => driverName?.(e.target.value),
              })}
            />
            {errors.driver_name && (
              <p className="text-xs text-destructive">{errors.driver_name.message}</p>
            )}
          </div>

          {/* Driver Phone & Emergency - 2 columns */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="driver_phone_no" className="text-xs">
                Driver Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="driver_phone_no"
                type="tel"
                placeholder="10 digits"
                className="h-8 text-sm"
                maxLength={10}
                {...register("driver_phone_no", {
                  onChange: (e) => driverPhoneNo?.(e.target.value),
                })}
              />
              {errors.driver_phone_no && (
                <p className="text-xs text-destructive">{errors.driver_phone_no.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="emergency_contact_phone_no" className="text-xs">
                Emergency <span className="text-destructive">*</span>
              </Label>
              <Input
                id="emergency_contact_phone_no"
                type="tel"
                placeholder="10 digits"
                className="h-8 text-sm"
                maxLength={10}
                {...register("emergency_contact_phone_no", {
                  onChange: (e) => emergencyContactPhoneNo?.(e.target.value),
                })}
              />
              {errors.emergency_contact_phone_no && (
                <p className="text-xs text-destructive">
                  {errors.emergency_contact_phone_no.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button type="submit" disabled={loading || isSubmitting} className="w-full h-8 text-sm">
          {loading || isSubmitting ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              {selectedVehicle ? "Updating..." : "Creating..."}
            </>
          ) : selectedVehicle ? (
            "Update Vehicle"
          ) : (
            "Create Vehicle"
          )}
        </Button>
      </form>
    </div>
  );
}
