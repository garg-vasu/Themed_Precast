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
import { ChevronDown, Download, MoreHorizontal } from "lucide-react";

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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCallback, useContext, useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router";
import type { FilterStateElementtype } from "./ElementtypeFilter";
import ElementtypeFilter from "./ElementtypeFilter";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import ElementDrawing from "./ElementDrawing";
import { formatDisplayDate } from "@/utils/formatdate";
import { generatePDFFromTable } from "@/utils/pdfGenerator";
import { ProjectContext } from "@/Provider/ProjectProvider";

export type File = {
  drawing_id: number;
  Element_type_id: number;
  current_version: string;
  created_by?: string;
  drawing_type_id: number;
  drawing_type_name: string;
  updated_at?: string;
  comments: string;
  file: string;
  drawingsRevision?: DrawingRevision[];
};

export type DrawingRevision = {
  parent_drawing_id: number;
  version: string;
  created_by: string;
  drawing_type_id: number;
  drawing_type_name: string;
  comments: string;
  file: string;
  drawing_revision_id: number;
  Element_type_id: number;
  created_at_formatted: string;
  updated_at_formatted: string;
};

export type Elementtype = {
  id: number;
  quantity: number;
  production_count: number;
  stockyard_count: number;
  dispatch_count: number;
  erection_count: number;
  floor_name: string;
  tower_name: string;
  hierarchy_id: number;
  project_id: number;
  element_type_name: string;
  element_type: string;
  element_type_version: string;
  element_type_id: number;
  thickness: number;
  length: number;
  height: number;
  weight: number;
  created_by: string;
  created_at: string;
  update_at: string;
  in_request_count: number;
};

type PaginationInfo = {
  current_page: number;
  has_next: boolean;
  has_prev: boolean;
  page_size: number;
  total_records: number;
  total_pages: number;
};

