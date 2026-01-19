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
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCallback, useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import type { FilterStateLog } from "./LogAdvanceFilter";
import LogAdvanceFilter from "./LogAdvanceFilter";
import PageHeader from "@/components/ui/PageHeader";

export type Log = {
  id: number;
  created_at: string;
  user_name: string;
  host_name: string;
  event_context: string;
  ip_address: string;
  description: string;
  event_name: string;
  affected_user_name: string;
  affected_user_email: string;
  project_id: number;
};

type PaginationInfo = {
  current_page: number;
  has_next: boolean;
  has_prev: boolean;
  page_size: number;
  total_records: number;
  total_pages: number;
};

export type ApiResponse = {
  logs: Log[];
  pagination: PaginationInfo;
};

export const columns: ColumnDef<Log>[] = [
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
    accessorKey: "event_name",
    header: "Event Name",
    cell: ({ row }) => {
      return (
        <div className="capitalize cursor-pointer">
          {row.getValue("event_name")}
        </div>
      );
    },
  },
  {
    accessorKey: "event_context",
    header: "Event Context",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("event_context")}</div>
    ),
  },
  {
    accessorKey: "ip_address",
    header: "IP Address",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("ip_address")}</div>
    ),
  },
  {
    accessorKey: "host_name",
    header: "Host Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("host_name")}</div>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("description")}</div>
    ),
  },

  {
    accessorKey: "affected_user_name",
    header: "Affected User Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("affected_user_name")}</div>
    ),
  },
  {
    accessorKey: "affected_user_email",
    header: "Affected User Email",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("affected_user_email")}</div>
    ),
  },

  {
    accessorKey: "project_id",
    header: "Project ID",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("project_id")}</div>
    ),
  },
  {
    accessorKey: "user_name",
    header: "User Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("user_name")}</div>
    ),
  },
  // {
  //   id: "actions",
  //   enableHiding: false,
  //   cell: ({ row }) => {
  //     return (
  //       <DropdownMenu>
  //         <DropdownMenuTrigger asChild>
  //           <Button variant="ghost" className="h-8 w-8 p-0">
  //             <span className="sr-only">Open menu</span>
  //             <MoreHorizontal />
  //           </Button>
  //         </DropdownMenuTrigger>
  //         <DropdownMenuContent align="end">
  //           <DropdownMenuLabel>Actions</DropdownMenuLabel>
  //           <DropdownMenuSeparator />
  //         </DropdownMenuContent>
  //       </DropdownMenu>
  //     );
  //   },
  // },
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

export function LogTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [data, setData] = useState<Log[]>([]);
  //   server side pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  //   filter state
  const [filterState, setFilterState] = useState<FilterStateLog>({
    selectedProject: 0,
    user_name: "",
    event_name: "",
    ip_address: "",
    host_name: "",
    affected_user_name: "",
    affected_user_email: "",
    event_context: "",
    event_context_mode: "contains",
  });

  const handleFilterChange = useCallback(
    (filters: FilterStateLog) => {
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
      user_name: "",
      event_name: "",
      ip_address: "",
      host_name: "",
      affected_user_name: "",
      affected_user_email: "",
      event_context: "",
      event_context_mode: "contains",
    });
    setCurrentPage(1);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      filterState.selectedProject > 0 ||
      filterState.user_name !== "" ||
      filterState.event_name !== "" ||
      filterState.ip_address !== "" ||
      filterState.host_name !== "" ||
      filterState.affected_user_name !== "" ||
      filterState.affected_user_email !== "" ||
      filterState.event_context !== ""
    );
  };

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchLogs = async () => {
      try {
        const params: Record<string, number | string> = {
          page: currentPage,
          page_size: limit,
        };

        if (filterState.selectedProject > 0) {
          params.project_id = filterState.selectedProject;
        }
        if (filterState.user_name !== "") {
          params.user_name = filterState.user_name.trim();
        }
        if (filterState.event_name !== "") {
          params.event_name = filterState.event_name.trim();
        }
        if (filterState.ip_address !== "") {
          params.ip_address = filterState.ip_address.trim();
        }
        if (filterState.host_name !== "") {
          params.host_name = filterState.host_name.trim();
        }
        if (filterState.affected_user_name !== "") {
          params.affected_user_name = filterState.affected_user_name.trim();
        }
        if (filterState.affected_user_email !== "") {
          params.affected_user_email = filterState.affected_user_email.trim();
        }
        if (filterState.event_context !== "") {
          params.event_context = filterState.event_context.trim();
        }
        if (filterState.event_context_mode === "exact") {
          params.event_context_mode = "exact";
        } else {
          params.event_context_mode = "contains";
        }

        const response = await apiClient.get(`/logs`, {
          cancelToken: source.token,
          params,
        });

        if (response.status === 200) {
          setData(response.data.logs || []);
          if (response.data.pagination) {
            setPagination(response.data.pagination);
          }
        } else {
          toast.error(response.data?.message || "Failed to fetch logs");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "log data"));
        }
      }
    };

    fetchLogs();

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

  return (
    <div className="w-full p-4 ">
      <div className="flex  item-center justify-between">
        <PageHeader title="Logs" />
      </div>
      {/* top toolbar */}
      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Filter by event name..."
          value={
            (table.getColumn("event_name")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("event_name")?.setFilterValue(event.target.value)
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
        <LogAdvanceFilter
          onFilterChange={handleFilterChange}
          onClose={handleFilterClose}
          currentFilter={filterState}
        />
      )}
      <div className="overflow-hidden rounded-md border shadow-md bg-card mt-4">
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
              table.getRowModel().rows.map((row) => (
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
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
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
              (Total: {pagination.total_records} logs)
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
