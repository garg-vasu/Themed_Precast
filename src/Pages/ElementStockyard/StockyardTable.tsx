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
import { ArrowUpDown, ChevronDown, Download } from "lucide-react";

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
import { useContext, useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDisplayDate } from "@/utils/formatdate";
import { useNavigate, useParams } from "react-router";
import { generatePDFFromTable } from "@/utils/pdfGenerator";
import { ProjectContext } from "@/Provider/ProjectProvider";

export type Stockyard = {
  id: number;
  element_type_name: string;
  element_name: string;
  element_id: number;
  element_type: string;
  element_type_id: number;
  stockyard_id: number;
  thickness: number;
  length: number;
  height: number;
  volume: number;
  mass: number;
  area: number;
  width: number;
  production_date: string;
  storage_location: string;
  dispatch_status: boolean;
  created_at: string;
  updated_at: string;
  stockyard: boolean;
  project_id: number;
  target_location: number;
  tower_name: string;
  floor_name: string;
  floor_id: number;
  disable: boolean;
};

export const getColumns = (permissions: string[]): ColumnDef<Stockyard>[] => [
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
    cell: ({ row }) => {
      const isDisabled = row.original.disable;
      return (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          disabled={isDisabled}
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  //   name column
  {
    accessorKey: "element_name",
    header: "Element Name",
    cell: ({ row }) => {
      const navigate = useNavigate();
      const { projectId } = useParams();
      const isDisabled = row.original.disable;
      return (
        <div
          className={`capitalize ${
            isDisabled ? "cursor-not-allowed" : "cursor-pointer"
          }`}
          onClick={() => {
            if (isDisabled) return;
            if (permissions?.includes("ViewElementDetail")) {
              navigate(
                `/project/${projectId}/element-detail/${row.original.element_id}`
              );
            }
          }}
        >
          <div className="flex flex-col gap-2">
            {row.getValue("element_name")}
            {/* apply accent color  */}
            <span className="text-xs text-accent-foreground">
              {row.original.element_id}
            </span>
          </div>
        </div>
      );
    },
  },

  {
    accessorKey: "element_type",
    header: "Element Type",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("element_type")}</div>
    ),
  },
  {
    accessorKey: "element_type_name",
    header: "Element Type Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("element_type_name")}</div>
    ),
  },
  {
    accessorKey: "thickness",
    header: ({ column }) => {
      return (
        <Button
          variant="customPadding"
          size="noPadding"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Thickness
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("thickness")}</div>
    ),
  },
  {
    accessorKey: "length",
    header: ({ column }) => {
      return (
        <Button
          variant="customPadding"
          size="noPadding"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Length
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("length")}</div>
    ),
  },
  {
    accessorKey: "height",
    header: ({ column }) => {
      return (
        <Button
          variant="customPadding"
          size="noPadding"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Height
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("height")}</div>
    ),
  },
  {
    accessorKey: "mass",
    header: ({ column }) => {
      return (
        <Button
          variant="customPadding"
          size="noPadding"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Mass
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      );
    },
    // round of the mass to 3 decimal places
    cell: ({ row }) => {
      const mass = row.getValue("mass") as number;
      return <div className="">{mass ? mass.toFixed(3) : "—"}</div>;
    },
  },

  //   start date column
  {
    accessorKey: "production_date",
    header: ({ column }) => (
      <Button
        variant="customPadding"
        size="noPadding"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Production Date
        <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const raw = row.getValue("production_date") as string | undefined;
      return <div>{formatDisplayDate(raw)}</div>;
    },
  },
  {
    accessorKey: "floor_name",
    header: "Floor Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("floor_name")}</div>
    ),
  },
  {
    accessorKey: "tower_name",
    header: "Tower Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("tower_name")}</div>
    ),
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

export function StockyardTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { projectId } = useParams();
  const projectCtx = useContext(ProjectContext);
  const permissions = projectCtx?.permissions || [];
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [data, setData] = useState<Stockyard[]>([]);

  useEffect(() => {
    if (!projectId) return;

    const source = axios.CancelToken.source();

    const fetchStockyards = async () => {
      try {
        const response = await apiClient.get(
          `/precast_stock/all/${projectId}`,
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          setData(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch stockyards");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "stockyards data"));
        }
      }
    };

    fetchStockyards();

    return () => {
      source.cancel();
    };
  }, [projectId]);

  const table = useReactTable({
    data,
    columns: getColumns(permissions),
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
      title: "Stockyard Report",
      headers: [
        "Element Name",
        "Element Type",
        "Thickness",
        "Length",
        "Height",
        "Mass",
        "Production Date",
        "Floor Name",
        "Tower Name",
      ],
      dataMapper: (row): string[] => {
        const stockyard = row.original as Stockyard;
        return [
          stockyard.element_name || "—",
          stockyard.element_type || "—",
          stockyard.thickness?.toString() || "—",
          stockyard.length?.toString() || "—",
          stockyard.height?.toString() || "—",
          stockyard.mass?.toString() || "—",
          formatDisplayDate(stockyard.production_date),
          stockyard.floor_name || "—",
          stockyard.tower_name || "—",
        ];
      },
      fileName: `stockyard-report-${
        new Date().toISOString().split("T")[0]
      }.pdf`,
      successMessage: "PDF downloaded successfully with {count} stockyard(s)",
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
          placeholder="Filter by Element Name..."
          value={
            (table.getColumn("element_name")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("element_name")?.setFilterValue(event.target.value)
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
              table.getRowModel().rows.map((row) => {
                const isDisabled = row.original.disable;
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={
                      isDisabled
                        ? "opacity-50 bg-gray-100 cursor-not-allowed"
                        : ""
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={`${isDisabled ? "text-gray-500" : ""}`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={getColumns(permissions).length}
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
    </div>
  );
}
