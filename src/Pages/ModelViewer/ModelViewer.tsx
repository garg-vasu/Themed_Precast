import { useState, useRef, useCallback } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UploadCloud,
  RotateCcw,
  Maximize2,
  Box,
  Trash2,
  FileUp,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Info,
  Cube,
  Eye,
  Settings2,
} from "lucide-react";
import XeokitViewer, { XeokitViewerHandle } from "./XeokitViewer";

type ViewerStatus = "idle" | "loading" | "loaded" | "error";

export default function ModelViewer() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<ViewerStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [modelInfo, setModelInfo] = useState<{
    name: string;
    size: string;
    type: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const viewerRef = useRef<XeokitViewerHandle | null>(null);
  const [isOrtho, setIsOrtho] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleFile = useCallback(
    (selectedFile: File) => {
      const validExtensions = [".ifc", ".gltf", ".glb", ".obj", ".stl", ".xkt"];
      const ext = selectedFile.name
        .substring(selectedFile.name.lastIndexOf("."))
        .toLowerCase();

      if (!validExtensions.includes(ext)) {
        setStatus("error");
        if (ext === ".dwg" || ext === ".dxf") {
          setErrorMsg(
            `AutoCAD formats (${ext}) are not natively supported in the browser. Please export your drawing as an IFC file and upload it here.`,
          );
        } else {
          setErrorMsg(
            `Unsupported file format "${ext}". Please upload IFC, glTF, OBJ, STL, or XKT files.`,
          );
        }
        return;
      }

      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }

      const url = URL.createObjectURL(selectedFile);
      setFile(selectedFile);
      setFileUrl(url);
      setStatus("loading");
      setErrorMsg("");
      setModelInfo({
        name: selectedFile.name,
        size: formatFileSize(selectedFile.size),
        type: ext.replace(".", "").toUpperCase(),
      });
    },
    [fileUrl],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFile(droppedFile);
      }
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFile(selectedFile);
      }
    },
    [handleFile],
  );

  const handleRemoveModel = useCallback(() => {
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }
    setFile(null);
    setFileUrl(null);
    setStatus("idle");
    setErrorMsg("");
    setModelInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [fileUrl]);

  const handleModelLoaded = useCallback(() => {
    setStatus("loaded");
  }, []);

  const handleModelError = useCallback((error: string) => {
    console.error("Model Error:", error);
    setStatus("error");
    setErrorMsg(error);
  }, []);

  const toggleProjection = () => {
    const next = !isOrtho;
    setIsOrtho(next);
    viewerRef.current?.setOrtho(next);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] overflow-hidden p-6 gap-6 bg-slate-50/50 dark:bg-slate-950/50">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <PageHeader title="3D Model Viewer" />
          <p className="text-sm text-muted-foreground mt-1">
            Upload and visualize IFC building models directly in your browser.
          </p>
        </div>

        {status === "loaded" && modelInfo && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in fade-in zoom-in duration-300">
            <CheckCircle2 className="h-4 w-4" />
            <span>Model Loaded: {modelInfo.name}</span>
          </div>
        )}
      </div>

      {status === "idle" && (
        <div className="flex-1 flex items-center justify-center animate-in fade-in zoom-in duration-500">
          <Card
            className={`w-full max-w-2xl border-2 border-dashed transition-all duration-300 shadow-sm ${
              isDragging
                ? "border-primary bg-primary/5 scale-[1.02] shadow-primary/10 shadow-xl"
                : "border-muted-foreground/25 hover:border-primary/50 hover:shadow-md hover:bg-muted/30"
            }`}>
            <CardContent className="p-0">
              <div
                className="flex flex-col items-center justify-center py-20 px-10 cursor-pointer text-center"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}>
                <div
                  className={`p-6 rounded-3xl mb-6 transition-all duration-500 shadow-sm ${
                    isDragging
                      ? "bg-primary text-primary-foreground scale-110 shadow-primary/20"
                      : "bg-white dark:bg-slate-900 text-primary border shadow-sm group-hover:scale-105"
                  }`}>
                  <UploadCloud className="h-10 w-10" strokeWidth={1.5} />
                </div>

                <h3 className="text-xl font-semibold tracking-tight mb-2">
                  {isDragging ? "Drop your model file here" : "Upload 3D Model"}
                </h3>

                <p className="text-muted-foreground/80 mb-8 max-w-sm">
                  Drag and drop your structural or architectural model file
                  here, or click to browse your computer.
                </p>

                <div className="flex flex-wrap gap-2 justify-center mb-8">
                  {["IFC", "glTF", "GLB", "OBJ", "STL", "XKT"].map((fmt) => (
                    <span
                      key={fmt}
                      className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border">
                      {fmt}
                    </span>
                  ))}
                </div>

                <Button
                  size="lg"
                  className="rounded-full shadow-sm"
                  type="button">
                  <FileUp className="h-4 w-4 mr-2" />
                  Select File
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".ifc,.gltf,.glb,.obj,.stl,.xkt"
                  onChange={handleFileInput}
                  className="hidden"
                  id="model-file-input"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {(status === "loading" ||
        status === "loaded" ||
        (status === "error" && fileUrl)) &&
        fileUrl &&
        file && (
          <div className="flex-1 flex flex-col gap-4 min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 border rounded-xl p-2 shadow-sm shrink-0">
              <div className="flex items-center gap-2 px-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Box className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium leading-none truncate max-w-[200px] sm:max-w-xs">
                    {modelInfo?.name}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {modelInfo?.size} • {modelInfo?.type}
                  </span>
                </div>
              </div>

              <div className="h-6 w-px bg-border mx-2 hidden sm:block" />

              <div className="flex items-center gap-1.5 flex-1 justify-center overflow-x-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-2"
                  onClick={() => viewerRef.current?.resetCamera()}
                  title="Reset Camera"
                  disabled={status !== "loaded"}>
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden md:inline">Reset</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-2"
                  onClick={() => viewerRef.current?.fitModel()}
                  title="Fit to Screen"
                  disabled={status !== "loaded"}>
                  <Maximize2 className="h-4 w-4" />
                  <span className="hidden md:inline">Fit</span>
                </Button>
                <div className="h-4 w-px bg-border mx-1" />
                <Button
                  variant={isOrtho ? "secondary" : "ghost"}
                  size="sm"
                  className="h-9 gap-2"
                  onClick={toggleProjection}
                  title="Toggle Orthographic"
                  disabled={status !== "loaded"}>
                  <Eye className="h-4 w-4" />
                  <span className="hidden md:inline">
                    {isOrtho ? "Perspective" : "Ortho"}
                  </span>
                </Button>
              </div>

              <div className="h-6 w-px bg-border mx-2 hidden sm:block" />

              <div className="flex items-center gap-2 px-1 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 hidden sm:flex"
                  onClick={() => fileInputRef.current?.click()}>
                  <FileUp className="h-4 w-4 mr-2" />
                  Replace
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-9"
                  onClick={handleRemoveModel}>
                  <Trash2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Remove</span>
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".ifc,.gltf,.glb,.obj,.stl,.xkt"
                  onChange={handleFileInput}
                  className="hidden"
                  id="model-file-input-toolbar"
                />
              </div>
            </div>

            {/* Viewer Container */}
            <Card className="flex-1 overflow-hidden border-0 shadow-xl ring-1 ring-border relative rounded-2xl bg-slate-100 dark:bg-slate-900/50">
              <CardContent className="p-0 h-full w-full relative">
                <XeokitViewer
                  ref={viewerRef}
                  fileUrl={fileUrl}
                  fileName={file.name}
                  onLoaded={handleModelLoaded}
                  onError={handleModelError}
                />

                {/* Loading Overlay */}
                {status === "loading" && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-md flex flex-col items-center justify-center z-20 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 border shadow-2xl rounded-2xl p-8 flex flex-col items-center max-w-sm w-full mx-4">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full mix-blend-multiply dark:mix-blend-screen animate-pulse" />
                        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 relative z-10">
                          <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        </div>
                      </div>
                      <h4 className="text-lg font-semibold mb-2">
                        Processing Model
                      </h4>
                      <p className="text-sm text-center text-muted-foreground whitespace-pre-wrap">
                        Parsing IFC geometries and materials.{"\n"}This might
                        take a few moments for large files.
                      </p>

                      <div className="w-full bg-secondary h-1.5 rounded-full mt-6 overflow-hidden">
                        <div
                          className="h-full bg-primary w-full animate-pulse origin-left scale-x-75 will-change-transform"
                          style={{ animationDuration: "2s" }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Embedded Help Overlay */}
                {status === "loaded" && (
                  <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
                    <div className="bg-background/80 backdrop-blur-md border rounded-xl p-3 shadow-lg pointer-events-auto transition-opacity hover:opacity-100 opacity-60">
                      <div className="flex flex-col gap-2 text-xs font-medium text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-6 h-6 rounded bg-muted border shrink-0">
                            L
                          </span>
                          <span>Orbit (Left Drag)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-6 h-6 rounded bg-muted border shrink-0">
                            R
                          </span>
                          <span>Pan (Right Drag)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex flex-col justify-center items-center w-6 h-6 rounded bg-muted border shrink-0 space-y-[2px]">
                            <div className="w-1 h-1 rounded-full bg-current" />
                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                          </span>
                          <span>Zoom (Scroll)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

      {status === "error" && !fileUrl && (
        <div className="flex-1 flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="w-full max-w-md border-red-200 dark:border-red-900/50 shadow-sm overflow-hidden">
            <div className="h-2 bg-red-500 w-full" />
            <CardContent className="flex flex-col items-center py-10 px-8 text-center">
              <div className="h-16 w-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-6 border border-red-100 dark:border-red-500/20 text-red-500">
                <AlertTriangle className="h-8 w-8" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Unsupported Format
              </h3>

              <p className="text-muted-foreground mb-8 text-sm">{errorMsg}</p>

              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setStatus("idle");
                    setErrorMsg("");
                  }}>
                  Go Back
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={() => fileInputRef.current?.click()}>
                  <UploadCloud className="h-4 w-4" />
                  Select File
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