export const getColumns = (permissions: string[]): ColumnDef<Elementtype>[] => [
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
    accessorKey: "element_type",
    header: "Element Type",
    cell: ({ row }) => {
      const navigate = useNavigate();
      const { projectId } = useParams();
      return (
        <div
          className="capitalize cursor-pointer"
          onClick={() => {
            if (permissions?.includes("ViewElementTypeDetail")) {
              navigate(
                `/project/${projectId}/element-type-detail/${row.original.element_type_id}/${row.original.hierarchy_id}`
              );
            }
          }}
        >
          {row.getValue("element_type")}
        </div>
      );
    },
  },

  {
    accessorKey: "element_type_name",
    header: "Element Type Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("element_type_name")}</div>
    ),
  },
  {
    accessorKey: "drawing",
    header: "Drawing",
    cell: ({ row }) => (
      <div className="capitalize">
        <Dialog>
          <DialogTrigger asChild className="ml-0">
            <Button variant="customPadding" size="noPadding">
              View Drawing
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <ElementDrawing elementTypeId={row.original.element_type_id} />
          </DialogContent>
        </Dialog>
      </div>
    ),
  },
  {
    accessorKey: "quantity",
    header: () => <div className="text-right">Quantity</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right font-medium">{row.getValue("quantity")}</div>
      );
    },
  },
  {
    accessorKey: "production_count",
    header: () => <div className="text-right"> Production Count</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right font-medium">
          {row.getValue("production_count")}
        </div>
      );
    },
  },
  {
    accessorKey: "stockyard_count",
    header: () => <div className="text-right"> Stockyard Count</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right font-medium">
          {row.getValue("stockyard_count")}
        </div>
      );
    },
  },
  {
    accessorKey: "in_request_count",
    header: () => <div className="text-right"> In Request Count</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right font-medium">
          {row.getValue("in_request_count")}
        </div>
      );
    },
  },
  {
    accessorKey: "dispatch_count",
    header: () => <div className="text-right"> Dispatch Count</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right font-medium">
          {row.getValue("dispatch_count")}
        </div>
      );
    },
  },
  {
    accessorKey: "erection_count",
    header: () => <div className="text-right"> Erection Count</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right font-medium">
          {row.getValue("erection_count")}
        </div>
      );
    },
  },
  {
    accessorKey: "tower_name",
    header: "Tower Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("tower_name")}</div>
    ),
  },
  {
    accessorKey: "floor_name",
    header: "Floor Name",
    cell: ({ row }) => (
      <div className="capitalize">
        {row.getValue("floor_name") ?? "Common Floor"}
      </div>
    ),
  },
  // action columns get visible only if user has permission to edit or view element type detail
  {
    id: "actions",
    header: "Actions",
    enableHiding: false,
    cell: ({ row }) => {
      const canEdit = permissions?.includes("EditElementType");
      const canView = permissions?.includes("ViewElementTypeDetail");
      const navigate = useNavigate();
      const { projectId } = useParams();
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
            <DropdownMenuSeparator />
            {canEdit && (
              <DropdownMenuItem
                onClick={() =>
                  navigate(
                    `/project/${projectId}/edit-element-type/${row.original.element_type_id}/${row.original.hierarchy_id}`
                  )
                }
              >
                Edit Element Type
              </DropdownMenuItem>
            )}
            {canView && (
              <DropdownMenuItem
                onClick={() =>
                  navigate(
                    `/project/${projectId}/element-type-detail/${row.original.element_type_id}/${row.original.hierarchy_id}`
                  )
                }
              >
                View Element Type Detail
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
    return error.response?.data?.message || `Failed to fetch ${data}.`;
  }
  return "An unexpected error occurred. Please try again later.";
};

export function ElementtypeTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { projectId } = useParams();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [data, setData] = useState<Elementtype[]>([]);
  const projectCtx = useContext(ProjectContext);
  const permissions = projectCtx?.permissions || [];
  //   server side pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  //   filter state
  const [filterState, setFilterState] = useState<FilterStateElementtype>({
    selectedTower: 0,
    selectedFloor: 0,
    elementType: "",
    typeName: "",
    selectedStages: [],
  });

  const handleFilterChange = useCallback(
    (filters: FilterStateElementtype) => {
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
      selectedTower: 0,
      selectedFloor: 0,
      elementType: "",
      typeName: "",
      selectedStages: [],
    });
    setCurrentPage(1);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      filterState.selectedTower > 0 ||
      filterState.selectedFloor > 0 ||
      filterState.elementType !== "" ||
      filterState.typeName !== "" ||
      filterState.selectedStages.length > 0
    );
  };

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchElementTypes = async () => {
      try {
        const params: Record<string, number | string> = {
          page: currentPage,
          page_size: limit,
        };

        if (filterState.selectedFloor > 0) {
          params.hierarchy_id = filterState.selectedFloor;
        } else if (filterState.selectedTower > 0) {
          params.hierarchy_id = filterState.selectedTower;
        }
        if (filterState.elementType !== "") {
          params.element_type = filterState.elementType.trim();
        }
        if (filterState.typeName !== "") {
          params.element_type_name = filterState.typeName.trim();
        }
        if (filterState.selectedStages.length > 0) {
          // Send stages as array - API should handle array of stage values
          params.stages = filterState.selectedStages.join(",");
        }

        const response = await apiClient.get(
          `/elementtype_fetch/${projectId}`,
          {
            cancelToken: source.token,
            params,
          }
        );

        if (response.status === 200) {
          setData(response.data.data);
          if (response.data.pagination) {
            setPagination(response.data.pagination);
          }
        } else {
          toast.error(response.data?.message || "Failed to fetch element type");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "element type data"));
        }
      }
    };

    if (projectId) {
      fetchElementTypes();
    }

    return () => {
      source.cancel();
    };
  }, [currentPage, limit, filterState, projectId]);

  const table = useReactTable({
    data,
    columns: getColumns(permissions),
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

  const handleDownloadPDF = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;

    generatePDFFromTable({
      selectedRows,
      title: "Element Type Report",
      headers: [
        "Ele. Type",
        "Type Name",
        "Total Count",
        "Production",
        "Stockyard",
        "Request",
        "Dispatch",
        "Erection",
        "Tower",
      ],
      dataMapper: (row): string[] => {
        const elementType = row.original as Elementtype;
        return [
          elementType.element_type || "—",
          elementType.element_type_name || "—",
          elementType.quantity?.toString() || "0",
          elementType.production_count?.toString() || "0",
          elementType.stockyard_count?.toString() || "0",
          elementType.in_request_count?.toString() || "0",
          elementType.dispatch_count?.toString() || "0",
          elementType.erection_count?.toString() || "0",
          elementType.tower_name || "—",
        ];
      },
      fileName: `element-type-report-${
        new Date().toISOString().split("T")[0]
      }.pdf`,
      successMessage:
        "PDF downloaded successfully with {count} element type(s)",
      emptySelectionMessage: "Please select at least one row to download",
      titleFontSize: 24,
      headerColor: "#283C6E",
      headerHeight: 8,
      bodyFontSize: 7,
    });
  };

  return (
    <div className="w-full">
      {/* top toolbar */}
      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Filter by element type name..."
          value={
            (table
              .getColumn("element_type_name")
              ?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table
              .getColumn("element_type_name")
              ?.setFilterValue(event.target.value)
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
        <ElementtypeFilter
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
      <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getRowModel().rows.length} row(s) selected on this page.
          {pagination && (
            <span className="ml-2">
              (Total: {pagination.total_records} element types)
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
