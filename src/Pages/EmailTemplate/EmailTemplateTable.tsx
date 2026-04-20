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
  ChevronDown,
  MoreHorizontal,
  Download,
  Loader2,
  FileText,
  Plus,
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

import { useNavigate } from "react-router";
import PageHeader from "@/components/ui/PageHeader";

export type Template = {
  id: number;
  name: string;
  subject: string;
  body: string;
  template_type: string;
  is_default: boolean;
  is_active: boolean;
  variables: any;
  created_by: any;
  created_at: string;
  updated_at: string;
  updated_by: any;
};
export const getColumns = (
  onEdit?: (id: number) => void,
): ColumnDef<Template>[] => [
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
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div className="capitalize">{row.original.name}</div>,
  },

  {
    accessorKey: "template_type",
    header: "Template Type",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.template_type}</div>
    ),
  },

  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const template = row.original;

      const handleEdit = () => {
        if (onEdit) {
          onEdit(template.id);
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
            <DropdownMenuItem onClick={handleEdit}>
              Edit Email Template
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
    // Check both 'error' and 'message' fields in the response
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      `Failed to ${data}.`;
    return errorMessage;
  }
  return "An unexpected error occurred. Please try again later.";
};

export function EmailTemplateTable() {
  const [sorting, setSorting] = useState<SortingState>([]);

  const navigate = useNavigate();

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [data, setData] = useState<Template[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const openEditDialog = (id: number) => {
    navigate(`/email-templates/edit/${id}`);
  };

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchTemplates = async () => {
      try {
        setDataLoading(true);
        const response = await apiClient.get(`/email-templates`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setData(response.data ?? []);
        } else {
          toast.error(response.data?.message || "Failed to fetch templates");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "templates data"));
        }
      } finally {
        setDataLoading(false);
      }
    };

    fetchTemplates();

    return () => {
      source.cancel();
    };
  }, []);

  const table = useReactTable({
    data,
    columns: getColumns(openEditDialog),
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

  if (!dataLoading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">
              No Email Templates Yet
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Email templates are the templates that are used to send emails to
              the users.
            </p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-4 text-left space-y-2">
            <h3 className="text-sm font-medium">Getting started</h3>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Create a email template with a descriptive name</li>
            </ul>
          </div>
          <Button
            onClick={() => navigate("/email-templates/create")}
            className="gap-2">
            <Plus className="w-4 h-4" />
            Create Email Template
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      <PageHeader title="Email Templates" />
      {/* top toolbar */}
      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Filter by email template name..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="w-full max-w-sm sm:max-w-xs"
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => navigate("/email-templates/create")}>
            Add Email Template
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Columns <ChevronDown className=" h-4 w-4" />
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
                      }>
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
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="[&_td]:py-1">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-0.5">
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
                    colSpan={table.getAllColumns().length}
                    className="h-24 text-center py-2">
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
            disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
