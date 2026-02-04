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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, ChevronDown, Download } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ProjectContext, useProject } from "@/Provider/ProjectProvider";
import { generatePDFFromTable } from "@/utils/pdfGenerator";

export type Stockyard = {
  id: number;
  element_id: number;
  element_type: string;
  element_type_id: number;
  stockyard_id: number;
  dimensions: string;
  disable: boolean;
  weight: number;
  production_date: string;
  storage_location: string;
  dispatch_status: boolean;
  created_at: string;
  updated_at: string;
  stockyard: boolean;
  project_id: number;
  target_location: number;
};

interface StockyardOption {
  id: number;
  stockyard_id: number;
  yard_name?: string;
  stockyard?: {
    yard_name: string;
  };
}

type Element = {
  element_id: number;
  element_name: string;
  element_type_name: string;
  element_type: string;
  thickness?: number;
  length?: number;
  height?: number;
  mass?: number;
  production_date?: string;
  floor_name?: string;
  tower_name?: string;
  disable?: boolean;
};

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

export function ReceiveTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { projectId } = useParams();
  const projectCtx = useContext(ProjectContext);
  const permissions = projectCtx?.permissions || [];
  const [userStockyards, setUserStockyards] = useState<StockyardOption[]>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [data, setData] = useState<Element[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [selectedStockyardId, setSelectedStockyardId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const getColumns = (permissions: string[]): ColumnDef<Element>[] => [
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
            {row.getValue("element_name")}
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
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const element = row.original;
        const isDisabled = element.disable;
        return (
          <div>
            {permissions?.includes("ApproveStockyard") && (
              <Button
                variant="outline"
                disabled={isDisabled}
                onClick={() => {
                  if (isDisabled) return;
                  setSelectedElement(element);
                  setSelectedStockyardId("");
                  setIsDialogOpen(true);
                }}
              >
                Approve
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    if (!projectId) return;

    const source = axios.CancelToken.source();

    const fetchStockyards = async () => {
      try {
        const response = await apiClient.get(
          `${projectId}/received_stockyards`,
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          const responseElements = Object.values(
            response.data
          ).flat() as Element[];
          setData(responseElements);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch received stockyards"
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "received stockyards data"));
        }
      }
    };

    fetchStockyards();

    return () => {
      source.cancel();
    };
  }, [projectId, refreshKey]);

  //   fetch all stockyards options
  useEffect(() => {
    if (!projectId) return;

    const source = axios.CancelToken.source();

    const fetchUserStockyards = async () => {
      try {
        const response = await apiClient.get(
          `/projects/${projectId}/my-stockyards`,
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          // Handle nested data structure: response.data.data
          const stockyardsData = response.data?.data;

          // Check if we have valid array data
          if (Array.isArray(stockyardsData)) {
            setUserStockyards(stockyardsData);
          } else if (stockyardsData === null || stockyardsData === undefined) {
            // Data is null/undefined, set empty array
            setUserStockyards([]);
          } else if (Array.isArray(response.data)) {
            // Fallback: if data is not nested, try response.data directly
            setUserStockyards(response.data);
          } else {
            // No valid data structure found
            setUserStockyards([]);
          }
        } else {
          toast.error(
            response.data?.message || "Failed to fetch user stockyards"
          );
          setUserStockyards([]);
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "user stockyards data"));
          setUserStockyards([]);
        }
      }
    };

    fetchUserStockyards();

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
      title: "Receive Report",
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
        const receive = row.original as Element;
        return [
          receive.element_id?.toString() || "—",
          receive.element_type || "—",
          receive.thickness?.toString() || "—",
          receive.length?.toString() || "—",
          receive.height?.toString() || "—",
          receive.mass?.toString() || "—",
          formatDisplayDate(receive.production_date),
          receive.floor_name || "—",
          receive.tower_name || "—",
        ];
      },
      fileName: `receive-report-${new Date().toISOString().split("T")[0]}.pdf`,
      successMessage: "PDF downloaded successfully with {count} received(s)",
      emptySelectionMessage: "Please select at least one row to download",
      titleFontSize: 24,
      headerColor: "#283C6E",
      headerHeight: 8,
      bodyFontSize: 9,
    });
  };

  const handleApproveStockyard = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedElement || !selectedStockyardId || !projectId) {
      toast.error("Please select a stockyard");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient.put(
        `/projects/${projectId}/assign-stockyard/${selectedElement.element_id}`,
        {
          stockyard_id: Number(selectedStockyardId),
        }
      );

      if (response.status === 200 || response.status === 201) {
        toast.success("Stockyard approved successfully!");
        setIsDialogOpen(false);
        setSelectedElement(null);
        setSelectedStockyardId("");
        setRefreshKey((prev) => prev + 1);
      } else {
        toast.error(response.data?.message || "Failed to approve stockyard");
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "approve stockyard"));
    } finally {
      setIsSubmitting(false);
    }
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

      {/* Approve Stockyard Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleApproveStockyard}>
            <DialogHeader>
              <DialogTitle>Approve Stockyard</DialogTitle>
              <DialogDescription>
                Select a stockyard to assign for this element.
              </DialogDescription>
            </DialogHeader>
            <div className="w-full py-4">
              {userStockyards &&
              Array.isArray(userStockyards) &&
              userStockyards.length > 0 ? (
                <Select
                  value={selectedStockyardId}
                  onValueChange={setSelectedStockyardId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a stockyard" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Stockyards</SelectLabel>
                      {userStockyards.map((stockyard) => {
                        const yardName =
                          stockyard.yard_name ||
                          stockyard.stockyard?.yard_name ||
                          `Stockyard ${stockyard.stockyard_id}`;
                        return (
                          <SelectItem
                            key={stockyard.id}
                            value={stockyard.stockyard_id.toString()}
                          >
                            {yardName}
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-2">
                  No stockyards available
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  !selectedStockyardId ||
                  !userStockyards ||
                  userStockyards.length === 0
                }
              >
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
