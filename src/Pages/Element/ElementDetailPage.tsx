import React from "react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingState } from "@/components/ui/loading-state";
import { apiClient } from "@/utils/apiClient";

const apiBaseUrl = import.meta.env.VITE_API_URL as string;

export default function ElementDetailPage() {
  const { elementTypeId } = useParams();
  const [elementdata, setElementdata] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  // State for expanded drawings (must be before any return)
  const [expandedDrawings, setExpandedDrawings] = useState<{
    [key: number]: boolean;
  }>({});
  const handleToggleExpand = (drawingId: number) => {
    setExpandedDrawings((prev) => ({ ...prev, [drawingId]: !prev[drawingId] }));
  };

  // State for expanded lifecycle stages
  const [expandedStages, setExpandedStages] = useState<{
    [key: number]: boolean;
  }>({});
  const handleToggleStage = (stageIdx: number) => {
    setExpandedStages((prev) => ({ ...prev, [stageIdx]: !prev[stageIdx] }));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/scan_element/${elementTypeId}`);
      if (response.status === 200) {
        setElementdata(response.data);
      }
    } catch (error) {
      console.error("Error fetching element type data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [elementTypeId]);

  // Fetch QR code when elementdata is loaded
  useEffect(() => {
    const fetchQr = async () => {
      if (!elementdata?.element_id) return;
      try {
        const response = await apiClient.get(`/generate-qr/${elementTypeId}`, {
          responseType: "blob",
        });
        const blob = new Blob([response.data], { type: "image/png" });
        const url = window.URL.createObjectURL(blob);
        setQrUrl(url);
      } catch (error) {
        setQrUrl(null);
      }
    };
    fetchQr();
    // Clean up URL object when component unmounts or element changes
    return () => {
      if (qrUrl) window.URL.revokeObjectURL(qrUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementdata?.element_id]);

  // Helper to format 'Date-30-May-2025 Time-05:12:10AM' to '30-May-2025 05:12:10AM'
  function formatCustomDate(dateStr: string) {
    if (!dateStr || typeof dateStr !== "string") return "-";
    const dateMatch = dateStr.match(/Date-(.*?) Time-(.*)/);
    if (dateMatch) {
      return `${dateMatch[1]} ${dateMatch[2]}`;
    }
    return dateStr;
  }

  // Helper to format ISO timestamp to 'date: DD-MMM-YYYY' and 'time: HH:MM:SSAM/PM'
  function formatIsoDateTime(isoStr: string) {
    if (!isoStr) return { date: "-", time: "-" };
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return { date: "-", time: "-" };
    const date = d
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-");
    const time = d
      .toLocaleTimeString("en-US", { hour12: true })
      .replace(/ /g, "");
    return { date, time };
  }

  if (loading) {
    return (
      <div className="flex w-full flex-col">
        <PageHeader title="Element details" />
        <LoadingState label="Loading element details..." className="grow" />
      </div>
    );
  }

  if (!elementdata) {
    return (
      <div className="flex w-full flex-col gap-2">
        <PageHeader title="Element details" />
        <Card>
          <CardContent>
            <div className="text-muted-foreground">No data available.</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2 px-4 py-4 text-sm">
      <PageHeader title={`Element ${elementdata.element_id ?? ""}`} />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {/* Basics */}
        <Card>
          <CardHeader>
            <CardTitle>Basics</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Name</dt>
                <dd>{elementdata.element_id || "-"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground ">Element type version</dt>
                <dd>{elementdata.element_type?.element_type || "-"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Element type name</dt>
                <dd>{elementdata.element_type?.element_type_name || "-"}</dd>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <dt className="text-muted-foreground">Thickness</dt>
                  <dd>{elementdata.element_type?.thickness || "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Length</dt>
                  <dd>{elementdata.element_type?.length || "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Height</dt>
                  <dd>{elementdata.element_type?.height || "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Weight</dt>
                  <dd>{elementdata.element_type?.weight || "-"}</dd>
                </div>
              </div>
              <div>
                <dt className="text-muted-foreground">Version</dt>
                <dd>{elementdata.element_type?.element_type_version || "-"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created by</dt>
                <dd>{elementdata.element_type?.created_by || "-"} </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created at</dt>
                <dd>{elementdata.element_type?.created_at_formatted || "-"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Updated at</dt>
                <dd>
                  {formatCustomDate(
                    elementdata.element_type?.updated_at_formatted,
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Tower</dt>
                <dd>{elementdata.element_type?.tower_name || "-"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Floor</dt>
                <dd>
                  {elementdata.element_type?.hierarchy_quantity?.[0]?.name ||
                    "-"}
                </dd>
              </div>
              {/* <div>
                <dt className="text-muted-foreground">Stressing type</dt>
                <dd>
                  {elementdata.element_type?.stressing_type || "Reinforced"}
                </dd>
              </div> */}
            </dl>
          </CardContent>
        </Card>

        {/* Drawings & BOM */}
        <Card className="md:col-span-1 xl:col-span-2 text-sm">
          <CardHeader>
            <CardTitle>Drawings & materials</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {Array.isArray(elementdata.element_type?.drawings) &&
            elementdata.element_type.drawings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead />
                    <TableHead>Name</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>File</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {elementdata.element_type.drawings.map((drawing: any) => (
                    <React.Fragment key={drawing.drawing_id}>
                      <TableRow>
                        <TableCell>
                          {Array.isArray(drawing.drawingsRevision) &&
                          drawing.drawingsRevision.length > 0 ? (
                            <button
                              onClick={() =>
                                handleToggleExpand(drawing.drawing_id)
                              }
                              className="text-muted-foreground"
                              title={
                                expandedDrawings[drawing.drawing_id]
                                  ? "Collapse"
                                  : "Expand"
                              }
                              aria-label={
                                expandedDrawings[drawing.drawing_id]
                                  ? "Collapse"
                                  : "Expand"
                              }
                            >
                              {expandedDrawings[drawing.drawing_id] ? (
                                <ChevronDown size={16} />
                              ) : (
                                <ChevronRight size={16} />
                              )}
                            </button>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          {drawing.drawing_type_name || "Mep"}
                        </TableCell>
                        <TableCell>{drawing.current_version || "-"}</TableCell>
                        <TableCell>
                          {drawing.file ? (
                            <a
                              href={`${apiBaseUrl}/files/${drawing.file}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline-offset-4 hover:underline"
                            >
                              View
                            </a>
                          ) : (
                            <span className="text-muted-foreground">
                              No file
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                      {expandedDrawings[drawing.drawing_id] &&
                        Array.isArray(drawing.drawingsRevision) &&
                        drawing.drawingsRevision.length > 0 && (
                          <>
                            <TableRow>
                              <TableCell />
                              <TableCell
                                colSpan={3}
                                className="text-xs text-muted-foreground"
                              >
                                Old versions
                              </TableCell>
                            </TableRow>
                            {drawing.drawingsRevision.map((rev: any) => (
                              <TableRow key={rev.drawing_revision_id}>
                                <TableCell />
                                <TableCell>
                                  {rev.drawing_type_name || "Mep"}
                                </TableCell>
                                <TableCell>{rev.version || "-"}</TableCell>
                                <TableCell>
                                  {rev.file ? (
                                    <a
                                      href={`${apiBaseUrl}/files/${rev.file}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary underline-offset-4 hover:underline"
                                    >
                                      View
                                    </a>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      No file
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </>
                        )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-muted-foreground">
                No drawings available.
              </div>
            )}

            <div className="border-t pt-2">
              <div>Bill of materials</div>
              {Array.isArray(elementdata.element_type?.products) &&
              elementdata.element_type.products.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {elementdata.element_type.products.map((product: any) => (
                      <TableRow key={product.product_id}>
                        <TableCell>{product.product_name}</TableCell>
                        <TableCell>{product.quantity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-muted-foreground">
                  No BOM products available.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lifecycle */}
        <Card>
          <CardHeader>
            <CardTitle>Lifecycle</CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(elementdata.lifecycle) &&
            elementdata.lifecycle.length > 0 ? (
              <div className="flex flex-col gap-2">
                {elementdata.lifecycle.map((stage: any, idx: number) => {
                  const hasAnswers =
                    Array.isArray(stage.answers) && stage.answers.length > 0;
                  const { date, time } = formatIsoDateTime(stage.timestamp);
                  return (
                    <div key={idx} className="border rounded-md">
                      <button
                        className="flex w-full items-center justify-between px-2 py-1 text-left"
                        onClick={() => hasAnswers && handleToggleStage(idx)}
                      >
                        <div className="flex flex-col gap-1">
                          <span>{stage.label}</span>
                          {stage.timestamp && (
                            <span className="text-xs text-muted-foreground">
                              {date} · {time}
                            </span>
                          )}
                        </div>
                        {hasAnswers && (
                          <span className="text-muted-foreground">
                            {expandedStages[idx] ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )}
                          </span>
                        )}
                      </button>
                      {hasAnswers && expandedStages[idx] && (
                        <div className="border-t px-2 py-2">
                          <div className="flex flex-col gap-2">
                            {stage.answers.map((ans: any) => (
                              <div
                                key={ans.id}
                                className="border-b pb-2 last:border-b-0 last:pb-0"
                              >
                                <div className="text-xs">
                                  <span className="text-muted-foreground">
                                    Qus:{" "}
                                  </span>
                                  {ans.question_text}
                                </div>
                                <div className="text-xs">
                                  <span className="text-muted-foreground">
                                    Ans:{" "}
                                  </span>
                                  {ans.option_text}
                                </div>
                                {ans.image_path && ans.image_path !== "" && (
                                  <div className="pt-1">
                                    <a
                                      href={`${apiBaseUrl}/files/${ans.image_path}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center rounded border px-2 py-1 text-xs text-primary underline-offset-4 hover:underline"
                                    >
                                      File
                                    </a>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-muted-foreground">
                No lifecycle data available.
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR / Scan */}
        <Card>
          <CardHeader>
            <CardTitle>Scan it</CardTitle>
          </CardHeader>
          <CardContent>
            {qrUrl ? (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={qrUrl}
                  alt="QR Code"
                  className="h-40 w-40 rounded border object-contain"
                />
                <div className="text-xs text-muted-foreground">
                  Scan this QR code for this element.
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">
                QR code not available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
