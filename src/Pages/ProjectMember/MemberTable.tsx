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
import { useNavigate, useParams } from "react-router";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type Member = {
  id: number;
  employee_id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
  first_access: string;
  last_access: string;
  profile_picture: string;
  is_admin: boolean;
  ip?: string;
  address: string;
  city: string;
  state: string;
  user_id: number;
  country: string;
  zip_code?: string;
  phone_no: string;
  role: string;
  role_name: string;
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

export const columns: ColumnDef<Member>[] = [
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
    id: "member",
    header: "Name",
    accessorFn: (member) => {
      const name = `${member.first_name ?? ""} ${
        member.last_name ?? ""
      }`.trim();
      return `${name} ${member.email} ${member.role_name}`.toLowerCase();
    },
    cell: ({ row }) => {
      const { first_name, last_name, profile_picture, role_name } =
        row.original;
      const name = `${first_name ?? ""} ${last_name ?? ""}`.trim() || "Unknown";
      const avatarSrc = buildAvatarSrc(profile_picture);

      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarSrc} alt={name} />
            <AvatarFallback>
              {getInitials(first_name, last_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium capitalize">{name}</span>
            <span className="text-xs text-muted-foreground">
              {role_name ?? "Member"}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Email
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => <div className="capitalize">{row.original.email}</div>,
  },
  {
    id: "address",
    header: "Address",
    accessorFn: (member) => member.address ?? "",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.address ?? "—"}</div>
    ),
  },
  {
    id: "state",
    header: "State  ",
    accessorFn: (member) => member.state ?? "",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.state ?? "—"}</div>
    ),
  },

  {
    id: "phone_no",
    header: "Phone Number",
    accessorFn: (member) => member.phone_no ?? "",
    cell: ({ row }) => <div>{row.original.phone_no ?? "—"}</div>,
  },

  {
    id: "role",
    header: "Role",
    accessorFn: (member) => member.role_name ?? "",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.role_name ?? "Member"}</div>
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
      const member = row.original;

      const { projectId } = useParams<{ projectId: string }>();
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
              onClick={() => {
                // TODO: Implement edit member functionality
                navigate(`/project/${projectId}/edit-member/${member.user_id}`);
              }}
            >
              Edit Member
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                // TODO: Implement remove member functionality
                toast.info("Remove member functionality coming soon");
              }}
              className="text-destructive focus:text-destructive"
            >
              Remove from Project
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

export function MemberTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [data, setData] = useState<Member[]>([]);

  useEffect(() => {
    if (!projectId) return;

    const source = axios.CancelToken.source();

    const fetchMembers = async () => {
      try {
        const response = await apiClient.get(`/project/${projectId}/members`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setData(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch members");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "members data"));
        }
      }
    };

    fetchMembers();

    return () => {
      source.cancel();
    };
  }, [projectId]);

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
      doc.text("Members Report", 14, 20);

      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      // Prepare table data
      const tableData = selectedRows.map((row) => {
        const member = row.original;
        const name =
          `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim() ||
          "Unknown";
        const location =
          [member.city, member.state, member.country]
            .filter(Boolean)
            .join(", ") || "—";
        const address = member.address || "—";

        return [
          name,
          member.email || "—",
          member.phone_no || "—",
          address,
          location,
          member.role || "Member",
        ];
      });

      // Add table
      autoTable(doc, {
        head: [["Name", "Email", "Phone", "Address", "Location", "Role"]],
        body: tableData,
        startY: 40,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] }, // Blue header
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      // Save the PDF
      const fileName = `members-report-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      doc.save(fileName);

      toast.success(
        `PDF downloaded successfully with ${selectedRows.length} member(s)`,
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
          placeholder="Filter by name, email, or role..."
          value={(table.getColumn("member")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("member")?.setFilterValue(event.target.value)
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
            onClick={() => {
              // TODO: Implement add member functionality
              navigate(`/project/${projectId}/add-project-member`);
            }}
          >
            Add Member
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
