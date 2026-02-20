import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { Plus, Check, Search, X } from "lucide-react";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/utils/apiClient";
import { useProject } from "@/Provider/ProjectProvider";
import PageHeader from "@/components/ui/PageHeader";

export type Bom = {
  master_bom_id: number;
  bom_name: string;
  bom_type: string;
  unit: string;
};

export type alreadySelectedBom = {
  bom_id: number;
  bom_name: string;
  bom_type: string;
  unit: string;
  created_at: string;
  updated_at: string;
  project_id: number;
  name_id: string;
  vendor: null;
  master_bom_id: number;
};

interface NewBomForm {
  bom_name: string;
  bom_type: string;
  unit: string;
}

interface FormErrors {
  bom_name?: string;
  bom_type?: string;
  unit?: string;
}

const getErrorMessage = (
  error: AxiosError | unknown,
  context: string
): string => {
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
    return error.response?.data?.message || `Failed to ${context}.`;
  }

  return "An unexpected error occurred. Please try again later.";
};

export default function LargeImport() {
  type ExistingBom = Bom;
  type NewCreatedBom = {
    temp_id: number;
    bom_name: string;
    bom_type: string;
    unit: string;
  };
  type SelectedBom = ExistingBom | NewCreatedBom;
  const { projectId } = useParams<{ projectId: string }>();
  const { markSetupStepDone } = useProject();
  const [alreadySelectedBoms, setAlreadySelectedBoms] = useState<
    alreadySelectedBom[]
  >([]);
  const navigate = useNavigate();
  const [bomList, setBomList] = useState<ExistingBom[]>([]);
  const [masterBomList, setMasterBomList] = useState<ExistingBom[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedBoms, setSelectedBoms] = useState<SelectedBom[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newBom, setNewBom] = useState<NewBomForm>({
    bom_name: "",
    bom_type: "",
    unit: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  // Helper: filter available master BOMs by removing already-selected ones
  const filterAvailableBoms = (
    master: ExistingBom[],
    selected: alreadySelectedBom[]
  ): ExistingBom[] => {
    if (!Array.isArray(master) || !Array.isArray(selected)) return master;
    const selectedIds = new Set(selected.map((s) => s.master_bom_id));
    return master.filter((m) => !selectedIds.has(m.master_bom_id));
  };

  // Load data in the correct order: fetch already-selected first, then master, then filter.
  useEffect(() => {
    const loadBoms = async () => {
      try {
        setLoading(true);
        // 1) Fetch already-selected for the project
        const selectedRes = await apiClient.get(
          `/fetch_bom_products/${projectId}`
        );
        const selected: alreadySelectedBom[] = Array.isArray(selectedRes.data)
          ? selectedRes.data
          : [];
        setAlreadySelectedBoms(selected);

        // 2) Fetch master list
        const masterRes = await apiClient.get("/get_bom_master_products");
        const master: ExistingBom[] = Array.isArray(masterRes.data)
          ? masterRes.data
          : [];
        setMasterBomList(master);

        // 3) Filter master against selected (works even if selected is empty)
        const filtered = filterAvailableBoms(master, selected);
        setBomList(filtered);
      } catch (error) {
        console.error("Error loading BOM data:", error);
        toast.error(
          getErrorMessage(error as AxiosError | unknown, "fetch BOM data")
        );
      } finally {
        setLoading(false);
      }
    };

    loadBoms();
  }, [projectId]);

  const handleBomSelect = (bom: ExistingBom) => {
    setSelectedBoms((prev) => [...prev, bom]);
    setBomList((prev) =>
      prev.filter((item) => item.master_bom_id !== bom.master_bom_id)
    );
  };

  // Re-filter if either list changes (e.g., user deselects/changes) but keep raw master list intact
  useEffect(() => {
    setBomList(filterAvailableBoms(masterBomList, alreadySelectedBoms));
  }, [masterBomList, alreadySelectedBoms]);

  // Handle BOM deselection (move back to first column)
  const handleBomDeselect = (bom: SelectedBom) => {
    setSelectedBoms((prev) =>
      prev.filter((item) => {
        if ("master_bom_id" in bom && "master_bom_id" in item) {
          return item.master_bom_id !== bom.master_bom_id;
        }
        if ("temp_id" in bom && "temp_id" in item) {
          return item.temp_id !== bom.temp_id;
        }
        return true;
      })
    );
    if ("master_bom_id" in bom) {
      setBomList((prev) =>
        [...prev, bom].sort((a, b) => a.bom_name.localeCompare(b.bom_name))
      );
    }
  };

  // Filter available BOMs based on search term
  const filteredBomList = bomList.filter((bom) =>
    bom.bom_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!newBom.bom_name.trim()) {
      errors.bom_name = "Product name is required";
    }
    if (!newBom.bom_type.trim()) {
      errors.bom_type = "Product type is required";
    }
    if (!newBom.unit.trim()) {
      errors.unit = "Unit is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (
    field: keyof NewBomForm,
    value: string | number
  ) => {
    setNewBom((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // Add new BOM to the list
  const handleAddBom = () => {
    if (!validateForm()) {
      return;
    }

    const newBomItem: NewCreatedBom = {
      temp_id: Date.now(),
      bom_name: newBom.bom_name.trim(),
      bom_type: newBom.bom_type.trim(),
      unit: newBom.unit.trim(),
    };

    // Add the new BOM directly to selected BOMs
    setSelectedBoms((prev) => [...prev, newBomItem]);

    // Reset form
    setNewBom({
      bom_name: "",
      bom_type: "",
      unit: "",
    });
    setFormErrors({});
    setShowAddForm(false);

    // Clear search to show the newly added BOM in selected list
    setSearchTerm("");
  };

  // Save handler - console log a single merged array
  const handleSave = async () => {
    const existingSelected = selectedBoms.filter(
      (b): b is ExistingBom => "master_bom_id" in b
    );
    const newlyCreatedSelected = selectedBoms.filter(
      (b): b is NewCreatedBom => "temp_id" in b
    );

    const mergedSelection = [
      ...existingSelected,
      ...newlyCreatedSelected.map(({ bom_name, bom_type, unit }) => ({
        bom_name,
        bom_type,
        unit,
      })),
    ];

    const project_id = Number(projectId);
    const payload = mergedSelection.map((item) => ({
      ...item,
      project_id,
    }));

    try {
      const response = await apiClient.post("/create_bom_products", payload);
      if (response.status === 200 || response.status === 201) {
        toast.success("BOM products created successfully");
        markSetupStepDone("is_bom");
        navigate(`/project/${projectId}/bom`);
      } else {
        toast.error(response.data?.message || "Error creating BOM products");
      }
    } catch (error) {
      console.error("Error creating BOM products:", error);
      toast.error(
        getErrorMessage(error as AxiosError | unknown, "create BOM products")
      );
    }
  };

  // Update unit for a selected BOM
  const handleUnitChange = (bom: SelectedBom, unitValue: string) => {
    setSelectedBoms((prev) =>
      prev.map((item) => {
        if ("master_bom_id" in bom && "master_bom_id" in item) {
          return item.master_bom_id === bom.master_bom_id
            ? { ...item, unit: unitValue }
            : item;
        }
        if ("temp_id" in bom && "temp_id" in item) {
          return item.temp_id === bom.temp_id
            ? { ...item, unit: unitValue }
            : item;
        }
        return item;
      })
    );
  };

  // Reset form
  const handleResetForm = () => {
    setNewBom({
      bom_name: "",
      bom_type: "",
      unit: "",
    });
    setFormErrors({});
    setShowAddForm(false);
  };
  return (
    <>
      <div className="w-full py-4 px-4">
        <PageHeader title="Add BOM" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {/* First Column - Available BOMs */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-foreground">
                Available BOMs ({bomList.length})
              </h3>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                variant="outline"
                size="sm"
                className="h-7 px-2"
              >
                <Plus className="mr-1 h-3 w-3" />
                {showAddForm ? "Cancel" : "Add BOM"}
              </Button>
            </div>
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search BOMs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8"
              />
            </div>

            {/* Add New BOM Form */}
            {showAddForm && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-foreground">
                    Add New BOM (Auto-Selected)
                    <Button
                      onClick={handleResetForm}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="rounded bg-muted text-muted-foreground">
                    💡 New BOMs will be automatically added to the "Selected
                    BOMs" list
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="product_name">Product Name *</Label>
                      <Input
                        id="product_name"
                        placeholder="e.g., Steel"
                        value={newBom.bom_name}
                        onChange={(e) =>
                          handleInputChange("bom_name", e.target.value)
                        }
                        className={`h-7 ${
                          formErrors.bom_name ? "border-destructive" : ""
                        }`}
                      />
                      {formErrors.bom_name && (
                        <p className="text-destructive">
                          {formErrors.bom_name}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="product_type">Product Type *</Label>
                      <Input
                        id="product_type"
                        placeholder="e.g., 12MM"
                        value={newBom.bom_type}
                        onChange={(e) =>
                          handleInputChange("bom_type", e.target.value)
                        }
                        className={`h-7 ${
                          formErrors.bom_type ? "border-destructive" : ""
                        }`}
                      />
                      {formErrors.bom_type && (
                        <p className="text-destructive">
                          {formErrors.bom_type}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="unit">Unit *</Label>
                      <Input
                        id="unit"
                        placeholder="e.g., KG"
                        value={newBom.unit}
                        onChange={(e) =>
                          handleInputChange("unit", e.target.value)
                        }
                        className={`h-7 ${
                          formErrors.unit ? "border-destructive" : ""
                        }`}
                      />
                      {formErrors.unit && (
                        <p className="text-destructive">{formErrors.unit}</p>
                      )}
                    </div>
                    {/* <div className="space-y-1">
                      <Label htmlFor="rate" className="text-xs font-medium">
                        Rate *
                      </Label>
                      <Input
                        id="rate"
                        type="number"
                        placeholder="e.g., 234"
                        value={newBom.rate || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "rate",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className={`h-7 text-xs ${
                          formErrors.rate ? "border-red-500" : ""
                        }`}
                      />
                      {formErrors.rate && (
                        <p className="text-xs text-red-500">
                          {formErrors.rate}
                        </p>
                      )}
                    </div> */}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddBom}
                      size="sm"
                      className="h-7 px-3"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add & Select BOM
                    </Button>
                    <Button
                      onClick={handleResetForm}
                      variant="outline"
                      size="sm"
                      className="h-7 px-3"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="max-h-[250px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="text-muted-foreground">Loading BOMs...</div>
                </div>
              ) : filteredBomList.length === 0 ? (
                <div className="flex items-center justify-center">
                  <div className="text-muted-foreground">
                    {searchTerm
                      ? "No BOMs found matching your search"
                      : "No BOMs available"}
                  </div>
                </div>
              ) : (
                <CardContent className="space-y-1">
                  {filteredBomList.map((bom) => (
                    <button
                      key={bom.master_bom_id}
                      type="button"
                      className="group focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground flex w-full cursor-pointer items-center gap-2 rounded-sm p-2 text-left outline-none"
                      onClick={() => handleBomSelect(bom)}
                    >
                      <Checkbox
                        id={bom.master_bom_id.toString()}
                        className="group-hover:border-accent group-hover:bg-accent/10 data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                      />
                      <span className="leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {bom.bom_name} ({bom.bom_type})
                      </span>
                    </button>
                  ))}
                </CardContent>
              )}
            </Card>
          </div>

          {/* Second Column - Selected BOMs */}
          <div className="flex flex-col gap-2">
            <h3 className="text-foreground">
              Selected BOMs ({selectedBoms.length})
            </h3>
            <Card className="max-h-[300px] overflow-y-auto">
              {selectedBoms.length === 0 ? (
                <div className="flex items-center justify-center">
                  <div className="text-muted-foreground">No BOMs selected</div>
                </div>
              ) : (
                <CardContent className="space-y-1">
                  {selectedBoms.map((bom) => {
                    const isExisting = "master_bom_id" in bom;
                    const key = isExisting
                      ? `existing-${bom.master_bom_id}`
                      : `new-${(bom as NewCreatedBom).temp_id}`;
                    const checkboxId = isExisting
                      ? `selected-${bom.master_bom_id}`
                      : `selected-new-${(bom as NewCreatedBom).temp_id}`;
                    return (
                      <div
                        key={key}
                        className="flex cursor-pointer items-center justify-between gap-2 rounded p-0.5"
                        onClick={() => handleBomDeselect(bom)}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox id={checkboxId} checked={true} />
                          <label
                            htmlFor={checkboxId}
                            className="flex cursor-pointer items-center gap-2 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {bom.bom_name} ({bom.bom_type})
                            <Check className="h-4 w-4 text-primary" />
                          </label>
                        </div>
                        <div
                          className="ml-auto flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Label className="text-muted-foreground">Unit</Label>
                          <Input
                            value={bom.unit}
                            onChange={(e) =>
                              handleUnitChange(bom, e.target.value)
                            }
                            className="h-7 w-24"
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} className="h-8 px-3">
            Save Selection
          </Button>
        </div>
        {/* Already Selected BOMs (from server) */}
        <div className="flex flex-col gap-2">
          <h3 className="text-foreground">
            Already Selected BOMs ({alreadySelectedBoms.length})
          </h3>
          <Card className="h-full overflow-y-auto">
            {alreadySelectedBoms.length === 0 ? (
              <div className="flex items-center justify-center">
                <div className="text-muted-foreground">
                  No BOMs selected yet
                </div>
              </div>
            ) : (
              <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                {alreadySelectedBoms.map((bom) => (
                  <div
                    key={`already-${bom.master_bom_id}-${bom.bom_type}`}
                    className="flex items-center justify-between rounded bg-muted p-2"
                  >
                    <div className="truncate text-foreground">
                      {bom.bom_name} ({bom.bom_type})
                    </div>
                    <div className="ml-2 mr-4 flex-shrink-0 text-muted-foreground">
                      Unit: {bom.unit}
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
