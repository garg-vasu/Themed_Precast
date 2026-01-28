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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { formatDisplayDate } from "@/utils/formatdate";
import { generatePDFFromTable } from "@/utils/pdfGenerator";
import type { FilterStateEndClient } from "./AdvanceEndClientFilter";
import AdvanceEndClientFilter from "./AdvanceEndClientFilter";

type PaginationInfo = {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export type EndClient = {
  id: number;
  email: string;
  contact_person: string;
  address: string;
  attachment: string[];
  organization: string;
  cin: string;
  gst_number: string;
  phone_no: string;
  profile_picture: string;
  created_at: string;
  updated_at: string;
  created_by: number;
};

const getInitials = (text?: string) => {
  if (!text) return "EC";
  const parts = text.trim().split(" ");
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second || first || "EC").toUpperCase();
};

export const columns: ColumnDef<EndClient>[] = [
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
    id: "client",
    header: "Name",
    cell: ({ row }) => {
      const { contact_person, organization, profile_picture } = row.original;
      const name = contact_person || organization || "Unknown";
      const navigate = useNavigate();
      return (
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate(`/end-client/${row.original.id}`)}
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile_picture} alt={name} />
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium capitalize">{name}</span>
            <span className="text-xs text-muted-foreground">End Client</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "organization",
    header: "Organization",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.organization}</div>
    ),
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
    accessorFn: (client) => client.email ?? "",
    cell: ({ row }) => <div className="lowercase">{row.original.email}</div>,
  },
  {
    id: "contact_person",
    header: "Contact Person",

    accessorFn: (client) => client.contact_person ?? "",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.contact_person}</div>
    ),
  },
  {
    id: "phone",
    header: "Phone",
    accessorFn: (client) => client.phone_no ?? "",
    cell: ({ row }) => <div>{row.original.phone_no}</div>,
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => <div className="capitalize">{row.original.address}</div>,
  },
  {
    accessorKey: "cin",
    header: "CIN",
    cell: ({ row }) => <div>{row.original.cin || "—"}</div>,
  },
  {
    accessorKey: "gst_number",
    header: "GST Number",
    cell: ({ row }) => <div>{row.original.gst_number || "—"}</div>,
  },
  {
    id: "attachments",
    header: "Attachments",
    accessorFn: (client) => client.attachment?.length ?? 0,
    cell: ({ row }) => <div>{row.original.attachment?.length ?? 0}</div>,
  },

  //   {
  //     accessorKey: "amount",
  //     header: () => <div className="text-right">Amount</div>,
  //     cell: ({ row }) => {
  //       const amount = parseFloat(row.getValue("amount"));

  //       // Format the amount as a dollar amount
  //       const formatted = new Intl.NumberFormat("en-US", {
  //         style: "currency",
  //         currency: "USD",
  //       }).format(amount);

  //       return <div className="text-right font-medium">{formatted}</div>;
  //     },
  //   },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const endClient = row.original;
      const navigate = useNavigate();

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigate(`/end-client/${endClient.id}`)}
            >
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate(`/edit-end-client/${endClient.id}`)}
            >
              Edit End Client
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

export function EndClientTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const navigate = useNavigate();
  const [filterOpen, setFilterOpen] = useState(false);
  const [data, setData] = useState<EndClient[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  //   filter state
  const [filterState, setFilterState] = useState<FilterStateEndClient>({
    client_id: 0,
    email: "",
    organization: "",
    contact_person: "",
    address: "",
    cin: "",
    gst_number: "",
    phone_no: "",
  });

  const handleFilterChange = useCallback(
    (filters: FilterStateEndClient) => {
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
      client_id: 0,
      email: "",
      organization: "",
      contact_person: "",
      address: "",
      cin: "",
      gst_number: "",
      phone_no: "",
    });
    setCurrentPage(1);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      filterState.client_id > 0 ||
      filterState.email !== "" ||
      filterState.contact_person !== "" ||
      filterState.address !== "" ||
      filterState.cin !== "" ||
      filterState.gst_number !== "" ||
      filterState.phone_no !== "" ||
      filterState.organization !== ""
    );
  };

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchEndClients = async () => {
      try {
        const params: Record<string, number | string> = {
          page: currentPage,
          page_size: limit,
        };
        if (filterState.client_id > 0) {
          params.client_id = filterState.client_id;
        }
        if (filterState.email !== "") {
          params.email = filterState.email;
        }
        if (filterState.contact_person !== "") {
          params.contact_person = filterState.contact_person;
        }
        if (filterState.address !== "") {
          params.address = filterState.address;
        }
        if (filterState.cin !== "") {
          params.cin = filterState.cin;
        }
        if (filterState.gst_number !== "") {
          params.gst_number = filterState.gst_number;
        }
        if (filterState.phone_no !== "") {
          params.phone_no = filterState.phone_no;
        }
        if (filterState.organization !== "") {
          params.organization = filterState.organization;
        }
        if (filterState.phone_no !== "") {
          params.phone_no = filterState.phone_no;
        }

        const response = await apiClient.get("/end_clients", {
          params,
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setData(response.data.data);
          if (response.data.pagination) {
            setPagination(response.data.pagination);
          }
        } else {
          toast.error(response.data?.message || "Failed to fetch end clients");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "end clients data"));
        }
      }
    };

    fetchEndClients();

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

    generatePDFFromTable({
      selectedRows,
      title: "End Client Report",
      headers: [
        "Contact Person",
        "Organization",
        "Email",
        "Phone",
        "Address",
        "CIN",
        "GST Number",
        "Created At",
        "Updated At",
      ],
      dataMapper: (row): string[] => {
        const endClient = row.original as EndClient;
        return [
          endClient.contact_person || "—",
          endClient.organization || "—",
          endClient.email || "—",
          endClient.phone_no || "—",
          endClient.address || "—",
          endClient.cin || "—",
          endClient.gst_number || "—",
          endClient.attachment?.length?.toString() || "0",
          formatDisplayDate(endClient.created_at),
          formatDisplayDate(endClient.updated_at),
        ];
      },
      fileName: `end-client-report-${new Date().toISOString().split("T")[0]}.pdf`,
      successMessage: "PDF downloaded successfully with {count} end client(s)",
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
          placeholder="Filter by organization..."
          value={
            (table.getColumn("organization")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("organization")?.setFilterValue(event.target.value)
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
            onClick={() => navigate("/add-end-client")}
          >
            Add End Client
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
        <AdvanceEndClientFilter
          onFilterChange={handleFilterChange}
          onClose={handleFilterClose}
          currentFilter={filterState}
        />
      )}
      <div className="overflow-hidden rounded-md border">
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
                  className="h-12"
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
