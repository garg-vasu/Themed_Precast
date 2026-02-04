import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import QuestionAnswerBlock from "@/components/QuestionAnswerBlock";
import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";

// Types
export type ListView = {
  task_id: number;
  project_id: number;
  element_type: string;
  element_type_id: string;
  activities: Task[];
};

export type Task = {
  task_id: number;
  MeshMold: boolean;
  Other: boolean;
  Reinforcement: boolean;
  id: number;
  mesh_mold_status: string;
  reinforcement_status: string;
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

export default function PendingTask() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lists, setLists] = useState<ListView[]>([]);
  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});
  const [isOpen, setIsOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Task | null>(null);
  const { projectId } = useParams<{ projectId: string }>();
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [pendingActivityId, setPendingActivityId] = useState<number | null>(
    null
  );

  const handleStatusChange = async (
    newStatus: string,
    id: number,
    role: string
  ) => {
    setLoading(true);
    const data: { qc_status?: string; status?: string; activity_id: number } = {
      activity_id: id,
    };

    if (role === "qc") {
      data.qc_status = newStatus;
    } else {
      data.status = newStatus;
    }

    try {
      const response = await apiClient.put("/update_activity_status", data);

      if (response.status === 200 || response.status === 201) {
        toast.success("Status updated successfully!");
        fetchTask();
      } else {
        toast.error(response.data?.message || "Failed to update status");
      }
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, "update status");
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchTask = async () => {
    const source = axios.CancelToken.source();
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/get_activity/${projectId}`, {
        cancelToken: source.token,
      });

      if (response.status === 200) {
        setLists(Array.isArray(response.data) ? response.data : []);
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

    return () => {
      source.cancel();
    };
  };

  useEffect(() => {
    if (projectId) {
      fetchTask();
    }
  }, [projectId]);

  const handleCloseDialog = () => {
    setIsOpen(false);
    setSelectedActivity(null);
    fetchTask();
  };

  const toggleExpand = (taskId: number) => {
    setExpanded((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
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

  if (!lists.length) {
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
    <div className="space-y-2 sm:space-y-4">
      {lists.map((list) => (
        <div
          key={list.task_id}
          className="rounded-lg border overflow-hidden transition-all duration-200 hover:shadow-md"
        >
          <div
            className="flex justify-between items-center p-2 sm:p-3 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() =>
              list.activities.length > 0 && toggleExpand(list.task_id)
            }
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <h3 className="text-sm sm:text-base font-medium">
                {list.element_type}
              </h3>
              <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                {list.activities.length} Elements
              </span>
            </div>

            {list.activities.length > 0 && (
              <div className="text-muted-foreground hover:text-foreground">
                {expanded[list.task_id] ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            )}
          </div>

          {expanded[list.task_id] && (
            <div className="border-t">
              {/* Mobile Layout */}
              <div className="block md:hidden">
                <div className="p-2 text-xs font-medium text-muted-foreground border-b bg-muted/50">
                  Activities
                </div>
                {list.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-2 border-b hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-muted-foreground">
                          Name:
                        </span>
                        <span className="text-sm font-medium">
                          {activity.element_id}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-muted-foreground">
                          Stage:
                        </span>
                        <span className="text-sm">{activity.stage_name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-muted-foreground">
                          QC Status:
                        </span>
                        <div className="text-sm">
                          {activity.qc ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs px-2 py-1"
                              onClick={() => {
                                setSelectedActivity(activity);
                                setIsOpen(true);
                              }}
                            >
                              {activity.qc_status || "InProgress"}
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              {activity.qc_status}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-muted-foreground">
                          Status:
                        </span>
                        <div>
                          {activity.qc ? (
                            <span className="text-sm capitalize">
                              {activity.stage_name === "Mesh & Mould"
                                ? activity.mesh_mold_status
                                : activity.stage_name === "Reinforcement"
                                ? activity.reinforcement_status
                                : activity.status}
                            </span>
                          ) : (
                            <Select
                              onValueChange={(newStatus) => {
                                setPendingStatus(newStatus);
                                setPendingActivityId(activity.id);
                                setConfirmModalOpen(true);
                              }}
                              value={
                                activity.stage_name === "Mesh & Mould"
                                  ? activity.mesh_mold_status
                                  : activity.stage_name === "Reinforcement"
                                  ? activity.reinforcement_status
                                  : activity.status
                              }
                            >
                              <SelectTrigger className="w-full text-xs">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="completed">
                                  Completed
                                </SelectItem>
                                <SelectItem value="Inprogress">
                                  In Progress
                                </SelectItem>
                                <SelectItem value="Onhold">On Hold</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:block">
                <div className="grid grid-cols-4 gap-2 p-3 text-xs font-medium text-muted-foreground bg-muted/50">
                  <div>Name</div>
                  <div>Current Stage</div>
                  <div>QC Status</div>
                  <div>Update Status</div>
                </div>

                {list.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="grid grid-cols-4 gap-2 p-3 border-t hover:bg-accent/50 transition-colors items-center"
                  >
                    <div className="text-sm font-medium">
                      {activity.element_id}
                    </div>
                    <div className="text-sm">{activity.stage_name}</div>
                    <div className="text-sm">
                      {activity.qc ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full md:w-auto text-left"
                          onClick={() => {
                            setSelectedActivity(activity);
                            setIsOpen(true);
                          }}
                        >
                          {activity.qc_status || "InProgress"}
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          {activity.qc_status}
                        </span>
                      )}
                    </div>
                    <div>
                      {activity.qc ? (
                        <span className="text-sm capitalize">
                          {activity.stage_name === "Mesh & Mould"
                            ? activity.mesh_mold_status
                            : activity.stage_name === "Reinforcement"
                            ? activity.reinforcement_status
                            : activity.status}
                        </span>
                      ) : (
                        <Select
                          onValueChange={(newStatus) => {
                            setPendingStatus(newStatus);
                            setPendingActivityId(activity.id);
                            setConfirmModalOpen(true);
                          }}
                          value={
                            activity.MeshMold === true
                              ? activity.mesh_mold_status
                              : activity.Reinforcement === true
                              ? activity.reinforcement_status
                              : activity.status
                          }
                        >
                          <SelectTrigger className="w-full text-sm">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="InProgress">
                              In Progress
                            </SelectItem>
                            <SelectItem value="Onhold">On Hold</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
      {/* QC Questions Dialog */}
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setSelectedActivity(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>QC Questions</DialogTitle>
          </DialogHeader>
          {selectedActivity && (
            <QuestionAnswerBlock
              activityId={selectedActivity.id}
              taskId={selectedActivity.task_id}
              paperId={selectedActivity.paper_id}
              projectId={selectedActivity.project_id}
              stage_id={selectedActivity.stage_id}
              close={handleCloseDialog}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for status change */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
          </DialogHeader>
          <div>
            Are you sure you want to set the status to <b>{pendingStatus}</b>?
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (pendingStatus && pendingActivityId) {
                  handleStatusChange(
                    pendingStatus,
                    pendingActivityId,
                    "member"
                  );
                }
                setConfirmModalOpen(false);
              }}
            >
              Yes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
