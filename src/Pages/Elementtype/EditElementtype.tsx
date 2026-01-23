import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { Check, FileText, Info, Loader2, Upload, X } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";

// Custom Components
import MultiBom, { type Product } from "@/components/Multibom/MultiBom";
import { type Structure } from "@/components/MultiFloor/MultiFloor";
import { toast } from "sonner";

/* ------------------------------------------------------------------
   Types & Schema
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

type ExistingDrawing = {
  drawing_id: number;
  current_version: string;
  created_by: string;
  drawing_type_id: number;
  drawing_type_name: string;
  comments: string;
  file: string;
  Element_type_id: number;
};

type ExistingProduct = {
  product_id: number;
  product_name: string;
  product_type: string;
  quantity: number;
};

type ExistingHierarchy = {
  hierarchy_id: number;
  quantity: number;
  project_id: number;
  name: string;
  parent_id: number;
  naming_convention: string;
};

type ExistingElementType = {
  element_type: string;
  element_type_name: string;
  thickness: number;
  length: number;
  height: number;
  area: number;
  volume: number;
  mass: number;
  width: number;
  element_type_id: number;
  project_id: number;
  element_type_version: string;
  elementtype_id: string;
  products: ExistingProduct[];
  hierarchy_quantity: ExistingHierarchy[];
  drawings: ExistingDrawing[];
  stages?: Array<{ id: number; stages_id: number; order: number }>;
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
   Main Component
-------------------------------------------------------------------*/
export default function EditElementType() {
  const { projectId, elementTypeId, floorId } = useParams<{
    projectId: string;
    elementTypeId: string;
    floorId: string;
  }>();
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
  const [existingData, setExistingData] = useState<ExistingElementType | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<Record<number, boolean>>({});
  const [drawingPreviews, setDrawingPreviews] = useState<Record<number, string>>({});

  const [activeTab, setActiveTab] = useState("element-info");
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [allDrawingTypes, setAllDrawingTypes] = useState<DrawingType[]>([]);
  const [selectedStructures, setSelectedStructures] = useState<Structure[]>([]);
  const [bomData, setBomData] = useState<Product[]>([]);
  const [selectedBom, setSelectedBom] = useState<Product[]>([]);

  // Edit mode toggles
  const [isBasicDetailsEditable, setIsBasicDetailsEditable] = useState(false);
  const [isStructureEditable, setIsStructureEditable] = useState(false);
  const [isProductsEditable, setIsProductsEditable] = useState(false);
  const [isDrawingsEditable, setIsDrawingsEditable] = useState(false);

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    trigger,
    setError,
    clearErrors,
    reset,
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
      if (!isBasicDetailsEditable) return true;
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
      if (!isStructureEditable) return true;
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
      if (!isProductsEditable) return true;
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
    if (!isDrawingsEditable) return true;
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
    const etId = elementTypeId ? Number(elementTypeId) : undefined;
    const fId = floorId ? Number(floorId) : undefined;

    if (!pid || !etId) return;

    Promise.all([
      fetchExistingElementType(etId, fId),
      fetchBomData(pid),
      fetchAllDrawingTypes(pid),
      fetchColumn(pid),
    ])
      .then(() => setLoading(false))
      .catch((error) => {
        console.error("Error initializing data:", error);
        setLoading(false);
      });
  }, [projectId, elementTypeId, floorId]);

  const fetchExistingElementType = async (etId: number, fId?: number) => {
    try {
      const url = fId
        ? `/elementtype_get/${etId}?hierarchy_id=${fId}`
        : `/elementtype_get/${etId}`;
      const response = await apiClient.get<ExistingElementType>(url);

      if (response.data) {
        const data = response.data;
        setExistingData(data);

        // Pre-populate form with existing data
        reset({
          element_type_name: data.element_type_name || "",
          element_type: data.element_type || "",
          height: data.height || 0,
          length: data.length || 0,
          thickness: data.thickness || 0,
          Area: data.area || 0,
          Volume: data.volume || 0,
          Mass: data.mass || 0,
          Width: data.width || 0,
          drawings: [],
          products: [],
          hierarchy_quantity: [],
          stages: [],
        });

        // Pre-populate selected structures from existing hierarchy_quantity
        if (data.hierarchy_quantity && data.hierarchy_quantity.length > 0) {
          const existingStructures: Structure[] = data.hierarchy_quantity.map((h) => ({
            id: h.hierarchy_id,
            name: h.name,
            project_id: h.project_id,
            parent_id: h.parent_id,
            description: "",
            prefix: h.naming_convention || "",
          }));
          setSelectedStructures(existingStructures);

          // Set hierarchy quantities
          const hierarchyQuantities = data.hierarchy_quantity.map((h) => ({
            hierarchy_id: h.hierarchy_id,
            quantity: h.quantity,
          }));
          setValue("hierarchy_quantity", hierarchyQuantities);
        }

        // Pre-populate selected BOM from existing products
        if (data.products && data.products.length > 0) {
          // Note: We'll match these with bomData once it's loaded
          const productQuantities = data.products.map((p) => ({
            product_id: p.product_id,
            quantity: p.quantity,
          }));
          setValue("products", productQuantities);
        }

        // Stages will be pre-populated after column data is loaded
      }
    } catch (error) {
      console.error("Error fetching element type:", error);
      toast.error("Failed to fetch element type data");
    }
  };

  const fetchColumn = async (pid: number) => {
    try {
      const response = await apiClient.get<ApiResponse<ColumnLayout[]>>(
        `/get_allstages/${pid}`
      );
      if (Array.isArray(response.data?.data)) {
        setColumn(response.data.data);
      } else if (Array.isArray(response.data as any)) {
        setColumn(response.data as any);
      }
    } catch (error) {
      console.error("Error fetching stages:", error);
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
      console.error("Error fetching drawing types:", error);
      setAllDrawingTypes([]);
    }
  };

  /* ------------------------------------------------------------------
     Pre-populate BOM and Stages after data is loaded
  -------------------------------------------------------------------*/
  useEffect(() => {
    if (existingData && bomData.length > 0 && existingData.products) {
      const matchedBom = existingData.products
        .map((p) => {
          const match = bomData.find((b) => b.bom_id === p.product_id);
          return match;
        })
        .filter((b): b is Product => !!b);
      setSelectedBom(matchedBom);
    }
  }, [existingData, bomData]);

  useEffect(() => {
    if (existingData && column.length > 0 && existingData.stages) {
      const matchedStages = existingData.stages
        .map((s) => {
          const match = column.find((c) => c.id === s.stages_id);
          return match?.name;
        })
        .filter((name): name is string => !!name);
      setSelectedStages(matchedStages);
    }
  }, [existingData, column]);

  /* ------------------------------------------------------------------
     Pre-populate drawings after drawing types are loaded
  -------------------------------------------------------------------*/
  useEffect(() => {
    if (existingData && allDrawingTypes.length > 0 && existingData.drawings) {
      const drawingsForm = allDrawingTypes.map((type) => {
        const existingDrawing = existingData.drawings.find(
          (d) => d.drawing_type_id === type.drawings_type_id
        );
        return {
          drawing_type_id: type.drawings_type_id,
          current_version: existingDrawing?.current_version || "",
          comments: existingDrawing?.comments || "",
          file: existingDrawing?.file || "",
        };
      });
      setValue("drawings", drawingsForm);
    }
  }, [existingData, allDrawingTypes, setValue]);

  /* ------------------------------------------------------------------
     Stage Selection
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
  -------------------------------------------------------------------*/
  useEffect(() => {
    const currentProducts = getValues("products") || [];
    const mergedProducts = selectedBom.map((product) => {
      const existing = currentProducts.find(
        (p: any) => p.product_id === product.bom_id
      );
      // Also check existing data for initial quantity
      const existingFromData = existingData?.products?.find(
        (p) => p.product_id === product.bom_id
      );
      return {
        product_id: product.bom_id,
        quantity: existing?.quantity || existingFromData?.quantity || 0,
      };
    });
    setValue("products", mergedProducts);
  }, [selectedBom, setValue, getValues, existingData]);

  /* ------------------------------------------------------------------
     Form Submission
  -------------------------------------------------------------------*/
  const onSubmit = async (data: FormData) => {
    // Check if any edit mode is enabled
    if (!isBasicDetailsEditable && !isStructureEditable && !isProductsEditable && !isDrawingsEditable) {
      toast.error("Please enable at least one edit mode to save changes");
      return;
    }

    const tabOk = await validateTab(activeTab as TabKey);
    if (!tabOk) return;

    const submitData: any = {};

    // Only include basic details if toggle is ON
    if (isBasicDetailsEditable) {
      submitData.element_type_name = data.element_type_name;
      submitData.element_type = data.element_type;
      submitData.height = data.height;
      submitData.length = data.length;
      submitData.thickness = data.thickness;
      submitData.area = data.Area;
      submitData.volume = data.Volume;
      submitData.mass = data.Mass;
      submitData.width = data.Width;
    }

    // Only include hierarchy_quantity if toggle is ON
    if (isStructureEditable) {
      if (selectedStructures.length === 0) {
        setActiveTab("structure");
        setError("hierarchy_quantity", {
          type: "manual",
          message: "Select at least one floor",
        });
        return;
      }
      submitData.hierarchy_quantity = data.hierarchy_quantity;
    }

    // Only include products if toggle is ON
    if (isProductsEditable) {
      if (selectedBom.length === 0) {
        setActiveTab("bom");
        setError("products", {
          type: "manual",
          message: "Select at least one product",
        });
        return;
      }
      submitData.products = data.products;
    }

    // Only include drawings and stages if toggle is ON
    if (isDrawingsEditable) {
      const validDrawings = data.drawings.filter((d) => d.current_version && d.file);
      if (validDrawings.length === 0) {
        setActiveTab("drawings");
        return;
      }
      submitData.drawings = validDrawings;

      // Build stages payload
      const sortedSelectedStages = selectedStages
        .map((stageName) => column.find((s) => s.name === stageName))
        .filter((s): s is ColumnLayout => !!s)
        .sort((a, b) => a.order - b.order);

      submitData.stages = sortedSelectedStages.map((stage) => ({
        id: stage.id,
        stages_id: stage.id,
        order: stage.order,
      }));
    }

    try {
      setLoading(true);
      const response = await apiClient.put(
        `/elementtype_update/${Number(elementTypeId)}`,
        submitData
      );

      if (response.status === 200) {
        toast.success("Element Type Updated Successfully");
        const wantsToAdjust = window.confirm(
          "Element type updated successfully. Do you want to adjust?"
        );
        if (wantsToAdjust) {
          navigate(`/project/${projectId}/adjustment/${elementTypeId}`);
        } else {
          navigate(`/project/${projectId}/element`);
        }
      } else {
        toast.error("Failed to update element type");
      }
    } catch (error) {
      console.error("Failed to update element type:", error);
      toast.error("Error updating element type");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------
     Progress Indicator
  -------------------------------------------------------------------*/
  const calculateProgress = () => {
    let completed = 0;
    const totalSteps = 4;

    const values = getValues();

    // Element Info
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

    // Structure
    if (
      selectedStructures.length > 0 &&
      values.hierarchy_quantity?.every((item) => item?.quantity > 0)
    ) {
      completed++;
    }

    // BOM
    if (
      selectedBom.length > 0 &&
      values.products?.every((item) => item?.quantity > 0)
    ) {
      completed++;
    }

    // Drawings
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
          <span className="text-sm text-muted-foreground">Loading element type data...</span>
        </div>
      </div>
    );
  }

  if (!existingData) {
    return (
      <div className="p-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>No data found for this element type</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2 py-4 px-4">
        <div className="flex items-center justify-between gap-2">
          <PageHeader title="Edit Element Type" />
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
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Basic Information</Label>
                  <div className="flex items-center gap-2">
                    <Label>Edit Mode</Label>
                    <Switch
                      checked={isBasicDetailsEditable}
                      onCheckedChange={setIsBasicDetailsEditable}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="element_type_name">Element Type Name</Label>
                    <Input
                      id="element_type_name"
                      placeholder="Element Type Name"
                      disabled={!isBasicDetailsEditable}
                      {...register("element_type_name", {
                        required: isBasicDetailsEditable ? "Element type name is required" : false,
                        minLength: isBasicDetailsEditable ? {
                          value: 2,
                          message: "Minimum 2 characters required",
                        } : undefined,
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
                      disabled={!isBasicDetailsEditable}
                      {...register("element_type", {
                        required: isBasicDetailsEditable ? "Element type is required" : false,
                        minLength: isBasicDetailsEditable ? {
                          value: 2,
                          message: "Minimum 2 characters required",
                        } : undefined,
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
                      disabled={!isBasicDetailsEditable}
                      {...register("height", {
                        required: isBasicDetailsEditable ? "Height is required" : false,
                        min: isBasicDetailsEditable ? {
                          value: 1,
                          message: "Height must be greater than 0",
                        } : undefined,
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
                      disabled={!isBasicDetailsEditable}
                      {...register("Area", {
                        required: isBasicDetailsEditable ? "Area is required" : false,
                        min: isBasicDetailsEditable ? {
                          value: 1,
                          message: "Area must be greater than 0",
                        } : undefined,
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
                      disabled={!isBasicDetailsEditable}
                      {...register("Volume", {
                        required: isBasicDetailsEditable ? "Volume is required" : false,
                        min: isBasicDetailsEditable ? {
                          value: 1,
                          message: "Volume must be greater than 0",
                        } : undefined,
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
                      disabled={!isBasicDetailsEditable}
                      {...register("Mass", {
                        required: isBasicDetailsEditable ? "Mass is required" : false,
                        min: isBasicDetailsEditable ? {
                          value: 1,
                          message: "Mass must be greater than 0",
                        } : undefined,
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
                      disabled={!isBasicDetailsEditable}
                      {...register("Width", {
                        required: isBasicDetailsEditable ? "Width is required" : false,
                        min: isBasicDetailsEditable ? {
                          value: 1,
                          message: "Width must be greater than 0",
                        } : undefined,
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
                      disabled={!isBasicDetailsEditable}
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
                      disabled={!isBasicDetailsEditable}
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
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Structure Quantities</Label>
                  <div className="flex items-center gap-2">
                    <Label>Edit Mode</Label>
                    <Switch
                      checked={isStructureEditable}
                      onCheckedChange={setIsStructureEditable}
                    />
                  </div>
                </div>

                {selectedStructures.length > 0 ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Edit quantities for the assigned floors. Adding or removing floors is not allowed.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                      {selectedStructures.map((struc, index) => (
                        <Card
                          key={struc.id}
                          className="p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
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

                          <div className="mb-2">
                            <span className="text-xs text-muted-foreground">Floor</span>
                            <p className="font-medium truncate text-sm" title={struc.name}>
                              {struc.name}
                            </p>
                          </div>

                          <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor={`structure-qty-${struc.id}`}>
                              Quantity
                            </Label>
                            <Input
                              id={`structure-qty-${struc.id}`}
                              type="number"
                              placeholder="Qty"
                              className="h-8 text-sm"
                              disabled={!isStructureEditable}
                              {...register(
                                `hierarchy_quantity.${index}.quantity`,
                                {
                                  required: isStructureEditable ? "Quantity is required" : false,
                                  min: isStructureEditable ? {
                                    value: 1,
                                    message: "Quantity must be at least 1",
                                  } : undefined,
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
                            {errors.hierarchy_quantity?.[index]?.quantity && (
                              <p className="text-destructive min-h-[20px]">
                                {errors.hierarchy_quantity?.[index]?.quantity?.message}
                              </p>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>No floors assigned</AlertTitle>
                      <AlertDescription>
                        This element type has no floors assigned to it.
                      </AlertDescription>
                    </Alert>
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
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Products (BOM)</Label>
                  <div className="flex items-center gap-2">
                    <Label>Edit Mode</Label>
                    <Switch
                      checked={isProductsEditable}
                      onCheckedChange={setIsProductsEditable}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Select Products</Label>
                  {isProductsEditable ? (
                    <MultiBom
                      users={bomData}
                      selected={selectedBom}
                      onSelectionChange={setSelectedBom}
                      placeholder="Search for BOM"
                    />
                  ) : (
                    <div className="p-3 border rounded-md bg-muted/30 text-muted-foreground">
                      Enable edit mode to modify product selection
                    </div>
                  )}
                </div>

                {selectedBom.length > 0 ? (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                      {selectedBom.map((product, index) => (
                        <Card
                          key={product.bom_id}
                          className="relative p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          {isProductsEditable && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleRemoveProduct(product.bom_id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}

                          <span className="truncate text-sm">
                            {product.bom_name} ({product.bom_type})
                          </span>
                          <Input
                            type="hidden"
                            {...register(`products.${index}.product_id`, {
                              setValueAs: (val) =>
                                val === "" ? 0 : Number.parseInt(val, 10),
                            })}
                            value={product.bom_id}
                          />

                          <div className="grid w-full items-center gap-1.5 mt-2">
                            <Label htmlFor={`bom-qty-${product.bom_id}`}>
                              Quantity
                            </Label>
                            <Input
                              id={`bom-qty-${product.bom_id}`}
                              type="number"
                              placeholder="Quantity"
                              disabled={!isProductsEditable}
                              {...register(`products.${index}.quantity`, {
                                required: isProductsEditable ? "Quantity is required" : false,
                                min: isProductsEditable ? {
                                  value: 1,
                                  message: "Quantity must be at least 1",
                                } : undefined,
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
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>No products selected</AlertTitle>
                      <AlertDescription>
                        {isProductsEditable
                          ? "Select at least one product."
                          : "Enable edit mode to modify product selection."}
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
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Drawings & Stages</Label>
                  <div className="flex items-center gap-2">
                    <Label>Edit Mode</Label>
                    <Switch
                      checked={isDrawingsEditable}
                      onCheckedChange={setIsDrawingsEditable}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Stages</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {column.map((stage) => (
                      <div key={stage.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`stage-${stage.name}`}
                          checked={selectedStages.includes(stage.name)}
                          onCheckedChange={() => handleStageToggle(stage.name)}
                          disabled={!isDrawingsEditable}
                        />
                        <Label
                          htmlFor={`stage-${stage.name}`}
                          className={cn(
                            "cursor-pointer",
                            !isDrawingsEditable && "opacity-60"
                          )}
                        >
                          {stage.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {attemptedTabs.drawings && isDrawingsEditable && selectedStages.length === 0 && (
                    <p className="text-destructive min-h-[20px]">
                      Select at least one stage
                    </p>
                  )}
                </div>

                <Separator />

                {attemptedTabs.drawings && isDrawingsEditable && !hasAnyCompleteDrawing && (
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
                              <div className="truncate font-medium">
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
                                  disabled={!isDrawingsEditable}
                                  {...register(
                                    `drawings.${index}.current_version`,
                                    {
                                      validate: (value, formValues) => {
                                        if (!isDrawingsEditable) return true;
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
                                  disabled={!isDrawingsEditable}
                                  {...register(`drawings.${index}.comments`)}
                                />
                                <p className="min-h-[20px] text-muted-foreground">{`\u00A0`}</p>
                              </div>
                            </div>

                            <div className="grid gap-2 mt-4">
                              <Label htmlFor={`file-upload-${index}`}>
                                File
                              </Label>
                              {isDrawingsEditable ? (
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
                              ) : (
                                <div className="p-4 bg-muted rounded-md">
                                  {uploadedFile ? (
                                    <a
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline"
                                    >
                                      View Drawing
                                    </a>
                                  ) : (
                                    <p className="text-muted-foreground">
                                      No file uploaded
                                    </p>
                                  )}
                                </div>
                              )}

                              {(showImage || (uploadedFile && !isDrawingsEditable)) && (
                                <div className="rounded-md border bg-muted/20 overflow-hidden">
                                  {showImage ? (
                                    <img
                                      src={preview || fileUrl}
                                      alt="preview"
                                      className="w-full max-h-56 object-contain bg-background"
                                    />
                                  ) : uploadedFile && isDrawingsEditable ? (
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
                                  ) : null}
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
                      No drawing types found for this project
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
                        "Save Changes"
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
