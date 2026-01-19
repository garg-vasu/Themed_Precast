import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { Check, FileText, Info, Loader2, Upload } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { apiClient } from "@/utils/apiClient";

// UI Components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Custom Components
import MultiBom, { type Product } from "@/components/Multibom/MultiBom";
import MultiFloor, { type Structure } from "@/components/MultiFloor/MultiFloor";
import { toast } from "sonner";

/* ------------------------------------------------------------------
   Types & Schema (for type inference only)
-------------------------------------------------------------------*/
export type DrawingType = {
  drawings_type_id: number;
  drawing_type_name: string;
  project_id: number;
};

export type ColumnLayout = {
  id: number;
  name: string;
  production_quantity: number;
  qc_quantity: number;
  project_id: number;
  assigned_to: number;
  qc_assign: boolean;
  qc_id: number;
  paper_id: number;
  template_id: number;
  order: number;
  completion_stage: boolean;
  inventory_deduction: boolean;
  status: string;
  qc_status: string;
  editable: string | boolean;
  qc_editable: string | boolean;
  quantity: number;
};

export type FormData = {
  element_type_name: string;
  element_type: string;
  height: number;

  length: number;
  thickness: number;
  Area: number;
  Volume: number;
  Mass: number;
  Width: number;
  drawings: Array<{
    current_version: string;
    drawing_type_id: number;
    comments: string;
    file: string;
  }>;
  products: Array<{
    product_id: number;
    quantity: number;
  }>;
  hierarchy_quantity: Array<{
    hierarchy_id: number;
    quantity: number;
  }>;
  stages: Array<{
    stages_id: number;
    order: number;
  }>;
};

interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

/* ------------------------------------------------------------------
   Stages Definition
-------------------------------------------------------------------*/

