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
import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { generatePDFFromTable } from "@/utils/pdfGenerator";

export interface User {
  id: number;
  employee_id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  first_access: string; // ISO date string
  last_access: string; // ISO date string
  profile_picture: string;
  is_admin: boolean;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  phone_no: string;
  role_id: number;
  role_name: string;
  suspended: boolean;
}

export type Tenant = {
  client_id: number;
  user_id: number;
  organization: string;
  user: User;
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

export const columns: ColumnDef<Tenant>[] = [
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
      const { user, organization } = row.original;
      const name =
        `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
        organization ||
        "Unknown";
      const avatarSrc = buildAvatarSrc(user?.profile_picture);
      const navigate = useNavigate();
      return (
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate(`/tenant-detail/${row.original.client_id}`)}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarSrc} alt={name} />
            <AvatarFallback>
              {getInitials(user?.first_name, user?.last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium capitalize">{name}</span>
            <span className="text-xs text-muted-foreground">
              {user?.role_name ?? "Tenant"}
            </span>
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
    accessorFn: (tenant) => tenant.user?.email ?? "",
    cell: ({ row }) => (
      <div className="lowercase">{row.original.user?.email ?? "—"}</div>
    ),
  },
  {
    id: "phone",
    header: "Phone",
    accessorFn: (tenant) => tenant.user?.phone_no ?? "",
    cell: ({ row }) => <div>{row.original.user?.phone_no ?? "—"}</div>,
  },
  {
    id: "location",
    header: "Location",
    accessorFn: (tenant) => {
      const city = tenant.user?.city;
      const country = tenant.user?.country;
      return [city, country].filter(Boolean).join(", ");
    },
    cell: ({ row }) => {
      const city = row.original.user?.city;
      const country = row.original.user?.country;
      const location = [city, country].filter(Boolean).join(", ");
      return <div className="capitalize">{location || "—"}</div>;
    },
  },
  {
    id: "role",
    header: "Role",
    accessorFn: (tenant) => tenant.user?.role_name ?? "",
    cell: ({ row }) => (
      <div className="capitalize">
        {row.original.user?.role_name ?? "Tenant"}
      </div>
    ),
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
              onClick={() => navigate(`/tenant-detail/${payment.client_id}`)}
            >
              View Tenant
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate(`/edit-tenant/${payment.client_id}`)}
            >
              Edit Tenant
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                navigate(`/tenant-via-end-client/${payment.client_id}`)
              }
            >
              View Projects
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

export function TenantsTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const navigate = useNavigate();
  const [data, setData] = useState<Tenant[]>([]);

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchTenants = async () => {
      try {
        const response = await apiClient.get("/client", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setData(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch tenants");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "tenants data"));
        }
      }
    };

    fetchTenants();

    return () => {
      source.cancel();
    };
  }, []);

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
      title: "Tenants Report",
      headers: ["Name", "Organization", "Email", "Phone", "Location", "Role"],
      dataMapper: (row) => {
        const tenant = row.original;
        const user = tenant.user;
        const name =
          `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
          tenant.organization ||
          "Unknown";
        const location =
          [user?.city, user?.country].filter(Boolean).join(", ") || "—";

        return [
          name,
          tenant.organization || "—",
          user?.email || "—",
          user?.phone_no || "—",
          location,
          user?.role_name || "Tenant",
        ];
      },
      fileName: `tenants-report-${new Date().toISOString().split("T")[0]}.pdf`,
      successMessage: "PDF downloaded successfully with {count} tenant(s)",
      emptySelectionMessage: "Please select at least one row to download",
      titleFontSize: 24,
      headerColor: "#283C6E",
      headerHeight: 12,
      bodyFontSize: 9,
    });
  };

  return (
    <div className="w-full ">
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
            onClick={() => navigate("/add-tenant")}
          >
            Add Tenant
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
                  className="h-24 text-center py-2"
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
