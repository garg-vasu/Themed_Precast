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
  Download,
  Eye,
  ArrowUpDown,
  RotateCcw,
  FileText,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCallback, useContext, useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";

import { useNavigate, useParams } from "react-router";
import { formatDisplayDate } from "@/utils/formatdate";
import { generatePDFFromTable } from "@/utils/pdfGenerator";
import { ProjectContext } from "@/Provider/ProjectProvider";
import { ProjectSetupGuide } from "@/components/ProjectSetupGuide";

export type CompletedJob = {
  id: number;
  project_id: number;
  job_type: string;
  status: string;
  progress: number;
  total_items: number;
  processed_items: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at: string;
  result: string;
  file_path: string;
  rollback_enabled: boolean;
};

export interface RollbackResponse {
  deleted_count: number;
  deleted_records_summary: {
    boms: number;
    drawings: number;
    element_type_paths: number;
    element_type_quantities: number;
    element_types: number;
    elements: number;
  };
  message: string;
  project_id: number;
  rolled_back_by: string;
  timestamp: string;
}

export const getColumns = (
  projectId: number,
  onRollbackSuccess: () => void,
): ColumnDef<CompletedJob>[] => [
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
    accessorKey: "id",
    header: "JobID",
    cell: ({ row }) => <div className="capitalize">{row.original.id}</div>,
  },
  {
    accessorKey: "job_type",
    header: "Job Type",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.job_type}</div>
    ),
  },
  {
    accessorKey: "file_path",
    header: "File",
    cell: ({ row }) => (
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          try {
            const absolutePath = row.original.file_path;
            const filePath = absolutePath
              ? absolutePath.replace("/var/www/dataprecast/", "")
              : "";
            if (!filePath) {
              toast.error("File path not available.");
              return;
            }

            const response = await apiClient.get(
              `/get-file?file=${encodeURIComponent(filePath)}`,
              {
                responseType: "blob",
              },
            );

            if (response.status !== 200) {
              toast.error(
                `Failed to download file (status ${response.status}).`,
              );
              return;
            }

            const blob = new Blob([response.data], {
              type: "application/pdf",
            });
            const url = window.URL.createObjectURL(blob);

            const disposition =
              response.headers["content-disposition"] ||
              response.headers["Content-Disposition"];
            let fileName = filePath.split("/").pop() || "download";
            if (disposition && disposition.includes("filename=")) {
              const match = disposition.match(
                /filename\*=UTF-8''([^;]+)|filename="?([^;"]+)"?/i,
              );
              const found = match?.[1] || match?.[2];
              if (found) {
                try {
                  fileName = decodeURIComponent(found.replace(/"/g, ""));
                } catch {
                  fileName = found.replace(/"/g, "");
                }
              }
            }

            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
          } catch (e) {
            toast.error(
              "An unexpected error occurred while downloading the file.",
            );
          }
        }}>
        <Eye />
        View File
      </Button>
    ),
  },
  {
    accessorKey: "result",
    header: "Result",
    cell: ({ row }) => {
      const errorText = String(row.getValue("result") || "");
      return <div className="capitalize">{errorText}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <div className="capitalize">{row.original.status}</div>,
  },
  {
    accessorKey: "total_items",
    header: ({ column }) => (
      <Button
        variant="customPadding"
        size="noPadding"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Total Items
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("total_items")}</div>,
  },
  {
    accessorKey: "processed_items",
    header: ({ column }) => (
      <Button
        variant="customPadding"
        size="noPadding"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Processed Items
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("processed_items")}</div>,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button
        variant="customPadding"
        size="noPadding"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Created At
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => {
      const raw = row.getValue("created_at") as string | undefined;
      return <div>{formatDisplayDate(raw)}</div>;
    },
  },
  {
    accessorKey: "completed_at",
    header: ({ column }) => (
      <Button
        variant="customPadding"
        size="noPadding"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Completed At
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => {
      const raw = row.getValue("completed_at") as string | undefined;
      return <div>{formatDisplayDate(raw)}</div>;
    },
  },

  {
    id: "rollback",
    header: "Rollback",
    cell: ({ row }) => {
      const job = row.original;
      const completedAt = new Date(job.completed_at);
      const currentTime = new Date();
      const timeDifference = currentTime.getTime() - completedAt.getTime();
      const thirtyMinutesInMs = 30 * 60 * 1000;
      const isWithin30Minutes = timeDifference <= thirtyMinutesInMs;

      const handleRollback = async () => {
        try {
          const response = await apiClient.post(
            `/rollback/element_type/${projectId}/${job.id}`,
          );
          if (response.status === 200) {
            toast.success("Rollback successful");
            onRollbackSuccess();
          } else {
            toast.error(response.data.message || "Rollback failed");
          }
        } catch (error) {
          toast.error(getErrorMessage(error, "rollback"));
        }
      };

      return (
        <div className="text-left">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRollback}
            disabled={!isWithin30Minutes}
            className={`flex items-center gap-2 ${
              isWithin30Minutes
                ? "text-red-600 hover:text-red-700 border-red-600 hover:border-red-700"
                : "text-gray-400 cursor-not-allowed"
            }`}>
            <RotateCcw />
            Rollback
          </Button>
        </div>
      );
    },
  },
];

