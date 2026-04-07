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
  ArrowUpDown,
  CheckCircle,
  ChevronDown,
  Download,
  Eye,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useContext, useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDisplayDate } from "@/utils/formatdate";
import { useNavigate, useParams } from "react-router";
import { ProjectContext } from "@/Provider/ProjectProvider";
import PageHeader from "@/components/ui/PageHeader";
const baseUrl = import.meta.env.VITE_API_URL || "";

export type AlreadyErrectedElement = {
  id: number;
  unmapped_drawing_id: number;
  drawing_type_id: number;
  drawing_type_name: string;
  element_type_id: number;
  element_type_name: string;
  revision_id: string;
  file_path: string;
  requested_by: string;
  requested_at: string;
};

const getColumns = (
  permissions: string[],
): ColumnDef<AlreadyErrectedElement>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}>
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  //   name column
  {
    accessorKey: "path",
    header: "File Name",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1.5">
        <span
          className="text-sm font-medium truncate max-w-[200px]"
          title={row.original.file_path}>
          {row.original.file_path}
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs"
            onClick={() =>
              window.open(
                `${baseUrl}/get-file?file=${encodeURIComponent(row.original.file_path)}`,
                "_blank",
              )
            }>
            <Eye className="size-3 mr-1" /> Preview
          </Button>
        </div>
      </div>
    ),
  },

  {
    accessorKey: "drawing_type_name",
    header: "Drawing Type",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("drawing_type_name")}</div>
    ),
  },
  {
    accessorKey: "revision_id",
    header: "Revision Number",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("revision_id")}</div>
    ),
  },
  {
    accessorKey: "element_type_name",
    header: "Element Type",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("element_type_name")}</div>
    ),
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

export function UploadedDrawingApprovaltable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { projectId } = useParams();
  const projectCtx = useContext(ProjectContext);
  const permissions = projectCtx?.permissions || [];
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [data, setData] = useState<AlreadyErrectedElement[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null,
  );

  useEffect(() => {
    if (!projectId) return;

    const source = axios.CancelToken.source();

    const fetchNotErrectedElement = async () => {
      try {
        const response = await apiClient.get(
          `/drawings/pending?project_id=${projectId}`,
          {
            cancelToken: source.token,
          },
        );

        if (response.status === 200) {
          // here to filter the response.data which have current_status.toLowerCase() == "accepted"
          setData(response.data);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch Uploaded Drawings",
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "Uploaded Drawings"));
        }
      }
    };

    fetchNotErrectedElement();

    return () => {
      source.cancel();
    };
  }, [projectId, refreshKey]);

  const handleAction = async (status: "approve" | "reject") => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) {
      toast.error(`Please select at least one Drawing to ${status}.`);
      return;
    }

    const requestIds = selectedRows.map((row) => row.original.id);
    setActionLoading(true);
    setActionType(status);

    try {
      const response = await apiClient.post(
        `/drawings/action?status=${status}`,
        {
          request_ids: requestIds,
        },
      );

      if (response.status === 200 || response.status === 201) {
        toast.success(`Drawings ${status}d successfully!`);
        setRowSelection({});
        setRefreshKey((prev) => prev + 1);
      } else {
        toast.error(
          (response.data as { message?: string })?.message ||
            `Failed to ${status} drawings. Please try again.`,
        );
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Uploaded Drawings"));
    } finally {
      setActionLoading(false);
      setActionType(null);
    }
  };

  const table = useReactTable({
    data,
    columns: getColumns(permissions),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    enableRowSelection: true,
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
      doc.text("Uploaded Drawing Approval Report", 14, 20);

      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      // Prepare table data with all columns
      const tableData = selectedRows.map((row) => {
        const item = row.original;
        return [
          item.file_path || "—",
          item.drawing_type_name || "—",
          item.revision_id || "—",
          item.element_type_name || "—",
          item.requested_by || "—",
          item.requested_at ? formatDisplayDate(item.requested_at) : "—",
        ];
      });

      // Prepare headers
      const headers = [
        "File Name",
        "Drawing Type",
        "Revision Number",
        "Element Type",
        "Requested By",
        "Requested At",
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
      const fileName = `uploaded-drawing-approval-report-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      doc.save(fileName);

      toast.success(
        `PDF downloaded successfully with ${selectedRows.length} selected drawing(s)`,
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="w-full p-4">
      <PageHeader title="Uploaded Drawing Approval" />
      {/* top toolbar */}
      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Filter by element type..."
          value={
            (table
              .getColumn("element_type_name")
              ?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table
              .getColumn("element_type_name")
              ?.setFilterValue(event.target.value)
          }
          className="w-full max-w-sm sm:max-w-xs"
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
          <Button
            onClick={() => handleAction("approve")}
            disabled={
              table.getFilteredSelectedRowModel().rows.length === 0 ||
              actionLoading
            }
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
            <CheckCircle className="h-4 w-4 mr-2" />
            {actionLoading && actionType === "approve"
              ? "Approving..."
              : `Approve Selected (${table.getFilteredSelectedRowModel().rows.length})`}
          </Button>
          <Button
            onClick={() => handleAction("reject")}
            disabled={
              table.getFilteredSelectedRowModel().rows.length === 0 ||
              actionLoading
            }
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white">
            <XCircle className="h-4 w-4 mr-2" />
            {actionLoading && actionType === "reject"
              ? "Rejecting..."
              : `Reject Selected (${table.getFilteredSelectedRowModel().rows.length})`}
          </Button>
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <Button
              variant="default"
              className="w-full sm:w-auto"
              onClick={handleDownloadPDF}>
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
                      }>
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
                            header.getContext(),
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
                    onClick={() => row.toggleSelected()}
                    className="cursor-pointer select-none">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={getColumns(permissions).length}
                  className="h-24 text-center">
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
            disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
