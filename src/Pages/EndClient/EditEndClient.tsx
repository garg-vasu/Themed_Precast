import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AddEndClient } from "./AddEndClient";

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

export interface EndClientDetail {
  id: number;
  email: string;
  contact_person: string;
  client_id: number;
  address: string;
  attachment: string[];
  phone_code: number;
  cin: string;
  gst_number: string;
  phone_no: string;
  organization_name: string;
  abbreviation: string;
  profile_picture: string;
  created_at: string;
  updated_at: string;
}

export default function EditEndClient() {
  const { end_client_id } = useParams<{ end_client_id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<EndClientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch end client data
  useEffect(() => {
    if (!end_client_id) {
      toast.error("End Client ID is required");
      setIsLoading(false);
      return;
    }

    const source = axios.CancelToken.source();

    const fetchEndClientData = async () => {
      try {
        const response = await apiClient.get(`/end_clients/${end_client_id}`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          console.log("API Response:", response.data);
          setData(response.data);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch end client data"
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "end client data"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchEndClientData();

    return () => {
      source.cancel();
    };
  }, [end_client_id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading end client data...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-muted-foreground">End Client not found</p>
      </div>
    );
  }

  // Transform API response to FormData format expected by AddEndClient
  const editEndClientData = {
    email: data.email || "",
    organization_name: data.organization_name || "",
    attachment: data.attachment || [],
    contact_person: data.contact_person || "",
    address: data.address || "",
    abbreviation: data.abbreviation || "",
    gst_number: data.gst_number || "",
    cin: data.cin || "",
    phone_no: data.phone_no || "",
    profile_picture: data.profile_picture || "",
    phone_code: data.phone_code || 0,
    client_id: data.client_id || 0,
    // Include id for edit mode
    id: data.id || Number(end_client_id),
  };

  // Debug: Log the transformed data
  console.log("EditEndClient data:", editEndClientData);

  const handleRefresh = () => {
    // Navigate back to end clients list after successful update
    navigate("/end-clients");
  };

  const handleClose = () => {
    // Navigate back to end clients list
    navigate("/end-clients");
  };

  return (
    <AddEndClient
      refresh={handleRefresh}
      initialData={editEndClientData}
      onClose={handleClose}
    />
  );
}
