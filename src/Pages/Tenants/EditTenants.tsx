import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import AddTenants from "./AddTenants";
import type { EditTenant } from "./AddTenants";
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

export interface TenantDetail {
  client_id: number;
  organization: string;
  user_id: number;
  email: string;
  password: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
  first_access: string;
  last_access: string;
  profile_picture: string;
  is_admin: boolean;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  phone_no: string;
  role_id: number;
  role_name: string;
  store_id: number;
  phone_code: number;
  phone_code_name: string;
}

export default function EditTenants() {
  const { tenant_id } = useParams<{ tenant_id: string }>();
  const [data, setData] = useState<TenantDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch tenant data
  useEffect(() => {
    if (!tenant_id) {
      toast.error("Tenant ID is required");
      setIsLoading(false);
      return;
    }

    const source = axios.CancelToken.source();

    const fetchTenantData = async () => {
      try {
        const response = await apiClient.get(`/client_fetch/${tenant_id}`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          console.log("API Response:", response.data);
          setData(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch tenant data");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "tenant data"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantData();

    return () => {
      source.cancel();
    };
  }, [tenant_id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading tenant data...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-muted-foreground">Tenant not found</p>
      </div>
    );
  }

  // Transform API response to EditTenant format
  // Use client_id as the id (since that's what we send in the payload)
  const tenantId = data.client_id || Number(tenant_id);

  const editTenantData: EditTenant = {
    id: Number(tenantId),
    email: data.email || "",
    password: data.password,
    first_name: data.first_name || "",
    last_name: data.last_name || "",
    organization: data.organization || "",
    address: data.address || "",
    employee_id: data.employee_id || "",
    city: data.city || "",
    state: data.state || "",
    country: data.country || "",
    zip_code: data.zip_code || "",
    phone_no: data.phone_no || "",
    phone_code: data.phone_code || 0,
    profile_picture: data.profile_picture || "",
    store_id: data.store_id || 0,
    emailsent: false,
  };

  // Debug: Log the transformed data
  console.log("EditTenant data:", editTenantData);

  return <AddTenants user={editTenantData} />;
}
