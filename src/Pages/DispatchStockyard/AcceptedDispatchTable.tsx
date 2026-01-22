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
  ChevronDown,
  Download,
  MoreHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDisplayDate } from "@/utils/formatdate";
import { useParams } from "react-router";
import PageHeader from "@/components/ui/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ItemDialog from "../DispatchReceving/ItemDialog";
import { generatePDFFromTable } from "@/utils/pdfGenerator";

export type AcceptedDispatch = {
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

function ViewItemsButton({ dispatchLog }: { dispatchLog: AcceptedDispatch }) {
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

const getColumns = (
  setDownloading: React.Dispatch<React.SetStateAction<Record<number, boolean>>>
): ColumnDef<AcceptedDispatch>[] => [
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
      <div className="capitalize">{row.getValue("dispatch_order_id")}</div>
    ),
  },

  {
    accessorKey: "project_name",
    header: "Project Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("project_name")}</div>
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
    accessorKey: "dispatch_date",
    header: ({ column }) => (
      <Button
        variant="ghost"
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
  {
    accessorKey: "driver_name",
    header: "Driver Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("driver_name")}</div>
    ),
  },

  //   start date column
  {
    accessorKey: "Action_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Action At
        <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const raw = row.getValue("Action_at") as string | undefined;
      return <div>{formatDisplayDate(raw)}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const dispatch = row.original;

      const handleDownloadPDF = async () => {
        try {
          setDownloading((prev) => ({ ...prev, [dispatch.id]: true }));

          // Check if we're in a React Native webview environment
          const isReactNative =
            typeof window !== "undefined" &&
            ((window as any).ReactNativeWebView ||
              (window as any).webkit?.messageHandlers);

          // Use shared apiClient so baseURL and Authorization are handled centrally
          const response = await apiClient.get(
            `/dispatch_order/pdf/${dispatch.id}`,
            {
              responseType: "blob",
            }
          );

          const blob = new Blob([response.data], { type: "application/pdf" });
          const url = window.URL.createObjectURL(blob);

          if (isReactNative) {
            // For React Native webview, try to open in new tab
            try {
              window.open(url, "_blank");
            } catch (error) {
              console.error("Error opening PDF in React Native:", error);
              // Fall back to download if opening fails
              const link = document.createElement("a");
              link.href = url;
              link.setAttribute(
                "download",
                `dispatch-order-${dispatch.dispatch_order_id}.pdf`
              );
              document.body.appendChild(link);
              link.click();
              link.remove();
            }
          } else {
            // For regular web browsers, download the file
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute(
              "download",
              `dispatch-order-${dispatch.dispatch_order_id}.pdf`
            );
            document.body.appendChild(link);
            link.click();
            link.remove();
          }

          // Clean up the blob URL after a delay to prevent memory leaks
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 1000);

          toast.success("PDF downloaded successfully");
        } catch (error) {
          console.error("Error downloading PDF:", error);
          toast.error(getErrorMessage(error, "dispatch order PDF"));
        } finally {
          setDownloading((prev) => ({ ...prev, [dispatch.id]: false }));
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleDownloadPDF}>
              Download PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

export function AcceptedDispatchTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { projectId } = useParams();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [data, setData] = useState<AcceptedDispatch[]>([]);
  const [downloading, setDownloading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!projectId) return;

    const source = axios.CancelToken.source();

    const fetchAcceptedDispatch = async () => {
      try {
        const response = await apiClient.get(`/dispatch_order/${projectId}`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          // here to filter the response.data which have current_status.toLowerCase() == "accepted"
          setData(
            response.data.filter(
              (item: AcceptedDispatch) =>
                item.current_status.toLowerCase() === "dispatched"
            )
          );
        } else {
          toast.error(
            response.data?.message || "Failed to fetch dispatch order data"
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "dispatch order data"));
        }
      }
    };

    fetchAcceptedDispatch();

    return () => {
      source.cancel();
    };
  }, [projectId]);

  const table = useReactTable({
    data,
    columns: getColumns(setDownloading),
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
      title: "Accepted Dispatch Report",
      headers: ["Dispatch Order ID", "Project Name", "Dispatch Date", "Action At"],
      dataMapper: (row): string[] => {
        const acceptedDispatch = row.original as AcceptedDispatch & { Action_at?: string };
        return [
          acceptedDispatch.dispatch_order_id || "—",
          acceptedDispatch.project_name || "—",
          formatDisplayDate(acceptedDispatch.dispatch_date),
          formatDisplayDate(acceptedDispatch.Action_at),
        ];
      },
      fileName: `accepted-dispatch-report-${new Date().toISOString().split("T")[0]}.pdf`,
      successMessage: "PDF downloaded successfully with {count} accepted dispatch(s)",
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
                  colSpan={getColumns(setDownloading).length}
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
    </div>
  );
}
