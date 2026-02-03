import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ArrowUpDown, ChevronDown, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useContext, useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate, useParams } from "react-router";
import { formatDisplayDate } from "@/utils/formatdate";
import PageHeader from "@/components/ui/PageHeader";
import { ProjectContext } from "@/Provider/ProjectProvider";

export type Retification = {
  id: number;
  element_type_id: number;
  element_id: string;
  element_name: string;
  project_id: number;
  created_by: string;
  created_at: string; // ISO string, consider using `Date` if parsing
  status: number;
  element_type_version: string;
  update_at: string; // ISO string
  target_location: number;
  in_stockyard: boolean;
  status_text: string;
  in_erection: boolean;
};

export const getColumns = (
  permissions: string[],
  handleAction: (elementId: number, action: "approve" | "reject") => void
): ColumnDef<Retification>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "element_id",
    header: "Element Name",
    cell: ({ row }) => {
      const navigate = useNavigate();
      const { projectId } = useParams();
      return (
        <div
          className="capitalize"
          onClick={() => {
            if (permissions?.includes("ViewElementDetail")) {
              navigate(
                `/project/${projectId}/element-detail/${row.original.element_id}`
              );
            }
          }}
        >
          {row.getValue("element_id")}
        </div>
      );
    },
  },
  //   name column
  {
    accessorKey: "element_name",
    header: "Element Type Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("element_name")}</div>
    ),
  },

  {
    accessorKey: "element_type_version",
    header: "Element Revision",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("element_type_version")}</div>
    ),
  },

  {
    accessorKey: "status_text",
    header: "Status",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("status_text")}</div>
    ),
  },

  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Created At
        <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const raw = row.getValue("created_at") as string | undefined;
      return <div>{formatDisplayDate(raw)}</div>;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const retification = row.original;
      return (
        <div className="flex gap-2 items-center justify-center">
          <Button
            variant="default"
            size="sm"
            className="bg-green-500 hover:bg-green-600 text-white"
            onClick={() => handleAction(retification.id, "approve")}
          >
            Approve
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-destructive hover:bg-destructive/90 text-white"
            onClick={() => handleAction(retification.id, "reject")}
          >
            Reject
          </Button>
        </div>
      );
    },
  },
];

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

export function RetificationTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { projectId } = useParams();
  const projectCtx = useContext(ProjectContext);
  const permissions = projectCtx?.permissions || [];
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [data, setData] = useState<Retification[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<Retification | null>(
    null
  );
  const [actionType, setActionType] = useState<"approved" | "rejected" | null>(
    null
  );
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const refreshData = () => {
    setRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    if (!projectId) return;

    const source = axios.CancelToken.source();

    const fetchRetification = async () => {
      try {
        const response = await apiClient.get(`/rectification/${projectId}`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setData(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch retification");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "retification data"));
        }
      }
    };

    fetchRetification();

    return () => {
      source.cancel();
    };
  }, [projectId, refreshKey]);

  const handleAction = (elementId: number, action: "approve" | "reject") => {
    const element = data.find((el) => el.id === elementId);
    if (!element) return;
    setSelectedElement(element);
    setActionType(action === "approve" ? "approved" : "rejected");
    setComment("");
    setDialogOpen(true);
  };

  const handleDialogSubmit = async () => {
    if (!selectedElement || !actionType || !comment.trim()) {
      if (!comment.trim()) {
        toast.error("Please enter a comment before submitting.");
      }
      return;
    }

    setSubmitting(true);
    try {
      const payload = [
        {
          element_id: selectedElement.id,
          project_id: selectedElement.project_id,
          comments: comment.trim(),
          status: actionType,
        },
      ];

      const response = await apiClient.put(`/update_rectification`, payload);

      if (response.status === 200) {
        toast.success(
          `Element ${
            actionType === "approved" ? "approved" : "rejected"
          } successfully!`
        );
        setDialogOpen(false);
        setSelectedElement(null);
        setActionType(null);
        setComment("");
        refreshData();
      } else {
        toast.error(
          response.data?.message ||
            "Failed to update rectification status. Please try again."
        );
      }
    } catch (error) {
      console.error("Error updating rectification status:", error);
      toast.error("Failed to update rectification status");
    } finally {
      setSubmitting(false);
    }
  };

  const table = useReactTable({
    data,
    columns: getColumns(permissions, handleAction),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const handleDownloadPDF = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;

    if (selectedRows.length === 0) {
      toast.error("Please select at least one row to download");
      return;
    }

    try {
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(18);
      doc.text("Retification Report", 14, 20);

      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      // Prepare table data with all columns
      const tableData = selectedRows.map((row) => {
        const pending = row.original;
        return [
          pending.element_name || "—",
          pending.element_type_version || "—",
          pending.status_text || "Pending",
          pending.created_at || "—",
        ];
      });

      // Prepare headers
      const headers = [
        "Element Name",
        "Element Revision",
        "Status",
        "Created At",
      ];

      // Add table with all column headers
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 40,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], fontSize: 8 }, // Blue header
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      // Save the PDF
      const fileName = `retification-report-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      doc.save(fileName);

      toast.success(
        `PDF downloaded successfully with ${selectedRows.length} retification(s)`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="w-full py-4 px-4">
      <div>
        <PageHeader title="Rectification" />
      </div>
      {/* top toolbar */}
      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Filter by Element Name..."
          value={
            (table.getColumn("element_name")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("element_name")?.setFilterValue(event.target.value)
          }
          className="w-full max-w-sm sm:max-w-xs"
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <Button
              variant="default"
              className="w-full sm:w-auto"
              onClick={handleDownloadPDF}
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF ({table.getFilteredSelectedRowModel().rows.length})
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                Columns <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={getColumns(permissions, handleAction).length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSelectedElement(null);
            setActionType(null);
            setComment("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approved"
                ? "Approve Rectification"
                : actionType === "rejected"
                ? "Reject Rectification"
                : "Update Rectification"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selectedElement && (
              <div className="text-sm text-muted-foreground space-y-1">
                <div>
                  <span className="font-medium">Element ID:</span>{" "}
                  {selectedElement.element_id}
                </div>
                <div>
                  <span className="font-medium">Element Name:</span>{" "}
                  {selectedElement.element_name}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="rectification-comment">
                Comment <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rectification-comment"
                placeholder="Enter your comments here..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setSelectedElement(null);
                setActionType(null);
                setComment("");
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleDialogSubmit} disabled={submitting}>
              {submitting
                ? "Submitting..."
                : actionType === "approved"
                ? "Approve"
                : actionType === "rejected"
                ? "Reject"
                : "Submit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
