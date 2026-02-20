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
import { useNavigate } from "react-router";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import AddStoreWarehouse from "./AddStoreWarehouse";
import { generatePDFFromTable } from "@/utils/pdfGenerator";

export type StoreWarehouse = {
  id: number;
  name: string;
  location: string;
  contact_number: string;
  email: string;
  capacity: number;
  used_capacity: number;
  description: string;
  created_at: string;
  updated_at: string;
  project_id: number;
};
export const getColumns = (
  onEdit?: (storeWarehouse: StoreWarehouse) => void,
): ColumnDef<StoreWarehouse>[] => [
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
    cell: ({ row }) => <div className="capitalize">{row.getValue("name")}</div>,
  },
  //   email column
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
  },
  //   description column
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("description")}</div>
    ),
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("location")}</div>
    ),
  },

  //   contact number column
  {
    accessorKey: "contact_number",
    header: "Contact Number",
    cell: ({ row }) => (
      <div className="lowercase">{row.getValue("contact_number")}</div>
    ),
  },

  //   used capacity column
  {
    accessorKey: "used_capacity",
    header: ({ column }) => {
      return (
        <Button
          variant="customPadding"
          size="noPadding"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Used Capacity
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div className="">{row.getValue("used_capacity")}</div>;
    },
  },
  // total capacity
  {
    accessorKey: "capacity",
    header: ({ column }) => {
      return (
        <Button
          variant="customPadding"
          size="noPadding"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total Capacity
          <ArrowUpDown />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div className="">{row.getValue("capacity")}</div>;
    },
  },

  {
    id: "actions",
    enableHiding: false,
    header: "Actions",
    cell: ({ row }) => {
      const storeWarehouse = row.original;
      const handleEdit = () => {
        if (onEdit) {
          onEdit(storeWarehouse);
        }
      };
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

            <DropdownMenuItem onClick={handleEdit}>
              Edit Store / Warehouse
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

export function StoreWareHouseTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const [data, setData] = useState<StoreWarehouse[]>([]);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [editingStoreWarehouse, setEditingStoreWarehouse] =
    useState<StoreWarehouse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const refreshData = () => {
    setRefreshKey((prev) => prev + 1);
  };
  const openCreateDialog = () => {
    setEditingStoreWarehouse(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (storeWarehouse: StoreWarehouse) => {
    setEditingStoreWarehouse(storeWarehouse);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchWarehouses = async () => {
      try {
        const response = await apiClient.get("/get_warehouses", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setData(response.data.data);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch store / warehouses",
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "store / warehouses data"));
        }
      }
    };

    fetchWarehouses();

    return () => {
      source.cancel();
    };
  }, [refreshKey]);

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

  const handleDownloadPDF = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    generatePDFFromTable({
      selectedRows,
      title: "Store / Warehouse Report",
      headers: [
        "Name",
        "Email",
        "Description",
        "Location",
        "Contact Number",
        "Used Capacity",
      ],
      dataMapper: (row) => {
        const storeWarehouse = row.original;
        return [
          storeWarehouse.name,
          storeWarehouse.email,
          storeWarehouse.description,
          storeWarehouse.location,
          storeWarehouse.contact_number,
          storeWarehouse.used_capacity,
        ];
      },
      fileName: `store-warehouse-report-${
        new Date().toISOString().split("T")[0]
      }.pdf`,
      successMessage:
        "PDF downloaded successfully with {count} store / warehouse(s)",
      emptySelectionMessage: "Please select at least one row to download",
      titleFontSize: 24,
      headerColor: "#283C6E",
      headerHeight: 10,
      bodyFontSize: 9,
    });
  };

  return (
    <div className="w-full">
      {/* top toolbar */}
      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Filter by Store / Warehouse Name..."
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
            variant="outline"
            className="w-full sm:w-auto"
            onClick={openCreateDialog}
          >
            Add Store / Warehouse
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
                  colSpan={table.getAllColumns().length}
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
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingStoreWarehouse(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {editingStoreWarehouse
                ? "Edit Store / Warehouse"
                : "Add Store / Warehouse"}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            <AddStoreWarehouse
              refresh={refreshData}
              initialData={editingStoreWarehouse || undefined}
              onClose={() => {
                setIsDialogOpen(false);
                setEditingStoreWarehouse(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
