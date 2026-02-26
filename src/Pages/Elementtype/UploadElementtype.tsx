import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  CheckCheck,
  FileSpreadsheet,
  Loader2,
  Upload,
  XCircle,
  AlertTriangle,
  Plus,
  FileText,
} from "lucide-react";

import { apiClient } from "@/utils/apiClient";
import { useProject } from "@/Provider/ProjectProvider";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { CompletedJobTable } from "./CompletedJob";
import { PendingJobTable } from "./PendingJob";
import PageHeader from "@/components/ui/PageHeader";

interface Job {
  job_id: number;
  job_type: string;
  status: string;
  project_id: number;
  created_at: string;
}

const POLL_INTERVAL = 5000;

export default function UploadElementtypePage() {
  const { permissions } = useProject();
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const projectCtx = useProject();
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [totalItems, setTotalItems] = useState<number | null>(null);
  const [processedItems, setProcessedItems] = useState<number | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [terminateLoading, setTerminateLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasViewPermission = permissions?.includes("ViewElement");

  const fetchActiveJob = useCallback(async () => {
    try {
      const { data } = await apiClient.get(
        `/jobs/pending-processing/${projectId}`,
      );
      if (data?.err || data?.error) return;
      if (data.jobs?.length > 0) {
        setActiveJob(data.jobs[0]);
      } else {
        setActiveJob(null);
      }
    } catch {
      /* silently fail — job polling handles errors */
    }
  }, [projectId]);

  const handleCloseUploadDialog = useCallback(() => {
    setUploadDialogOpen(false);
    fetchActiveJob();
  }, [fetchActiveJob]);

  const handleTerminate = useCallback(async () => {
    if (!activeJob) return;
    setTerminateLoading(true);
    try {
      const { data } = await apiClient.delete(
        `/jobs/${activeJob.job_id}/terminate`,
      );
      toast.success("Job terminated", {
        description: `Rolled back ${data.total_rolled_back ?? 0} items.`,
      });
      setActiveJob(null);
      setJobStatus(null);
      setProgress(0);
      setJobError(null);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      fetchActiveJob();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to terminate job.",
      );
    } finally {
      setTerminateLoading(false);
    }
  }, [activeJob, fetchActiveJob]);

  useEffect(() => {
    fetchActiveJob();
  }, [fetchActiveJob]);

  useEffect(() => {
    if (!activeJob) return;

    setJobStatus("pending");
    setJobError(null);

    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await apiClient.get(`/jobs/${activeJob.job_id}`);
        const job = data.job;
        setJobStatus(job.status);
        setProgress(job.progress || 0);
        setTotalItems(job.total_items || null);
        setProcessedItems(job.processed_items || null);

        if (job.status === "completed" || job.status === "failed") {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          if (job.status === "completed") {
            setActiveJob(null);
            window.location.reload();
          } else {
            setJobError(job.error || "Import failed.");
          }
        }
      } catch (err: any) {
        clearInterval(pollingRef.current!);
        pollingRef.current = null;
        setJobError(
          err.response?.data?.message || "Error fetching job status.",
        );
      }
    }, POLL_INTERVAL);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [activeJob]);

  const statusVariant = (
    status: string | null,
  ): "default" | "secondary" | "destructive" | "outline" => {
    if (status === "completed") return "default";
    if (status === "failed") return "destructive";
    return "secondary";
  };

  const isProjectSetupComplete =
    projectCtx?.projectDetails?.is_bom &&
    projectCtx?.projectDetails?.is_drawingtype &&
    projectCtx?.projectDetails?.is_hierachy &&
    projectCtx?.projectDetails?.is_elementtype;

  if (!isProjectSetupComplete) {
    return (
      <div className="w-full p-4">
        <PageHeader title="Upload Element Type" />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center ">
          <div className="w-full max-w-md space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">
                No Completed Jobs Yet
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pending jobs are the jobs that are pending in the project.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-4 text-left space-y-2">
              <h3 className="text-sm font-medium">Getting started</h3>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Create a element type with a descriptive name</li>
                <li>Upload a job to the project</li>
              </ul>
            </div>
            {projectCtx?.projectDetails?.is_hierachy &&
              projectCtx?.projectDetails?.is_bom &&
              projectCtx?.projectDetails?.is_drawingtype &&
              !projectCtx?.projectDetails?.is_elementtype && (
                <Dialog
                  open={uploadDialogOpen}
                  onOpenChange={setUploadDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" disabled={!!activeJob}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Excel
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <UploadDialogContent
                      closeHandler={handleCloseUploadDialog}
                      projectId={projectId}
                    />
                  </DialogContent>
                </Dialog>
              )}
            {/* show the hierachy add button  */}
            {!projectCtx?.projectDetails?.is_hierachy && (
              <Button
                className="gap-2 mr-2"
                onClick={() => navigate(`/project/${projectId}/hierarchy`)}
              >
                <Plus className="w-4 h-4" />
                Add Hierachy
              </Button>
            )}
            {/* show the bom add button  */}
            {!projectCtx?.projectDetails?.is_bom && (
              <Button
                className="gap-2 mr-2"
                onClick={() => navigate(`/project/${projectId}/large-import`)}
              >
                <Plus className="w-4 h-4" />
                Add BOM
              </Button>
            )}
            {/* show the drawing type add button  */}
            {!projectCtx?.projectDetails?.is_drawingtype && (
              <Button
                className="gap-2 mr-2"
                onClick={() => navigate(`/project/${projectId}/drawing`)}
              >
                <Plus className="w-4 h-4" />
                Add Drawing Type
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-primary text-lg font-semibold">
          Element Type Uploads
        </h1>

        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={!!activeJob}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Excel
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <UploadDialogContent
              closeHandler={handleCloseUploadDialog}
              projectId={projectId}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Job Card */}
      {activeJob && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Active Job</CardTitle>
              <Badge variant={statusVariant(jobStatus)}>
                {jobStatus || "pending"}
              </Badge>
            </div>
            <CardAction>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={terminateLoading}
                  >
                    {terminateLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    {terminateLoading ? "Terminating…" : "Terminate"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Terminate this job?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will cancel the import and roll back all processed
                      items. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleTerminate}>
                      Terminate
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardAction>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatBlock label="Job ID" value={String(activeJob.job_id)} />
              <StatBlock label="Progress" value={`${progress}%`} />
              <StatBlock
                label="Total Items"
                value={totalItems != null ? String(totalItems) : "—"}
              />
              <StatBlock
                label="Processed"
                value={processedItems != null ? String(processedItems) : "—"}
              />
            </div>

            <div className="flex flex-col gap-1">
              <Progress
                value={Math.max(0, Math.min(100, progress))}
                className={
                  jobStatus === "failed"
                    ? "[&>[data-slot=progress-indicator]]:bg-destructive"
                    : ""
                }
              />
              <p className="text-muted-foreground text-right text-xs">
                {progress}%
              </p>
            </div>

            {jobError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Import Failed</AlertTitle>
                <AlertDescription>{jobError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      {hasViewPermission && (
        <Tabs defaultValue="completed">
          <TabsList>
            <TabsTrigger value="completed">
              <CheckCheck className="mr-1.5 h-4 w-4" />
              Completed Jobs
            </TabsTrigger>
            <TabsTrigger value="pending">
              <Loader2 className="mr-1.5 h-4 w-4" />
              Pending Jobs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="completed">
            <CompletedJobTable />
          </TabsContent>
          <TabsContent value="pending">
            <PendingJobTable />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted rounded-md p-3">
      <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Upload Dialog                                                      */
/* ------------------------------------------------------------------ */

function UploadDialogContent({
  closeHandler,
  projectId,
}: {
  closeHandler: () => void;
  projectId?: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED_TYPES = new Set([
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!ACCEPTED_TYPES.has(selected.type)) {
      setErrorMessage("Please upload a valid .xlsx or .xls file.");
      setFile(null);
      return;
    }
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMessage("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);

    try {
      const { data } = await apiClient.post(
        `/project/${projectId}/import/excel`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      if (data.message) {
        toast.success("File uploaded successfully");
      } else {
        toast.info("Upload completed — please retry if data is missing.");
      }
      closeHandler();
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || "An error occurred during upload.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Import Excel File</DialogTitle>
        <DialogDescription>
          Upload your Excel file to import element types into this project.
        </DialogDescription>
      </DialogHeader>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3">
        <Label htmlFor="excel-file">Excel file (.xlsx, .xls)</Label>
        <div
          className="border-input hover:border-ring flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <FileSpreadsheet className="text-muted-foreground h-8 w-8" />
          <p className="text-muted-foreground text-sm">
            {file ? file.name : "Click to browse or drag & drop"}
          </p>
          <Input
            ref={inputRef}
            id="excel-file"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={loading}
            className="hidden"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={closeHandler} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleUpload} disabled={loading || !file}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading…
            </>
          ) : (
            "Upload"
          )}
        </Button>
      </DialogFooter>
    </>
  );
}
