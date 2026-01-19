import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios, { type AxiosError } from "axios";

import PageHeader from "@/components/ui/PageHeader";
import { Separator } from "@/components/ui/separator";
import { LoadingState } from "@/components/ui/loading-state";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";

import TowerFloorEditor from "./TowerFloorEditor";

const getErrorMessage = (
  error: AxiosError | unknown,
  _action?: string
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
    return (
      (error.response?.data as any)?.message ||
      "Failed to submit erection request."
    );
  }
  return "An unexpected error occurred. Please try again later.";
};

export default function RequestHandler() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [loading, setLoading] = useState<boolean>(false);

  // Called when the user hits "Submit" in TowerFloorEditor
  const handleSaveAllBlocks = async (allBlocks: {
    [floorId: number]: { element_type_id: number; quantity: number }[];
  }) => {
    if (!projectId) {
      toast.error("Missing project. Please go back and select a project.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post("/stock_erection", allBlocks);

      if (response.status === 200 || response.status === 201) {
        toast.success("Erection request created successfully.");
        navigate(`/project/${projectId}/previouslog`);
      } else {
        toast.error(
          (response.data as any)?.message ||
            "Something went wrong while creating the request."
        );
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error, "submit erection request");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-2 py-4 px-4">
      <div className="flex items-center justify-between">
        <PageHeader title="Create erection request" />
      </div>

      <div className="mt-2 flex flex-col gap-4">
        <TowerFloorEditor onSave={handleSaveAllBlocks} />
        {loading && (
          <LoadingState
            label="Submitting erection request..."
            className="mt-2"
          />
        )}
      </div>
    </div>
  );
}
