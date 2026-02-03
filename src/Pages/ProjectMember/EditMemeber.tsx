import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";

import { Loader2 } from "lucide-react";
import type { EditMember } from "./AddMember";
import AddMember from "./AddMember";

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

type User = {
  id: number;
  employee_id: string;
  email: string;
  suspended: boolean;
  project_suspend: boolean;
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
  phone_code: number;
  role_id: number;
  role_name: string;
  password: string;
};

export default function EditMember() {
  const [data, setData] = useState<User | null>(null);
  const { user_id } = useParams<{ user_id: string }>();
  const { projectId } = useParams<{ projectId: string }>();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch tenant data
  useEffect(() => {
    if (!user_id) {
      toast.error("User ID is required");
      setIsLoading(false);
      return;
    }

    const source = axios.CancelToken.source();

    const fetchUserData = async () => {
      try {
        const response = await apiClient.get(`/user_fetch/${user_id}`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          console.log("API Response:", response.data);
          setData(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch user data");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "user data"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();

    return () => {
      source.cancel();
    };
  }, [user_id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-muted-foreground">User not found</p>
      </div>
    );
  }

  // Transform API response to EditTenant format
  // Use client_id as the id (since that's what we send in the payload)
  const userId = data.id || Number(user_id);

  const editMemberData: EditMember = {
    id: Number(userId),
    role_id: data.role_id || 0,
    email: data.email || "",
    password: data.password || "",
    first_name: data.first_name || "",
    last_name: data.last_name || "",
    address: data.address || "",
    employee_id: data.employee_id || "",
    city: data.city || "",
    state: data.state || "",
    country: data.country || "",
    zipCode: data.zip_code || "",
    phone_no: data.phone_no || "",
    phone_code: data.phone_code || 0,
    profile_picture: data.profile_picture || "",
    emailsend: false,
  };

  // Debug: Log the transformed data
  console.log("EditMember data:", editMemberData);

  return <AddMember user={editMemberData} />;
}
