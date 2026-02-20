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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCallback, useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDisplayDate } from "@/utils/formatdate";
import type { FilterStateWorkOrder } from "./AdvanceWorkOrder";
import type { FilterStateElementtype } from "../Elementtype/ElementtypeFilter";
import ElementtypeFilter from "../Elementtype/ElementtypeFilter";
import AdvanceWorkOrderFilter from "./AdvanceWorkOrder";

export interface Material {
  id: number;
  item_name: string;
  description: string;
  unit_rate: number;
  volume: number;
  tax: number;
}

export type WorkOrder = {
  id: number;
  work_order_id?: number;
  wo_number: string;
  wo_date: string;
  project_name: string;
  wo_validate: string;
  total_value: number;
  contact_person: string;
  payemnt_term: string;
  wo_description: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  material: Material[];
  wo_attachment: string[];
  // Below are client-side only flags to render revision rows inline
  revision_no: number;
};

type PaginationInfo = {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

// Payment status badge styling function
const getPaymentStatusStyles = (status: string | undefined) => {
  const normalized = status?.toLowerCase() ?? "";

  switch (normalized) {
    case "fully_paid":
      return {
        badge:
          "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
        dot: "bg-emerald-500",
      };
    case "partial_paid":
      return {
        badge:
          "border border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
        dot: "bg-amber-500",
      };
    case "unpaid":
      return {
        badge:
          "border border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
        dot: "bg-red-500",
      };
    default:
      return {
        badge:
          "border border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-950/40 dark:text-slate-300",
        dot: "bg-slate-400",
      };
  }
};

export const columns: ColumnDef<WorkOrder>[] = [
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
    accessorKey: "wo_number",
    header: "Work Order Number",
    cell: ({ row }) => {
      const navigate = useNavigate();
      return (
        <div
          className="capitalize cursor-pointer"
          onClick={() => navigate(`/work-order-detail/${row.original.id}`)}
        >
          {row.original.wo_number}
        </div>
      );
    },
  },
  {
    accessorKey: "revision_no",
    header: "Revision No",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.revision_no}</div>
    ),
  },
  {
    accessorKey: "wo_date",
    header: ({ column }) => (
      <Button
        variant="customPadding"
        size="noPadding"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Start date
        <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const raw = row.getValue("wo_date") as string | undefined;
      return <div>{formatDisplayDate(raw)}</div>;
    },
  },
  {
    accessorKey: "wo_validate",
    header: ({ column }) => (
      <Button
        variant="customPadding"
        size="noPadding"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        End date
        <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const raw = row.getValue("wo_validate") as string | undefined;
      return <div>{formatDisplayDate(raw)}</div>;
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button
        variant="customPadding"
        size="noPadding"
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
    accessorKey: "updated_at",
    header: ({ column }) => (
      <Button
        variant="customPadding"
        size="noPadding"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Updated At
        <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const raw = row.getValue("updated_at") as string | undefined;
      return <div>{formatDisplayDate(raw)}</div>;
    },
  },

  //   CREATED BY COLUMN
  {
    id: "contact_person",
    header: "Contact Person",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.contact_person || "—"}</div>
    ),
  },

  // project name column
  {
    id: "project_name",
    header: "Project Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.project_name || "—"}</div>
    ),
  },

  {
    accessorKey: "total_value",
    header: () => <div className="text-right">Total Value</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("total_value"));

      // Format the amount as a dollar amount
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "INR",
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>;
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

