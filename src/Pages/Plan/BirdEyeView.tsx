import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { useParams } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  QrCode,
  Download,
  Loader2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiClient } from "@/utils/apiClient";

export type ListView = {
  task_id: number;
  project_id: number;
  element_type: string;
  element_type_id: number;
  activities: Task[] | null;
};

export type Task = {
  task_id: number;
  id: number;
  project_id: number;
  name: string;
  paper_id: number;
  priority: string;
  assigned_to: number;
  start_date: string;
  qc: boolean;
  end_date: string;
  status: string;
  element_id: number;
  qc_id: number;
  qc_status: string;
  stage_id: number;
  stage_name: string;
  mesh_mold_status: string;
  reinforcement_status: string;
  stages: string[];
  mesh_mold_qc_status: string;
  reinforcement_qc_status: string;
  stockyard_id: Number;
};

export type Stage = {
  id: number;
  name: string;
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
  editable: string;
  qc_editable: string;
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
    return (
      error.response?.data?.error ||
      error.response?.data?.message ||
      `Failed to ${data}.`
    );
  }
  return "An unexpected error occurred. Please try again later.";
};

const TableView = () => {
  const [tasks, setTasks] = useState<ListView[]>([]);
  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { projectId } = useParams<{ projectId: string }>();
  const [downloadingQr, setDownloadingQr] = useState<{
    [key: number]: boolean;
  }>({});
  const [qrPreview, setQrPreview] = useState<{
    isOpen: boolean;
    elementId: number | null;
    qrUrl: string | null;
  }>({
    isOpen: false,
    elementId: null,
    qrUrl: null,
  });

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      setError("Project ID is missing");
      return;
    }

    const source = axios.CancelToken.source();

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get(`/get_allview/${projectId}`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setTasks(Array.isArray(response.data) ? response.data : []);
        } else {
          toast.error(response.data?.message || "Failed to fetch project data");
          setError(response.data?.message || "Failed to fetch project data");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          const errorMessage = getErrorMessage(err, "project data");
          toast.error(errorMessage);
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      source.cancel();
    };
  }, [projectId]);

  const toggleExpand = (index: number) => {
    setExpanded((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const getStatusColor = (status: string, qc_status: string | undefined) => {
    if (status?.toLowerCase() === "inprogress") {
      return "bg-primary";
    }

    if (status?.toLowerCase() === "completed") {
      if (qc_status?.toLowerCase() === "inprogress") {
        return "bg-orange-500";
      }
      if (qc_status?.toLowerCase() === "completed") {
        return "bg-green-500";
      }
    }

    return "bg-muted";
  };

  const getStatusText = (status: string, qc_status: string | undefined) => {
    if (status?.toLowerCase() === "inprogress") {
      return "In Progress";
    }

    if (status?.toLowerCase() === "completed") {
      if (qc_status?.toLowerCase() === "inprogress") {
        return "QC In Progress";
      }
      if (qc_status?.toLowerCase() === "completed") {
        return "Completed";
      }
    }

    return "Not Started";
  };

  const getStageStatus = (
    activity: Task,
    stage: string,
    stageNames: string[]
  ) => {
    const currentStageIndex = stageNames.indexOf(activity.stage_name);
    const thisStageIndex = stageNames.indexOf(stage);

    // If this stage is after the current stage, only show "-" unless all previous are completed
    if (thisStageIndex > currentStageIndex) {
      // Check if all previous stages and their QC are completed
      for (let i = 0; i < thisStageIndex; i++) {
        const prevStage = stageNames[i];
        let status, qc_status;
        if (prevStage === "Mesh & Mould") {
          status = activity.mesh_mold_status;
          qc_status = activity.mesh_mold_qc_status;
        } else if (prevStage === "Reinforcement") {
          status = activity.reinforcement_status;
          qc_status = activity.reinforcement_qc_status;
        } else {
          status = activity.status;
          qc_status = activity.qc_status;
        }
        if (
          status?.toLowerCase() !== "completed" ||
          qc_status?.toLowerCase() !== "completed"
        ) {
          return { status: "Not Started", qc_status: "Not Started" };
        }
      }
      return {
        status: "completed",
        qc_status: "completed",
      };
    }

    // For the current stage, show actual status
    if (thisStageIndex === currentStageIndex) {
      if (stage === "Mesh & Mould") {
        return {
          status: activity.mesh_mold_status,
          qc_status: activity.mesh_mold_qc_status,
        };
      } else if (stage === "Reinforcement") {
        return {
          status: activity.reinforcement_status,
          qc_status: activity.reinforcement_qc_status,
        };
      } else {
        return {
          status: activity.status,
          qc_status: activity.qc_status,
        };
      }
    }

    // For previous stages, show as completed
    return {
      status: "completed",
      qc_status: "completed",
    };
  };

  const handleQrPreview = async (elementId: number) => {
    const source = axios.CancelToken.source();
    try {
      setDownloadingQr((prev) => ({ ...prev, [elementId]: true }));
      const response = await apiClient.get(`/generate-qr/${elementId}`, {
        cancelToken: source.token,
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "image/png" });
      const url = window.URL.createObjectURL(blob);

      setQrPreview({
        isOpen: true,
        elementId,
        qrUrl: url,
      });
    } catch (err: unknown) {
      if (!axios.isCancel(err)) {
        const errorMessage = getErrorMessage(err, "generate QR code");
        toast.error(errorMessage);
      }
    } finally {
      setDownloadingQr((prev) => ({ ...prev, [elementId]: false }));
    }
  };

  const handleQrDownload = async () => {
    if (!qrPreview.elementId || !qrPreview.qrUrl) return;

    try {
      const link = document.createElement("a");
      link.href = qrPreview.qrUrl;
      link.download = `qr-code-${qrPreview.elementId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("QR code downloaded successfully");
    } catch (error) {
      console.error("Error downloading QR code:", error);
      toast.error("Failed to download QR code. Please try again.");
    }
  };

  const closeQrPreview = () => {
    if (qrPreview.qrUrl) {
      window.URL.revokeObjectURL(qrPreview.qrUrl);
    }
    setQrPreview({
      isOpen: false,
      elementId: null,
      qrUrl: null,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!tasks.length) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">No Tasks Available</h3>
          <p className="text-sm">No tasks have been assigned yet.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {tasks.map((listView, index) => {
          const stageNames = [
            ...new Set(
              listView.activities?.flatMap((activity) => activity.stages)
            ),
          ];

          return (
            <div
              key={index}
              className="rounded-lg border overflow-hidden transition-all duration-200 hover:shadow-md"
            >
              <div
                className="flex justify-between items-center p-2 sm:p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => toggleExpand(index)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <h3 className="text-sm font-medium">
                    <span className="font-semibold">Element Type:</span>{" "}
                    {listView.element_type}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    <span className="font-semibold">
                      Elements in Production:
                    </span>{" "}
                    {listView.activities?.length || 0}
                  </span>
                </div>
                <div className="text-muted-foreground hover:text-foreground">
                  {expanded[index] ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>

              {expanded[index] && (
                <div className="border-t overflow-x-auto">
                  <table className="min-w-[600px] w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="border px-2 py-1 min-w-[110px] whitespace-nowrap text-left font-medium">
                          Task Name
                        </th>
                        {stageNames.map((stage, idx) => (
                          <th
                            key={idx}
                            className="border px-2 py-1 min-w-[90px] whitespace-nowrap text-center font-medium"
                          >
                            {stage}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {listView.activities?.map((activity) => (
                        <tr
                          key={activity.id}
                          className="border-b hover:bg-accent/50 transition-colors"
                        >
                          <td className="px-2 py-1 min-w-[110px] whitespace-nowrap font-medium">
                            <div className="flex items-center gap-1">
                              <span className="truncate">{activity.name}</span>
                              <span className="text-xs text-muted-foreground">
                                #{activity.element_id}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-5 px-1 text-xs w-fit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQrPreview(activity.element_id);
                                }}
                                disabled={downloadingQr[activity.element_id]}
                              >
                                {downloadingQr[activity.element_id] ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <QrCode className="h-3 w-3 mr-1" />
                                    QR
                                  </>
                                )}
                              </Button>
                            </div>
                          </td>
                          {stageNames.map((stage) => {
                            const stageData = activity.stages.find(
                              (s) => s === stage
                            );
                            const stageStatus = getStageStatus(
                              activity,
                              stage,
                              stageNames
                            );
                            let status, qc_status;
                            if (stage === "Mesh & Mould") {
                              status = activity.mesh_mold_status;
                              qc_status = activity.mesh_mold_qc_status;
                            } else if (stage === "Reinforcement") {
                              status = activity.reinforcement_status;
                              qc_status = activity.reinforcement_qc_status;
                            } else {
                              status = stageStatus?.status;
                              qc_status = stageStatus?.qc_status;
                            }
                            return (
                              <td
                                key={stage}
                                className="border px-2 py-1 min-w-[90px] whitespace-nowrap text-center"
                              >
                                {stageData ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <span
                                      className={`w-2 h-2 rounded-full ${getStatusColor(
                                        status || "",
                                        qc_status
                                      )}`}
                                    ></span>
                                    <span className="text-xs whitespace-nowrap">
                                      {getStatusText(status || "", qc_status)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    -
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={qrPreview.isOpen} onOpenChange={closeQrPreview}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code Preview</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4">
            {qrPreview.qrUrl && (
              <img
                src={qrPreview.qrUrl}
                alt="QR Code"
                className="max-w-[200px] max-h-[200px] object-contain"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeQrPreview}>
              Close
            </Button>
            <Button onClick={handleQrDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download QR Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TableView;
