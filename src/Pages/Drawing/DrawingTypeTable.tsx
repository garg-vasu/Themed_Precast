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
import { ChevronDown, MoreHorizontal, Download } from "lucide-react";

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useContext, useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import AddDrawingtype from "./AddDrawingtype";
import { useParams } from "react-router";
import { formatDisplayDate } from "@/utils/formatdate";
import { generatePDFFromTable } from "@/utils/pdfGenerator";
import { ProjectContext } from "@/Provider/ProjectProvider";

export type DrawingType = {
  drawings_type_id: number;
  drawing_type_name: string;
  project_id: number;
};
export const getColumns = (
  refreshData: () => void,
  permissions: string[],
  onEdit?: (drawingType: DrawingType) => void
): ColumnDef<DrawingType>[] => [
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
    accessorKey: "drawing_type_name",
    header: "Drawing Type Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.drawing_type_name}</div>
    ),
  },
  {
    accessorKey: "drawings_type_id",
    header: "Drawing Type ID",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.drawings_type_id}</div>
    ),
  },
  {
    accessorKey: "project_id",
    header: "Project ID",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.project_id}</div>
    ),
  },
  //   client_name column (only for super admin)

  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const department = row.original;
      const canEdit = permissions?.includes("CreateDrawingType");

      const handleEdit = () => {
        if (canEdit && onEdit) {
          onEdit(department);
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
            {canEdit && (
              <DropdownMenuItem onClick={handleEdit}>
                Edit Drawing Type
              </DropdownMenuItem>
            )}
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

export function DrawingTypeTable({ refresh }: { refresh: () => void }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { projectId } = useParams();
  const projectCtx = useContext(ProjectContext);
  const permissions = projectCtx?.permissions || [];
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [data, setData] = useState<DrawingType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDrawingType, setEditingDrawingType] =
    useState<DrawingType | null>(null);

  const refreshData = () => {
    setRefreshKey((prev) => prev + 1);
    if (refreshKey > 0) {
      refresh();
    }
  };

  const openCreateDialog = () => {
    setEditingDrawingType(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (drawingType: DrawingType) => {
    setEditingDrawingType(drawingType);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchDrawingTypes = async () => {
      try {
        const response = await apiClient.get(`/drawingtype/${projectId}`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setData(response.data);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch drawing types"
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "drawing types data"));
        }
      }
    };

    fetchDrawingTypes();

    return () => {
      source.cancel();
    };
  }, [refreshKey]);

  const table = useReactTable({
    data,
    columns: getColumns(refreshData, permissions, openEditDialog),
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
      title: "Drawing Type Report",
      headers: ["Drawing Type Name", "Drawing Type ID", "Project ID"],
      dataMapper: (row): string[] => {
        const drawingType = row.original as DrawingType;
        return [
          drawingType.drawing_type_name || "—",
          drawingType.drawings_type_id?.toString() || "—",
          drawingType.project_id?.toString() || "—",
        ];
      },
      fileName: `drawing-type-report-${
        new Date().toISOString().split("T")[0]
      }.pdf`,
      successMessage:
        "PDF downloaded successfully with {count} drawing type(s)",
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
          placeholder="Filter by drawing type name..."
          value={
            (table
              .getColumn("drawing_type_name")
              ?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table
              .getColumn("drawing_type_name")
              ?.setFilterValue(event.target.value)
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
          {permissions?.includes("CreateDrawingType") && (
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={openCreateDialog}
            >
              Add Drawing Type
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
                    colSpan={table.getAllColumns().length}
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
      {permissions?.includes("CreateDrawingType") && (
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingDrawingType(null);
            }
          }}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {editingDrawingType ? "Edit Drawing Type" : "Add Drawing Type"}
              </DialogTitle>
            </DialogHeader>
            <AddDrawingtype
              refresh={refreshData}
              initialData={editingDrawingType || undefined}
              onClose={() => {
                setIsDialogOpen(false);
                setEditingDrawingType(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
