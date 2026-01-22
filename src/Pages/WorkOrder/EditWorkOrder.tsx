import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import AddWorkOrder from "./AddWorkOrder";
import type { EditWorkOrder as EditWorkOrderType } from "./AddWorkOrder";
import { Loader2 } from "lucide-react";

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

export interface WorkOrderDetail {
  id: number;
  wo_number: string;
  wo_date: string;
  wo_validate: string;
  total_value: number;
  contact_person: string;
  contact_email: string;
  contact_number: string;
  phone_code: number;
  payment_term:
    | Record<string, number>
    | Array<{ stage_name: string; percentage: number }>
    | string;
  wo_description: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: string;
  material: Material[];
  wo_attachment: string[];
  endclient_id: number;
  project_id: number;
  project_name: string;
  end_client: string;
  comments: string;
  revision_no: number;
  phone_code_name: string;
  shipped_address: string;
  billed_address: string;
  created_by_name: string;
  recurrence_patterns?: Array<{
    pattern_type: "date" | "week";
    date_value?: string | number | null;
    week_number?: "first" | "second" | "third" | "fourth" | "last" | null;
    day_of_week?: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday" | null;
  }>;
}

export interface Material {
  id: number;
  item_name: string;
  unit_rate: number;
  volume: number;
  hsn_code: number;
  volume_used: number;
  tax: number;
  revision_no: number;
  balance: number;
  tower_id: number;
  floor_id: number[];
  tower_name: string;
  floor_name: string[];
}

export default function EditWorkOrder() {
  const { work_order_id } = useParams<{ work_order_id: string }>();
  const [data, setData] = useState<WorkOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch work order data
  useEffect(() => {
    if (!work_order_id) {
      toast.error("Work Order ID is required");
      setIsLoading(false);
      return;
    }

    const source = axios.CancelToken.source();

    const fetchWorkOrderData = async () => {
      try {
        const response = await apiClient.get(`/workorders/${work_order_id}`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          console.log("API Response:", response.data);
          setData(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch work order data");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "work order data"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkOrderData();

    return () => {
      source.cancel();
    };
  }, [work_order_id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading work order data...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-muted-foreground">Work Order not found</p>
      </div>
    );
  }

  // Transform API response to EditWorkOrder format
  const workOrderId = data.id || Number(work_order_id);

  // Parse payment_term if it's a string
  let parsedPaymentTerm = data.payment_term;
  if (typeof data.payment_term === "string") {
    try {
      parsedPaymentTerm = JSON.parse(data.payment_term);
    } catch {
      parsedPaymentTerm = {};
    }
  }

  const editWorkOrderData: EditWorkOrderType = {
    id: Number(workOrderId),
    wo_number: data.wo_number || "",
    billed_address: data.billed_address || "",
    shipped_address: data.shipped_address || "",
    contact_number: data.contact_number || "",
    contact_email: data.contact_email || "",
    phone_code: data.phone_code || 0,
    wo_date: data.wo_date || "",
    wo_validate: data.wo_validate || "",
    total_value: Number(data.total_value) || 0,
    material: Array.isArray(data.material)
      ? data.material.map((m) => ({
          item_name: m.item_name || "",
          hsn_code: Number(m.hsn_code) || 0,
          unit_rate: Number(m.unit_rate) || 0,
          tax: Number(m.tax) || 0,
          volume: Number(m.volume) || 0,
          tower_id: Number(m.tower_id) || 0,
          floor_id: Array.isArray(m.floor_id)
            ? m.floor_id.map((f) => Number(f))
            : [],
        }))
      : [],
    endclient_id: Number(data.endclient_id) || 0,
    project_id: Number(data.project_id) || 0,
    payment_term: parsedPaymentTerm as
      | Record<string, number>
      | Array<{ stage_name: string; percentage: number }>,
    contact_person: data.contact_person || "",
    wo_description: data.wo_description || "",
    wo_attachment: Array.isArray(data.wo_attachment) ? data.wo_attachment : [],
    recurrence_patterns: Array.isArray(data.recurrence_patterns)
      ? data.recurrence_patterns
      : [],
  };

  // Debug: Log the transformed data
  console.log("EditWorkOrder data:", editWorkOrderData);

  return <AddWorkOrder workOrder={editWorkOrderData} />;
}
