import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/utils/apiClient";
import type { SelectedItem, ElementType, ApiResponse } from "./types";

interface Stockyard {
  id: number;
  yard_name: string;
  location: string;
  capacity: number;
  current_stock: number;
}

type CompositeKey = `${number}-${number}`;

interface TowerFloorSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSave: (selection: Record<string, SelectedItem[]>) => void;
  onReset?: () => void;
}

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

export default function TowerFloorSelectionDialog({
  open,
  onOpenChange,
  projectId,
  onSave,
  onReset,
}: TowerFloorSelectionDialogProps) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [stockyards, setStockyards] = useState<Stockyard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTower, setSelectedTower] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<
    Record<string, SelectedItem[]>
  >({});
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const getTowerDisplayName = (towerName: string | null) => {
    if (!towerName) return "";
    if (towerName.startsWith("tower_")) {
      const index = parseInt(towerName.split("_")[1]) - 2;
      return `Tower ${index + 2}`;
    }
    return towerName.trim() === "" ? "Tower 2" : towerName;
  };

  const getFloorOptions = () => {
    if (!data || !selectedTower) return [];
    return Object.entries(data[selectedTower])
      .map(([floorName, floorData]) => {
        const firstCategory = Object.values(floorData)[0];
        const floor_id = firstCategory && firstCategory[0]?.floor_id;
        return floor_id !== undefined
          ? { floor_id: floor_id.toString(), floorName }
          : null;
      })
      .filter((v): v is { floor_id: string; floorName: string } => !!v);
  };

  const getFloorNameById = (floor_id: string | null) => {
    if (!data || !selectedTower || !floor_id) return null;
    for (const [floorName, floorData] of Object.entries(data[selectedTower])) {
      const firstCategory = Object.values(floorData)[0];
      const id = firstCategory && firstCategory[0]?.floor_id;
      if (id !== undefined && id.toString() === floor_id) {
        return floorName;
      }
    }
    return null;
  };

  const floorName = getFloorNameById(selectedFloor);

  const getTowerFallbackValue = (towerName: string, index: number) => {
    return towerName.trim() === "" ? `tower_${index + 2}` : towerName;
  };

  const getActualTowerValue = (value: string) => {
    return value.startsWith("tower_") ? "" : value;
  };

  const getSelectedTowerFallbackValue = (selectedTower: string | null) => {
    if (!selectedTower) return "";
    if (selectedTower === "") {
      if (data) {
        const towerKeys = Object.keys(data);
        const emptyTowerIndex = towerKeys.findIndex(
          (tower) => tower.trim() === "",
        );
        return emptyTowerIndex >= 0
          ? `tower_${emptyTowerIndex + 2}`
          : "tower_2";
      }
      return "tower_2";
    }
    return selectedTower;
  };

  useEffect(() => {
    if (!open || !projectId) {
      setLoading(false);
      return;
    }

    const source = axios.CancelToken.source();

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [elementsResponse, stockyardsResponse] = await Promise.all([
          apiClient.get(`/get_element_type_quantity/${projectId}`, {
            cancelToken: source.token,
          }),
          apiClient.get(`/stockyards`, {
            cancelToken: source.token,
          }),
        ]);

        if (
          elementsResponse.status === 200 &&
          stockyardsResponse.status === 200
        ) {
          setData(elementsResponse.data);
          setStockyards(stockyardsResponse.data);
        } else {
          const errorMsg = "Failed to fetch data";
          setError(errorMsg);
          toast.error(errorMsg);
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          const errorMessage = getErrorMessage(err, "fetch data");
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      source.cancel();
    };
  }, [open, projectId]);

  useEffect(() => {
    setInputValues((prev) => {
      const newInputValues = { ...prev };
      Object.values(selectedItems)
        .flat()
        .forEach((item) => {
          if (!(item.compositeKey in newInputValues)) {
            newInputValues[item.compositeKey] = item.quantity.toString();
          }
        });
      return newInputValues;
    });
  }, [selectedItems]);

  const handleItemSelect = (
    item: ElementType,
    quantity: number,
    stockyardId: number | null,
    billable: boolean = true,
  ) => {
    setSelectedItems((prev) => {
      const floorId = item.floor_id.toString();
      const compositeKey: CompositeKey = `${item.element_type_id}-${item.floor_id}`;
      const items = prev[floorId] ? [...prev[floorId]] : [];
      const existingIndex = items.findIndex(
        (i) => i.compositeKey === compositeKey,
      );

      const existingItem = existingIndex >= 0 ? items[existingIndex] : null;
      const finalStockyardId =
        stockyardId !== null
          ? stockyardId
          : (existingItem?.stockyard_id ?? null);
      const finalStockyardName =
        finalStockyardId !== null
          ? stockyards.find((s) => s.id === finalStockyardId)?.yard_name || null
          : null;
      const finalBillable = billable;
      const floorNameDisplay = getFloorNameById(floorId);

      const newItem: SelectedItem = {
        element_type_id: item.element_type_id,
        element_type_name: item.element_type_name,
        quantity,
        stockyard_id: finalStockyardId,
        stockyard_name: finalStockyardName ?? undefined,
        floor_name: floorNameDisplay ?? undefined,
        floor_id: item.floor_id,
        compositeKey,
        billable: finalBillable,
      };

      if (existingIndex >= 0) {
        items[existingIndex] = newItem;
      } else {
        items.push(newItem);
      }
      return { ...prev, [floorId]: items };
    });
  };

  const handleSave = () => {
    const filtered: Record<string, SelectedItem[]> = {};
    Object.entries(selectedItems).forEach(([floorId, items]) => {
      const valid = items.filter(
        (item) => item.quantity > 0 && item.stockyard_id !== null,
      );
      if (valid.length > 0) {
        filtered[floorId] = valid.map(
          ({
            element_type_id,
            element_type_name,
            quantity,
            stockyard_id,
            stockyard_name,
            floor_id,
            floor_name,
            compositeKey,
            billable,
          }) => ({
            element_type_id,
            element_type_name,
            quantity,
            stockyard_id,
            stockyard_name:
              stockyard_name ??
              (stockyards.find((s) => s.id === (stockyard_id as number))
                ?.yard_name ||
                undefined),
            floor_name: floor_name || undefined,
            floor_id,
            compositeKey,
            billable,
          }),
        );
      }
    });

    onSave(filtered);
    onOpenChange(false);
  };

  const resetSelection = () => {
    setSelectedTower(null);
    setSelectedFloor(null);
    setSelectedCategory(null);
    setSelectedItems({});
    if (onReset) {
      onReset();
    }
  };

  const selectedElements =
    selectedItems[selectedFloor ?? ""]?.filter((item) => {
      let categoryData: ElementType[] = [];
      if (
        selectedTower &&
        selectedFloor &&
        selectedCategory &&
        floorName &&
        data?.[selectedTower]?.[floorName]?.[selectedCategory]
      ) {
        const raw = data[selectedTower][floorName][selectedCategory];
        if (Array.isArray(raw)) categoryData = raw;
      }
      return categoryData.some(
        (catItem) => catItem.element_type_id === item.element_type_id,
      );
    }) ?? [];

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Tower & Floor Elements</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 ">
            {/* Tower Selector */}
            <div className="grid w-full items-center gap-1.5 ">
              <Label>Select Tower</Label>
              <Select
                value={getSelectedTowerFallbackValue(selectedTower)}
                onValueChange={(value) => {
                  const actualValue = getActualTowerValue(value);
                  setSelectedTower(actualValue);
                  setSelectedFloor(null);
                  setSelectedCategory(null);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select tower">
                    {selectedTower
                      ? getTowerDisplayName(selectedTower)
                      : "Select tower"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {data &&
                    Object.keys(data).map((tower, index) => {
                      const displayName =
                        tower.trim() === "" ? `Tower ${index + 2}` : tower;
                      const towerValue = getTowerFallbackValue(tower, index);
                      return (
                        <SelectItem key={tower} value={towerValue}>
                          {displayName}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            {/* Floor Selector */}
            <div className="grid w-full items-center gap-1.5">
              <Label>Select Floor</Label>
              <Select
                value={selectedFloor || ""}
                onValueChange={(value) => {
                  setSelectedFloor(value);
                  setSelectedCategory(null);
                }}
                disabled={!selectedTower}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select floor" />
                </SelectTrigger>
                <SelectContent>
                  {(
                    getFloorOptions() as {
                      floor_id: string;
                      floorName: string;
                    }[]
                  )
                    .filter(
                      ({ floor_id, floorName }) =>
                        floor_id && floorName && floorName.trim() !== "",
                    )
                    .map(({ floor_id, floorName }) => (
                      <SelectItem key={floor_id} value={floor_id}>
                        {floorName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Selector */}
            <div className="grid w-full items-center gap-1.5">
              <Label>Select Category</Label>
              <Select
                value={selectedCategory || ""}
                onValueChange={(value) => {
                  setSelectedCategory(value);
                }}
                disabled={!selectedFloor}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {data &&
                    selectedTower &&
                    selectedFloor &&
                    floorName &&
                    Object.entries(data[selectedTower][floorName] || {})
                      .filter(
                        ([category]) => category && category.trim() !== "",
                      )
                      .map(([category, elements]) => {
                        const totals = (elements as ElementType[]).reduce(
                          (acc, element) => ({
                            balance: acc.balance + element.Balance_quantity,
                            total: acc.total + element.total_quantity,
                          }),
                          { balance: 0, total: 0 },
                        );
                        return (
                          <SelectItem key={category} value={category}>
                            <div className="flex items-center justify-between w-full">
                              <span>{category}</span>
                              <span className="text-muted-foreground ml-2">
                                ({totals.balance}/{totals.total})
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Element Selection & Summary */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {selectedCategory ? (
              <div className="space-y-4">
                {/* Element Type Multi-select */}
                <div className="border rounded-lg p-4">
                  <Label className="mb-2">
                    Select Elements (Balance/Total)
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                    {data &&
                      selectedTower &&
                      selectedFloor &&
                      selectedCategory &&
                      floorName &&
                      (
                        data[selectedTower][floorName]?.[selectedCategory] || []
                      ).map((item: ElementType) => {
                        const compositeKey: CompositeKey = `${item.element_type_id}-${item.floor_id}`;
                        const isChecked = selectedItems[
                          selectedFloor ?? ""
                        ]?.some((el) => el.compositeKey === compositeKey);
                        return (
                          <div
                            key={compositeKey}
                            className="flex items-center gap-2 p-1 border rounded hover:bg-accent/50 transition-colors"
                          >
                            <Checkbox
                              id={`element-${item.element_type_id}-${item.floor_id}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                setSelectedItems((prev) => {
                                  const floorId = selectedFloor ?? "";
                                  const prevItems = prev[floorId]
                                    ? [...prev[floorId]]
                                    : [];
                                  if (checked) {
                                    if (
                                      !prevItems.some(
                                        (el) =>
                                          el.compositeKey === compositeKey,
                                      )
                                    ) {
                                      prevItems.push({
                                        element_type_id: item.element_type_id,
                                        element_type_name:
                                          item.element_type_name,
                                        quantity: 0,
                                        stockyard_id: null,
                                        floor_id: item.floor_id,
                                        compositeKey,
                                        billable: true,
                                      });
                                    }
                                  } else {
                                    return {
                                      ...prev,
                                      [floorId]: prevItems.filter(
                                        (el) =>
                                          el.compositeKey !== compositeKey,
                                      ),
                                    };
                                  }
                                  return { ...prev, [floorId]: prevItems };
                                });
                              }}
                            />
                            <label
                              htmlFor={`element-${item.element_type_id}-${item.floor_id}`}
                              className="font-medium text-wrap flex-1 cursor-pointer"
                            >
                              {item.element_type_name}
                            </label>
                            <span className="text-muted-foreground">
                              ({item.Balance_quantity}/{item.total_quantity})
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Selected Elements Cards */}
                {selectedElements.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Elements</Label>
                    <ScrollArea className="max-h-56 overflow-y-auto w-full">
                      <div className="flex flex-col gap-2">
                        {selectedFloor &&
                          selectedElements.map((item) => {
                            const compositeKey: CompositeKey = `${item.element_type_id}-${item.floor_id}`;
                            let categoryData: ElementType[] = [];
                            if (
                              selectedTower &&
                              selectedFloor &&
                              selectedCategory &&
                              floorName &&
                              data?.[selectedTower]?.[floorName]?.[
                                selectedCategory
                              ]
                            ) {
                              const raw =
                                data[selectedTower][floorName][
                                  selectedCategory
                                ];
                              if (Array.isArray(raw)) categoryData = raw;
                            }
                            const elementType = categoryData.find(
                              (el) =>
                                el.element_type_id === item.element_type_id &&
                                el.floor_id === item.floor_id,
                            );
                            const selectedItem = (
                              selectedItems[selectedFloor ?? ""] || []
                            ).find((i) => i.compositeKey === compositeKey);
                            const value = inputValues[compositeKey];
                            const fallback =
                              selectedItem?.quantity?.toString() ?? "";
                            return (
                              <div
                                key={compositeKey}
                                className="flex flex-row items-center gap-2 border rounded p-2 bg-muted/50 overflow-x-auto"
                              >
                                <span className="font-medium whitespace-nowrap flex-shrink-0">
                                  {item.element_type_name}
                                </span>
                                <div className="flex flex-row items-center gap-2">
                                  <Label className="text-muted-foreground">
                                    Stockyard:
                                  </Label>
                                  <Select
                                    value={selectedItem?.stockyard_id?.toString()}
                                    onValueChange={(value) => {
                                      const stockyardId = value
                                        ? Number(value)
                                        : null;
                                      if (stockyardId !== null && elementType) {
                                        handleItemSelect(
                                          elementType,
                                          selectedItem
                                            ? selectedItem.quantity
                                            : 0,
                                          stockyardId,
                                          selectedItem?.billable ?? true,
                                        );
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue placeholder="Stockyard" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {stockyards
                                        .filter(
                                          (yard) =>
                                            yard.yard_name &&
                                            yard.yard_name.trim() !== "",
                                        )
                                        .map((yard) => (
                                          <SelectItem
                                            key={yard.id}
                                            value={yard.id.toString()}
                                          >
                                            {yard.yard_name}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex flex-row items-center gap-2">
                                  <Label className="text-muted-foreground">
                                    Qty:
                                  </Label>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={elementType?.Balance_quantity ?? 0}
                                    value={
                                      value !== undefined ? value : fallback
                                    }
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      if (raw === "") {
                                        setInputValues((prev) => ({
                                          ...prev,
                                          [compositeKey]: "",
                                        }));
                                        return;
                                      }
                                      let parsed = parseInt(raw, 10);
                                      if (isNaN(parsed)) parsed = 0;
                                      const maxQty =
                                        elementType?.Balance_quantity ?? 0;
                                      const clamped = Math.min(
                                        Math.max(0, parsed),
                                        maxQty,
                                      );

                                      setInputValues((prev) => ({
                                        ...prev,
                                        [compositeKey]: clamped.toString(),
                                      }));

                                      const existingItem = (
                                        selectedItems[selectedFloor ?? ""] || []
                                      ).find(
                                        (i) => i.compositeKey === compositeKey,
                                      );
                                      if (elementType) {
                                        handleItemSelect(
                                          elementType,
                                          clamped,
                                          existingItem?.stockyard_id ?? null,
                                          existingItem?.billable ?? true,
                                        );
                                      }
                                    }}
                                    className="w-20"
                                  />
                                  <span className="text-muted-foreground">
                                    /{elementType?.Balance_quantity ?? 0}
                                  </span>
                                </div>
                                <div className="flex flex-row items-center gap-2">
                                  <Label className="text-muted-foreground">
                                    Billable:
                                  </Label>
                                  <RadioGroup
                                    value={
                                      selectedItem?.billable !== undefined
                                        ? selectedItem.billable.toString()
                                        : "true"
                                    }
                                    onValueChange={(value) => {
                                      const billableValue = value === "true";
                                      if (elementType) {
                                        handleItemSelect(
                                          elementType,
                                          selectedItem
                                            ? selectedItem.quantity
                                            : 0,
                                          selectedItem?.stockyard_id ?? null,
                                          billableValue,
                                        );
                                      }
                                    }}
                                    className="flex flex-row gap-4"
                                  >
                                    <div className="flex items-center gap-2">
                                      <RadioGroupItem
                                        value="true"
                                        id={`billable-true-${compositeKey}`}
                                      />
                                      <Label
                                        htmlFor={`billable-true-${compositeKey}`}
                                        className="cursor-pointer"
                                      >
                                        Yes
                                      </Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <RadioGroupItem
                                        value="false"
                                        id={`billable-false-${compositeKey}`}
                                      />
                                      <Label
                                        htmlFor={`billable-false-${compositeKey}`}
                                        className="cursor-pointer"
                                      >
                                        No
                                      </Label>
                                    </div>
                                  </RadioGroup>
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setSelectedItems((prev) => {
                                      if (!selectedFloor) return prev;
                                      const items = (
                                        prev[selectedFloor] || []
                                      ).filter(
                                        (i) => i.compositeKey !== compositeKey,
                                      );
                                      return {
                                        ...prev,
                                        [selectedFloor]: items,
                                      };
                                    });
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Select a category to view items
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t">
          {/* Validation message */}
          {Object.values(selectedItems)
            .flat()
            .some((item) => item.quantity <= 0 || item.stockyard_id === null) &&
            Object.values(selectedItems).flat().length > 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please ensure all selected items have quantity &gt; 0 and
                  stockyard selected
                </AlertDescription>
              </Alert>
            )}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <Button variant="outline" onClick={resetSelection}>
              Reset Selection
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  Object.values(selectedItems).flat().length === 0 ||
                  Object.values(selectedItems)
                    .flat()
                    .some(
                      (item) =>
                        item.quantity <= 0 || item.stockyard_id === null,
                    )
                }
                className="flex-1 sm:flex-none"
              >
                Save Selection
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
