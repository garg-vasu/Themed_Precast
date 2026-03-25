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
import { ChevronDown, Download, ArrowUpDown } from "lucide-react";
import { differenceInMinutes, endOfDay } from "date-fns";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useContext, useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import { generatePDFFromTable } from "@/utils/pdfGenerator";
import { ProjectContext } from "@/Provider/ProjectProvider";
import { useNavigate, useParams } from "react-router";
import { formatDisplayDate } from "@/utils/formatdate";

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

export type Element = {
  id: number;
  element_name: string;
  task_name: string;
  task_id: number;
  project_id: number;
  name: string;
  stage_id: number;
  paper_id: number;
  priority: string;
  assigned_to: number;
  start_date: string;
  end_date: string;
  status: string;
  element_id: number;
  qc_id: number;
  qc_status: string;
  stage_name: string;
  stages: null;
  mesh_mold_status: string;
  reinforcement_status: string;
  stockyard_id: number;
  mesh_mold_qc_status: string;
  reinforcement_qc_status: string;
  element_type_id: number;
  element_type_name: string;
  activity_status: string;
  assignee_name: string;
  qc_assignee_name: string;
  tower_name: string;
  floor_name: string;
  target_location: string;
  delay_days: number;
};

const getTimeStatusText = (endDateStr?: string): string => {
  if (!endDateStr) {
    return "—";
  }

  const endDate = endOfDay(new Date(endDateStr));
  const now = new Date();
  const diffMinutes = differenceInMinutes(endDate, now);

  const absMinutes = Math.abs(diffMinutes);
  const d = Math.floor(absMinutes / (24 * 60));
  const remH = absMinutes % (24 * 60);
  const h = Math.floor(remH / 60);
  const m = remH % 60;

  const duration = `${d > 0 ? `${d}d ` : ""}${h > 0 || d > 0 ? `${h}h ` : ""}${m}m`;

  return diffMinutes >= 0
    ? `Time Left: ${duration}`
    : `Delayed by: ${duration}`;
};

export const getColumns = (permissions: string[]): ColumnDef<Element>[] => [
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
    accessorKey: "element_type_name",
    header: "Element Type Name",
    cell: ({ row }) => {
      const navigate = useNavigate();
      const { projectId } = useParams();
      return (
        <div
          className="capitalize cursor-pointer"
          onClick={() => {
            if (permissions?.includes("ViewElementTypeDetail")) {
              navigate(
                `/project/${projectId}/element-type-detail/${row.original.element_type_id}/${row.original.target_location}`,
              );
            }
          }}>
          {row.getValue("element_type_name")}
        </div>
      );
    },
  },

  {
    accessorKey: "name",
    header: "Element Type",
    cell: ({ row }) => <div className="capitalize">{row.getValue("name")}</div>,
  },

  {
    accessorKey: "element_name",
    header: "Element Name",
    cell: ({ row }) => {
      const navigate = useNavigate();
      const { projectId } = useParams();
      return (
        <div
          className="capitalize cursor-pointer"
          onClick={() => {
            if (permissions?.includes("ViewElementDetail")) {
              navigate(
                `/project/${projectId}/element-detail/${row.original.element_id}`,
              );
            }
          }}>
          {row.getValue("element_name")}
        </div>
      );
    },
  },
  {
    accessorKey: "stage_name",
    header: "Current Stage",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("stage_name")}</div>
    ),
  },
  // stuck at
  // here two senerio
  // QC InProgress
  // InProgress
  // make color badge according to the state

  {
    accessorKey: "activity_status",
    header: "Stuck At",
    cell: ({ row }) => {
      const status = row.getValue("activity_status") as string;
      if (!status) return <div>—</div>;

      let badgeClassName =
        "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100";

      if (status === "QC InProgress" || status === "QC in-progress" || status === "QC In Progress") {
        badgeClassName =
          "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100";
      } else if (status === "InProgress" || status === "In-progress" || status === "In Progress") {
        badgeClassName =
          "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100";
      }

      return (
        <Badge
          variant="outline"
          className={`capitalize whitespace-nowrap ${badgeClassName}`}>
          {status}
        </Badge>
      );
    },
  },

  {
    accessorKey: "assignee_name",
    header: "Assignee Name",
    cell: ({ row }) => {
      const status = row.original.activity_status;
      const isQCInProgress = status === "QC InProgress" || status === "QC in-progress" || status === "QC In Progress";
      
      return (
        <div className="capitalize">
          {isQCInProgress ? row.original.qc_assignee_name : row.original.assignee_name}
        </div>
      );
    },
  },

  // show delayed by
  {
    id: "time_status",
    header: "Time Status",
    cell: ({ row }) => {
      const timeStatus = getTimeStatusText(row.original.end_date);
      if (timeStatus === "—") {
        return <div className="text-muted-foreground">—</div>;
      }

      const isDelayed = timeStatus.startsWith("Delayed by:");
      return (
        <div
          className={
            isDelayed
              ? "text-red-500 font-medium whitespace-nowrap"
              : "text-emerald-600 font-medium"
          }>
          {row.original.delay_days} days
        </div>
      );
    },
  },

  //   start date column
  {
    accessorKey: "start_date",
    header: ({ column }) => (
      <Button
        variant="customPadding"
        size="noPadding"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Start Date
        <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const raw = row.getValue("start_date") as string | undefined;
      return <div>{formatDisplayDate(raw)}</div>;
    },
  },
  //   end date column
  {
    accessorKey: "end_date",
    header: ({ column }) => (
      <Button
        variant="customPadding"
        size="noPadding"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        End Date
        <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const raw = row.getValue("end_date") as string | undefined;
      return <div>{formatDisplayDate(raw)}</div>;
    },
  },
  // {
  //   accessorKey: "drawing",
  //   header: "Drawing",
  //   cell: ({ row }) => (
  //     <div className="capitalize">
  //       <Dialog>
  //         <DialogTrigger asChild className="ml-0">
  //           <Button variant="customPadding" size="noPadding">
  //             View Drawing
  //           </Button>
  //         </DialogTrigger>
  //         <DialogContent className="sm:max-w-[600px]">
  //           <ElementDrawing elementTypeId={row.original.element_type_id} />
  //         </DialogContent>
  //       </Dialog>
  //     </div>
  //   ),
  // },

  {
    accessorKey: "tower_name",
    header: "Tower",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("tower_name")}</div>
    ),
  },
  {
    accessorKey: "floor_name",
    header: "Floor",
    cell: ({ row }) => (
      <div className="capitalize">
        {row.getValue("floor_name") ?? "Common Floor"}
      </div>
    ),
  },
  // {
  //   id: "actions",
  //   enableHiding: false,
  //   cell: ({ row }) => {
  //     return (
  //       <DropdownMenu>
  //         <DropdownMenuTrigger asChild>
  //           <Button variant="ghost" className="h-8 w-8 p-0">
  //             <span className="sr-only">Open menu</span>
  //             <MoreHorizontal />
  //           </Button>
  //         </DropdownMenuTrigger>
  //         <DropdownMenuContent align="end">
  //           <DropdownMenuLabel>Actions</DropdownMenuLabel>
  //           <DropdownMenuSeparator />
  //         </DropdownMenuContent>
  //       </DropdownMenu>
  //     );
  //   },
  // },
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

