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
  ListCheck,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { ProjectSetupGuide } from "@/components/ProjectSetupGuide";

export type ErrectionRequest = {
  id: number;
  stock_erected_id: number;
  element_id: number;
  disable?: boolean;
  status: string;
  acted_by: number;
  acted_by_name: string;
  comments: string;
  Action_at: string;
  element_type_id: number;
  element_type_name: string;
  tower_name: string;
  floor_name: string;
};

export const columns = (
  permissions: string[],
  navigate: ReturnType<typeof useNavigate>,
  projectId: string | undefined,
): ColumnDef<ErrectionRequest>[] => [
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
  {
    accessorKey: "element_id",
    header: "Element ID",
    cell: ({ row }) => {
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
                `/project/${projectId}/element-detail/${row.original.element_id}`,
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
    header: "Element Type",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("element_type_name")}</div>
    ),
  },

  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const statusLower = status?.toLowerCase() || "";

      let variant: "default" | "secondary" | "destructive" | "outline" =
        "secondary";
      let className = "";

      if (statusLower === "erected") {
        className = "bg-green-500 hover:bg-green-600 text-white text-xs";
      } else if (statusLower === "pending") {
        className = "bg-yellow-500 hover:bg-yellow-600 text-white text-xs";
      } else if (statusLower === "received") {
        className = "bg-blue-500 hover:bg-blue-600 text-white text-xs";
      } else {
        className = "bg-gray-500 hover:bg-gray-600 text-white text-xs";
      }

      return (
        <Badge className={className} variant={variant}>
          {status || "Unknown"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "acted_by_name",
    header: "Acted By",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("acted_by_name")}</div>
    ),
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
    accessorKey: "Action_at",
    header: ({ column }) => (
      <Button
        variant="customPadding"
        size="noPadding"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Action At
        <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const raw = row.getValue("Action_at") as string | undefined;
      return <div>{formatDisplayDate(raw)}</div>;
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

export function ErrectionRequestTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { projectId } = useParams();
  const projectCtx = useContext(ProjectContext);
  const permissions = projectCtx?.permissions || [];
  const navigate = useNavigate();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [data, setData] = useState<ErrectionRequest[]>([]);

  const isProjectSetupComplete =
    projectCtx?.projectDetails?.is_stage_member &&
    projectCtx?.projectDetails?.is_member &&
    projectCtx?.projectDetails?.is_assign_stockyard &&
    projectCtx?.projectDetails?.is_paper &&
    projectCtx?.projectDetails?.is_hierachy &&
    projectCtx?.projectDetails?.is_bom &&
    projectCtx?.projectDetails?.is_drawingtype &&
    projectCtx?.projectDetails?.is_elementtype;

  useEffect(() => {
    if (!projectId) return;

    const source = axios.CancelToken.source();

    const fetchErrectionRequest = async () => {
      try {
        const response = await apiClient.get(
          `/stock-erected/logs/${projectId}`,
          {
            cancelToken: source.token,
          },
        );

        if (response.status === 200) {
          setData(response.data ?? []);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch errection request",
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "errection request data"));
        }
      }
    };

    fetchErrectionRequest();

    return () => {
      source.cancel();
    };
  }, [projectId]);

  const table = useReactTable({
    data,
    columns: columns(permissions, navigate, projectId),
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
      doc.text("Errection Request Report", 14, 20);

      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      // Prepare table data with all columns
      const tableData = selectedRows.map((row) => {
        const request = row.original;
        return [
          request.element_id?.toString() || "—",
          request.element_type_name || "—",
          request.status || "—",
          request.acted_by_name || "—",
          request.floor_name || "—",
          request.tower_name || "—",
          formatDisplayDate(request.Action_at),
        ];
      });

      // Prepare headers
      const headers = [
        "Element ID",
        "Element Type",
        "Status",
        "Acted By",
        "Floor Name",
        "Tower Name",
        "Action At",
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
      const fileName = `errection-request-report-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      doc.save(fileName);

      toast.success(
        `PDF downloaded successfully with ${selectedRows.length} errection request(s)`,
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  if (!isProjectSetupComplete) {
    return (
      <div className="w-full p-4">
        <PageHeader title="Erection Request" />
        <ProjectSetupGuide currentStep="is_stage_member" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full p-4">
        <PageHeader title="Erection Request" />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="w-full max-w-md space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <ListCheck className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">
                No Errection Requests Yet
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Errection requests are requests to erect elements in the
                project. They are created when an element is dispatched and
                needs to be erected.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-4 text-left space-y-2">
              <h3 className="text-sm font-medium">Getting started</h3>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Create a errection request</li>
                <li>Add elements to the errection request</li>
                <li>Erect the elements</li>
              </ul>
            </div>
            <Button
              onClick={() => navigate(`/project/${projectId}/dispatch-request`)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Your Errection Request
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-4 px-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="Erection Request" />
        <div className="flex items-center gap-2 justify-center">
          {permissions?.includes("AddErrectionRequest") && (
            <Button
              variant="outline"
              className="sm:w-auto"
              onClick={() => navigate(`/project/${projectId}/dispatch-request`)}
            >
              Add Request
            </Button>
          )}
        </div>
      </div>
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
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns(permissions, navigate, projectId).length}
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