// Map column ids to display names used in table headers
const COLUMN_LABELS: Record<string, string> = {
  element_name: "Element Name",
  element_id: "Element ID",
  element_type_id: "Element Type ID",
  element_type_name: "Element Type Name",
  element_type: "Element Type",
  stage_name: "Stage Name",
  tower_name: "Tower Name",
  floor_name: "Floor Name",
};

const getColumnDisplayName = (columnId: string): string =>
  COLUMN_LABELS[columnId] ??
  columnId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

type PaginationInfo = {
  current_page: number;
  has_next: boolean;
  has_prev: boolean;
  page_size: number;
  total_records: number;
  total_pages: number;
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

export function CompletedJobTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [data, setData] = useState<CompletedJob[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const projectCtx = useContext(ProjectContext);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const fetchCompletedJobs = useCallback(async () => {
    try {
      setDataLoading(true);
      //   const params: Record<string, number | string> = {
      //     page: currentPage,
      //     page_size: limit,
      //   };

      const response = await apiClient.get(`/project/${projectId}/jobs`);

      if (response.status === 200) {
        const completedJobs = response.data.jobs.filter(
          (job: CompletedJob) => job.status === "completed",
        );
        setData(completedJobs);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else {
        toast.error(response.data?.message || "Failed to fetch completed jobs");
      }
    } catch (err: unknown) {
      if (!axios.isCancel(err)) {
        toast.error(getErrorMessage(err, "completed jobs data"));
      }
    } finally {
      setDataLoading(false);
    }
  }, [currentPage, limit, projectId]);

  useEffect(() => {
    if (projectId) {
      fetchCompletedJobs();
    }
  }, [projectId, fetchCompletedJobs]);

  const columns = getColumns(Number(projectId), fetchCompletedJobs);

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

    generatePDFFromTable({
      selectedRows,
      title: "Completed Jobs Report",
      headers: [
        "Job ID",
        "Job Type",
        "Status",
        "Total Items",
        "Processed Items",
        "Result",
        "Created At",
        "Completed At",
      ],
      dataMapper: (row): string[] => {
        const job = row.original as CompletedJob;
        return [
          job.id?.toString() || "—",
          job.job_type || "—",
          job.status || "—",
          job.total_items?.toString() || "0",
          job.processed_items?.toString() || "0",
          job.result || "—",
          formatDisplayDate(job.created_at) || "—",
          formatDisplayDate(job.completed_at) || "—",
        ];
      },
      fileName: `completed-jobs-report-${new Date().toISOString().split("T")[0]}.pdf`,
      successMessage:
        "PDF downloaded successfully with {count} completed job(s)",
      emptySelectionMessage: "Please select at least one row to download",
      titleFontSize: 24,
      headerColor: "#283C6E",
      headerHeight: 8,
      bodyFontSize: 7,
    });
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Filter by job type..."
          value={
            (table.getColumn("job_type")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("job_type")?.setFilterValue(event.target.value)
          }
          className="w-full max-w-sm sm:max-w-xs"
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <Button
              variant="default"
              className="w-full sm:w-auto"
              onClick={handleDownloadPDF}>
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
                      }>
                      {getColumnDisplayName(column.id)}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

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
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}>
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
                  className="h-24 text-center">
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
              (Total: {pagination.total_records} records)
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
              }}>
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
              disabled={!pagination?.has_prev}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) =>
                  pagination
                    ? Math.min(pagination.total_pages, prev + 1)
                    : prev + 1,
                )
              }
              disabled={!pagination?.has_next}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
