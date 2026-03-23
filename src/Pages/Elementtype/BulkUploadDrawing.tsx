import { apiClient } from "@/utils/apiClient";
import axios, { AxiosError } from "axios";
import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
  UploadCloud,
  X,
  Eye,
  Plus,
  Trash2,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";

// ─── Types ───────────────────────────────────────────────────────────

export type Elementtype = {
  id: number;
  quantity: number;
  production_count: number;
  stockyard_count: number;
  dispatch_count: number;
  erection_count: number;
  floor_name: string;
  tower_name: string;
  hierarchy_id: number;
  project_id: number;
  element_type_name: string;
  element_type: string;
  element_type_version: string;
  element_type_id: number;
  thickness: number;
  length: number;
  height: number;
  weight: number;
  created_by: string;
  created_at: string;
  update_at: string;
  in_request_count: number;
};

export type DrawingType = {
  drawings_type_id: number;
  drawing_type_name: string;
  project_id: number;
};

export type UploadedFileResult = {
  original_name: string;
  saved_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
};

export type FileAssignment = {
  drawing_type_id: number | null;
  element_type_ids: Set<number>;
};

// ─── Helpers ─────────────────────────────────────────────────────────

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

const STEPS = [
  {
    label: "Select Element Types",
    description: "Choose one or more element types",
  },
  { label: "Upload Files", description: "Upload drawing files" },
  { label: "Assign Drawings", description: "Map files to element types" },
];

const baseUrl = import.meta.env.VITE_API_URL || "";

