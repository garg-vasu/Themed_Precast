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
import { generatePDFFromTable } from "@/utils/pdfGenerator";
import type { FilterStateUser } from "./AdvanceUser";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdvanceWorkOrderFilter from "../WorkOrder/AdvanceWorkOrder";
import AdvanceUserFilter from "./AdvanceUser";

export type User = {
  id: number;
  employee_id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
  first_access: string;
  last_access: string;
  profile_pic: string;
  is_admin: true;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  phone_no: string;
  role_id: number;
  role_name: string;
  phone_code: number;
  phone_code_name: string;
  project_names: string[];
};

type PaginationInfo = {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

const getInitials = (first?: string, last?: string) => {
  const firstInitial = first?.[0] ?? "";
  const lastInitial = last?.[0] ?? "";
  return (firstInitial + lastInitial || "TN").toUpperCase();
};

const buildAvatarSrc = (profilePicture?: string) => {
  if (!profilePicture) return "";
  const baseUrl = import.meta.env.VITE_API_URL;
  if (!baseUrl) return profilePicture;
  return `${baseUrl}/get-file?file=${encodeURIComponent(profilePicture)}`;
};

export const columns: ColumnDef<User>[] = [
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
    id: "tenant",
    header: "Name",
    cell: ({ row }) => {
      const { first_name, last_name, profile_pic, role_name } = row.original;
      const name = `${first_name ?? ""} ${last_name ?? ""}`.trim() || "Unknown";
      const avatarSrc = buildAvatarSrc(profile_pic);
      const navigate = useNavigate();
      return (
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate(`/user-detail/${row.original.id}`)}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarSrc} alt={name} />
            <AvatarFallback>
              {getInitials(first_name, last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium capitalize">{name}</span>
            <span className="text-xs text-muted-foreground">
              {role_name ?? "--"}
            </span>
          </div>
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
    accessorFn: (user) => user.email ?? "",
    cell: ({ row }) => (
      <div className="lowercase">{row.original.email ?? "—"}</div>
    ),
  },
  {
    id: "phone",
    header: "Phone",
    accessorFn: (user) => user.phone_no ?? "",
    // phone code and phone number
    cell: ({ row }) => (
      <div>
        {row.original.phone_code} {row.original.phone_no ?? "—"}
      </div>
    ),
  },
  {
    id: "address",
    header: "Address",
    accessorFn: (user) => user.address ?? "",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.address ?? "—"}</div>
    ),
  },
  {
    id: "role",
    header: "Role",
    accessorFn: (user) => user.role_name ?? "",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.role_name ?? "--"}</div>
    ),
  },
  // CREATED AT
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

  // {
  //   id: "actions",
  //   enableHiding: false,
  //   cell: ({ row }) => {
  //     const payment = row.original;
  //     const navigate = useNavigate();

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
  //           <DropdownMenuItem
  //             onClick={() => navigate(`/user-detail/${payment.id}`)}
  //           >
  //             View User
  //           </DropdownMenuItem>
  //           <DropdownMenuSeparator />
  //           <DropdownMenuItem>View customer</DropdownMenuItem>
  //           <DropdownMenuItem>View payment details</DropdownMenuItem>
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

export function UserTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [data, setData] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  //   filter state
  const [filterState, setFilterState] = useState<FilterStateUser>({
    selectedProject: 0,
    email: "",
    first_name: "",
    last_name: "",
    address: "",
    city: "",
    state: "",
    country: "",
    zip_code: "",
    phone_no: "",
    selectedRole: 0,
  });

  const handleFilterChange = useCallback(
    (filters: FilterStateUser) => {
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
      email: "",
      first_name: "",
      last_name: "",
      address: "",
      city: "",
      state: "",
      country: "",
      zip_code: "",
      phone_no: "",
      selectedRole: 0,
    });
    setCurrentPage(1);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      filterState.selectedProject > 0 ||
      filterState.email !== "" ||
      filterState.first_name !== "" ||
      filterState.last_name !== "" ||
      filterState.address !== "" ||
      filterState.city !== "" ||
      filterState.state !== "" ||
      filterState.country !== "" ||
      filterState.zip_code !== "" ||
      filterState.phone_no !== "" ||
      filterState.selectedRole > 0
    );
  };

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchUsers = async () => {
      try {
        const params: Record<string, number | string> = {
          page: currentPage,
          page_size: limit,
        };
        if (filterState.selectedProject > 0) {
          params.project_id = filterState.selectedProject;
        }
        if (filterState.email !== "") {
          params.email = filterState.email;
        }
        if (filterState.first_name !== "") {
          params.first_name = filterState.first_name;
        }
        if (filterState.last_name !== "") {
          params.last_name = filterState.last_name;
        }
        if (filterState.address !== "") {
          params.address = filterState.address;
        }
        if (filterState.city !== "") {
          params.city = filterState.city;
        }
        if (filterState.state !== "") {
          params.state = filterState.state;
        }
        if (filterState.country !== "") {
          params.country = filterState.country;
        }
        if (filterState.zip_code !== "") {
          params.zip_code = filterState.zip_code;
        }
        if (filterState.phone_no !== "") {
          params.phone_no = filterState.phone_no;
        }
        if (filterState.selectedRole > 0) {
          params.role_id = filterState.selectedRole;
        }

        const response = await apiClient.get("/users", {
          cancelToken: source.token,
          params,
        });

        if (response.status === 200) {
          setData(response.data.data);
          if (response.data.pagination) {
            setPagination(response.data.pagination);
          }
        } else {
          toast.error(response.data?.message || "Failed to fetch users");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "users data"));
        }
      }
    };

    fetchUsers();

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
      title: "User Report",
      headers: ["First Name", "Last Name", "Email", "Phone", "Address", "Role"],
      dataMapper: (row): string[] => {
        const user = row.original as User;
        return [
          user.first_name || "—",
          user.last_name || "—",
          user.email || "—",
          user.phone_no || "—",
          user.address || "—",
          user.role_name || "—",
        ];
      },
      fileName: `user-report-${new Date().toISOString().split("T")[0]}.pdf`,
      successMessage: "PDF downloaded successfully with {count} user(s)",
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
          placeholder="Filter by email or name..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
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
        <AdvanceUserFilter
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
