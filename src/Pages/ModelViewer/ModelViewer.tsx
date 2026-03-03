import { useState, useRef, useCallback } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  RotateCcw,
  Maximize2,
  Box,
  Trash2,
  FileUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Move3D,
} from "lucide-react";
import XeokitViewer from "./XeokitViewer";

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
  const viewerRef = useRef<{
    resetCamera: () => void;
    fitModel: () => void;
    setOrtho: (v: boolean) => void;
  } | null>(null);
  const [isOrtho, setIsOrtho] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleFile = useCallback(
    (selectedFile: File) => {
      // Validate file type
      const validExtensions = [".ifc", ".gltf", ".glb", ".obj", ".stl", ".xkt"];
      const ext = selectedFile.name
        .substring(selectedFile.name.lastIndexOf("."))
        .toLowerCase();

      if (!validExtensions.includes(ext)) {
        setStatus("error");
        setErrorMsg(
          `Unsupported file format "${ext}". Please upload IFC, glTF, OBJ, STL, or XKT files.`,
        );
        return;
      }

      // Revoke previous URL
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
    setStatus("error");
    setErrorMsg(error);
  }, []);

  const toggleProjection = () => {
    const next = !isOrtho;
    setIsOrtho(next);
    viewerRef.current?.setOrtho(next);
  };

  return (
    <div className="space-y-4 p-4">
      <PageHeader title="3D Model Viewer" />

      {/* Status Bar */}
      {modelInfo && status !== "idle" && (
        <div
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm transition-all duration-300 ${
            status === "loading"
              ? "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300"
              : status === "loaded"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
                : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300"
          }`}>
          {status === "loading" && (
            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
          )}
          {status === "loaded" && (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          )}
          {status === "error" && (
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            {status === "loading" && (
              <span>
                Loading <strong>{modelInfo.name}</strong> ({modelInfo.size})...
              </span>
            )}
            {status === "loaded" && (
              <span>
                <strong>{modelInfo.name}</strong> — {modelInfo.size} •{" "}
                {modelInfo.type} format
              </span>
            )}
            {status === "error" && <span>{errorMsg}</span>}
          </div>
          {(status === "loaded" || status === "error") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveModel}
              className="flex-shrink-0 h-7 gap-1 text-current hover:bg-black/5 dark:hover:bg-white/10">
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </Button>
          )}
        </div>
      )}

      {/* Upload Zone (when no file loaded) */}
      {status === "idle" && (
        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
          <CardContent className="p-0">
            <div
              className={`flex flex-col items-center justify-center py-16 px-6 cursor-pointer transition-all duration-200 rounded-xl ${
                isDragging
                  ? "bg-primary/5 border-primary scale-[1.01]"
                  : "hover:bg-muted/50"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}>
              <div
                className={`p-5 rounded-2xl mb-4 transition-all duration-300 ${
                  isDragging
                    ? "bg-primary/10 scale-110"
                    : "bg-gradient-to-br from-primary/5 to-primary/10"
                }`}>
                <Upload
                  className={`h-10 w-10 transition-all duration-300 ${
                    isDragging
                      ? "text-primary scale-110"
                      : "text-muted-foreground"
                  }`}
                />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                {isDragging ? "Drop your file here" : "Upload 3D Model File"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                Drag and drop your building model file, or click to browse.
                <br />
                The model will be rendered interactively in 3D.
              </p>

              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {["IFC", "glTF", "GLB", "OBJ", "STL", "XKT"].map((fmt) => (
                  <span
                    key={fmt}
                    className="px-2.5 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
                    .{fmt.toLowerCase()}
                  </span>
                ))}
              </div>

              <Button variant="outline" className="gap-2" type="button">
                <FileUp className="h-4 w-4" />
                Browse Files
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
      )}

      {/* Viewer Area (when file is loading or loaded) */}
      {(status === "loading" ||
        status === "loaded" ||
        (status === "error" && fileUrl)) &&
        fileUrl &&
        file && (
          <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 border">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => viewerRef.current?.resetCamera()}
                  title="Reset Camera">
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => viewerRef.current?.fitModel()}
                  title="Fit Model to View">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 border">
                <Button
                  variant={isOrtho ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={toggleProjection}
                  title={
                    isOrtho ? "Switch to Perspective" : "Switch to Orthographic"
                  }>
                  <Box className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1" />

              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5">
                <FileUp className="h-3.5 w-3.5" />
                Load Another
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemoveModel}
                className="gap-1.5">
                <Trash2 className="h-3.5 w-3.5" />
                Remove
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

            {/* 3D Canvas */}
            <Card className="overflow-hidden">
              <CardContent className="p-0 relative">
                <div
                  className="w-full"
                  style={{ height: "calc(100vh - 280px)", minHeight: "400px" }}>
                  <XeokitViewer
                    ref={viewerRef}
                    fileUrl={fileUrl}
                    fileName={file.name}
                    onLoaded={handleModelLoaded}
                    onError={handleModelError}
                  />
                </div>

                {/* Loading Overlay */}
                {status === "loading" && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                        <Move3D className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Parsing model...
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Controls Help */}
            <div className="flex flex-wrap gap-4 px-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">
                  Left Click + Drag
                </kbd>
                Orbit
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">
                  Right Click + Drag
                </kbd>
                Pan
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">
                  Scroll
                </kbd>
                Zoom
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">
                  Double Click
                </kbd>
                Focus Object
              </span>
            </div>
          </div>
        )}

      {/* Error state when no file URL (format error etc.) */}
      {status === "error" && !fileUrl && (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="flex flex-col items-center py-12 gap-4">
            <div className="p-4 rounded-full bg-red-50 dark:bg-red-950/30">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-red-700 dark:text-red-400 mb-1">
                Invalid File Format
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {errorMsg}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setStatus("idle");
                setErrorMsg("");
              }}
              className="gap-2">
              <Upload className="h-4 w-4" />
              Try Another File
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
