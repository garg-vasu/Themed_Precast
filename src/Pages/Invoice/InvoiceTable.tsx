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
import type { FilterStateInvoiceFilter } from "./InvoiceFilter";
import InvoiceFilter from "./InvoiceFilter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Item {
  id: number;
  invoice_id: number;
  item_id: number;
  volume: number;
  hsn_code: number;
  tower_id: number;
  item_name: string;
  unit_rate: number;
  tax: number;
  volume_used: number;
  balance: number;
}

export type Invoice = {
  id: number;
  name: string;
  work_order_id: number;
  created_by: number;
  created_at: string;
  revision_no: number;
  items: Item[];
  billing_address: string;
  shipping_address: string;
  created_by_name: string;
  wo_number: string;
  wo_date: string;
  wo_validate: string;
  total_value: number;
  contact_person: string;
  contact_email: string;
  contact_number: string;
  phone_code: number;
  payment_term: string;
  wo_description: string;
  endclient_id: number;
  project_id: number;
  project_name: string;
  end_client: string;
  comments: string;
  phone_code_name: string;
  revision: number;
  payment_status: string;
  total_paid: number;
  total_amount: number;
  updated_by: number;
  updated_at: string;
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

type PaginationInfo = {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export const columns: ColumnDef<Invoice>[] = [
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
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const navigate = useNavigate();
      return (
        <div
          className="capitalize cursor-pointer"
          onClick={() =>
            navigate(
              `/invoice-detail/${row.original.id}/${row.original.work_order_id}`
            )
          }
        >
          {row.original.name}
        </div>
      );
    },
  },
  {
    id: "email",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Email
        <ArrowUpDown />
      </Button>
    ),
    accessorFn: (invoice) => invoice.contact_email ?? "",
    cell: ({ row }) => (
      <div className="lowercase">{row.original.contact_email ?? "—"}</div>
    ),
  },
  //   payment status column
  // status can be Partial_paid, fully_paid or unpaid
  //   and color code should be green for fully_paid, red for unpaid and yellow for Partial_paid
  {
    id: "payment_status",
    header: "Payment Status",
    cell: ({ row }) => {
      const status = row.original.payment_status;
      const { badge, dot } = getPaymentStatusStyles(status);

      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize tracking-wide ${badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          {status || "—"}
        </span>
      );
    },
  },

  {
    id: "billing_address",
    header: "Billing Address",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.billing_address || "—"}</div>
    ),
  },
  //   shipping address column
  {
    id: "shipping_address",
    header: "Shipping Address",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.shipping_address || "—"}</div>
    ),
  },
  //   end customer column
  {
    id: "end_client",
    header: "End Client",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.end_client || "—"}</div>
    ),
  },
  //   project name column
  {
    id: "project_name",
    header: "Project Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.project_name || "—"}</div>
    ),
  },
  //   CREATED BY COLUMN
  {
    id: "created_by",
    header: "Created By",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.created_by_name || "—"}</div>
    ),
  },
  //   revesion no column
  {
    id: "revision_no",
    header: "Revision No",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.revision_no || "—"}</div>
    ),
  },
  //   work order number column
  {
    id: "work_order_id",
    header: "Work Order ID",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.work_order_id || "—"}</div>
    ),
  },

  {
    accessorKey: "total_amount",
    header: () => <div className="text-right">Total Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("total_amount"));

      // Format the amount as a dollar amount
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "INR",
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  //   Total Paid column
  {
    accessorKey: "total_paid",
    header: () => <div className="text-right">Total Paid</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("total_paid"));

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

