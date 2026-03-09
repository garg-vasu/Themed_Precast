import PageHeader from "@/components/ui/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ListChecks } from "lucide-react";
import { useContext, useEffect, useMemo, useState } from "react";

import { ProjectContext } from "@/Provider/ProjectProvider";

import { useNavigate, useParams } from "react-router-dom";
import { StageElementTable } from "./StageElementTable";
import { ProjectSetupGuide } from "@/components/ProjectSetupGuide";
import { apiClient } from "@/utils/apiClient";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

interface TabLink {
  id: string;
  label: string;
  number?: number;
  icon: React.ElementType;
}

export type Stages = {
  name: string;
  id: number;
  completion_stage: boolean;
  paper_id?: number;
  qc_assign: boolean;
  inventory_deduction: boolean;
  order: number;
  assigned_to: number;
  assignee_name: string;
  qc_name: string;
  qc_id?: number;
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
    // Check both 'error' and 'message' fields in the response
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      `Failed to ${data}.`;
    return errorMessage;
  }
  return "An unexpected error occurred. Please try again later.";
};

export default function MixStagewiseElement() {
  const navigate = useNavigate();
  const projectCtx = useContext(ProjectContext);
  const [dataLoading, setDataLoading] = useState(true);
  const [data, setData] = useState<Stages[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { projectId } = useParams<{ projectId: string }>();

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchStages = async () => {
      try {
        const response = await apiClient.get(`/get_allstages/${projectId}`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setData(response.data);
          setError(null);
        } else {
          const errMsg = response.data?.message || "Failed to fetch stages";
          setError(errMsg);
          toast.error(errMsg);
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          const errMsg = getErrorMessage(err, "stages data");
          setError(errMsg);
          toast.error(errMsg);
        }
      } finally {
        setDataLoading(false);
      }
    };

    fetchStages();

    return () => {
      source.cancel();
    };
  }, []);

  // check if the project is setup complete
  const isProjectSetupComplete =
    projectCtx?.projectDetails?.is_stage_member &&
    projectCtx?.projectDetails?.is_member &&
    projectCtx?.projectDetails?.is_assign_stockyard &&
    projectCtx?.projectDetails?.is_paper &&
    projectCtx?.projectDetails?.is_hierachy &&
    projectCtx?.projectDetails?.is_bom &&
    projectCtx?.projectDetails?.is_drawingtype &&
    projectCtx?.projectDetails?.is_elementtype;

  const tabLinks = useMemo<TabLink[]>(() => {
    return data.map((stage) => ({
      id: stage.id.toString(),
      label: stage.name,
      icon: ListChecks,
    }));
  }, [data]);

  // If no tabs are available, show a message
  if (!dataLoading && !error && tabLinks.length === 0) {
    return (
      <div className="flex flex-col gap-2 py-4 px-4">
        <div className="flex items-center justify-between">
          <PageHeader title="Shop Floor Status" />
        </div>
        <div className="text-center py-8 text-muted-foreground">
          No stages available.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex items-center justify-between">
        <PageHeader title="Shop Floor Status" />
      </div>
      {/* conditional render for project setup guide */}
      {!isProjectSetupComplete ? (
        <div className="w-full">
          <ProjectSetupGuide currentStep="is_stage_member" />
        </div>
      ) : dataLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading stages...
        </div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">{error}</div>
      ) : (
        <Tabs defaultValue={tabLinks[0]?.id}>
          {tabLinks.length > 1 && (
            <TabsList className="mb-4 flex h-auto flex-wrap justify-start gap-2">
              {tabLinks.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  <tab.icon className="mr-1.5 h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          )}

          {tabLinks.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              <StageElementTable stage_id={Number(tab.id)} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
