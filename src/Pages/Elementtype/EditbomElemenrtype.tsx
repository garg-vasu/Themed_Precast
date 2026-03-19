import { apiClient } from "@/utils/apiClient";
import axios, { AxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

// ─── Types ───────────────────────────────────────────────────────────

export type Elementtype = {
  id: number;
  quantity: number;
  production_count: number;
  stockyard_count: number;
  dispatch_count: number;
  erection_count: number;
  floor_name: string;
  tower_name: string;
  hierarchy_id: number;
  project_id: number;
  element_type_name: string;
  element_type: string;
  element_type_version: string;
  element_type_id: number;
  thickness: number;
  length: number;
  height: number;
  weight: number;
  created_by: string;
  created_at: string;
  update_at: string;
  in_request_count: number;
};

export type Bom = {
  bom_id: number;
  bom_name: string;
  bom_type: string;
  unit: string;
  created_at: string;
  updated_at: string;
  project_id: number;
  rate: number;
  name_id: string;
  vendor: null;
};

type BomQuantityEntry = {
  bom_id: number;
  quantity: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────

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

const STEPS = [
  {
    label: "Select Element Types",
    description: "Choose one or more element types",
  },
  { label: "Select BOMs", description: "Choose BOMs to assign" },
  { label: "Set Quantities", description: "Enter quantity for each BOM" },
];

// ─── Component ───────────────────────────────────────────────────────

export default function EditbomElemenrtype() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  // Data
  const [elementTypes, setElementTypes] = useState<Elementtype[]>([]);
  const [bomData, setBomData] = useState<Bom[]>([]);
  const [loadingElements, setLoadingElements] = useState(true);
  const [loadingBoms, setLoadingBoms] = useState(true);

  // Selections
  const [selectedElementTypeIds, setSelectedElementTypeIds] = useState<
    Set<number>
  >(new Set());
  const [selectedBomIds, setSelectedBomIds] = useState<Set<number>>(new Set());

  // Quantities: Map<bom_id, quantity> — same for all selected element types
  const [quantities, setQuantities] = useState<Map<number, number>>(new Map());

  // UI state
  const [currentStep, setCurrentStep] = useState(0);
  const [searchElement, setSearchElement] = useState("");
  const [searchBom, setSearchBom] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [passProduction, setPassProduction] = useState(true);

  // ── Fetch element types ────────────────────────────────────────────
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchElementTypes = async () => {
      try {
        setLoadingElements(true);
        const response = await apiClient.get(
          `/elementtype_fetch/${projectId}`,
          { cancelToken: source.token },
        );

        if (response.status === 200) {
          setElementTypes(response.data.data ?? []);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch element types",
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "element type data"));
        }
      } finally {
        setLoadingElements(false);
      }
    };

    if (projectId) {
      fetchElementTypes();
    }

    return () => {
      source.cancel();
    };
  }, [projectId]);

  // ── Fetch BOMs ─────────────────────────────────────────────────────
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchBoms = async () => {
      try {
        setLoadingBoms(true);
        const response = await apiClient.get(
          `/fetch_bom_products/${projectId}`,
          { cancelToken: source.token },
        );

        if (response.status === 200) {
          setBomData(response.data ?? []);
        } else {
          toast.error(response.data?.message || "Failed to fetch BOMs");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "BOM data"));
        }
      } finally {
        setLoadingBoms(false);
      }
    };

    if (projectId) {
      fetchBoms();
    }

    return () => {
      source.cancel();
    };
  }, [projectId]);

  // ── Filtered lists ─────────────────────────────────────────────────
  const filteredElements = useMemo(() => {
    if (!searchElement.trim()) return elementTypes;
    const q = searchElement.toLowerCase();
    return elementTypes.filter(
      (e) =>
        e.element_type.toLowerCase().includes(q) ||
        e.element_type_name.toLowerCase().includes(q) ||
        e.tower_name?.toLowerCase().includes(q) ||
        e.floor_name?.toLowerCase().includes(q),
    );
  }, [elementTypes, searchElement]);

  const filteredBoms = useMemo(() => {
    if (!searchBom.trim()) return bomData;
    const q = searchBom.toLowerCase();
    return bomData.filter(
      (b) =>
        b.bom_name.toLowerCase().includes(q) ||
        b.bom_type.toLowerCase().includes(q),
    );
  }, [bomData, searchBom]);

  // ── Selection handlers ─────────────────────────────────────────────
  const toggleElementType = (id: number) => {
    setSelectedElementTypeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllElements = (checked: boolean) => {
    if (checked) {
      setSelectedElementTypeIds(
        new Set(filteredElements.map((e) => e.element_type_id)),
      );
    } else {
      setSelectedElementTypeIds(new Set());
    }
  };

  const toggleBom = (id: number) => {
    setSelectedBomIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllBoms = (checked: boolean) => {
    if (checked) {
      setSelectedBomIds(new Set(filteredBoms.map((b) => b.bom_id)));
    } else {
      setSelectedBomIds(new Set());
    }
  };

  // ── Quantity handlers ──────────────────────────────────────────────
  const initializeQuantities = () => {
    const newQuantities = new Map<number, number>();
    selectedBomIds.forEach((bomId) => {
      // Preserve existing quantity if any
      const existing = quantities.get(bomId);
      newQuantities.set(bomId, existing ?? 1);
    });
    setQuantities(newQuantities);
  };

  const updateQuantity = (bomId: number, value: number) => {
    setQuantities((prev) => {
      const next = new Map(prev);
      next.set(bomId, Math.max(0, value));
      return next;
    });
  };

  // ── Navigation ─────────────────────────────────────────────────────
  const canGoNext = () => {
    if (currentStep === 0) return selectedElementTypeIds.size > 0;
    if (currentStep === 1) return selectedBomIds.size > 0;
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Moving to step 3: initialize quantities
      initializeQuantities();
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // ── Validation ─────────────────────────────────────────────────────
  const validateQuantities = (): boolean => {
    let valid = true;
    quantities.forEach((qty) => {
      if (qty <= 0 || isNaN(qty)) {
        valid = false;
      }
    });
    return valid;
  };

  // ── Submit ─────────────────────────────────────────────────────────
  // Opens the confirmation dialog instead of submitting directly
  const handleSubmitClick = () => {
    if (!validateQuantities()) {
      toast.error("Please enter a valid quantity (> 0) for every BOM item.");
      return;
    }
    setShowConfirmDialog(true);
  };

  // Actually submits after user confirms in the dialog
  const handleConfirmSubmit = async () => {
    // Build BOM array from the per-BOM quantities
    const bom: BomQuantityEntry[] = [];
    quantities.forEach((qty, bomId) => {
      bom.push({ bom_id: bomId, quantity: qty });
    });

    // Build flat payload with element type IDs as string array
    const payload = {
      elementtypeid: Array.from(selectedElementTypeIds).map(String),
      bom,
      update_all: passProduction,
    };

    try {
      setSubmitting(true);
      setShowConfirmDialog(false);
      const response = await apiClient.post(
        `/assign_bom_elementtype/${projectId}`,
        payload,
      );

      if (response.status === 200 || response.status === 201) {
        toast.success("BOM assignments saved successfully!");
        navigate(`/project/${projectId}/element-type`);
      } else {
        toast.error(
          response.data?.message || "Failed to save BOM assignments.",
        );
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "save BOM assignments"));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Lookup helpers ─────────────────────────────────────────────────

  const getBomName = (id: number) => {
    const b = bomData.find((bom) => bom.bom_id === id);
    return b ? b.bom_name : `BOM ${id}`;
  };

  const getBomUnit = (id: number) => {
    const b = bomData.find((bom) => bom.bom_id === id);
    return b?.unit ?? "";
  };

  // ── Loading skeleton ───────────────────────────────────────────────
  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );

  // ── Step indicator ─────────────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-1 sm:gap-3 mb-6">
      {STEPS.map((step, idx) => {
        const isActive = idx === currentStep;
        const isCompleted = idx < currentStep;
        return (
          <div key={idx} className="flex items-center gap-1 sm:gap-2">
            {idx > 0 && (
              <div
                className={`hidden sm:block h-px w-6 lg:w-12 ${
                  isCompleted ? "bg-primary" : "bg-border"
                }`}
              />
            )}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div
                className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}>
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </div>
              <div className="hidden md:block">
                <p
                  className={`text-xs sm:text-sm font-medium leading-tight ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}>
                  {step.label}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════════

  return (
    <div className="w-full p-4">
      {/* Header */}
      <PageHeader title="Bulk BOM Update" />

      <StepIndicator />

      {/* ──── STEP 1: Select Element Types ──────────────────────────── */}
      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Element Types</CardTitle>
            <CardDescription>
              Choose the element types you want to assign BOMs to.
              <Badge variant="secondary" className="ml-2">
                {selectedElementTypeIds.size} selected
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search element types..."
              value={searchElement}
              onChange={(e) => setSearchElement(e.target.value)}
            />

            {loadingElements ? (
              <LoadingSkeleton />
            ) : filteredElements.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No element types found.
              </div>
            ) : (
              <>
                {/* Select all */}
                <div className="flex items-center gap-2 py-2 px-3 rounded-md bg-muted/50">
                  <Checkbox
                    id="select-all-elements"
                    checked={
                      filteredElements.length > 0 &&
                      filteredElements.every((e) =>
                        selectedElementTypeIds.has(e.element_type_id),
                      )
                    }
                    onCheckedChange={(checked) => toggleAllElements(!!checked)}
                  />
                  <Label
                    htmlFor="select-all-elements"
                    className="cursor-pointer text-sm font-medium">
                    Select All ({filteredElements.length})
                  </Label>
                </div>

                <ScrollArea className="h-[360px] sm:h-[420px]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {filteredElements.map((et) => {
                      const isChecked = selectedElementTypeIds.has(
                        et.element_type_id,
                      );
                      return (
                        <div
                          key={et.element_type_id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50 ${
                            isChecked
                              ? "border-primary bg-primary/5"
                              : "border-border"
                          }`}
                          onClick={() => toggleElementType(et.element_type_id)}>
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() =>
                              toggleElementType(et.element_type_id)
                            }
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {et.element_type}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {et.element_type_name}
                            </p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {et.tower_name && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0">
                                  {et.tower_name}
                                </Badge>
                              )}
                              {et.floor_name && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0">
                                  {et.floor_name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ──── STEP 2: Select BOMs ───────────────────────────────────── */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select BOMs</CardTitle>
            <CardDescription>
              Choose BOMs to assign to the {selectedElementTypeIds.size}{" "}
              selected element type(s).
              <Badge variant="secondary" className="ml-2">
                {selectedBomIds.size} selected
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search BOMs by name or type..."
              value={searchBom}
              onChange={(e) => setSearchBom(e.target.value)}
            />

            {loadingBoms ? (
              <LoadingSkeleton />
            ) : filteredBoms.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No BOMs found.
              </div>
            ) : (
              <>
                {/* Select all */}
                <div className="flex items-center gap-2 py-2 px-3 rounded-md bg-muted/50">
                  <Checkbox
                    id="select-all-boms"
                    checked={
                      filteredBoms.length > 0 &&
                      filteredBoms.every((b) => selectedBomIds.has(b.bom_id))
                    }
                    onCheckedChange={(checked) => toggleAllBoms(!!checked)}
                  />
                  <Label
                    htmlFor="select-all-boms"
                    className="cursor-pointer text-sm font-medium">
                    Select All ({filteredBoms.length})
                  </Label>
                </div>

                <ScrollArea className="h-[360px] sm:h-[420px]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {filteredBoms.map((bom) => {
                      const isChecked = selectedBomIds.has(bom.bom_id);
                      return (
                        <div
                          key={bom.bom_id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50 ${
                            isChecked
                              ? "border-primary bg-primary/5"
                              : "border-border"
                          }`}
                          onClick={() => toggleBom(bom.bom_id)}>
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleBom(bom.bom_id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {bom.bom_name}
                            </p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0">
                                {bom.bom_type}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0">
                                {bom.unit}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ──── STEP 3: Set Quantities ────────────────────────────────── */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Set Quantities</CardTitle>
            <CardDescription>
              Enter the quantity for each BOM. These quantities will apply to
              all {selectedElementTypeIds.size} selected element type(s).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <ScrollArea className="h-[400px] sm:h-[480px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pr-3">
                {Array.from(selectedBomIds).map((bomId) => {
                  const qty = quantities.get(bomId) ?? 1;
                  const unit = getBomUnit(bomId);
                  return (
                    <div
                      key={bomId}
                      className="flex flex-col gap-1.5 p-3 rounded-lg border bg-muted/30">
                      <Label className="text-sm font-medium truncate">
                        {getBomName(bomId)}
                      </Label>
                      {unit && (
                        <span className="text-xs text-muted-foreground">
                          Unit: {unit}
                        </span>
                      )}
                      <Input
                        type="number"
                        min={1}
                        value={qty}
                        onChange={(e) =>
                          updateQuantity(bomId, parseFloat(e.target.value) || 0)
                        }
                        className="mt-1"
                        placeholder="Qty"
                      />
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* ──── Bottom navigation bar ─────────────────────────────────── */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t">
        <Button
          variant="outline"
          disabled={currentStep === 0}
          onClick={handleBack}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          {/* Summary badges */}
          {selectedElementTypeIds.size > 0 && (
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {selectedElementTypeIds.size} element type(s)
            </Badge>
          )}
          {selectedBomIds.size > 0 && (
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {selectedBomIds.size} BOM(s)
            </Badge>
          )}
        </div>

        {currentStep < STEPS.length - 1 ? (
          <Button disabled={!canGoNext()} onClick={handleNext}>
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            disabled={submitting || !validateQuantities()}
            onClick={handleSubmitClick}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-1" />
                Submit
              </>
            )}
          </Button>
        )}
      </div>

      {/* ──── Confirmation Dialog with Pass Production Switch ──────── */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm BOM Assignment</DialogTitle>
            <DialogDescription>
              Choose whether to pass all elements into production or not before
              submitting.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center gap-4 rounded-lg border p-4 my-2">
            <Label
              htmlFor="pass-production-switch"
              className={`text-sm font-medium cursor-pointer transition-colors ${
                passProduction ? "text-foreground" : "text-muted-foreground"
              }`}
              onClick={() => setPassProduction(true)}>
              Apply on all element type
            </Label>
            <Switch
              id="pass-production-switch"
              checked={!passProduction}
              onCheckedChange={(checked) => setPassProduction(!checked)}
            />
            <Label
              htmlFor="pass-production-switch"
              className={`text-sm font-medium cursor-pointer transition-colors ${
                !passProduction ? "text-foreground" : "text-muted-foreground"
              }`}
              onClick={() => setPassProduction(false)}>
              Element which pass the production cycle
            </Label>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Confirm & Submit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