export function InvoiceTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const navigate = useNavigate();
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const [data, setData] = useState<Invoice[]>([]);

  const [filterState, setFilterState] = useState<FilterStateInvoiceFilter>({
    selectedProject: 0,
    workorderid: "",
    contact_person: "",
    contact_email: "",
    contact_number: "",
    payment_status: "",
    total_paid: 0,
    total_value: 0,
    totalvalueFilterType: "exact",
    totalpaidFilterType: "exact",
    billing_address: "",
    shipping_address: "",
    wo_date: "",
    wo_validate: "",
    endclient_id: 0,
  });

  const handleFilterChange = useCallback(
    (filters: FilterStateInvoiceFilter) => {
      // Only update if filters actually changed
      if (JSON.stringify(filters) !== JSON.stringify(filterState)) {
        setFilterState(filters);
        setCurrentPage(1); // Reset to first page when filters change
      }
    },
    [filterState]
  );

  const handleFilterClose = useCallback(() => {
    setFilterOpen(false);
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilterState({
      selectedProject: 0,
      workorderid: "",
      contact_person: "",
      contact_email: "",
      contact_number: "",
      payment_status: "",
      total_paid: 0,
      total_value: 0,
      totalvalueFilterType: "exact",
      totalpaidFilterType: "exact",
      billing_address: "",
      shipping_address: "",
      wo_date: "",
      wo_validate: "",
      endclient_id: 0,
    });
    setCurrentPage(1);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      filterState.selectedProject > 0 ||
      filterState.workorderid !== "" ||
      filterState.contact_person !== "" ||
      filterState.contact_email !== "" ||
      filterState.contact_number !== "" ||
      filterState.payment_status !== "" ||
      filterState.total_paid > 0 ||
      filterState.total_value > 0 ||
      filterState.totalvalueFilterType !== "exact" ||
      filterState.totalpaidFilterType !== "exact" ||
      filterState.billing_address !== "" ||
      filterState.shipping_address !== "" ||
      filterState.wo_date !== "" ||
      filterState.wo_validate !== "" ||
      filterState.endclient_id > 0
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
        if (filterState.workorderid !== "") {
          params.work_order_id = filterState.workorderid;
        }
        if (filterState.contact_person !== "") {
          params.contact_person = filterState.contact_person;
        }
        if (filterState.contact_email !== "") {
          params.contact_email = filterState.contact_email;
        }
        if (filterState.contact_number !== "") {
          params.contact_number = filterState.contact_number;
        }
        if (filterState.payment_status !== "") {
          params.payment_status = filterState.payment_status;
        }
        if (filterState.total_paid > 0) {
          params.total_paid = filterState.total_paid;
          if (filterState.totalpaidFilterType === "upto") {
            params.total_paid_filter_type = "lt";
          } else {
            params.total_paid_filter_type = "eq";
          }
        }
        if (filterState.total_value > 0) {
          params.total_value = filterState.total_value;
          if (filterState.totalvalueFilterType === "upto") {
            params.total_value_filter_Type = "lt";
          } else {
            params.total_value_filter_Type = "eq";
          }
        }
        if (filterState.billing_address !== "") {
          params.billing_address = filterState.billing_address;
        }
        if (filterState.shipping_address !== "") {
          params.shipping_address = filterState.shipping_address;
        }
        if (filterState.wo_date !== "") {
          params.wo_date = filterState.wo_date;
        }
        if (filterState.wo_validate !== "") {
          params.wo_validate = filterState.wo_validate;
        }
        if (filterState.endclient_id > 0) {
          params.endclient_id = filterState.endclient_id;
        }

        const response = await apiClient.get("/invoices/search", {
          cancelToken: source.token,
          params,
        });

        if (response.status === 200) {
          setData(response.data.data);
          if (response.data.pagination) {
            setPagination(response.data.pagination);
          }
        } else {
          toast.error(response.data?.message || "Failed to fetch invoices");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "invoices data"));
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
      doc.text("Invoices Report", 14, 20);

      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      // Prepare table data with all columns
      const tableData = selectedRows.map((row) => {
        const invoice = row.original;
        const formattedTotalAmount = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "INR",
        }).format(invoice.total_amount || 0);
        const formattedTotalPaid = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "INR",
        }).format(invoice.total_paid || 0);

        return [
          invoice.name || "—",
          invoice.contact_email || "—",
          invoice.payment_status || "—",
          invoice.billing_address || "—",
          invoice.shipping_address || "—",
          invoice.end_client || "—",
          invoice.project_name || "—",
          invoice.created_by_name || "—",
          invoice.revision_no?.toString() || "—",
          invoice.wo_number || invoice.work_order_id?.toString() || "—",
          formattedTotalAmount,
          formattedTotalPaid,
        ];
      });

      // Add table with all column headers
      autoTable(doc, {
        head: [
          [
            "Name",
            "Email",
            "Payment Status",
            "Billing Address",
            "Shipping Address",
            "End Client",
            "Project Name",
            "Created By",
            "Revision No",
            "Work Order",
            "Total Amount",
            "Total Paid",
          ],
        ],
        body: tableData,
        startY: 40,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], fontSize: 8 }, // Blue header
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: {
          10: { halign: "right" }, // Total Amount - right align
          11: { halign: "right" }, // Total Paid - right align
        },
      });

      // Save the PDF
      const fileName = `invoices-report-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      doc.save(fileName);

      toast.success(
        `PDF downloaded successfully with ${selectedRows.length} invoice(s)`
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
        <InvoiceFilter
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
                Page {pagination.current_page} of {pagination.total_pages}
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
                    : prev + 1
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
