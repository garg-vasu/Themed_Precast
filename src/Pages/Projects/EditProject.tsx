import { apiClient } from "@/utils/apiClient";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AddProjects from "./AddProjects";

interface EditProject {
  project_id: number;
  subscription_start_date: string;
  subscription_end_date: string;
  description: string;
  name: string;
  abbreviation?: string;
  priority: string;
  project_status: string;
  start_date: string;
  end_date: string;
  budget: string;
  client_name: string;
  client_id: number;
  logo: string;
  total_elements: number;
  completed_elements: number;
  progress: number;
  template_id: number;
  stockyards: editStockyard[];
  roles?: { role_id: number; quantity: number }[];
}

type editStockyard = {
  id: number;
  yard_name: string;
  location: string;
  created_at: string;
  updated_at: string;
  carpet_area: number;
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

export default function EditProject() {
  const [data, setData] = useState<EditProject>();
  const { project_id } = useParams();
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchProjectRoles = async () => {
      try {
        const response = await apiClient.get(`/project_get/${project_id} `, {
          cancelToken: source.token,
        });

        if (response.status === 200 || response.status === 201) {
          setData(response.data);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch project roles data"
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "project roles data"));
        }
      }
    };

    fetchProjectRoles();

    return () => {
      source.cancel();
    };
  }, []);

  return <AddProjects user={data} />;
}
