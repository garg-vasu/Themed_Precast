import { apiClient } from "@/utils/apiClient";
import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatDisplayDate } from "@/utils/formatdate";
import { Download, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const baseUrl = import.meta.env.VITE_API_URL;

export type File = {
  drawing_id: number;
  Element_type_id: number;
  current_version: string;
  created_by?: string;
  drawing_type_id: number;
  drawing_type_name: string;
  updated_at?: string;
  comments: string;
  file: string;
  drawingsRevision?: DrawingRevision[];
};

export type DrawingRevision = {
  parent_drawing_id: number;
  version: string;
  created_by: string;
  drawing_type_id: number;
  drawing_type_name: string;
  comments: string;
  file: string;
  drawing_revision_id: number;
  Element_type_id: number;
  created_at_formatted: string;
  updated_at_formatted: string;
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

type GroupedDrawing = {
  drawing_type_name: string;
  drawing_type_id: number;
  current: File;
  revisions: DrawingRevision[];
};

export default function ElementDrawing({
  elementTypeId,
}: {
  elementTypeId: number;
}) {
  console.log("elementTypeId", elementTypeId);

  const [drawings, setDrawings] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchElementDrawings = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(
          `/drawings_by_element_type/${elementTypeId}`,
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          setDrawings(response.data.data || response.data || []);
        } else {
          toast.error(response.data?.message || "Failed to fetch drawings");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "drawings data"));
        }
      } finally {
        setLoading(false);
      }
    };

    if (elementTypeId) {
      fetchElementDrawings();
    }

    return () => {
      source.cancel();
    };
  }, [elementTypeId]);

  const handleFileDownload = (filePath: string) => {
    if (filePath) {
      window.open(
        `${baseUrl}/get-file?file=${encodeURIComponent(filePath)}`,
        "_blank"
      );
    }
  };

  const toggleSection = (drawingTypeId: number) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(drawingTypeId)) {
        newSet.delete(drawingTypeId);
      } else {
        newSet.add(drawingTypeId);
      }
      return newSet;
    });
  };

  // Group drawings by drawing_type_name
  const groupedDrawings: GroupedDrawing[] = drawings.reduce((acc, drawing) => {
    const existingGroup = acc.find(
      (group) => group.drawing_type_id === drawing.drawing_type_id
    );

    if (existingGroup) {
      // If group exists, merge revisions
      if (drawing.drawingsRevision) {
        existingGroup.revisions.push(...drawing.drawingsRevision);
      }
    } else {
      // Create new group
      acc.push({
        drawing_type_name: drawing.drawing_type_name,
        drawing_type_id: drawing.drawing_type_id,
        current: drawing,
        revisions: drawing.drawingsRevision || [],
      });
    }

    return acc;
  }, [] as GroupedDrawing[]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading drawings...</p>
      </div>
    );
  }

  if (drawings.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">No drawings available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto space-y-6 py-2">
      {groupedDrawings.map((group) => {
        const isExpanded = expandedSections.has(group.drawing_type_id);
        const hasRevisions = group.revisions.length > 0;

        return (
          <div key={group.drawing_type_id} className="space-y-3 w-full">
            {/* Drawing Type Heading */}
            <h2 className="text-xl font-semibold text-foreground">
              {group.drawing_type_name}
            </h2>

            {/* Table for this drawing type */}
            <div className="w-full max-w-full rounded-md border">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>File</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Current Version Row */}
                  <TableRow>
                    <TableCell>
                      {hasRevisions ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleSection(group.drawing_type_id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      ) : null}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {group.current.current_version}{" "}
                      <span className="text-xs text-muted-foreground font-normal">
                        (Current)
                      </span>
                    </TableCell>
                    <TableCell>{group.current.comments || "—"}</TableCell>
                    <TableCell>
                      {group.current.updated_at
                        ? formatDisplayDate(group.current.updated_at)
                        : "—"}
                    </TableCell>
                    <TableCell className="">
                      {group.current.file ? (
                        <Button
                          variant="customPadding"
                          size="noPadding"
                          onClick={() => handleFileDownload(group.current.file)}
                        >
                          <Download className="" />
                          View File
                        </Button>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>

                  {/* Previous Versions - Only shown when expanded */}
                  {isExpanded &&
                    hasRevisions &&
                    group.revisions.map((revision) => (
                      <TableRow
                        key={`revision-${revision.drawing_revision_id}`}
                        className="bg-muted/30"
                      >
                        <TableCell />
                        <TableCell className="font-medium">
                          {revision.version}
                        </TableCell>
                        <TableCell>{revision.comments || "—"}</TableCell>

                        <TableCell>
                          {revision.created_at_formatted
                            ? formatDisplayDate(revision.created_at_formatted)
                            : "—"}
                        </TableCell>
                        <TableCell className="">
                          {revision.file ? (
                            <Button
                              variant="customPadding"
                              size="noPadding"
                              className="h-auto p-0"
                              onClick={() => handleFileDownload(revision.file)}
                            >
                              <Download className="mr-1 h-3 w-3" />
                              View File
                            </Button>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