/* ------------------------------------------------------------------
   Main Component
-------------------------------------------------------------------*/
export default function AddElementType() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [column, setColumn] = useState<ColumnLayout[]>([]);

  const apiUrl = import.meta.env.VITE_API_URL;
  const buildFileUrl = (fileName: string | undefined): string => {
    if (!fileName) return "";
    if (!apiUrl) return fileName;
    return `${apiUrl}/get-file?file=${encodeURIComponent(fileName)}`;
  };

  const isImageFile = (fileNameOrType: string | undefined) => {
    if (!fileNameOrType) return false;
    const v = fileNameOrType.toLowerCase();
    return (
      v.startsWith("image/") ||
      v.endsWith(".png") ||
      v.endsWith(".jpg") ||
      v.endsWith(".jpeg") ||
      v.endsWith(".webp") ||
      v.endsWith(".gif")
    );
  };

  // State management
  const [loading, setLoading] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState<Record<number, boolean>>(
    {}
  );
  const [drawingPreviews, setDrawingPreviews] = useState<
    Record<number, string>
  >({});

  const [activeTab, setActiveTab] = useState("element-info");
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [allDrawingTypes, setAllDrawingTypes] = useState<DrawingType[]>([]);
  const [structureData, setStructureData] = useState<Structure[]>([]);
  const [selectedStructures, setSelectedStructures] = useState<Structure[]>([]);
  const [bomData, setBomData] = useState<Product[]>([]);
  const [selectedBom, setSelectedBom] = useState<Product[]>([]);

  // Form setup – using shouldUnregister: false to persist data across tab changes.
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    trigger,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      element_type_name: "",
      element_type: "",
      height: 0,
      length: 0,
      Area: 0,
      Volume: 0,
      Mass: 0,
      Width: 0,
      thickness: 0,
      drawings: [],
      products: [],
      hierarchy_quantity: [],
      stages: [],
    },
    mode: "onChange",
    shouldUnregister: false,
  });

  const watchedValues = watch();
  const hasAnyCompleteDrawing =
    watchedValues.drawings?.some((d) => d?.current_version && d?.file) ?? false;

  const tabOrder = ["element-info", "structure", "bom", "drawings"] as const;
  type TabKey = (typeof tabOrder)[number];

  const [attemptedTabs, setAttemptedTabs] = useState<Record<TabKey, boolean>>({
    "element-info": false,
    structure: false,
    bom: false,
    drawings: false,
  });

  const validateTab = async (tab: TabKey): Promise<boolean> => {
    setAttemptedTabs((prev) => ({ ...prev, [tab]: true }));

    if (tab === "element-info") {
      const ok = await trigger([
        "element_type_name",
        "element_type",
        "height",
        "Area",
        "Volume",
        "Mass",
        "Width",
      ]);
      return ok;
    }

    if (tab === "structure") {
      if (selectedStructures.length === 0) {
        setError("hierarchy_quantity", {
          type: "manual",
          message: "Select at least one floor",
        });
        return false;
      }
      clearErrors("hierarchy_quantity");

      const qtyFields = selectedStructures.map(
        (_, index) => `hierarchy_quantity.${index}.quantity` as const
      );
      const ok = await trigger(qtyFields as any);
      return ok;
    }

    if (tab === "bom") {
      if (selectedBom.length === 0) {
        setError("products", {
          type: "manual",
          message: "Select at least one product",
        });
        return false;
      }
      clearErrors("products");

      const qtyFields = selectedBom.map(
        (_, index) => `products.${index}.quantity` as const
      );
      const ok = await trigger(qtyFields as any);
      return ok;
    }

    // drawings
    let ok = true;
    const values = getValues();
    const hasValidDrawing = values.drawings?.some(
      (d) => d?.current_version && d?.file
    );
    if (selectedStages.length === 0) {
      ok = false;
    }
    if (!hasValidDrawing) {
      ok = false;
    }
    // Validate conditional rules inside drawings (e.g. version when file is present)
    const drawingFields = allDrawingTypes.map(
      (_, index) => `drawings.${index}.current_version` as const
    );
    const triggerOk = await trigger(drawingFields as any);
    return ok && triggerOk;
  };

  const handleNextTab = async (nextTab: TabKey) => {
    const ok = await validateTab(activeTab as TabKey);
    if (ok) setActiveTab(nextTab);
  };

  const handleTabChange = async (next: string) => {
    const nextTab = next as TabKey;
    const currentIdx = tabOrder.indexOf(activeTab as TabKey);
    const nextIdx = tabOrder.indexOf(nextTab);

    // Always allow going backwards
    if (nextIdx <= currentIdx) {
      setActiveTab(nextTab);
      return;
    }

    const ok = await validateTab(activeTab as TabKey);
    if (ok) setActiveTab(nextTab);
  };

  /* ------------------------------------------------------------------
     Data Fetching
  -------------------------------------------------------------------*/
  useEffect(() => {
    const pid = projectId ? Number(projectId) : undefined;
    if (!pid) return;

    Promise.all([
      fetchStructureData(pid),
      fetchBomData(pid),
      fetchAllDrawingTypes(pid),
      fetchColumn(pid),
    ])
      .then(() => setLoading(false))
      .catch((error) => {
        console.error("Error initializing data:", error);
        setLoading(false);
      });
  }, [projectId]);

  const fetchColumn = async (pid: number) => {
    try {
      setLoading(true);
      const response = await apiClient.get<ApiResponse<ColumnLayout[]>>(
        `/get_allstages/${pid}`
      );
      if (Array.isArray(response.data?.data)) {
        setColumn(response.data.data);
      } else if (Array.isArray(response.data as any)) {
        // Fallback if API returns a bare array
        setColumn(response.data as any);
      }
    } catch (error) {
      console.error("Error fetching project data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStructureData = async (pid: number) => {
    try {
      const res = await apiClient.get<ApiResponse<Structure[]>>(
        `/get_precast_project/${pid}`
      );
      const payload = (res.data as any)?.data ?? res.data;
      if (Array.isArray(payload)) {
        setStructureData(payload);
      } else {
        setStructureData([]);
      }
    } catch (error) {
      console.error("Error fetching structure data:", error);
    }
  };

  const fetchBomData = async (pid: number) => {
    try {
      const res = await apiClient.get<ApiResponse<Product[]>>(
        `/fetch_bom_products/${pid}`
      );
      const payload = (res.data as any)?.data ?? res.data;
      setBomData(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error("Error fetching BOM data:", error);
    }
  };

  const fetchAllDrawingTypes = async (pid: number) => {
    try {
      const res = await apiClient.get<ApiResponse<DrawingType[]>>(
        `/drawingtype/${pid}`
      );
      const payload = (res.data as any)?.data ?? res.data;
      setAllDrawingTypes(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error("Error fetching all drawing types:", error);
      setAllDrawingTypes([]);
    }
  };

  /* ------------------------------------------------------------------
     Stage Selection & Drawing Types
  -------------------------------------------------------------------*/
  const sortStagesByOrder = useCallback(
    (stages: string[]) => {
      return [...stages].sort((a, b) => {
        const stageA = column.find((s) => s.name === a);
        const stageB = column.find((s) => s.name === b);
        return (
          (stageA?.order ?? Number.MAX_SAFE_INTEGER) -
          (stageB?.order ?? Number.MAX_SAFE_INTEGER)
        );
      });
    },
    [column]
  );

  const handleStageToggle = useCallback(
    (stageLabel: string) => {
      const stage = column.find((s) => s.name === stageLabel);
      if (stage) {
        setSelectedStages((prev) => {
          const nextStages = prev.includes(stage.name)
            ? prev.filter((s) => s !== stage.name)
            : [...prev, stage.name];
          return sortStagesByOrder(nextStages);
        });
      }
    },
    [column, sortStagesByOrder]
  );

  useEffect(() => {
    const pid = projectId ? Number(projectId) : undefined;
    if (pid) fetchColumn(pid);
  }, [projectId]);

  /* ------------------------------------------------------------------
     File Upload
  -------------------------------------------------------------------*/
  const handleFileUpload = async (file: File, index: number) => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      setError(`drawings.${index}.file` as any, {
        type: "manual",
        message: "File size must be less than 10MB",
      });
      return;
    }

    setUploadingFiles((prev) => ({ ...prev, [index]: true }));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiClient.post(`/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setValue(`drawings.${index}.file`, res.data.file_name);
      clearErrors(`drawings.${index}.file` as any);

      if (isImageFile(file.type)) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setDrawingPreviews((prev) => ({
            ...prev,
            [index]: reader.result as string,
          }));
        };
        reader.readAsDataURL(file);
      } else {
        setDrawingPreviews((prev) => {
          const next = { ...prev };
          delete next[index];
          return next;
        });
      }
    } catch (error) {
      console.error("File upload failed:", error);
      setError(`drawings.${index}.file` as any, {
        type: "manual",
        message: "File upload failed. Please try again.",
      });
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [index]: false }));
    }
  };

  /* ------------------------------------------------------------------
     Remove Handlers
  -------------------------------------------------------------------*/
  const handleRemoveStructure = (id: number) => {
    setSelectedStructures((prev) => prev.filter((s) => s.id !== id));
  };

  const handleRemoveProduct = (id: number) => {
    setSelectedBom((prev) => prev.filter((p) => p.bom_id !== id));
    const currentProducts = getValues("products") || [];
    const updatedProducts = currentProducts.filter(
      (prod: any) => prod.product_id !== id
    );
    setValue("products", updatedProducts);
  };

  /* ------------------------------------------------------------------
     BOM Data Synchronization
     Merge new selected products with any existing form data to preserve entered quantities.
  -------------------------------------------------------------------*/
  useEffect(() => {
    const currentProducts = getValues("products") || [];
    const mergedProducts = selectedBom.map((product) => {
      const existing = currentProducts.find(
        (p: any) => p.product_id === product.bom_id
      );
      return {
        product_id: product.bom_id,
        quantity: existing ? existing.quantity : 0,
      };
    });
    setValue("products", mergedProducts);
  }, [selectedBom, setValue, getValues]);

  /* ------------------------------------------------------------------
     Form Submission & Data Combination
  -------------------------------------------------------------------*/
  const onSubmit = async (data: FormData) => {
    // If user tries to submit directly, validate the current tab first
    const tabOk = await validateTab(activeTab as TabKey);
    if (!tabOk) return;

    // Validate structure quantities
    const invalidQuantities = data.hierarchy_quantity?.some(
      (item: any) => !item?.quantity || item.quantity < 1
    );

    if (invalidQuantities) {
      setActiveTab("structure");
      setError("hierarchy_quantity", {
        type: "manual",
        message: "All structure quantities must be at least 1",
      });
      return;
    }

    // Validate BOM quantities
    const invalidBomQuantities = data.products?.some(
      (item: any) => !item?.quantity || item.quantity < 1
    );

    if (invalidBomQuantities) {
      setActiveTab("bom");
      setError("products", {
        type: "manual",
        message: "All product quantities must be at least 1",
      });
      return;
    }

    // Validate that at least one drawing type has all required fields
    const hasValidDrawing = data.drawings.some(
      (drawing) => drawing.current_version && drawing.file
    );

    if (!hasValidDrawing) {
      setActiveTab("drawings");
      return;
    }

    // Build stages array using the "order" coming from get_allstages
    // 1. Map selected stage names to their corresponding objects from `column`
    // 2. Sort them by the backend-provided `order` (ascending)
    // 3. Send `stages_id` = stage.id and `order` = stage.order
    const sortedSelectedStages = selectedStages
      .map((stageName) => {
        const stageObj = column.find((s) => s.name === stageName);
        if (!stageObj) {
          console.warn(`No stage found for name: ${stageName}`);
        }
        return stageObj;
      })
      .filter((s): s is ColumnLayout => !!s)
      .sort((a, b) => a.order - b.order);

    const stagesPayload = sortedSelectedStages.map((stage) => ({
      id: stage.id,
      stages_id: stage.id,
      order: stage.order,
    }));

    // Build final data object
    const pid = Number(projectId);
    const finalData = {
      project_id: pid,
      element_type_name: data.element_type_name,
      element_type: data.element_type,
      height: data.height,
      length: data.length,
      thickness: data.thickness,
      drawings: data.drawings.filter((d) => d.current_version && d.file),
      products: data.products,
      hierarchy_quantity: data.hierarchy_quantity,
      stages: stagesPayload,
    };

    try {
      setLoading(true);
      const response = await apiClient.post(`/elementtype_create`, finalData);
      if (response.status === 200) {
        toast.success("Element Type Created Successfully");
        navigate(`/project/${pid}/element`);
      } else {
        toast.error("Failed to create element type");
        navigate(`/project/${pid}/element`);
      }
    } catch (error) {
      console.error("Failed to create element type:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------
     Progress Indicator
  -------------------------------------------------------------------*/
  // Better approach:
  const calculateProgress = () => {
    let completed = 0;
    const totalSteps = 4; // One per tab

    const values = getValues();

    // Element Info - all required fields filled
    if (
      values.element_type_name?.trim() &&
      values.element_type?.trim() &&
      values.height > 0 &&
      values.Area > 0 &&
      values.Volume > 0 &&
      values.Mass > 0 &&
      values.Width > 0
    ) {
      completed++;
    }

    // Structure - has selections with valid quantities
    if (
      selectedStructures.length > 0 &&
      values.hierarchy_quantity?.every((item) => item?.quantity > 0)
    ) {
      completed++;
    }

    // BOM - has selections with valid quantities
    if (
      selectedBom.length > 0 &&
      values.products?.every((item) => item?.quantity > 0)
    ) {
      completed++;
    }

    // Drawings - has at least one complete drawing and stages selected
    if (
      selectedStages.length > 0 &&
      values.drawings?.some((d) => d?.current_version && d?.file)
    ) {
      completed++;
    }

    return Math.round((completed / totalSteps) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-2"
        >
          <Loader2 className="animate-spin text-primary" />
          <span className="sr-only">Loading element type form...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2 py-4 px-4">
        <div className="flex items-center justify-between gap-2">
          <PageHeader title="Add Element Type" />
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </div>
        </div>
        <Separator />

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="element-info">Element Info</TabsTrigger>
              <TabsTrigger value="structure">Structure</TabsTrigger>
              <TabsTrigger value="bom">BOM</TabsTrigger>
              <TabsTrigger value="drawings">Drawings</TabsTrigger>
            </TabsList>

            {/* Element Info Tab */}
            <TabsContent value="element-info">
              <div className="grid gap-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="element_type_name">Element Type Name</Label>
                    <Input
                      id="element_type_name"
                      placeholder="Element Type Name"
                      {...register("element_type_name", {
                        required: "Element type name is required",
                        minLength: {
                          value: 2,
                          message: "Minimum 2 characters required",
                        },
                      })}
                      aria-invalid={!!errors.element_type_name}
                    />
                    <p className="text-destructive min-h-[20px]">
                      {errors.element_type_name?.message || "\u00A0"}
                    </p>
                  </div>

                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="element_type">Element Type</Label>
                    <Input
                      id="element_type"
                      placeholder="Element Type"
                      {...register("element_type", {
                        required: "Element type is required",
                        minLength: {
                          value: 2,
                          message: "Minimum 2 characters required",
                        },
                      })}
                      aria-invalid={!!errors.element_type}
                    />
                    <p className="text-destructive min-h-[20px]">
                      {errors.element_type?.message || "\u00A0"}
                    </p>
                  </div>

                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="height">Height</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="Height"
                      {...register("height", {
                        required: "Height is required",
                        min: {
                          value: 1,
                          message: "Height must be greater than 0",
                        },
                        valueAsNumber: true,
                      })}
                      aria-invalid={!!errors.height}
                    />
                    <p className="text-destructive min-h-[20px]">
                      {errors.height?.message || "\u00A0"}
                    </p>
                  </div>

                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="Area">Area</Label>
                    <Input
                      id="Area"
                      type="number"
                      placeholder="Area"
                      {...register("Area", {
                        required: "Area is required",
                        min: {
                          value: 1,
                          message: "Area must be greater than 0",
                        },
                        valueAsNumber: true,
                      })}
                      aria-invalid={!!errors.Area}
                    />
                    <p className="text-destructive min-h-[20px]">
                      {errors.Area?.message || "\u00A0"}
                    </p>
                  </div>

                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="Volume">Volume</Label>
                    <Input
                      id="Volume"
                      type="number"
                      placeholder="Volume"
                      {...register("Volume", {
                        required: "Volume is required",
                        min: {
                          value: 1,
                          message: "Volume must be greater than 0",
                        },
                        valueAsNumber: true,
                      })}
                      aria-invalid={!!errors.Volume}
                    />
                    <p className="text-destructive min-h-[20px]">
                      {errors.Volume?.message || "\u00A0"}
                    </p>
                  </div>

                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="Mass">Mass</Label>
                    <Input
                      id="Mass"
                      type="number"
                      placeholder="Mass"
                      {...register("Mass", {
                        required: "Mass is required",
                        min: {
                          value: 1,
                          message: "Mass must be greater than 0",
                        },
                        valueAsNumber: true,
                      })}
                      aria-invalid={!!errors.Mass}
                    />
                    <p className="text-destructive min-h-[20px]">
                      {errors.Mass?.message || "\u00A0"}
                    </p>
                  </div>

                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="Width">Width</Label>
                    <Input
                      id="Width"
                      type="number"
                      placeholder="Width"
                      {...register("Width", {
                        required: "Width is required",
                        min: {
                          value: 1,
                          message: "Width must be greater than 0",
                        },
                        valueAsNumber: true,
                      })}
                      aria-invalid={!!errors.Width}
                    />
                    <p className="text-destructive min-h-[20px]">
                      {errors.Width?.message || "\u00A0"}
                    </p>
                  </div>

                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="length">Length</Label>
                    <Input
                      id="length"
                      type="number"
                      placeholder="Length"
                      {...register("length", {
                        setValueAs: (value) =>
                          value === "" ? 0 : Number.parseInt(value, 10),
                      })}
                    />
                    <p className="min-h-[20px] text-muted-foreground">{`\u00A0`}</p>
                  </div>

                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="thickness">Thickness</Label>
                    <Input
                      id="thickness"
                      type="number"
                      placeholder="Thickness"
                      {...register("thickness", {
                        setValueAs: (value) =>
                          value === "" ? 0 : Number.parseInt(value, 10),
                      })}
                    />
                    <p className="min-h-[20px] text-muted-foreground">{`\u00A0`}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-6 border-t">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleNextTab("structure")}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Structure Tab */}
            <TabsContent value="structure">
              <div className="grid gap-4 mt-4">
                <div className="grid gap-2">
                  <Label>Select Floors</Label>
                  <MultiFloor
                    options={structureData}
                    selectedOptions={selectedStructures}
                    onSelectionChange={setSelectedStructures}
                    placeholder="Search structure..."
                  />
                </div>

                {selectedStructures.length > 0 ? (
                  <Card>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {selectedStructures.map((struc, index) => (
                          <div
                            key={struc.id}
                            className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate">{struc.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => handleRemoveStructure(struc.id)}
                              >
                                Remove
                              </Button>
                              <Input
                                type="hidden"
                                {...register(
                                  `hierarchy_quantity.${index}.hierarchy_id`,
                                  {
                                    setValueAs: (value) => Number(value),
                                  }
                                )}
                                value={struc.id}
                              />
                            </div>
                            <div className="grid w-full items-center gap-1.5">
                              <Label htmlFor={`structure-qty-${struc.id}`}>
                                Quantity
                              </Label>
                              <Input
                                id={`structure-qty-${struc.id}`}
                                type="number"
                                placeholder="Quantity"
                                {...register(
                                  `hierarchy_quantity.${index}.quantity`,
                                  {
                                    required: "Quantity is required",
                                    min: {
                                      value: 1,
                                      message: "Quantity must be at least 1",
                                    },
                                    setValueAs: (value) =>
                                      value === ""
                                        ? 0
                                        : Number.parseInt(value, 10),
                                  }
                                )}
                                aria-invalid={
                                  !!errors.hierarchy_quantity?.[index]?.quantity
                                }
                              />
                              <p className="text-destructive min-h-[20px]">
                                {errors.hierarchy_quantity?.[index]?.quantity
                                  ?.message || "\u00A0"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-2">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>No floors selected</AlertTitle>
                      <AlertDescription>
                        Select at least one floor.
                      </AlertDescription>
                    </Alert>
                    <p className="text-destructive min-h-[20px]">
                      {(errors.hierarchy_quantity as any)?.message || "\u00A0"}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-4 pt-6 border-t">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setActiveTab("element-info")}
                  >
                    Previous
                  </Button>
                  <Button type="button" onClick={() => handleNextTab("bom")}>
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* BOM Tab */}
            <TabsContent value="bom">
              <div className="grid gap-4 mt-4">
                <div className="grid gap-2">
                  <Label>Select Products</Label>
                  <MultiBom
                    users={bomData}
                    selected={selectedBom}
                    onSelectionChange={setSelectedBom}
                    placeholder="Search for BOM"
                  />
                </div>

                {selectedBom.length > 0 ? (
                  <Card>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {selectedBom.map((product, index) => (
                          <div
                            key={product.bom_id}
                            className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate">
                                {product.bom_name}
                              </span>
                              <Input
                                type="hidden"
                                {...register(`products.${index}.product_id`, {
                                  setValueAs: (val) =>
                                    val === "" ? 0 : Number.parseInt(val, 10),
                                })}
                                value={product.bom_id}
                              />
                            </div>

                            <div className="grid w-full items-center gap-1.5">
                              <Label htmlFor={`bom-qty-${product.bom_id}`}>
                                Quantity
                              </Label>
                              <Input
                                id={`bom-qty-${product.bom_id}`}
                                type="number"
                                placeholder="Quantity"
                                {...register(`products.${index}.quantity`, {
                                  required: "Quantity is required",
                                  min: {
                                    value: 1,
                                    message: "Quantity must be at least 1",
                                  },
                                  valueAsNumber: true,
                                })}
                                aria-invalid={
                                  !!errors.products?.[index]?.quantity
                                }
                              />
                              <p className="text-destructive min-h-[20px]">
                                {errors.products?.[index]?.quantity?.message ||
                                  "\u00A0"}
                              </p>
                            </div>

                            <div className="flex items-center justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() =>
                                  handleRemoveProduct(product.bom_id)
                                }
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-2">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>No products selected</AlertTitle>
                      <AlertDescription>
                        Select at least one product.
                      </AlertDescription>
                    </Alert>
                    <p className="text-destructive min-h-[20px]">
                      {(errors.products as any)?.message || "\u00A0"}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-4 pt-6 border-t">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setActiveTab("structure")}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleNextTab("drawings")}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Drawings Tab */}
            <TabsContent value="drawings">
              <div className="grid gap-4 mt-4">
                <div className="grid gap-2">
                  <Label>Stages</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {column.map((stage) => (
                      <div key={stage.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`stage-${stage.name}`}
                          checked={selectedStages.includes(stage.name)}
                          onCheckedChange={() => handleStageToggle(stage.name)}
                        />
                        <Label
                          htmlFor={`stage-${stage.name}`}
                          className="cursor-pointer"
                        >
                          {stage.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {attemptedTabs.drawings && selectedStages.length === 0 && (
                    <p className="text-destructive min-h-[20px]">
                      Select at least one stage
                    </p>
                  )}
                </div>

                <Separator />

                {attemptedTabs.drawings && !hasAnyCompleteDrawing && (
                  <p className="text-destructive min-h-[20px]">
                    Upload at least one complete drawing (version + file)
                  </p>
                )}

                {allDrawingTypes.length > 0 ? (
                  <div className="grid gap-4">
                    {allDrawingTypes.map((type, index) => {
                      const uploadedFile =
                        watchedValues.drawings?.[index]?.file;
                      const preview = drawingPreviews[index];
                      const fileUrl = uploadedFile
                        ? buildFileUrl(uploadedFile)
                        : "";
                      const showImage =
                        !!preview ||
                        (uploadedFile && isImageFile(uploadedFile));

                      return (
                        <Card key={type.drawings_type_id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between gap-2">
                              <div className="truncate">
                                {type.drawing_type_name}
                              </div>
                              <Input
                                type="hidden"
                                {...register(
                                  `drawings.${index}.drawing_type_id`,
                                  {
                                    setValueAs: (value) => Number(value),
                                  }
                                )}
                                value={type.drawings_type_id}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor={`version-${index}`}>
                                  Version
                                </Label>
                                <Input
                                  id={`version-${index}`}
                                  placeholder="Version"
                                  {...register(
                                    `drawings.${index}.current_version`,
                                    {
                                      validate: (value, formValues) => {
                                        if (
                                          formValues.drawings[index]?.file &&
                                          !value
                                        ) {
                                          return "Version is required when file is uploaded";
                                        }
                                        return true;
                                      },
                                    }
                                  )}
                                  aria-invalid={
                                    !!errors.drawings?.[index]?.current_version
                                  }
                                />
                                <p className="text-destructive min-h-[20px]">
                                  {errors.drawings?.[index]?.current_version
                                    ?.message || "\u00A0"}
                                </p>
                              </div>

                              <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor={`comments-${index}`}>
                                  Comments
                                </Label>
                                <Textarea
                                  id={`comments-${index}`}
                                  placeholder="Comments"
                                  className="resize-none"
                                  {...register(`drawings.${index}.comments`)}
                                />
                                <p className="min-h-[20px] text-muted-foreground">{`\u00A0`}</p>
                              </div>
                            </div>

                            <div className="grid gap-2 mt-4">
                              <Label htmlFor={`file-upload-${index}`}>
                                File
                              </Label>
                              <label
                                htmlFor={`file-upload-${index}`}
                                className={cn(
                                  "flex items-center justify-between gap-3 w-full border border-dashed rounded-md bg-background hover:bg-accent cursor-pointer transition-colors",
                                  uploadingFiles[index] &&
                                    "opacity-60 cursor-not-allowed"
                                )}
                              >
                                <div className="flex items-center gap-3 p-3 min-w-0">
                                  {uploadingFiles[index] ? (
                                    <Loader2 className="animate-spin text-primary" />
                                  ) : uploadedFile ? (
                                    <Check className="text-primary" />
                                  ) : (
                                    <Upload className="text-primary" />
                                  )}
                                  <div className="truncate">
                                    {uploadingFiles[index]
                                      ? "Uploading..."
                                      : uploadedFile
                                      ? uploadedFile
                                      : "Click to upload"}
                                  </div>
                                </div>
                                <div className="p-3">
                                  <FileText className="text-muted-foreground" />
                                </div>
                                <input
                                  id={`file-upload-${index}`}
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleFileUpload(f, index);
                                  }}
                                  disabled={!!uploadingFiles[index]}
                                />
                              </label>

                              {(showImage || uploadedFile) && (
                                <div className="rounded-md border bg-muted/20 overflow-hidden">
                                  {showImage ? (
                                    <img
                                      src={preview || fileUrl}
                                      alt="preview"
                                      className="w-full max-h-56 object-contain bg-background"
                                    />
                                  ) : (
                                    <div className="flex items-center justify-between gap-2 p-3">
                                      <div className="truncate">
                                        {uploadedFile}
                                      </div>
                                      {fileUrl ? (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          onClick={() =>
                                            window.open(fileUrl, "_blank")
                                          }
                                        >
                                          View
                                        </Button>
                                      ) : null}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>No drawing types available</AlertTitle>
                    <AlertDescription>
                      {selectedStages.length === 0
                        ? "Select at least one stage to see available drawing types"
                        : "No drawing types found for the selected stages"}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pt-6 border-t">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setActiveTab("bom")}
                    >
                      Previous
                    </Button>
                  </div>
                  <div className="flex flex-col gap-3 md:items-end">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Create"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </>
  );
}