export function WorkOrderTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const navigate = useNavigate();
  const [data, setData] = useState<WorkOrder[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  //   filter state
  const [filterState, setFilterState] = useState<FilterStateWorkOrder>({
    selectedProject: 0,
    workordernumber: "",
    revisionnumber: 0,
    contactperson: "",
    wo_date: "",
    wo_validate: "",
    totalvalue: 0,
    totalvalueFilterType: "exact",
    createdat: "",
  });

  const handleFilterChange = useCallback(
    (filters: FilterStateWorkOrder) => {
      // Only update if filters actually changed
      if (JSON.stringify(filters) !== JSON.stringify(filterState)) {
        setFilterState(filters);
        setCurrentPage(1); // Reset to first page when filters change
      }
    },
    [filterState],
  );

  const handleFilterClose = useCallback(() => {
    setFilterOpen(false);
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilterState({
      selectedProject: 0,
      workordernumber: "",
      revisionnumber: 0,
      contactperson: "",
      wo_date: "",
      wo_validate: "",
      totalvalue: 0,
      totalvalueFilterType: "exact",
      createdat: "",
    });
    setCurrentPage(1);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      filterState.selectedProject > 0 ||
      filterState.workordernumber !== "" ||
      filterState.revisionnumber > 0 ||
      filterState.contactperson !== "" ||
      filterState.wo_date !== "" ||
      filterState.wo_validate !== "" ||
      filterState.totalvalue > 0 ||
      filterState.createdat !== ""
    );
  };

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchInvoices = async () => {
      try {
        const params: Record<string, number | string> = {
          page: currentPage,
          page_size: limit,
        };

        if (filterState.selectedProject > 0) {
          params.project_id = filterState.selectedProject;
        }
        if (filterState.workordernumber !== "") {
          params.wo_number = filterState.workordernumber;
        }
        if (filterState.revisionnumber > 0) {
          params.revision_no = filterState.revisionnumber;
        }
        if (filterState.contactperson !== "") {
          params.contact_person = filterState.contactperson;
        }
        if (filterState.wo_date !== "") {
          params.wo_date = filterState.wo_date;
        }
        if (filterState.wo_validate !== "") {
          params.wo_validate = filterState.wo_validate;
        }
        if (filterState.totalvalue > 0) {
          params.total_value = filterState.totalvalue;
          if (filterState.totalvalueFilterType === "upto") {
            params.total_value_filter_type = "lt";
          } else {
            params.total_value_filter_type = "eq";
          }
        }
        if (filterState.createdat !== "") {
          params.created_at = filterState.createdat;
        }
        const response = await apiClient.get("/work-orders/search", {
          cancelToken: source.token,
          params,
        });

        if (response.status === 200) {
          setData(response.data.data ?? []);
          const pag = response.data.pagination;
          if (pag) {
            setPagination({
              current_page: pag.current_page ?? pag.page ?? 1,
              per_page: pag.per_page ?? pag.limit ?? limit,
              total: pag.total ?? 0,
              total_pages: pag.total_pages ?? 0,
            });
          } else {
            setPagination(null);
          }
        } else {
          toast.error(response.data?.message || "Failed to fetch work orders");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "work orders data"));
        }
      }
    };

    fetchInvoices();

    return () => {
      source.cancel();
    };
  }, [currentPage, limit, filterState]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination?.total_pages ?? 0,
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
      doc.setFont("helvetica", "bold");
      doc.text("Work Orders Report", 14, 20);

      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      // Format Total Value for PDF - use explicit formatter to avoid locale issues
      // (Intl can produce apostrophes as thousands sep in some envs, breaking PDF display)
      const formatTotalValueForPDF = (val: number) => {
        const n = Number(val) || 0;
        const parts = n.toFixed(2).split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return `₹ ${parts.join(".")}`;
      };

      // Prepare table data with all columns
      const tableData = selectedRows.map((row) => {
        const workOrder = row.original;
        const formattedTotalValue = formatTotalValueForPDF(
          workOrder.total_value || 0,
        );

        return [
          workOrder.wo_number || "—",
          workOrder.revision_no?.toString() || "—",
          formatDisplayDate(workOrder.wo_date) || "—",
          formatDisplayDate(workOrder.wo_validate) || "—",
          formatDisplayDate(workOrder.created_at) || "—",
          workOrder.contact_person || "—",
          formattedTotalValue,
        ];
      });

      // Add table with all column headers
      autoTable(doc, {
        head: [
          [
            "Work Order Number",
            "Revision No",
            "Start date",
            "End date",
            "Created At",
            "Contact Person",
            "Total Value",
          ],
        ],
        body: tableData,
        startY: 40,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], fontSize: 8 }, // Blue header
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: {
          6: { halign: "right" }, // Total Value - right align
        },
      });

      // Save the PDF
      const fileName = `work-order-report-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      doc.save(fileName);

      toast.success(
        `PDF downloaded successfully with ${selectedRows.length} work order(s)`,
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="w-full">
      {/* top toolbar */}
      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Filter by work order number..."
          value={
            (table.getColumn("wo_number")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("wo_number")?.setFilterValue(event.target.value)
          }
          className="w-full max-w-sm sm:max-w-xs"
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
          <Button
            variant={hasActiveFilters() ? "default" : "outline"}
            className="w-full sm:w-auto"
            onClick={() => setFilterOpen((prev) => !prev)}
          >
            Advance Filter
          </Button>
          {hasActiveFilters() && (
            <Button variant="outline" onClick={clearAllFilters}>
              Clear Filters
            </Button>
          )}
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
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => navigate("/add-work-order")}
          >
            Add Work Order
          </Button>
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
      {filterOpen && (
        <AdvanceWorkOrderFilter
          onFilterChange={handleFilterChange}
          onClose={handleFilterClose}
          currentFilter={filterState}
        />
      )}
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
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="h-12">
                  <TableCell
                    colSpan={columns.length}
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
              (Total: {pagination.total} work orders)
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
                Page {pagination.current_page} of{" "}
                {Math.max(1, pagination.total_pages)}
              </span>
            </div>
          )}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={!pagination || pagination.current_page <= 1}
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
                    : prev + 1,
                )
              }
              disabled={
                !pagination || pagination.current_page >= pagination.total_pages
              }
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