type StageElementProps = {
  stage_id: number;
};

const COLUMN_LABELS: Record<string, string> = {
  element_type_name: "Element Type Name",
  name: "Element Type",
  element_name: "Element Name",
  stage_name: "Current Stage",
  activity_status: "Stuck At",
  assignee_name: "Assignee Name",
  time_status: "Time Status",
  start_date: "Start Date",
  end_date: "End Date",
  tower_name: "Tower",
  floor_name: "Floor",
};

const getColumnDisplayName = (columnId: string): string =>
  COLUMN_LABELS[columnId] ??
  columnId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function StageElementTable({ stage_id }: StageElementProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { projectId } = useParams();
  const projectCtx = useContext(ProjectContext);
  const permissions = projectCtx?.permissions || [];
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [data, setData] = useState<Element[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchElements = async () => {
      setDataLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(
          `projects/${projectId}/stages/${stage_id}/elements`,
          {
            cancelToken: source.token,
          },
        );

        if (response.status === 200) {
          setData(response.data.data);
          setError(null);
        } else {
          const errMsg = response.data?.message || "Failed to fetch element";
          setError(errMsg);
          toast.error(errMsg);
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          const errMsg = getErrorMessage(err, "element data");
          setError(errMsg);
          toast.error(errMsg);
        }
      } finally {
        setDataLoading(false);
      }
    };

    if (projectId && stage_id) {
      fetchElements();
    }

    return () => {
      source.cancel();
    };
  }, [projectId, stage_id]);

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
    getPaginationRowModel: getPaginationRowModel(),
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
      title: "Stage Element Report",
      headers: [
        "Element Type Name",
        "Element Type",
        "Current Stage",
        "Assigne to",
        "Time Status",
        "Tower",
        "Floor",
      ],
      dataMapper: (row): string[] => {
        const element = row.original as Element;
        return [
          element.element_type_name || "—",
          element.name || "—",
          element.stage_name || "—",
          element.assignee_name || "—",
          getTimeStatusText(element.end_date),
          element.tower_name || "—",
          element.floor_name || "—",
        ];
      },
      fileName: `stage-element-report-${new Date().toISOString().split("T")[0]}.pdf`,
      successMessage:
        "PDF downloaded successfully with {count} stage element(s)",
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
          placeholder="Filter by element name..."
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
            <Button variant="default" size="sm" onClick={handleDownloadPDF}>
              <Download className=" h-4 w-4" />
              Download PDF ({table.getFilteredSelectedRowModel().rows.length})
            </Button>
          )}
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
          <TableBody>
            {dataLoading ? (
              <TableRow>
                <TableCell
                  colSpan={getColumns(permissions).length}
                  className="h-24 text-center">
                  Loading elements...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={getColumns(permissions).length}
                  className="h-24 text-center text-destructive">
                  {error}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
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
                  colSpan={getColumns(permissions).length}
                  className="h-24 text-center">
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
