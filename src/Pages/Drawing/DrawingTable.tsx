import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";

const baseUrl = import.meta.env.VITE_API_URL;

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChevronDown, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDisplayDate } from "@/utils/formatdate";
import { useParams } from "react-router-dom";
import { DrawingFileModal } from "./DrawingFileModal";
import { generatePDFFromTable } from "@/utils/pdfGenerator";

export type DrawingRevision = {
  version: string;
  drawing_type_id: number;
  drawing_type_name: string;
  comments: string;
  file: string;
  drawing_revision_id: number;
};

export type Drawing = {
  drawing_id: number;
  current_version: string;
  drawing_type_id: number;
  drawing_type_name: string;
  comments: string;
  file: string;
  drawingsRevision: DrawingRevision[];
};

type PaginationInfo = {
  current_page: number;
  has_next: boolean;
  has_prev: boolean;
  limit: number;
  total_count: number;
  total_pages: number;
};
export const getColumns = (
  refreshData: () => void,
  onEdit?: (drawing: Drawing) => void
): ColumnDef<Drawing>[] => [
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
  //   drawing_id column
  {
    accessorKey: "drawing_id",
    header: "Drawing ID",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.drawing_id}</div>
    ),
  },
  {
    accessorKey: "current_version",
    header: "Current Version",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.current_version}</div>
    ),
  },
  {
    accessorKey: "drawing_type_name",
    header: "Drawing Type Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.drawing_type_name}</div>
    ),
  },
  {
    accessorKey: "drawings",
    header: "Drawings",
    cell: ({ row }) => {
      const drawingsRevision = row.original.drawingsRevision;
      return drawingsRevision && drawingsRevision.length > 0 ? (
        <>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">View Files</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{row.original.drawing_type_name}</DialogTitle>
                <DialogDescription>
                  Current and previous versions for this drawing.
                </DialogDescription>
              </DialogHeader>
              <DrawingFileModal {...row.original} />
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <Button
          variant="link"
          onClick={() =>
            window.open(
              `${baseUrl}/get-file?file=${encodeURIComponent(
                row.original.file
              )}`,
              "_blank"
            )
          }
        >
          View File
        </Button>
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
    // Check both 'error' and 'message' fields in the response
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      `Failed to ${data}.`;
    return errorMessage;
  }
  return "An unexpected error occurred. Please try again later.";
};

export function DrawingTable({ refresh }: { refresh: () => void }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { projectId } = useParams();
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [data, setData] = useState<Drawing[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const refreshData = () => {
    setRefreshKey((prev) => prev + 1);
    if (refreshKey > 0) {
      refresh();
    }
  };

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchDrawings = async () => {
      try {
        const response = await apiClient.get(`/drawing_fetch/${projectId}`, {
          params: {
            page: currentPage,
            limit: limit,
          },
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setData(response.data.data);
          if (response.data.pagination) {
            setPagination(response.data.pagination);
          }
        } else {
          toast.error(response.data?.message || "Failed to fetch drawings");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "drawings data"));
        }
      }
    };

    fetchDrawings();

    return () => {
      source.cancel();
    };
  }, [refreshKey, currentPage, limit, projectId]);

  const table = useReactTable({
    data,
    columns: getColumns(refreshData),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualPagination: true,
    pageCount: pagination?.total_pages ?? 0,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const handleDownloadPDF = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;

    generatePDFFromTable({
      selectedRows,
      title: "Drawing Report",
      headers: ["Drawing ID", "Current Version", "Drawing Type Name", "Comments", "Drawing Revision Count"],
      dataMapper: (row): string[] => {
        const drawing = row.original as Drawing;
        return [
          drawing.drawing_id?.toString() || "—",
          drawing.current_version || "—",
          drawing.drawing_type_name || "—",
          drawing.comments || "—",
          drawing.drawingsRevision.length?.toString() || "0",
        ];
      },
      fileName: `drawing-report-${new Date().toISOString().split("T")[0]}.pdf`,
      successMessage: "PDF downloaded successfully with {count} drawing(s)",
      emptySelectionMessage: "Please select at least one row to download",
      titleFontSize: 24,
      headerColor: "#283C6E",
      headerHeight: 8,
      bodyFontSize: 9,
    });
  };

  return (
    <div className="w-full">
      {/* top toolbar */}
      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Filter by name..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
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
        <div className="hide-x-scrollbar">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="h-12">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="py-2">
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
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="h-8"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="h-12">
                  <TableCell
                    colSpan={table.getAllColumns().length}
                    className="h-24 text-center py-2"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getRowModel().rows.length} row(s) selected on this page.
          {pagination && (
            <span className="ml-2">
              (Total: {pagination.total_count} drawings)
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Rows per page:
            </span>
            <Select
              value={limit.toString()}
              onValueChange={(value) => {
                setLimit(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {pagination && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>
                Page {pagination.current_page} of {pagination.total_pages}
              </span>
            </div>
          )}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={!pagination?.has_prev}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) =>
                  pagination
                    ? Math.min(pagination.total_pages, prev + 1)
                    : prev + 1
                )
              }
              disabled={!pagination?.has_next}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