// ─── Custom Searchable Multi-Select ──────────────────────────────────
function ElementTypeMultiSelect({
  options,
  selectedIds,
  onChange,
}: {
  options: Elementtype[];
  selectedIds: Set<number>;
  onChange: (ids: Set<number>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (o) =>
        o.element_type.toLowerCase().includes(q) ||
        o.element_type_name.toLowerCase().includes(q),
    );
  }, [options, search]);

  const toggle = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  const selectAll = () => {
    onChange(new Set(options.map((o) => o.element_type_id)));
  };

  const clearAll = () => {
    onChange(new Set());
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-start text-left font-normal truncate h-9 px-3 ${
            selectedIds.size === 0 ? "text-muted-foreground" : ""
          }`}>
          {selectedIds.size > 0
            ? `${selectedIds.size} selected`
            : "Select element types..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-2" align="start">
        <div className="flex gap-2 mb-2 items-center">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="flex items-center gap-2 mb-2 text-xs">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={selectAll}>
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={clearAll}>
            Clear
          </Button>
        </div>
        <ScrollArea className="h-[200px]">
          {filtered.length === 0 && (
            <div className="text-sm text-center text-muted-foreground py-4">
              No results.
            </div>
          )}
          <div className="flex flex-col gap-1 pr-3">
            {filtered.map((et) => (
              <div
                key={et.element_type_id}
                className="flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer"
                onClick={() => toggle(et.element_type_id)}>
                <Checkbox
                  checked={selectedIds.has(et.element_type_id)}
                  className="mt-0.5"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">
                    {et.element_type}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {et.element_type_name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

// ─── Component ───────────────────────────────────────────────────────

export default function BulkUploadDrawing() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  // Data
  const [elementTypes, setElementTypes] = useState<Elementtype[]>([]);
  const [drawingTypes, setDrawingTypes] = useState<DrawingType[]>([]);
  const [loadingElements, setLoadingElements] = useState(true);
  const [loadingDrawingTypes, setLoadingDrawingTypes] = useState(true);

  // Selections & State
  const [selectedElementTypeIds, setSelectedElementTypeIds] = useState<
    Set<number>
  >(new Set());
  const [currentStep, setCurrentStep] = useState(0);
  const [searchElement, setSearchElement] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Step 2 State
  const [selectedLocalFiles, setSelectedLocalFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3 State
  const [uploadedResults, setUploadedResults] = useState<UploadedFileResult[]>(
    [],
  );
  const [activeFiles, setActiveFiles] = useState<Set<string>>(new Set());
  const [assignments, setAssignments] = useState<
    Record<string, FileAssignment>
  >({});

  // ── Fetch data ────────────────────────────────────────────
  useEffect(() => {
    const source = axios.CancelToken.source();
    const fetchElementTypes = async () => {
      try {
        setLoadingElements(true);
        const response = await apiClient.get(
          `/elementtype_fetch/${projectId}`,
          { cancelToken: source.token },
        );
        if (response.status === 200) {
          setElementTypes(response.data.data ?? []);
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "element type data"));
        }
      } finally {
        setLoadingElements(false);
      }
    };

    if (projectId) fetchElementTypes();
    return () => source.cancel();
  }, [projectId]);

  useEffect(() => {
    const source = axios.CancelToken.source();
    const fetchDrawingTypes = async () => {
      try {
        setLoadingDrawingTypes(true);
        const response = await apiClient.get(`/drawingtype/${projectId}`, {
          cancelToken: source.token,
        });
        if (response.status === 200) {
          setDrawingTypes(response.data ?? []);
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "drawing types data"));
        }
      } finally {
        setLoadingDrawingTypes(false);
      }
    };
    if (projectId) fetchDrawingTypes();
    return () => source.cancel();
  }, [projectId]);

  // ── Filtered Element Types (Step 1) ────────────────────────────────
  const filteredElements = useMemo(() => {
    if (!searchElement.trim()) return elementTypes;
    const q = searchElement.toLowerCase();
    return elementTypes.filter(
      (e) =>
        e.element_type.toLowerCase().includes(q) ||
        e.element_type_name.toLowerCase().includes(q) ||
        e.tower_name?.toLowerCase().includes(q) ||
        e.floor_name?.toLowerCase().includes(q),
    );
  }, [elementTypes, searchElement]);

  // ── Selection handlers (Step 1) ────────────────────────────────────
  const toggleElementType = (id: number) => {
    setSelectedElementTypeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllElements = (checked: boolean) => {
    if (checked) {
      setSelectedElementTypeIds(
        new Set(filteredElements.map((e) => e.element_type_id)),
      );
    } else {
      setSelectedElementTypeIds(new Set());
    }
  };

  // ── Upload Handlers (Step 2) ───────────────────────────────────────
  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setSelectedLocalFiles((prev) => [...prev, ...filesArr]);
    }
    // reset input value so re-selecting same file triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeLocalFile = (index: number) => {
    setSelectedLocalFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBulkUpload = async () => {
    if (selectedLocalFiles.length === 0) return;

    const formData = new FormData();
    selectedLocalFiles.forEach((file) => formData.append("files", file));

    try {
      setUploading(true);
      const response = await apiClient.post(`/upload/bulk_files`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200 && response.data?.results) {
        toast.success(`Successfully uploaded ${response.data.succeeded} files`);
        const results = response.data.results as UploadedFileResult[];

        // Setup initial state for Step 3
        setUploadedResults(results);
        const activeSet = new Set(results.map((r) => r.saved_name));
        setActiveFiles(activeSet);

        const initialAssignments: Record<string, FileAssignment> = {};
        results.forEach((r) => {
          initialAssignments[r.saved_name] = {
            drawing_type_id: null,
            element_type_ids: new Set(),
          };
        });
        setAssignments(initialAssignments);
        setSelectedLocalFiles([]); // clear local selection
        setCurrentStep(2); // Move to Step 3
      } else {
        toast.error("Upload responded but format was unexpected.");
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "upload files"));
    } finally {
      setUploading(false);
    }
  };

  // ── Navigation ─────────────────────────────────────────────────────
  const canGoNext = () => {
    if (currentStep === 0) return selectedElementTypeIds.size > 0;
    if (currentStep === 1) return selectedLocalFiles.length > 0; // Handled by Upload button, but check if user wants to skip. Actually, we shouldn't let them go next without uploading.
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      handleBulkUpload();
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // ── Assignment Handlers (Step 3) ───────────────────────────────────

  // Element types available for selection (restricted to Step 1 subset)
  const availableElementTypes = useMemo(() => {
    return elementTypes.filter((et) =>
      selectedElementTypeIds.has(et.element_type_id),
    );
  }, [elementTypes, selectedElementTypeIds]);

  const updateAssignmentDrawingType = (
    savedName: string,
    drawingTypeId: number,
  ) => {
    setAssignments((prev) => ({
      ...prev,
      [savedName]: {
        ...prev[savedName],
        drawing_type_id: drawingTypeId,
      },
    }));
  };

  const updateAssignmentElementTypes = (
    savedName: string,
    ids: Set<number>,
  ) => {
    setAssignments((prev) => ({
      ...prev,
      [savedName]: {
        ...prev[savedName],
        element_type_ids: ids,
      },
    }));
  };

  const toggleCancelFile = (savedName: string, cancel: boolean) => {
    setActiveFiles((prev) => {
      const next = new Set(prev);
      if (cancel) next.delete(savedName);
      else next.add(savedName);
      return next;
    });
  };

  // ── Validation & Submit ────────────────────────────────────────────
  const validateAssignments = (): boolean => {
    const activeArr = uploadedResults.filter((r) =>
      activeFiles.has(r.saved_name),
    );
    if (activeArr.length === 0) return false;

    for (const file of activeArr) {
      const assign = assignments[file.saved_name];
      // File must have drawing type AND at least one element type
      if (
        !assign ||
        !assign.drawing_type_id ||
        assign.element_type_ids.size === 0
      ) {
        return false;
      }
    }
    return true;
  };

  const handleSubmitClick = () => {
    if (!validateAssignments()) {
      toast.error(
        "Please ensure all active files have a Drawing Type and at least one Element Type assigned.",
      );
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    const activeArr = uploadedResults.filter((r) =>
      activeFiles.has(r.saved_name),
    );

    const payloadAssignments = activeArr.map((file) => {
      const assign = assignments[file.saved_name];
      return {
        saved_name: file.saved_name,
        original_name: file.original_name,
        file_path: file.file_path,
        file_size: file.file_size,
        drawing_type_id: assign.drawing_type_id,
        element_type_ids: Array.from(assign.element_type_ids),
      };
    });

    const payload = {
      assignments: payloadAssignments,
    };

    try {
      setSubmitting(true);
      setShowConfirmDialog(false);
      const response = await apiClient.post(
        `/bulk_assign_drawings/${projectId}`,
        payload,
      );

      if (response.status === 200 || response.status === 201) {
        toast.success("Drawings successfully assigned!");
        navigate(`/project/${projectId}/element-type`); // Redirect or reset
      } else {
        toast.error(
          response.data?.message || "Failed to submit drawing assignments.",
        );
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "submit assignments"));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading skeleton ───────────────────────────────────────────────
  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );

  // ── Step indicator ─────────────────────────────────────────────────
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-1 sm:gap-3 mb-6">
      {STEPS.map((step, idx) => {
        const isActive = idx === currentStep;
        const isCompleted = idx < currentStep;
        return (
          <div key={idx} className="flex items-center gap-1 sm:gap-2">
            {idx > 0 && (
              <div
                className={`hidden sm:block h-px w-6 lg:w-12 ${
                  isCompleted ? "bg-primary" : "bg-border"
                }`}
              />
            )}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div
                className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}>
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </div>
              <div className="hidden md:block">
                <p
                  className={`text-xs sm:text-sm font-medium leading-tight ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}>
                  {step.label}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════════

  const activeResults = uploadedResults.filter((r) =>
    activeFiles.has(r.saved_name),
  );
  const canceledResults = uploadedResults.filter(
    (r) => !activeFiles.has(r.saved_name),
  );

  return (
    <div className="w-full p-4">
      <PageHeader title="Bulk Drawing Upload" />

      <StepIndicator />

      {/* ──── STEP 1: Select Element Types ──────────────────────────── */}
      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Step 1: Select Target Element Types
            </CardTitle>
            <CardDescription>
              Choose the subset of element types you may assign drawings to.
              <Badge variant="secondary" className="ml-2">
                {selectedElementTypeIds.size} selected
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search element types..."
              value={searchElement}
              onChange={(e) => setSearchElement(e.target.value)}
            />

            {loadingElements ? (
              <LoadingSkeleton />
            ) : filteredElements.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No element types found.
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 py-2 px-3 rounded-md bg-muted/50">
                  <Checkbox
                    id="select-all-elements"
                    checked={
                      filteredElements.length > 0 &&
                      filteredElements.every((e) =>
                        selectedElementTypeIds.has(e.element_type_id),
                      )
                    }
                    onCheckedChange={(checked) => toggleAllElements(!!checked)}
                  />
                  <Label
                    htmlFor="select-all-elements"
                    className="cursor-pointer text-sm font-medium">
                    Select All ({filteredElements.length})
                  </Label>
                </div>

                <ScrollArea className="h-[360px] sm:h-[420px]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {filteredElements.map((et) => {
                      const isChecked = selectedElementTypeIds.has(
                        et.element_type_id,
                      );
                      return (
                        <div
                          key={et.element_type_id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50 ${
                            isChecked
                              ? "border-primary bg-primary/5"
                              : "border-border"
                          }`}
                          onClick={() => toggleElementType(et.element_type_id)}>
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() =>
                              toggleElementType(et.element_type_id)
                            }
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {et.element_type}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {et.element_type_name}
                            </p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {et.tower_name && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0">
                                  {et.tower_name}
                                </Badge>
                              )}
                              {et.floor_name && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0">
                                  {et.floor_name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ──── STEP 2: Upload Files ──────────────────────────────────── */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Step 2: Upload Drawings</CardTitle>
            <CardDescription>
              Select drawing files from your computer to upload.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/20 hover:bg-muted/50 transition-colors w-full cursor-pointer"
              onClick={() => fileInputRef.current?.click()}>
              <UploadCloud className="size-10 text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">Click to select files</p>
              <p className="text-xs text-muted-foreground">
                PDFs, images, or drawings
              </p>
              <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleLocalFileSelect}
              />
            </div>

            {selectedLocalFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">
                    {selectedLocalFiles.length} File(s) Selected
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLocalFiles([])}>
                    Clear All
                  </Button>
                </div>
                <ScrollArea className="h-[240px] border rounded-md p-2">
                  <ul className="space-y-2">
                    {selectedLocalFiles.map((f, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between p-2 rounded bg-muted/40 text-sm">
                        <span className="truncate pr-4 flex-1">{f.name}</span>
                        <span className="text-xs text-muted-foreground mr-4">
                          {(f.size / 1024).toFixed(1)} KB
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeLocalFile(idx)}>
                          <X className="size-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ──── STEP 3: Assign Drawings ───────────────────────────────── */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Step 3: Assign Drawings</CardTitle>
            <CardDescription>
              Map your uploaded files to a Drawing Type and target Element
              Types.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {canceledResults.length > 0 && (
              <div className="border border-destructive/20 bg-destructive/5 rounded-md p-4">
                <h4 className="text-sm font-semibold text-destructive mb-2 flex items-center gap-2">
                  <Trash2 className="size-4" />
                  Canceled Files ({canceledResults.length})
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  These files will not be assigned or submitted.
                </p>
                <div className="flex flex-wrap gap-2">
                  {canceledResults.map((r) => (
                    <Badge
                      key={r.saved_name}
                      variant="outline"
                      className="flex items-center gap-1.5 py-1 px-2">
                      <span className="truncate max-w-[150px]">
                        {r.original_name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 rounded-full hover:bg-background"
                        onClick={() => toggleCancelFile(r.saved_name, false)}>
                        <Plus className="size-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%]">File Info</TableHead>
                    <TableHead className="w-[30%]">Drawing Type</TableHead>
                    <TableHead className="w-[35%]">Element Types</TableHead>
                    <TableHead className="w-[5%] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeResults.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-muted-foreground">
                        No active files to assign. Please restore canceled
                        files.
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeResults.map((r) => {
                      const assign = assignments[r.saved_name];
                      if (!assign) return null;

                      return (
                        <TableRow key={r.saved_name}>
                          <TableCell>
                            <div className="flex flex-col gap-1.5">
                              <span
                                className="text-sm font-medium truncate max-w-[200px]"
                                title={r.original_name}>
                                {r.original_name}
                              </span>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] font-normal">
                                  {(r.file_size / 1024).toFixed(1)} KB
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-xs"
                                  onClick={() =>
                                    window.open(
                                      `${baseUrl}/get-file?file=${encodeURIComponent(r.saved_name)}`,
                                      "_blank",
                                    )
                                  }>
                                  <Eye className="size-3 mr-1" /> Preview
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={assign.drawing_type_id?.toString() || ""}
                              onValueChange={(val) =>
                                updateAssignmentDrawingType(
                                  r.saved_name,
                                  Number(val),
                                )
                              }>
                              <SelectTrigger className="w-full text-xs h-9">
                                <SelectValue placeholder="Select type..." />
                              </SelectTrigger>
                              <SelectContent>
                                {drawingTypes.map((dt) => (
                                  <SelectItem
                                    key={dt.drawings_type_id}
                                    value={dt.drawings_type_id.toString()}>
                                    {dt.drawing_type_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {!assign.drawing_type_id && (
                              <p className="text-[10px] text-destructive mt-1">
                                Required
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <ElementTypeMultiSelect
                              options={availableElementTypes}
                              selectedIds={assign.element_type_ids}
                              onChange={(ids) =>
                                updateAssignmentElementTypes(r.saved_name, ids)
                              }
                            />
                            {assign.element_type_ids.size === 0 && (
                              <p className="text-[10px] text-destructive mt-1">
                                Minimum 1 required
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                toggleCancelFile(r.saved_name, true)
                              }
                              title="Remove File">
                              <X className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ──── Bottom navigation bar ─────────────────────────────────── */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t">
        <Button
          variant="outline"
          disabled={currentStep === 0 || uploading || submitting}
          onClick={handleBack}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          {selectedElementTypeIds.size > 0 && (
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {selectedElementTypeIds.size} Target Element(s)
            </Badge>
          )}
          {currentStep >= 1 &&
            selectedLocalFiles.length > 0 &&
            currentStep < 2 && (
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {selectedLocalFiles.length} File(s)
              </Badge>
            )}
          {currentStep === 2 && activeResults.length > 0 && (
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {activeResults.length} Active File(s)
            </Badge>
          )}
        </div>

        {currentStep === 0 ? (
          <Button disabled={!canGoNext()} onClick={handleNext}>
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : currentStep === 1 ? (
          <Button disabled={!canGoNext() || uploading} onClick={handleNext}>
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                Upload & Next
                <UploadCloud className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        ) : (
          <Button
            disabled={
              submitting || activeResults.length === 0 || !validateAssignments()
            }
            onClick={handleSubmitClick}
            className="bg-primary hover:bg-primary/90">
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Assignments
              </>
            )}
          </Button>
        )}
      </div>

      {/* ──── Confirmation Dialog ──────── */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Submit</DialogTitle>
            <DialogDescription>
              Are you sure you want to assign these {activeResults.length}{" "}
              drawings?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Confirm & Submit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
