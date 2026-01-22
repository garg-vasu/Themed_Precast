import axios, { AxiosError } from "axios";
import { Controller, useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Upload,
  Plus,
  Trash2,
  Calculator,
  FileText,
  X,
} from "lucide-react";
import { apiClient } from "@/utils/apiClient";
import { cn } from "@/lib/utils";

// Types
export interface Phonecode {
  id: number;
  country_name: string;
  phone_code: string;
}

export interface Stages {
  id: number;
  name: string;
}

const stages: Stages[] = [
  { id: 1, name: "Dispatch" },
  { id: 2, name: "Errected" },
  { id: 3, name: "Handover" },
  { id: 4, name: "Casted" },
];

export type TowerData = {
  id: number;
  project_id: number;
  name: string;
  description: string;
  child_count: number;
};

export type FloorData = {
  hierarchy_id: number;
  name: string;
  description: string;
  parent_id: number;
  tower_name: string;
};

export type EndClient = {
  id: number;
  email: string;
  contact_person: string;
  address: string;
  attachment: string[];
  cin: string;
  gst_number: string;
  phone_no: string;
  profile_picture: string;
  created_at: string;
  updated_at: string;
  created_by: number;
};

export type Project = {
  project_id: number;
  name: string;
  suspend: boolean;
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

// Schema
const schema = z
  .object({
    wo_number: z.string().min(1, "Work Order Number is required"),
    billed_address: z.string().min(1, "Billing Address is required"),
    shipped_address: z.string().min(1, "Shipping Address is required"),
    contact_number: z
      .string()
      .min(10, "Phone number is required")
      .max(10, "Phone number must be 10 digits"),
    contact_email: z.string().email("Invalid email address"),
    phone_code: z.number().min(1, "Phone Code is required"),
    wo_date: z.string().min(1, "Work Order Date is required"),
    wo_validate: z.string().min(1, "Work Order Valid Till is required"),
    total_value: z.number().min(1, "Total Value is required"),
    material: z.array(
      z.object({
        item_name: z.string().min(1, "Item Name is required"),
        hsn_code: z.number().min(1, "HSN Code is required"),
        unit_rate: z.number().min(1, "Unit Rate is required"),
        tax: z.number().min(0, "Tax is required"),
        volume: z.number().min(1, "Volume is required"),
        tower_id: z.number().min(1, "Tower is required"),
        floor_id: z.array(z.number()).min(1, "At least one floor is required"),
      })
    ),
    endclient_id: z.number().min(1, "Customer is required"),
    project_id: z.number().min(1, "Project is required"),
    payment_term: z
      .array(
        z.object({
          stage_name: z.string().min(1, "Stage is required"),
          percentage: z
            .number({ message: "Percentage is required" })
            .min(0, "Min 0%")
            .max(100, "Max 100%"),
        })
      )
      .min(1, "At least one payment term is required"),
    contact_person: z.string().min(1, "Contact Person is required"),
    wo_description: z.string().min(1, "Work Order Description is required"),
    wo_attachment: z.array(z.string()).optional(),
    recurrence_patterns: z
      .array(
        z.object({
          pattern_type: z.enum(["date", "week"]),
          date_value: z.union([z.string(), z.number(), z.null()]).optional(),
          week_number: z
            .enum(["first", "second", "third", "fourth", "last"])
            .nullable()
            .optional(),
          day_of_week: z
            .enum([
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ])
            .nullable()
            .optional(),
        })
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    const items = data.payment_term || [];
    const total = items.reduce((s, i) => s + (Number(i.percentage) || 0), 0);
    if (total < 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Payment term percentages must total at least 100%",
        path: ["payment_term"],
      });
    }
    const names = items.map((i) => i.stage_name).filter(Boolean);
    const hasDuplicate = new Set(names).size !== names.length;
    if (hasDuplicate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Duplicate stages are not allowed",
        path: ["payment_term"],
      });
    }
  });

type FormData = z.infer<typeof schema>;

export interface EditWorkOrder {
  id: number;
  wo_number: string;
  billed_address: string;
  shipped_address: string;
  contact_number: string;
  contact_email: string;
  phone_code: number;
  wo_date: string;
  wo_validate: string;
  total_value: number;
  material: Array<{
    item_name: string;
    hsn_code: number;
    unit_rate: number;
    tax: number;
    volume: number;
    tower_id: number;
    floor_id: number[];
  }>;
  endclient_id: number;
  project_id: number;
  payment_term: Record<string, number> | Array<{ stage_name: string; percentage: number }>;
  contact_person: string;
  wo_description: string;
  wo_attachment?: string[];
  recurrence_patterns?: Array<{
    pattern_type: "date" | "week";
    date_value?: string | number | null;
    week_number?: "first" | "second" | "third" | "fourth" | "last" | null;
    day_of_week?: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday" | null;
  }>;
}

type WorkOrderFormProps = {
  workOrder?: EditWorkOrder;
};

