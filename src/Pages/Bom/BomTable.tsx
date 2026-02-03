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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ChevronDown,
  MoreHorizontal,
  Download,
  ArrowUpDown,
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

import { useContext, useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate, useParams } from "react-router";
import PageHeader from "@/components/ui/PageHeader";
import { formatDisplayDate } from "@/utils/formatdate";
import AddBom from "./AddBom";
import { Label } from "@/components/ui/label";
import UploadDialog from "./Upload";
import { generatePDFFromTable } from "@/utils/pdfGenerator";
import { UserContext } from "@/Provider/UserProvider";
import { ProjectContext } from "@/Provider/ProjectProvider";

export type Bom = {
  bom_id: number;
  bom_name: string;
  bom_type: string;
  unit: string;
  created_at: string;
  updated_at: string;
  project_id: number;
  rate: number;
  name_id: string;
  vendor: null;
};
export const getColumns = (
  refreshData: () => void,
  onEdit?: (bom: Bom) => void,
  permissions: string[] = []
): ColumnDef<Bom>[] => [
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
    accessorKey: "bom_name",
    header: "Material Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.bom_name}</div>
    ),
  },
  {
    accessorKey: "bom_type",
    header: "Material Type",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.bom_type}</div>
    ),
  },
  {
    accessorKey: "unit",
    header: "Unit",
    cell: ({ row }) => <div className="capitalize">{row.original.unit}</div>,
  },

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
  {
    accessorKey: "updated_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Updated At
        <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const raw = row.getValue("updated_at") as string | undefined;
      return <div>{formatDisplayDate(raw)}</div>;
    },
  },

  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const bom = row.original;
      const canEditBom = permissions.includes("EditBom");

      const handleEdit = () => {
        if (onEdit) {
          onEdit(bom);
        }
      };

      // Don't render the actions menu if user has no permissions
      if (!canEditBom) {
        return null;
      }

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
            {canEditBom && (
              <DropdownMenuItem onClick={handleEdit}>Edit Bom</DropdownMenuItem>
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

export function BomTable({ refresh }: { refresh: () => void }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const navigate = useNavigate();
  const projectCtx = useContext(ProjectContext);
  const permissions = (projectCtx?.permissions as string[]) || [];
  const { projectId } = useParams();
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [data, setData] = useState<Bom[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBom, setEditingBom] = useState<Bom | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const refreshData = () => {
    setRefreshKey((prev) => prev + 1);
    if (refreshKey > 0) {
      refresh();
    }
  };

  const openCreateDialog = () => {
    setEditingBom(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (bom: Bom) => {
    setEditingBom(bom);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchBoms = async () => {
      try {
        const response = await apiClient.get(
          `/fetch_bom_products/${projectId}`,
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          setData(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch boms");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "boms data"));
        }
      }
    };

    fetchBoms();

    return () => {
      source.cancel();
    };
  }, [projectId]);

  const table = useReactTable({
    data,
    columns: getColumns(refreshData, openEditDialog, permissions),
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
      title: "BOM Report",
      headers: [
        "Material Name",
        "Material Type",
        "Unit",
        "Created At",
        "Updated At",
      ],
      dataMapper: (row): string[] => {
        const bom = row.original as Bom;
        return [
          bom.bom_name || "—",
          bom.bom_type || "—",
          bom.unit || "—",
          formatDisplayDate(bom.created_at),
          formatDisplayDate(bom.updated_at),
        ];
      },
      fileName: `bom-report-${new Date().toISOString().split("T")[0]}.pdf`,
      successMessage: "PDF downloaded successfully with {count} bom(s)",
      emptySelectionMessage: "Please select at least one row to download",
      titleFontSize: 24,
      headerColor: "#283C6E",
      headerHeight: 10,
      bodyFontSize: 9,
    });
  };

  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex item-center justify-between">
        <PageHeader title="BOM" />
        <div className="flex gap-2 items-center justify-center">
          {permissions?.includes("AddBom") && (
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => navigate(`/project/${projectId}/large-import`)}
            >
              Add Bom
            </Button>
          )}
          {permissions?.includes("ImportBom") && (
            <Dialog
              open={isImportDialogOpen}
              onOpenChange={setIsImportDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => setIsImportDialogOpen(true)}
                >
                  Import Bom
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle>Import BOM</DialogTitle>
                  <DialogDescription>
                    Upload your BOM file in CSV or .xlsx format.
                  </DialogDescription>
                </DialogHeader>
                <UploadDialog
                  api={`/import_bom/${projectId}`}
                  projectId={projectId ? Number(projectId) : undefined}
                  close={() => setIsImportDialogOpen(false)}
                  onSuccess={refreshData}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      {/* top toolbar */}
      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Filter by material name..."
          value={
            (table.getColumn("bom_name")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("bom_name")?.setFilterValue(event.target.value)
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
      {(permissions?.includes("EditBom") ||
        permissions?.includes("AddBom")) && (
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingBom(null);
            }
          }}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingBom ? "Edit Bom" : "Add Bom"}</DialogTitle>
            </DialogHeader>
            <AddBom
              refresh={refreshData}
              initialData={editingBom || undefined}
              onClose={() => {
                setIsDialogOpen(false);
                setEditingBom(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
