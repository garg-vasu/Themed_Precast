import { useNavigate, useParams } from "react-router-dom";
import VehicleSelector, { type NewVehicle } from "./VehicleSelector";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { apiClient } from "@/utils/apiClient";
import axios from "axios";
import { Loader2, Truck, Package, Weight, Building2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import PageHeader from "@/components/ui/PageHeader";

// Constants
const API_ENDPOINTS = {
  STOCK_SUMMARY: "/stock-summary/approved-erected",
  DISPATCH_ORDER: "/dispatch_order",
} as const;

// Types
export type Element = {
  element_element_id: string;
  element_table_id: number;
  element_type: string;
  element_type_id: number;
  element_type_name: string;
  floor_id: number;
  floor_name: string;
  stock_element_id: string;
  tower_name: string;
  weight: number;
};

export default function VehicleDispatch() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const [vehicleCapacity, setVehicleCapacity] = useState<string>("0");
  const [elements, setElements] = useState<Element[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [vehicleId, setVehicleId] = useState<number>(0);
  const [vehicleInfo, setVehicleInfo] = useState<{
    vehicle_number: string;
    transporter_id: number;
    capacity: number;
    truck_type: string;
  } | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [driverName, setDriverName] = useState("");
  const [driverPhoneNo, setDriverPhoneNo] = useState("");
  const [emergencyContactPhoneNo, setEmergencyContactPhoneNo] = useState("");

  // Fetch elements
  const fetchElements = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const response = await apiClient.get<Element[] | null>(
        `${API_ENDPOINTS.STOCK_SUMMARY}/${projectId}`
      );
      // Handle null response from API
      setElements(response.data ?? []);
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error("Error fetching elements:", error);
        toast.error("Failed to fetch elements. Please try again.");
        setElements([]);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchElements();
  }, [fetchElements]);

  // Vehicle selection handler
  const handleVehicleSelect = useCallback((id: number, capacity: string) => {
    setVehicleId(id);
    setVehicleCapacity(capacity);
    setSelectedItems(new Set());
  }, []);

  // Handle vehicle data sync from selector
  const handleVehicleDataChange = useCallback((data: NewVehicle) => {
    setVehicleInfo({
      vehicle_number: data.vehicle_number,
      transporter_id: data.transporter_id,
      capacity: data.capacity,
      truck_type: data.truck_type,
    });
  }, []);

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
    if (selectedItems.size === elements.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(elements.map((e) => e.element_table_id)));
    }
  }, [elements, selectedItems.size]);

  // Calculate capacities
  const calculateSelectedCapacity = useCallback(() => {
    return Array.from(selectedItems).reduce((total, elementId) => {
      const foundElement = elements.find((e) => e.element_table_id === elementId);
      return total + (foundElement?.weight || 0);
    }, 0);
  }, [selectedItems, elements]);

  const calculateLeftCapacity = useCallback(() => {
    const total = parseFloat(vehicleCapacity) || 0;
    const selected = calculateSelectedCapacity();
    return parseFloat((total - selected).toFixed(2));
  }, [vehicleCapacity, calculateSelectedCapacity]);

  // Validate and submit dispatch
  const handleSendDispatch = async () => {
    if (!vehicleId) {
      toast.error("Please select a vehicle");
      return;
    }
    if (selectedItems.size === 0) {
      toast.error("Please select at least one item");
      return;
    }
    if (!driverName || driverName.trim().length < 2) {
      toast.error("Driver name must be at least 2 characters");
      return;
    }
    if (driverPhoneNo.length !== 10) {
      toast.error("Driver phone number must be exactly 10 digits");
      return;
    }
    if (emergencyContactPhoneNo.length !== 10) {
      toast.error("Emergency contact phone number must be exactly 10 digits");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        vehicle_id: vehicleId,
        project_id: Number(projectId),
        driver_name: driverName,
        driver_phone_no: driverPhoneNo,
        emergency_contact_phone_no: emergencyContactPhoneNo,
        items: Array.from(selectedItems),
        vehicle_details: vehicleInfo ? {
          ...vehicleInfo,
          driver_name: driverName,
          driver_phone_no: driverPhoneNo,
          emergency_contact_phone_no: emergencyContactPhoneNo,
        } : null,
      };

      const response = await apiClient.post(API_ENDPOINTS.DISPATCH_ORDER, payload);

      if (response.status === 200 || response.status === 201) {
        toast.success("Dispatch order sent successfully!");
        setSelectedItems(new Set());
        setDriverName("");
        setDriverPhoneNo("");
        setEmergencyContactPhoneNo("");
        fetchElements();
        navigate(`/project/${projectId}/dispatchlog`);
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
        <PageHeader title="Vehicle Dispatch" />
        <Badge variant="outline" className="w-fit">
          <Truck className="mr-1 h-3 w-3" />
          {elements.length} Elements
        </Badge>
      </div>

      <Separator />

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-12">
        {/* Vehicle Selector - Left Panel */}
        <Card className="lg:col-span-4 py-3">
          <CardHeader className="px-3 py-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4" />
              Vehicle Details
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 py-0">
            <ScrollArea className="h-[calc(100vh-200px)] pr-2">
              <VehicleSelector
                onChanging={handleVehicleSelect}
                onVehicleDataChange={handleVehicleDataChange}
                driverName={setDriverName}
                driverPhoneNo={setDriverPhoneNo}
                emergencyContactPhoneNo={setEmergencyContactPhoneNo}
              />
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Elements List - Right Panel */}
        <div className="flex flex-col gap-2 lg:col-span-8">
          <Card className="flex-1 py-3">
            <CardHeader className="px-3 py-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4" />
                  Available Elements ({elements.length})
                </CardTitle>
                {elements.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    {selectedItems.size === elements.length ? "Deselect All" : "Select All"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-3 py-0">
              {loading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : elements.length > 0 ? (
                <ScrollArea className="h-[calc(100vh-340px)]">
                  <div className="space-y-1 pr-2">
                    {elements.map((item) => {
                      const isSelected = selectedItems.has(item.element_table_id);
                      return (
                        <div
                          key={item.element_table_id}
                          onClick={() => handleItemSelection(item.element_table_id)}
                          className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 transition-colors hover:bg-accent/50 ${
                            isSelected ? "border-primary bg-primary/5" : "border-border"
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleItemSelection(item.element_table_id)}
                            aria-label={`Select ${item.element_type_name}`}
                          />
                          <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-medium text-sm truncate">{item.element_type_name}</span>
                              <Badge variant="secondary" className="text-xs shrink-0">
                                {item.element_element_id}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                              <span className="flex items-center gap-1">
                                <Weight className="h-3 w-3" />
                                {item.weight.toFixed(2)} kg
                              </span>
                              <span className="hidden sm:flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {item.tower_name}
                              </span>
                              <span className="hidden md:flex items-center gap-1">
                                <Layers className="h-3 w-3" />
                                {item.floor_name}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex h-32 flex-col items-center justify-center gap-1 text-muted-foreground">
                  <Package className="h-8 w-8 opacity-50" />
                  <p className="text-sm">No elements available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Capacity Summary Bar */}
          <Card className="py-2">
            <CardContent className="px-3 py-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-semibold">{vehicleCapacity} kg</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Selected:</span>
                    <span className="font-semibold text-primary">
                      {selectedCapacity.toFixed(2)} kg
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Left:</span>
                    <span
                      className={`font-semibold ${
                        isOverCapacity ? "text-destructive" : "text-green-600"
                      }`}
                    >
                      {leftCapacity} kg
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleSendDispatch}
                  disabled={selectedItems.size === 0 || submitting}
                  size="sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Truck className="mr-1 h-3 w-3" />
                      Dispatch ({selectedItems.size})
                    </>
                  )}
                </Button>
              </div>

              {isOverCapacity && (
                <p className="mt-2 text-sm text-destructive">
                  Warning: Selected weight exceeds vehicle capacity
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