export default function AddWorkOrder({ workOrder }: WorkOrderFormProps) {
  const navigate = useNavigate();
  const isEditMode = !!workOrder;

  const [phonecodes, setPhonecodes] = useState<Phonecode[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [endClients, setEndClients] = useState<EndClient[]>([]);
  const [towers, setTowers] = useState<TowerData[]>([]);
  const [towerFloorsCache, setTowerFloorsCache] = useState<Record<number, FloorData[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [towerLoading, setTowerLoading] = useState(false);
  const [floorLoading, setFloorLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; name: string; type: string }>>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const skipClearOnFirstProjectSetRef = useRef<boolean>(Boolean(workOrder));

  // Helper function to build file URL for display
  const buildFileUrl = (fileName: string | undefined): string => {
    if (!fileName) return "";
    const baseUrl = import.meta.env.VITE_API_URL;
    if (!baseUrl) return fileName;
    return `${baseUrl}/get-file?file=${encodeURIComponent(fileName)}`;
  };

  // Format ISO date/time strings to input[type="date"] value (YYYY-MM-DD)
  const formatDateToInput = (isoDate?: string) => {
    if (!isoDate) return "";
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return "";
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Map backend stage keys/names to UI option names
  const mapBackendStageToOptionName = (name: string): string => {
    const k = String(name || "").trim().toLowerCase();
    if (k.startsWith("erec") || k === "errected" || k === "erection" || k === "erected") {
      return "Errected";
    }
    if (k === "cast" || k === "casting" || k === "casted") return "Casted";
    if (k === "handover") return "Handover";
    if (k === "dispatch") return "Dispatch";
    const title = k ? k.charAt(0).toUpperCase() + k.slice(1) : "";
    const known = stages.map((s) => s.name);
    return known.includes(title) ? title : name;
  };

  // Prepare default values for form
  const getDefaultValues = (): Partial<FormData> => {
    if (!workOrder) {
      return {
        wo_number: "",
        billed_address: "",
        shipped_address: "",
        contact_number: "",
        contact_email: "",
        phone_code: 0,
        wo_date: "",
        wo_validate: "",
        total_value: 0,
        material: [
          {
            item_name: "",
            hsn_code: 0,
            unit_rate: 0,
            tax: 0,
            volume: 0,
            tower_id: 0,
            floor_id: [],
          },
        ],
        endclient_id: 0,
        project_id: 0,
        payment_term: [],
        contact_person: "",
        wo_description: "",
        wo_attachment: [],
        recurrence_patterns: [],
      };
    }

    // Normalize payment_term: support both array and object forms
    const normalizedPaymentTerm = Array.isArray(workOrder.payment_term)
      ? workOrder.payment_term.map((p: any) => ({
          stage_name: mapBackendStageToOptionName(String(p.stage_name || "")),
          percentage: Number(p.percentage) || 0,
        }))
      : workOrder.payment_term && typeof workOrder.payment_term === "object"
      ? Object.entries(workOrder.payment_term).map(([k, v]) => ({
          stage_name: mapBackendStageToOptionName(String(k || "")),
          percentage: Number(v as any) || 0,
        }))
      : [];

    return {
      wo_number: workOrder.wo_number || "",
      billed_address: workOrder.billed_address || "",
      shipped_address: workOrder.shipped_address || "",
      contact_number: workOrder.contact_number || "",
      contact_email: workOrder.contact_email || "",
      phone_code: workOrder.phone_code || 0,
      wo_date: formatDateToInput(workOrder.wo_date),
      wo_validate: formatDateToInput(workOrder.wo_validate),
      total_value: Number(workOrder.total_value) || 0,
      material: Array.isArray(workOrder.material)
        ? workOrder.material.map((m: any) => ({
            item_name: m.item_name || "",
            hsn_code: Number(m.hsn_code) || 0,
            unit_rate: Number(m.unit_rate) || 0,
            tax: Number(m.tax) || 0,
            volume: Number(m.volume) || 0,
            tower_id: Number(m.tower_id) || 0,
            floor_id: Array.isArray(m.floor_id)
              ? m.floor_id.map((f: any) => Number(f))
              : [],
          }))
        : [
            {
              item_name: "",
              hsn_code: 0,
              unit_rate: 0,
              tax: 0,
              volume: 0,
              tower_id: 0,
              floor_id: [],
            },
          ],
      endclient_id: Number(workOrder.endclient_id) || 0,
      project_id: Number(workOrder.project_id) || 0,
      payment_term: normalizedPaymentTerm,
      contact_person: workOrder.contact_person || "",
      wo_description: workOrder.wo_description || "",
      wo_attachment: Array.isArray(workOrder.wo_attachment) ? workOrder.wo_attachment : [],
      recurrence_patterns: Array.isArray(workOrder.recurrence_patterns)
        ? workOrder.recurrence_patterns
        : [],
    };
  };

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues(),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "material",
  });

  const {
    fields: paymentFields,
    append: appendPayment,
    remove: removePayment,
  } = useFieldArray({
    control,
    name: "payment_term",
  });

  const {
    fields: recurrenceFields,
    append: appendRecurrence,
    remove: removeRecurrence,
  } = useFieldArray({
    control,
    name: "recurrence_patterns",
  });

  const watchedProjectId = watch("project_id");
  const watchedMaterial = watch("material");
  const watchedPayments = watch("payment_term");

  // Fetch tower data
  const fetchTowerData = async (projectId?: number) => {
    if (!projectId) {
      setTowers([]);
      return;
    }
    setTowerLoading(true);
    try {
      const response = await apiClient.get(`/dashboard/towers/${projectId}`);
      if (response.status === 200) {
        const towersData = Array.isArray(response.data?.towers)
          ? (response.data.towers as TowerData[])
          : [];
        setTowers(towersData);
      } else {
        toast.error("Failed to fetch tower data");
      }
    } catch (error) {
      if (!axios.isCancel(error)) {
        toast.error(getErrorMessage(error, "tower data"));
      }
    } finally {
      setTowerLoading(false);
    }
  };

  // Fetch floor data
  const fetchFloorData = async (
    projectId?: number,
    selectedTower?: number
  ): Promise<FloorData[]> => {
    if (!projectId || !selectedTower) {
      return [];
    }

    setFloorLoading(true);
    try {
      const response = await apiClient.get(
        `/precast/floors/${projectId}/${selectedTower}`
      );
      if (response.status === 200) {
        return response.data as FloorData[];
      } else {
        toast.error("Failed to fetch floor data");
        return [];
      }
    } catch (error) {
      if (!axios.isCancel(error)) {
        toast.error(getErrorMessage(error, "floor data"));
      }
      return [];
    } finally {
      setFloorLoading(false);
    }
  };

  // Load floors for a specific tower (with caching)
  const loadFloorsForTower = async (
    projectId?: number,
    towerId?: number
  ): Promise<FloorData[]> => {
    if (!projectId || !towerId) return [];
    if (towerFloorsCache[towerId]) {
      return towerFloorsCache[towerId];
    }
    const floors = await fetchFloorData(projectId, towerId);
    setTowerFloorsCache((prev) => ({ ...prev, [towerId]: floors }));
    return floors;
  };

  // Fetch phone codes
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchPhonecodes = async () => {
      try {
        const response = await apiClient.get("/phonecodes", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setPhonecodes(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch phonecodes");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "phonecodes data"));
        }
      }
    };

    fetchPhonecodes();

    return () => {
      source.cancel();
    };
  }, []);

  // Fetch end clients
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchEndClients = async () => {
      try {
        const response = await apiClient.get("/end_clients", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setEndClients(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch end clients");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "end clients data"));
        }
      }
    };

    fetchEndClients();

    return () => {
      source.cancel();
    };
  }, []);

  // Fetch projects
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchProjects = async () => {
      try {
        const response = await apiClient.get("/projects/basic", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setProjects(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch projects");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "projects data"));
        }
      }
    };

    fetchProjects();

    return () => {
      source.cancel();
    };
  }, []);

  // Handle project change - fetch towers
  useEffect(() => {
    fetchTowerData(watchedProjectId);

    // Skip clearing selections on initial prefill
    if (skipClearOnFirstProjectSetRef.current) {
      skipClearOnFirstProjectSetRef.current = false;
      return;
    }

    setTowerFloorsCache({});
    if (Array.isArray(watchedMaterial)) {
      watchedMaterial.forEach((_, idx) => {
        setValue(`material.${idx}.tower_id`, 0, {
          shouldDirty: true,
          shouldValidate: true,
        });
        setValue(`material.${idx}.floor_id`, [], {
          shouldDirty: true,
          shouldValidate: true,
        });
      });
    }
  }, [watchedProjectId]);

  // Prefill form when editing
  useEffect(() => {
    if (!workOrder) return;

    skipClearOnFirstProjectSetRef.current = true;

    // Preload uploaded files preview
    if (Array.isArray(workOrder.wo_attachment)) {
      const previews = workOrder.wo_attachment.map((file) => ({
        url: file,
        name: file,
        type: "",
      }));
      setUploadedFiles(previews);
    }

    // Load tower and floor data for editing
    const loadDataAndResetForm = async () => {
      if (workOrder.project_id) {
        await fetchTowerData(workOrder.project_id);
      }

      // Load floors for each tower that has material items
      if (Array.isArray(workOrder.material)) {
        const uniqueTowerIds = new Set(
          workOrder.material
            .map((m: any) => m.tower_id)
            .filter((id: any) => id && id > 0)
        );

        const floorPromises = Array.from(uniqueTowerIds).map((towerId) => {
          if (workOrder.project_id && towerId) {
            return loadFloorsForTower(workOrder.project_id, Number(towerId));
          }
          return Promise.resolve([]);
        });

        await Promise.all(floorPromises);
      }

      // Reset form with all data
      const defaultValues = getDefaultValues();
      reset(defaultValues);
    };

    loadDataAndResetForm();
  }, [workOrder]);

  // Calculate total value
  const calculateTotalValue = () => {
    if (!watchedMaterial || watchedMaterial.length === 0) return 0;

    const total = watchedMaterial.reduce((sum, item) => {
      const unitRate = item.unit_rate || 0;
      const volume = item.volume || 0;
      const tax = item.tax || 0;
      const itemTotal = unitRate * volume * (1 + tax / 100);
      return sum + itemTotal;
    }, 0);

    return Math.round(total * 100) / 100;
  };

  // Manual calculation
  const handleManualCalculate = () => {
    if (!watchedMaterial || watchedMaterial.length === 0) {
      toast.error("Please add at least one material item before calculating.");
      return;
    }

    const incompleteItems = watchedMaterial.filter(
      (item) =>
        !item.item_name ||
        !item.hsn_code ||
        item.hsn_code <= 0 ||
        !item.unit_rate ||
        item.unit_rate <= 0 ||
        !item.volume ||
        item.volume <= 0
    );

    if (incompleteItems.length > 0) {
      toast.error("Please fill all fields for all material items before calculating.");
      return;
    }

    const calculatedTotal = calculateTotalValue();
    setValue("total_value", calculatedTotal);
    toast.success("Total value calculated successfully!");
  };

  // Auto-calculate total when material changes
  useEffect(() => {
    const calculatedTotal = calculateTotalValue();
    if (calculatedTotal > 0) {
      setValue("total_value", calculatedTotal);
    }
  }, [watchedMaterial]);

  // File upload handling
  const handleFileUpload = async (file: File) => {
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size should be less than 10MB");
      return;
    }

    setIsUploadingFile(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await apiClient.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200 || response.status === 201) {
        if (response.data?.file_name) {
          const fileUrl = response.data.file_name;
          const newFile = {
            url: fileUrl,
            name: file.name,
            type: file.type,
          };

          setUploadedFiles((prev) => [...prev, newFile]);

          // Update form with URLs
          const allUrls = [...uploadedFiles, newFile].map((f) => f.url);
          setValue("wo_attachment", allUrls);

          toast.success("File uploaded successfully!");
        } else {
          throw new Error("Invalid response format: Missing file URL.");
        }
      } else {
        throw new Error("Failed to upload file.");
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, "upload file");
      toast.error(errorMessage);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updatedFiles);
    const remainingUrls = updatedFiles.map((f) => f.url);
    setValue("wo_attachment", remainingUrls);
    toast.success("File removed");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => {
      handleFileUpload(file);
    });
  };

  // Material item handlers
  const addMaterialItem = () => {
    append({
      item_name: "",
      hsn_code: 0,
      unit_rate: 0,
      tax: 0,
      tower_id: 0,
      floor_id: [],
      volume: 0,
    });
  };

  const removeMaterialItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Payment term handlers
  const addPaymentRow = () => {
    appendPayment({ stage_name: "", percentage: 0 });
  };

  const removePaymentRow = (index: number) => {
    if (paymentFields.length > 0) {
      removePayment(index);
    }
  };

  // Recurrence pattern handlers
  const addRecurrencePattern = () => {
    appendRecurrence({
      pattern_type: "date",
      date_value: "",
      week_number: null,
      day_of_week: null,
    });
  };

  const removeRecurrencePattern = (index: number) => {
    removeRecurrence(index);
  };

  // Form submission
  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      // Clean up recurrence patterns
      const cleanedRecurrencePatterns = data.recurrence_patterns?.map((pattern) => {
        const cleaned: any = {
          pattern_type: pattern.pattern_type,
        };

        if (pattern.pattern_type === "date" && pattern.date_value) {
          cleaned.date_value = pattern.date_value;
        } else if (pattern.pattern_type === "week") {
          if (pattern.week_number) cleaned.week_number = pattern.week_number;
          if (pattern.day_of_week) cleaned.day_of_week = pattern.day_of_week;
        }

        return cleaned;
      });

      // Transform payment_term array to object
      const normalizeStageKey = (name: string) => {
        const k = String(name || "").trim().toLowerCase();
        if (k.startsWith("erec") || k.startsWith("erect") || k === "errected") {
          return "erection";
        }
        if (k === "cast" || k === "casting" || k === "casted") return "casted";
        if (k === "handover") return "handover";
        if (k === "dispatch") return "dispatch";
        return k;
      };

      const paymentTermMap = (data.payment_term || []).reduce(
        (acc: Record<string, number>, item) => {
          const key = normalizeStageKey(item.stage_name);
          acc[key] = Number(item.percentage) || 0;
          return acc;
        },
        {}
      );

      const payload: any = {
        ...data,
        payment_term: paymentTermMap,
        recurrence_patterns: cleanedRecurrencePatterns,
      };

      if (isEditMode && workOrder?.id) {
        const response = await apiClient.put(`/workorders/${workOrder.id}`, payload);
        if (response.status === 200 || response.status === 201) {
          toast.success("Amendment updated successfully!");
          navigate("/work-order");
        }
      } else {
        const response = await apiClient.post("/workorders", payload);
        if (response.status === 200 || response.status === 201 || response.data?.work_order_id) {
          toast.success("Work Order created successfully!");
          navigate("/work-order");
        }
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        isEditMode ? "update Amendment" : "create work order"
      );
      toast.error(errorMessage);
      setError("root", {
        message: "Failed to save work order. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex items-center justify-between">
        <PageHeader title={isEditMode ? "Edit Amendment" : "Add Work Order"} />
      </div>
      <Separator />

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Basic Information Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {/* Work Order Number */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="wo_number">
              Work Order Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="wo_number"
              placeholder="Enter Work Order Name"
              {...register("wo_number")}
              aria-invalid={!!errors.wo_number}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.wo_number?.message || "\u00A0"}
            </p>
          </div>

          {/* Work Order Date */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="wo_date">
              Work Order Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="wo_date"
              type="date"
              {...register("wo_date")}
              aria-invalid={!!errors.wo_date}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.wo_date?.message || "\u00A0"}
            </p>
          </div>

          {/* Work Order Valid Till */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="wo_validate">
              Work Order Valid Till <span className="text-red-500">*</span>
            </Label>
            <Input
              id="wo_validate"
              type="date"
              {...register("wo_validate")}
              aria-invalid={!!errors.wo_validate}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.wo_validate?.message || "\u00A0"}
            </p>
          </div>

          {/* Customer Select */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="endclient_id">
              Customer <span className="text-red-500">*</span>
            </Label>
            <Controller
              control={control}
              name="endclient_id"
              render={({ field }) => (
                <Select
                  value={field.value ? field.value.toString() : ""}
                  onValueChange={(val) => field.onChange(Number(val))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Customers</SelectLabel>
                      {endClients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.contact_person}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.endclient_id?.message || "\u00A0"}
            </p>
          </div>

          {/* Project Select */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="project_id">
              Project <span className="text-red-500">*</span>
            </Label>
            <Controller
              control={control}
              name="project_id"
              render={({ field }) => (
                <Select
                  value={field.value ? field.value.toString() : ""}
                  onValueChange={(val) => field.onChange(Number(val))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Projects</SelectLabel>
                      {projects.map((project) => (
                        <SelectItem
                          key={project.project_id}
                          value={project.project_id.toString()}
                        >
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.project_id?.message || "\u00A0"}
            </p>
          </div>

          {/* Phone Code + Phone Number */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="contact_number">
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <div className="w-2/5">
                <Controller
                  control={control}
                  name="phone_code"
                  render={({ field }) => (
                    <Select
                      value={field.value ? field.value.toString() : ""}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Code" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Phone Codes</SelectLabel>
                          {phonecodes.map((code) => (
                            <SelectItem key={code.id} value={code.id.toString()}>
                              {code.phone_code} - {code.country_name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="flex-1">
                <Input
                  id="contact_number"
                  type="tel"
                  placeholder="Phone Number"
                  {...register("contact_number")}
                  aria-invalid={!!errors.contact_number}
                />
              </div>
            </div>
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.phone_code?.message || errors.contact_number?.message || "\u00A0"}
            </p>
          </div>

          {/* Contact Person */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="contact_person">
              Contact Person <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contact_person"
              placeholder="Enter Contact Person"
              {...register("contact_person")}
              aria-invalid={!!errors.contact_person}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.contact_person?.message || "\u00A0"}
            </p>
          </div>

          {/* Contact Email */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="contact_email">
              Contact Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contact_email"
              type="email"
              placeholder="Enter Contact Email"
              {...register("contact_email")}
              aria-invalid={!!errors.contact_email}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.contact_email?.message || "\u00A0"}
            </p>
          </div>
        </div>

        {/* Address Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Shipping Address */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="shipped_address">
              Shipping Address <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="shipped_address"
              placeholder="Enter Shipping Address"
              rows={3}
              {...register("shipped_address")}
              aria-invalid={!!errors.shipped_address}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.shipped_address?.message || "\u00A0"}
            </p>
          </div>

          {/* Billing Address */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="billed_address">
              Billing Address <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="billed_address"
              placeholder="Enter Billing Address"
              rows={3}
              {...register("billed_address")}
              aria-invalid={!!errors.billed_address}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.billed_address?.message || "\u00A0"}
            </p>
          </div>

          {/* Payment Terms */}
          <div className="grid w-full items-center gap-1.5">
            <div className="flex items-center justify-between">
              <Label>
                Payment Terms <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPaymentRow}
                className="h-7 px-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Stage
              </Button>
            </div>

            {paymentFields.length === 0 ? (
              <div className="border border-dashed border-muted-foreground/25 rounded-md p-4 text-center">
                <p className="text-sm text-muted-foreground">No stages added</p>
              </div>
            ) : (
              <div className="space-y-2">
                {paymentFields.map((field, index) => {
                  const selectedNames = (watchedPayments || []).map(
                    (p: any) => p?.stage_name
                  );
                  const currentName = (watchedPayments?.[index]?.stage_name || "") as string;
                  const availableStages = stages.filter(
                    (s) => s.name === currentName || !selectedNames.includes(s.name)
                  );

                  return (
                    <div
                      key={field.id}
                      className="grid grid-cols-7 gap-2 border rounded-md p-2 bg-muted/50"
                    >
                      <div className="col-span-4">
                        <Label className="text-xs">Stage</Label>
                        <Controller
                          control={control}
                          name={`payment_term.${index}.stage_name`}
                          render={({ field: selectField }) => (
                            <Select
                              value={selectField.value || ""}
                              onValueChange={(val) => selectField.onChange(val)}
                            >
                              <SelectTrigger className="w-full h-9">
                                <SelectValue placeholder="Select stage" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {availableStages.map((s) => (
                                    <SelectItem key={s.id} value={s.name}>
                                      {s.name}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Percentage</Label>
                        <Input
                          {...register(`payment_term.${index}.percentage`, {
                            valueAsNumber: true,
                          })}
                          type="number"
                          step="0.01"
                          min={0}
                          max={100}
                          placeholder="0"
                          className="h-9"
                        />
                      </div>
                      <div className="col-span-1 flex items-end justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removePaymentRow(index)}
                          className="text-red-600 hover:text-red-700 h-9"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Total:{" "}
                {Math.round(
                  (watchedPayments || []).reduce(
                    (s: number, p: any) => s + (Number(p?.percentage) || 0),
                    0
                  ) * 100
                ) / 100}
                %
              </p>
              {(watchedPayments || []).reduce(
                (s: number, p: any) => s + (Number(p?.percentage) || 0),
                0
              ) > 100 && (
                <span className="text-xs text-amber-600">
                  Warning: Exceeds 100%
                </span>
              )}
            </div>
            <p className="text-sm text-red-600 min-h-[20px]">
              {(errors as any).payment_term?.message || "\u00A0"}
            </p>
          </div>

          {/* Work Order Description */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="wo_description">
              Work Order Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="wo_description"
              placeholder="Enter Work Order Description"
              rows={3}
              {...register("wo_description")}
              aria-invalid={!!errors.wo_description}
            />
            <p className="text-sm text-red-600 min-h-[20px]">
              {errors.wo_description?.message || "\u00A0"}
            </p>
          </div>
        </div>

        {/* Material Items Section */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <Label className="text-lg font-semibold">Material Items</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleManualCalculate}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Calculator className="h-4 w-4" />
                Calculate Total
              </Button>
              <Button
                type="button"
                onClick={addMaterialItem}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="border rounded-lg p-4 mb-4 bg-muted/30"
            >
              <div className="flex justify-between items-center mb-3">
                <Label className="font-medium">Item {index + 1}</Label>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeMaterialItem(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                {/* Item Name */}
                <div className="grid w-full items-center gap-1.5">
                  <Label className="text-sm">Item Name</Label>
                  <Input
                    {...register(`material.${index}.item_name`)}
                    placeholder="Item Name"
                  />
                  {errors.material?.[index]?.item_name && (
                    <p className="text-sm text-red-600 min-h-[20px]">
                      {errors.material[index]?.item_name?.message}
                    </p>
                  )}
                </div>

                {/* HSN Code */}
                <div className="grid w-full items-center gap-1.5">
                  <Label className="text-sm">HSN Code</Label>
                  <Input
                    {...register(`material.${index}.hsn_code`, {
                      valueAsNumber: true,
                    })}
                    type="number"
                    placeholder="HSN Code"
                  />
                  {errors.material?.[index]?.hsn_code && (
                    <p className="text-sm text-red-600 min-h-[20px]">
                      {errors.material[index]?.hsn_code?.message}
                    </p>
                  )}
                </div>

                {/* Volume */}
                <div className="grid w-full items-center gap-1.5">
                  <Label className="text-sm">Volume / Qty</Label>
                  <Input
                    {...register(`material.${index}.volume`, {
                      valueAsNumber: true,
                    })}
                    type="number"
                    step="0.01"
                    placeholder="Volume"
                  />
                  {errors.material?.[index]?.volume && (
                    <p className="text-sm text-red-600 min-h-[20px]">
                      {errors.material[index]?.volume?.message}
                    </p>
                  )}
                </div>

                {/* Unit Rate */}
                <div className="grid w-full items-center gap-1.5">
                  <Label className="text-sm">Unit Rate</Label>
                  <Input
                    {...register(`material.${index}.unit_rate`, {
                      valueAsNumber: true,
                    })}
                    type="number"
                    step="0.01"
                    placeholder="Unit Rate"
                  />
                  {errors.material?.[index]?.unit_rate && (
                    <p className="text-sm text-red-600 min-h-[20px]">
                      {errors.material[index]?.unit_rate?.message}
                    </p>
                  )}
                </div>

                {/* Tax */}
                <div className="grid w-full items-center gap-1.5">
                  <Label className="text-sm">Tax (%)</Label>
                  <Input
                    {...register(`material.${index}.tax`, {
                      valueAsNumber: true,
                    })}
                    type="number"
                    step="0.01"
                    placeholder="Tax"
                  />
                  {errors.material?.[index]?.tax && (
                    <p className="text-sm text-red-600 min-h-[20px]">
                      {errors.material[index]?.tax?.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Tower and Floors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tower */}
                <div className="grid w-full items-center gap-1.5">
                  <Label className="text-sm">Tower</Label>
                  <Controller
                    control={control}
                    name={`material.${index}.tower_id`}
                    render={({ field: towerField }) => (
                      <Select
                        disabled={!watchedProjectId}
                        value={
                          towerField.value && towerField.value > 0
                            ? String(towerField.value)
                            : ""
                        }
                        onValueChange={async (value) => {
                          const towerId = Number(value);
                          towerField.onChange(towerId);
                          setValue(`material.${index}.floor_id`, [], {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          await loadFloorsForTower(watchedProjectId, towerId);
                        }}
                      >
                        <SelectTrigger className="w-full" disabled={!watchedProjectId}>
                          <SelectValue
                            placeholder={
                              towerLoading ? "Loading towers..." : "Select Tower"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {towers.map((tower) => (
                              <SelectItem key={tower.id} value={String(tower.id)}>
                                {tower.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {isSubmitted && errors.material?.[index]?.tower_id && (
                    <p className="text-sm text-red-600 min-h-[20px]">
                      {errors.material[index]?.tower_id?.message}
                    </p>
                  )}
                </div>

                {/* Floors */}
                <div className="grid w-full items-center gap-1.5">
                  <Label className="text-sm">Floors</Label>
                  <div
                    className={cn(
                      "border rounded-md p-2 max-h-40 overflow-auto",
                      !watchedMaterial?.[index]?.tower_id && "opacity-60"
                    )}
                  >
                    {(() => {
                      const towerId = watchedMaterial?.[index]?.tower_id;
                      const floors = towerId ? towerFloorsCache[towerId] || [] : [];

                      if (!towerId) {
                        return (
                          <p className="text-xs text-muted-foreground">
                            Select a tower to view floors
                          </p>
                        );
                      }

                      if (towerId && !towerFloorsCache[towerId] && floorLoading) {
                        return (
                          <p className="text-xs text-muted-foreground">
                            Loading floors...
                          </p>
                        );
                      }

                      if (floors.length === 0) {
                        return (
                          <p className="text-xs text-muted-foreground">
                            No floors found
                          </p>
                        );
                      }

                      const selected = watchedMaterial?.[index]?.floor_id || [];

                      return (
                        <div className="grid grid-cols-2 gap-2">
                          {floors.map((f) => {
                            const id = f.hierarchy_id;
                            const checked = selected.includes(id);
                            return (
                              <label
                                key={id}
                                className="flex items-center gap-2 text-sm cursor-pointer"
                              >
                                <Checkbox
                                  checked={checked}
                                  disabled={!towerId}
                                  onCheckedChange={(v) => {
                                    const isChecked = Boolean(v);
                                    const next = isChecked
                                      ? Array.from(new Set([...(selected || []), id]))
                                      : (selected || []).filter((x: number) => x !== id);
                                    setValue(`material.${index}.floor_id`, next, {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    });
                                  }}
                                />
                                <span>{f.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                  {isSubmitted && errors.material?.[index]?.floor_id && (
                    <p className="text-sm text-red-600 min-h-[20px]">
                      {errors.material[index]?.floor_id?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total Value Section */}
        <div className="flex justify-end mt-4">
          <div className="w-full md:w-1/3">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="total_value">Total Value (Auto-calculated)</Label>
              <Input
                id="total_value"
                {...register("total_value", { valueAsNumber: true })}
                type="number"
                step="0.01"
                placeholder="Total Value"
                className="bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">
                Calculated: (Unit Rate × Volume) + Tax%
              </p>
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.total_value?.message || "\u00A0"}
              </p>
            </div>
          </div>
        </div>

        {/* Recurrence Patterns Section */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <Label className="text-lg font-semibold">Recurrence Patterns</Label>
            <Button
              type="button"
              onClick={addRecurrencePattern}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Pattern
            </Button>
          </div>

          {recurrenceFields.length === 0 ? (
            <div className="border border-dashed border-muted-foreground/25 rounded-md p-4 text-center">
              <p className="text-sm text-muted-foreground">No patterns added</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recurrenceFields.map((field, index) => {
                const watchedPatternType = watch(`recurrence_patterns.${index}.pattern_type`);
                const watchedDateValue = watch(`recurrence_patterns.${index}.date_value`);
                const watchedWeekNumber = watch(`recurrence_patterns.${index}.week_number`);
                const watchedDayOfWeek = watch(`recurrence_patterns.${index}.day_of_week`);

                return (
                  <div
                    key={field.id}
                    className="border rounded-lg p-3 bg-muted/30"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <Label className="font-medium text-sm">Pattern {index + 1}</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeRecurrencePattern(index)}
                        className="text-red-600 hover:text-red-700 h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {/* Pattern Type Selection */}
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            {...register(`recurrence_patterns.${index}.pattern_type`)}
                            value="date"
                            className="h-4 w-4"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setValue(`recurrence_patterns.${index}.week_number`, null);
                                setValue(`recurrence_patterns.${index}.day_of_week`, null);
                                setValue(`recurrence_patterns.${index}.pattern_type`, "date");
                              }
                            }}
                          />
                          <span className="text-sm">Date</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            {...register(`recurrence_patterns.${index}.pattern_type`)}
                            value="week"
                            className="h-4 w-4"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setValue(`recurrence_patterns.${index}.date_value`, null);
                                setValue(`recurrence_patterns.${index}.pattern_type`, "week");
                              }
                            }}
                          />
                          <span className="text-sm">Week</span>
                        </label>
                      </div>

                      {/* Date Pattern */}
                      {watchedPatternType === "date" && (
                        <Controller
                          control={control}
                          name={`recurrence_patterns.${index}.date_value`}
                          render={({ field: dateField }) => (
                            <Select
                              value={String(dateField.value || "")}
                              onValueChange={(val) => dateField.onChange(val)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select day of month" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                    <SelectItem key={day} value={day.toString()}>
                                      {day}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="penultimate">Penultimate</SelectItem>
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      )}

                      {/* Week Pattern */}
                      {watchedPatternType === "week" && (
                        <div className="flex gap-2">
                          <Controller
                            control={control}
                            name={`recurrence_patterns.${index}.week_number`}
                            render={({ field: weekField }) => (
                              <Select
                                value={weekField.value || ""}
                                onValueChange={(val) => weekField.onChange(val as any)}
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Week" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectItem value="first">First</SelectItem>
                                    <SelectItem value="second">Second</SelectItem>
                                    <SelectItem value="third">Third</SelectItem>
                                    <SelectItem value="fourth">Fourth</SelectItem>
                                    <SelectItem value="last">Last</SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            )}
                          />
                          <Controller
                            control={control}
                            name={`recurrence_patterns.${index}.day_of_week`}
                            render={({ field: dayField }) => (
                              <Select
                                value={dayField.value || ""}
                                onValueChange={(val) => dayField.onChange(val as any)}
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Day" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectItem value="monday">Monday</SelectItem>
                                    <SelectItem value="tuesday">Tuesday</SelectItem>
                                    <SelectItem value="wednesday">Wednesday</SelectItem>
                                    <SelectItem value="thursday">Thursday</SelectItem>
                                    <SelectItem value="friday">Friday</SelectItem>
                                    <SelectItem value="saturday">Saturday</SelectItem>
                                    <SelectItem value="sunday">Sunday</SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                      )}

                      {/* Pattern Summary */}
                      <div className="bg-background border rounded-md p-2">
                        <p className="text-xs text-muted-foreground capitalize">
                          {watchedPatternType === "date" &&
                            watchedDateValue &&
                            `${
                              watchedDateValue === "penultimate"
                                ? "Penultimate"
                                : watchedDateValue +
                                  (watchedDateValue === "1"
                                    ? "st"
                                    : watchedDateValue === "2"
                                    ? "nd"
                                    : watchedDateValue === "3"
                                    ? "rd"
                                    : "th")
                            } of each month`}
                          {watchedPatternType === "week" &&
                            watchedWeekNumber &&
                            watchedDayOfWeek &&
                            `${watchedWeekNumber} ${watchedDayOfWeek} of each month`}
                          {!watchedPatternType && "Select pattern type"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* File Upload Section */}
        <div className="mt-6">
          <Label className="text-lg font-semibold">Work Order Documents</Label>
          <div
            className={cn(
              "mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors",
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="space-y-2 text-center">
              {isUploadingFile ? (
                <Loader2 className="mx-auto h-12 w-12 text-muted-foreground animate-spin" />
              ) : (
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              )}
              <div className="flex text-sm text-muted-foreground">
                <label
                  htmlFor="document-upload"
                  className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none"
                >
                  <span>Upload files</span>
                  <input
                    id="document-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*,.pdf,.doc,.docx"
                    multiple
                    disabled={isUploadingFile}
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      files.forEach((file) => {
                        handleFileUpload(file);
                      });
                    }}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, PDF, DOC up to 10MB each
              </p>
            </div>
          </div>

          {/* Uploaded Files Preview */}
          {uploadedFiles.length > 0 && (
            <div className="mt-4">
              <Label className="text-sm font-medium mb-2 block">
                Uploaded Files ({uploadedFiles.length})
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="relative border rounded-lg p-3 bg-muted/30"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {file.type.startsWith("image/") ? (
                          <div className="flex flex-col items-center">
                            <img
                              src={buildFileUrl(file.url)}
                              alt={file.name}
                              className="w-full h-20 object-cover rounded mb-2"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                            <p className="text-xs text-muted-foreground truncate w-full text-center">
                              {file.name}
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <FileText className="h-12 w-12 text-primary mb-2" />
                            <p className="text-xs text-muted-foreground truncate w-full text-center">
                              {file.name}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 ml-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(buildFileUrl(file.url), "_blank")
                          }
                          className="text-xs px-2 py-1 h-7"
                        >
                          View
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-700 text-xs px-2 py-1 h-7"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errors.wo_attachment && (
            <p className="text-sm text-red-600 mt-2">
              {errors.wo_attachment.message}
            </p>
          )}
        </div>

        {/* Form Error */}
        {errors.root && (
          <p className="text-red-500 text-sm mt-4">{errors.root.message}</p>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 mt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/workorder")}
            disabled={isSubmitting || isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="min-w-[120px]"
          >
            {isSubmitting || isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : isEditMode ? (
              "Add Amendment"
            ) : (
              "Create Work Order"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
