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
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useCallback, useContext, useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { UserContext } from "@/Provider/UserProvider";
import { formatDisplayDate } from "@/utils/formatdate";
import { getStatusStyles } from "@/Pages/Projects/ProjectCardView";
import type { FilterStateProject } from "./AdvanceProjectfilter";
import type { FilterStateInvoiceFilter } from "../Invoice/InvoiceFilter";
import AdvanceProjectFilter from "./AdvanceProjectfilter";

export type Project = {
  name: string;
  priority: string;
  project_status: string;
  start_date: string;
  end_date: string;
  logo: string;
  description: string;
  created_at: string;
  updated_at: string;
  last_updated: string;
  last_updated_by: string;
  client_id: number;
  budget: string;
  suspend: boolean;
  template_id: number;
  subscription_start_date: string;
  subscription_end_date: string;
  project_id: number;
  total_elements: number;
  erected_elements: number;
  casted_elements: number;
  in_stock: number;
  in_production: number;
  element_type_count: number;
  project_members_count: number;
  stockyards: null;
};

type PaginationInfo = {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export const columns: ColumnDef<Project>[] = [
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
          onClick={() => navigate(`/project/${row.original.project_id}`)}
        >
          {row.getValue("name")}
        </div>
      );
    },
  },

  //   description column
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("description")}</div>
    ),
  },
  //   budget
  {
    accessorKey: "budget",
    header: () => <div className="text-right">Budget</div>,
    cell: ({ row }) => {
      const budget = parseFloat(row.getValue("budget"));
      // Format the amount as a dollar amount
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "INR",
      }).format(budget);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },

  //   start date column
  {
    accessorKey: "start_date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Start Date
        <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const raw = row.getValue("start_date") as string | undefined;
      return <div>{formatDisplayDate(raw)}</div>;
    },
  },
  //   end date column
  {
    accessorKey: "end_date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        End Date
        <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const raw = row.getValue("end_date") as string | undefined;
      return <div>{formatDisplayDate(raw)}</div>;
    },
  },
  //   priority column
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("priority")}</div>
    ),
  },
  //   project status column
  {
    accessorKey: "project_status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.getValue("project_status") as string | undefined;
      const { badge, dot } = getStatusStyles(status);

      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          {status || "Unknown"}
        </span>
      );
    },
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
      const payment = row.original;
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
              onClick={() => navigate(`/project/${payment.project_id}`)}
            >
              View Project
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate(`/edit-projects/${payment.project_id}`)}
            >
              Edit Project
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

export function ProjectTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { user } = useContext(UserContext);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const navigate = useNavigate();
  const [data, setData] = useState<Project[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const [filterState, setFilterState] = useState<FilterStateProject>({
    name: "",
    client_id: 0,
    stockyard_id: 0,
    start_date: "",
    end_date: "",
    subscription_start_date: "",
    subscription_end_date: "",
    type: "all",
  });

  const handleFilterChange = useCallback(
    (filters: FilterStateProject) => {
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
      name: "",
      client_id: 0,
      stockyard_id: 0,
      start_date: "",
      end_date: "",
      subscription_start_date: "",
      subscription_end_date: "",
      type: "all",
    });
    setCurrentPage(1);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      filterState.name !== "" ||
      filterState.client_id > 0 ||
      filterState.stockyard_id > 0 ||
      filterState.start_date !== "" ||
      filterState.end_date !== "" ||
      filterState.subscription_start_date !== "" ||
      filterState.subscription_end_date !== "" ||
      filterState.type !== "all"
    );
  };

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchProjects = async () => {
      try {
        const params: Record<string, number | string> = {
          page: currentPage,
          page_size: limit,
        };
        if (filterState.name !== "") {
          params.name = filterState.name;
        }
        if (filterState.client_id > 0) {
          params.client_id = filterState.client_id;
        }
        if (filterState.stockyard_id > 0) {
          params.stockyard_id = filterState.stockyard_id;
        }
        if (filterState.start_date !== "") {
          params.start_date = filterState.start_date;
        }
        if (filterState.end_date !== "") {
          params.end_date = filterState.end_date;
        }
        if (filterState.subscription_start_date !== "") {
          params.subscription_start_date = filterState.subscription_start_date;
        }
        if (filterState.subscription_end_date !== "") {
          params.subscription_end_date = filterState.subscription_end_date;
        }
        if (filterState.type !== "all") {
          params.type = filterState.type;
        }
        const response = await apiClient.get("/projects_overview", {
          cancelToken: source.token,
          params,
        });

        if (response.status === 200) {
          setData(response.data.projects);
          if (response.data.pagination) {
            setPagination(response.data.pagination);
          }
        } else {
          toast.error(response.data?.message || "Failed to fetch projects");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "projects data"));
        }
      }
    };

    fetchProjects();

    return () => {
      source.cancel();
    };
  }, [filterState, currentPage, limit]);

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

  return (
    <div className="w-full">
      {/* top toolbar */}
      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Filter by Project Name..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
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
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => navigate("/add-projects")}
          >
            Add Project
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
        <AdvanceProjectFilter
          onFilterChange={handleFilterChange}
          onClose={handleFilterClose}
          currentFilter={filterState}
        />
      )}
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
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={
                    row.original.suspend && user?.role_name !== "superadmin"
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
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
