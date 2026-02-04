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
import { ArrowUpDown, ChevronDown, Download } from "lucide-react";

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDisplayDate } from "@/utils/formatdate";
import { useParams } from "react-router-dom";
import ItemDialog from "./ItemDialog";
import { generatePDFFromTable } from "@/utils/pdfGenerator";

type DispatchLog = {
  id: number;
  dispatch_order_id: string;
  project_id: number;
  project_name: string;
  dispatch_date: string;
  vehicle_id: number;
  driver_name: string;
  current_status: string;
  items: Item[];
};

type Item = {
  element_id: number;
  element_type: string;
  element_type_name: string;
  weight: number;
};

// Component for View Items button with dialog
function ViewItemsButton({ dispatchLog }: { dispatchLog: DispatchLog }) {
  const [isItemsDialogOpen, setIsItemsDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant="link"
        className="h-auto p-0 text-primary"
        onClick={() => setIsItemsDialogOpen(true)}
      >
        View Items ({dispatchLog.items?.length || 0})
      </Button>
      <Dialog open={isItemsDialogOpen} onOpenChange={setIsItemsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Items - {dispatchLog.dispatch_order_id}</DialogTitle>
          </DialogHeader>
          <ItemDialog
            items={dispatchLog.items || []}
            onClose={() => setIsItemsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export const getColumns = (): ColumnDef<DispatchLog>[] => [
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
  //   name column
  {
    accessorKey: "dispatch_order_id",
    header: "Dispatch Order ID",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.dispatch_order_id}</div>
    ),
  },
  {
    accessorKey: "project_name",
    header: "Project Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.project_name}</div>
    ),
  },
  {
    accessorKey: "driver_name",
    header: "Driver Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.driver_name}</div>
    ),
  },
  {
    accessorKey: "vehicle_id",
    header: "Vehicle ID",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.vehicle_id}</div>
    ),
  },
  {
    accessorKey: "item count",
    header: "Item Count",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.items?.length || 0}</div>
    ),
  },
  {
    id: "view_items",
    header: "Items",
    cell: ({ row }) => {
      return <ViewItemsButton dispatchLog={row.original} />;
    },
  },
  {
    accessorKey: "current_status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.current_status?.toLowerCase() || "";
      const isAccepted = status === "accepted" || status === "delivered";

      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isAccepted
              ? "bg-green-100 text-green-700 border border-green-200 dark:bg-green-950/40 dark:text-green-300"
              : "bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isAccepted ? "bg-green-500" : "bg-yellow-500"
            }`}
          />
          {row.original.current_status || "Unknown"}
        </span>
      );
    },
  },
  {
    accessorKey: "dispatch_date",
    header: ({ column }) => (
      <Button
        variant="customPadding"
        size="noPadding"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Dispatch Date
        <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const raw = row.getValue("dispatch_date") as string | undefined;
      return <div>{formatDisplayDate(raw)}</div>;
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

export function DeliveredTable({ refresh }: { refresh: () => void }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { projectId } = useParams<{ projectId: string }>();
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [data, setData] = useState<DispatchLog[]>([]);

  const refreshData = () => {
    setRefreshKey((prev) => prev + 1);
    if (refreshKey > 0) {
      refresh();
    }
  };

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchDispatchLogs = async () => {
      try {
        const response = await apiClient.get(`/dispatch_order/${projectId}`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          // save that response.data which have current_status.toLowerCase() == "accepted"
          setData(
            response.data.filter(
              (item: DispatchLog) =>
                item.current_status.toLowerCase() === "accepted"
            )
          );
        } else {
          toast.error(
            response.data?.message || "Failed to fetch dispatch logs"
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "dispatch logs data"));
        }
      }
    };

    if (projectId) {
      fetchDispatchLogs();
    }

    return () => {
      source.cancel();
    };
  }, [refreshKey, projectId]);

  const table = useReactTable({
    data,
    columns: getColumns(),
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

    generatePDFFromTable({
      selectedRows,
      title: "Delivered Report",
      headers: [
        "Dispatch Order ID",
        "Project Name",
        "Driver Name",
        "Vehicle ID",
        "Item Count",
        "Status",
        "Dispatch Date",
      ],
      dataMapper: (row): string[] => {
        const delivered = row.original as DispatchLog;
        return [
          delivered.dispatch_order_id || "—",
          delivered.project_name || "—",
          delivered.driver_name || "—",
          delivered.vehicle_id?.toString() || "—",
          delivered.items?.length?.toString() || "0",
          delivered.current_status || "—",
          formatDisplayDate(delivered.dispatch_date) || "—",
        ];
      },
      fileName: `delivered-report-${
        new Date().toISOString().split("T")[0]
      }.pdf`,
      successMessage:
        "PDF downloaded successfully with {count} delivered order(s)",
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
          placeholder="Filter by dispatch order ID..."
          value={
            (table
              .getColumn("dispatch_order_id")
              ?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table
              .getColumn("dispatch_order_id")
              ?.setFilterValue(event.target.value)
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
    </div>
  );
}
