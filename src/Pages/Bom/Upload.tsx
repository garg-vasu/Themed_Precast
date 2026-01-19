import { useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { apiClient } from "@/utils/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UploadDialogProps = {
  api: string;
  projectId?: number;
  close?: () => void;
  onSuccess?: () => void;
};

type FileFormat = "csv" | "xlsx";

export default function UploadDialog({
  api,
  close,
  projectId,
  onSuccess,
}: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<FileFormat>("csv");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFormatChange = (format: FileFormat) => {
    setSelectedFormat(format);
    setFile(null);
    setErrorMessage(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      const fileType = selectedFile.type;
      const isValidFile =
        selectedFormat === "csv"
          ? fileType === "text/csv"
          : fileType ===
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
            fileType === "application/vnd.ms-excel";

      if (!isValidFile) {
        setErrorMessage(
          `Please upload a valid ${
            selectedFormat === "csv" ? ".csv" : ".xlsx"
          } file.`
        );
        setFile(null);
        event.target.value = "";
      } else {
        setFile(selectedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMessage("Please choose a file to upload.");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("format", selectedFormat);
      if (projectId != null) {
        formData.append("project_id", String(projectId));
      }

      const response = await apiClient.post(api, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status >= 200 && response.status < 300) {
        toast.success("File uploaded successfully");
        onSuccess?.();
        close?.();
      } else {
        toast.error(response.data?.message || "Failed to upload file");
      }
    } catch (error: unknown) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const accept = selectedFormat === "csv" ? ".csv" : ".xlsx,.xls";

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Choose file type</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={selectedFormat === "csv" ? "default" : "outline"}
            onClick={() => handleFormatChange("csv")}
          >
            CSV
          </Button>
          <Button
            type="button"
            variant={selectedFormat === "xlsx" ? "default" : "outline"}
            onClick={() => handleFormatChange("xlsx")}
          >
            .xlsx
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bom-file" className="text-sm font-medium">
          Upload file
        </Label>
        <div className="flex flex-col gap-3 rounded-lg border border-dashed p-4 text-sm">
          <p className="text-muted-foreground">
            Drag & drop your BOM file here, or click to browse.
          </p>
          <Input
            id="bom-file"
            type="file"
            accept={accept}
            onChange={handleFileChange}
          />
          {file && (
            <p className="text-xs text-muted-foreground truncate">
              Selected: <span className="font-medium">{file.name}</span>
            </p>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Supported formats: <span className="font-medium">.csv, .xlsx</span>
        </p>
        {errorMessage && (
          <p className="text-xs text-destructive">{errorMessage}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={close}
          disabled={isUploading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleUpload}
          disabled={isUploading || !file}
        >
          {isUploading ? "Uploading..." : "Upload"}
        </Button>
      </div>
    </div>
  );
}
