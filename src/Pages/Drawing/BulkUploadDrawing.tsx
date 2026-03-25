import { useState, useRef } from "react";
import { toast } from "sonner";
import { apiClient } from "@/utils/apiClient";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UploadCloud, X } from "lucide-react";
import { useParams } from "react-router";

type BulkUploadProps = {
  refresh: () => void;
  onClose: () => void;
};

export default function BulkUploadDrawing({
  refresh,
  onClose,
}: BulkUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const { projectId } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => {
        const newFiles = Array.from(e.target.files!);
        // Avoid duplicate files by name and size just in case, though usually people can upload what they want
        return [...prev, ...newFiles];
      });
      // Reset input so the same file could be selected again if removed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await apiClient.post(
        `/upload/bulk_files?project_id=${projectId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const data = response.data;
      if (data && data.succeeded !== undefined) {
        toast.success(`Upload successful. ${data.succeeded} files uploaded.`);
      }

      if (data && data.report_download_url) {
        const downloadUrl = data.report_download_url.startsWith("/api")
          ? data.report_download_url.substring(4)
          : data.report_download_url;

        try {
          const fileResp = await apiClient.get(downloadUrl, {
            responseType: "blob",
          });
          const url = window.URL.createObjectURL(new Blob([fileResp.data]));
          const link = document.createElement("a");
          link.href = url;
          // You could extract filename from report_file but a standard name is safe
          const filename =
            data.report_file?.split("/").pop() || "upload-report.xlsx";
          link.setAttribute("download", filename);
          document.body.appendChild(link);
          link.click();
          link.parentNode?.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (downloadErr) {
          toast.error(
            "File upload succeeded but could not download the report.",
          );
          console.error(downloadErr);
        }
      }

      refresh();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to upload files",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-4 mt-2">
          <div className="grid w-full items-center gap-2">
            <Label className="font-semibold text-lg text-foreground mb-2">
              Upload Drawings
            </Label>
            <div
              className="border-2 border-dashed border-muted-foreground/30 bg-muted/10 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors min-h-[160px]"
              onClick={() => fileInputRef.current?.click()}>
              <UploadCloud className="w-10 h-10 text-primary mb-3" />
              <p className="text-sm font-medium text-foreground">
                Click to select files
              </p>
              <p className="text-xs text-muted-foreground mt-1 text-center max-w-[250px]">
                You can upload multiple drawing files at once
              </p>
              <Input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>
          </div>

          {files.length > 0 && (
            <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto mt-4 pr-1">
              <Label className="text-sm font-medium">
                Selected Files ({files.length})
              </Label>
              <div className="flex flex-col gap-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 lg:px-3 bg-background border rounded-lg text-sm shadow-sm">
                    <div className="flex flex-col truncate max-w-[85%]">
                      <span className="truncate font-medium">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50/50"
                      onClick={() => removeFile(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-8 border-t pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || files.length === 0}
            className="min-w-[120px]">
            {isSubmitting ? "Uploading..." : "Upload Files"}
          </Button>
        </div>
      </form>
    </div>
  );
}
