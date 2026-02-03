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
import { useContext, useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDisplayDate } from "@/utils/formatdate";
import { useNavigate, useParams } from "react-router";
import PageHeader from "@/components/ui/PageHeader";
import { ProjectContext } from "@/Provider/ProjectProvider";

export type AlreadyErrectedElement = {
  id: number;
  disable?: boolean;
  precast_stock_id: number;
  element_id: number;
  erected: boolean;
  approved_status: boolean;
  project_id: number;
  order_at: string;
  action_approve_reject: string;
  comments: string;
  element_type: string;
  element_type_id: number;
  element_type_name: string;
  tower_name: string;
  floor_name: string;
  floor_id: number;
};

const getColumns = (
  setDownloading: React.Dispatch<React.SetStateAction<Record<number, boolean>>>,
  permissions: string[]
): ColumnDef<AlreadyErrectedElement>[] => [
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
    accessorKey: "element_id",
    header: "Element ID",
    cell: ({ row }) => {
      const navigate = useNavigate();
      const { projectId } = useParams();
      return (
        <div
          className="capitalize cursor-pointer"
          onClick={() => {
            if (permissions?.includes("ViewElementDetail")) {
              navigate(
                `/project/${projectId}/element-detail/${row.original.element_id}`
              );
            }
          }}
        >
          {row.getValue("element_id")}
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
    accessorKey: "erected",
    header: "Status",
    cell: ({ row }) => (
      <div
        className={`capitalize ${
          row.getValue("erected") ? "text-green-600" : "text-yellow-600"
        }`}
      >
        {row.getValue("erected") ? "Erected" : "Not Erected"}
      </div>
    ),
  },
  {
    accessorKey: "order_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Order At
        <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const raw = row.getValue("order_at") as string | undefined;
      return <div>{formatDisplayDate(raw)}</div>;
    },
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
  {
    accessorKey: "tower_name",
    header: "Tower Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("tower_name")}</div>
    ),
  },
  {
    accessorKey: "approved_status",
    header: "Approved Status",
    cell: ({ row }) => (
      <div className="capitalize">
        {row.getValue("approved_status") ? "Approved" : "Pending"}
      </div>
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

export function AlreadyErrectedElementTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { projectId } = useParams();
  const projectCtx = useContext(ProjectContext);
  const permissions = projectCtx?.permissions || [];
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [data, setData] = useState<AlreadyErrectedElement[]>([]);
  const [downloading, setDownloading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!projectId) return;

    const source = axios.CancelToken.source();

    const fetchAlreadyErrectedElement = async () => {
      try {
        const response = await apiClient.get(
          `/erection_stock/received/${projectId}`,
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          // here to filter the response.data which have current_status.toLowerCase() == "accepted"
          setData(
            response.data.filter(
              (item: AlreadyErrectedElement) => item.erected === true
            )
          );
        } else {
          toast.error(
            response.data?.message || "Failed to fetch already errected element"
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "already errected element data"));
        }
      }
    };

    fetchAlreadyErrectedElement();

    return () => {
      source.cancel();
    };
  }, [projectId]);

  const table = useReactTable({
    data,
    columns: getColumns(setDownloading, permissions),
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
      doc.text("Dispatched Ready Report", 14, 20);

      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      // Prepare table data with all columns
      const tableData = selectedRows.map((row) => {
        const dispatch = row.original;
        return [
          dispatch.element_id || "—",
          dispatch.element_type_name || "—",
          dispatch.erected ? "Yes" : "No",
          dispatch.order_at || "—",
          dispatch.floor_name || "—" || "Common Floor",
          dispatch.tower_name || "—" || "Common Tower",
          dispatch.approved_status ? "Approved" : "Pending",
        ];
      });

      // Prepare headers
      const headers = [
        "Element ID",
        "Element Type Name",
        "Status",
        "Order At",
        "Floor Name",
        "Tower Name",
        "Approved Status",
      ];

      // Add table with all column headers
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 40,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], fontSize: 8 }, // Blue header
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      // Save the PDF
      const fileName = `already-errected-element-report-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      doc.save(fileName);

      toast.success(
        `PDF downloaded successfully with ${selectedRows.length} already errected element(s)`
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
          placeholder="Filter by Element ID..."
          value={
            (table.getColumn("element_id")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("element_id")?.setFilterValue(event.target.value)
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
                return (
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
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={getColumns(setDownloading, permissions).length}
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
