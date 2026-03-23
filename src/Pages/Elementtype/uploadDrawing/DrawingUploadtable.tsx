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
  FileText,
  Eye,
  Check,
  ChevronsUpDown,
  Loader2,
  Save,
  UploadCloud,
} from "lucide-react";

import { cn } from "@/lib/utils";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { useContext, useEffect, useState, useRef } from "react";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";

import { useParams } from "react-router";

import { ProjectContext } from "@/Provider/ProjectProvider";
import PageHeader from "@/components/ui/PageHeader";

const baseUrl = import.meta.env.VITE_API_URL || "";

export type Elementtype = {
  element_type_id: number;
  element_type: string;
  element_type_name: string;
  floor_name: string;
  tower_name: string;
};

export type DrawingType = {
  drawings_type_id: number;
  drawing_type_name: string;
  project_id: number;
};

export type UploadedFileResult = {
  id: number;
  path: string;
  project_id: number;
};

export type SingleAssignment = {
  drawing_type_id: number | null;
  element_type_id: number | null;
};

export const getColumns = (
  drawingTypes: DrawingType[],
  elementTypesMap: Record<number, Elementtype[]>,
  loadingElementTypes: Record<number, boolean>,
  assignments: Record<string, SingleAssignment>,
  onAssignmentChange: (
    savedName: string,
    field: "drawing_type_id" | "element_type_id",
    value: number,
  ) => void,
): ColumnDef<UploadedFileResult>[] => [
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
  //   file name column
  {
    accessorKey: "path",
    header: "File Name",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1.5">
        <span
          className="text-sm font-medium truncate max-w-[200px]"
          title={row.original.path}>
          {row.original.path}
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs"
            onClick={() =>
              window.open(
                `${baseUrl}/get-file?file=${encodeURIComponent(row.original.path)}`,
                "_blank",
              )
            }>
            <Eye className="size-3 mr-1" /> Preview
          </Button>
        </div>
      </div>
    ),
  },
  {
    id: "drawingType",
    header: "Drawing Type",
    cell: ({ row }) => {
      const savedName = row.original.path;
      const assignment = assignments[savedName] || {
        drawing_type_id: null,
        element_type_id: null,
      };

      return (
        <Select
          value={
            assignment.drawing_type_id
              ? assignment.drawing_type_id.toString()
              : undefined
          }
          onValueChange={(val) =>
            onAssignmentChange(savedName, "drawing_type_id", Number(val))
          }>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Select Drawing Type" />
          </SelectTrigger>
          <SelectContent>
            {drawingTypes.map((dt) => (
              <SelectItem
                key={dt.drawings_type_id}
                value={dt.drawings_type_id.toString()}>
                {dt.drawing_type_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    },
  },
  {
    id: "elementType",
    header: "Element Type",
    cell: ({ row }) => {
      const savedName = row.original.path;
      const assignment = assignments[savedName] || {
        drawing_type_id: null,
        element_type_id: null,
      };

      const drawingTypeId = assignment.drawing_type_id;
      const elementTypes = drawingTypeId
        ? elementTypesMap[drawingTypeId] || []
        : [];
      const isLoading = drawingTypeId
        ? loadingElementTypes[drawingTypeId]
        : false;

      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              disabled={!drawingTypeId}
              className={cn(
                "w-[200px] justify-between h-9",
                !assignment.element_type_id && "text-muted-foreground",
              )}>
              {isLoading
                ? "Loading..."
                : assignment.element_type_id
                  ? elementTypes.find(
                      (et) => et.element_type_id === assignment.element_type_id,
                    )?.element_type_name || "Selected"
                  : "Select Element Type"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search element type..." />
              <CommandList>
                <CommandEmpty>No element type found.</CommandEmpty>
                <CommandGroup>
                  {elementTypes.map((et) => (
                    <CommandItem
                      key={et.element_type_id}
                      value={et.element_type_name}
                      onSelect={() => {
                        onAssignmentChange(
                          savedName,
                          "element_type_id",
                          et.element_type_id,
                        );
                      }}>
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          assignment.element_type_id === et.element_type_id
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {et.element_type_name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
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

export default function DrawingUploadTable({
  refresh,
}: {
  refresh: () => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { projectId } = useParams();
  const projectCtx = useContext(ProjectContext);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [data, setData] = useState<UploadedFileResult[]>([]);
  const [drawingType, setDrawingType] = useState<DrawingType[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [assignments, setAssignments] = useState<
    Record<string, SingleAssignment>
  >({});

  const [elementTypesMap, setElementTypesMap] = useState<
    Record<number, Elementtype[]>
  >({});
  const [loadingElementTypes, setLoadingElementTypes] = useState<
    Record<number, boolean>
  >({});
  const [savingBulk, setSavingBulk] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchElementTypesForDrawing = async (drawingTypeId: number) => {
    if (elementTypesMap[drawingTypeId] || loadingElementTypes[drawingTypeId])
      return;

    try {
      setLoadingElementTypes((prev) => ({ ...prev, [drawingTypeId]: true }));
      const response = await apiClient.get(
        `/element-types/not-instage/${projectId}/${drawingTypeId}`,
      );
      if (response.status === 200) {
        const payloadData = response.data;
        const dataArray = Array.isArray(payloadData) 
          ? payloadData 
          : (payloadData?.data || []);
        setElementTypesMap((prev) => ({
          ...prev,
          [drawingTypeId]: dataArray,
        }));
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "element types for drawing"));
    } finally {
      setLoadingElementTypes((prev) => ({ ...prev, [drawingTypeId]: false }));
    }
  };

  const handleAssignmentChange = (
    savedName: string,
    field: "drawing_type_id" | "element_type_id",
    value: number,
  ) => {
    setAssignments((prev) => ({
      ...prev,
      [savedName]: {
        ...prev[savedName],
        [field]: value,
      },
    }));

    if (field === "drawing_type_id") {
      fetchElementTypesForDrawing(value);
    }
  };

  const handleBulkSave = async () => {
    const payloadAssignments: any[] = [];
    
    if (data && data.length > 0) {
      data.forEach((row) => {
        const assign = assignments[row.path];
        if (assign && assign.drawing_type_id && assign.element_type_id) {
          payloadAssignments.push({
            unmapped_drawing_id: row.id,
            drawing_type_id: assign.drawing_type_id,
            element_type_id: assign.element_type_id,
          });
        }
      });
    }

    if (payloadAssignments.length === 0) {
      toast.info("No rows are fully assigned yet.");
      return;
    }

    setSavingBulk(true);
    try {
      const response = await apiClient.post(
        `/bulk_assign_drawings/${projectId}`,
        payloadAssignments,
      );
      if (response.status === 200 || response.status === 201) {
        toast.success("Assignments saved successfully");
        setAssignments({});
        refreshData();
      } else {
        toast.error(response.data?.message || "Failed to save assignments");
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "save assignments"));
    } finally {
      setSavingBulk(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const filesArr = Array.from(e.target.files);
    const formData = new FormData();
    filesArr.forEach((file) => formData.append("files", file));

    try {
      setUploading(true);
      const response = await apiClient.post(
        `/upload/bulk_files?project_id=${projectId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (response.status === 200 && response.data?.results) {
        toast.success(`Successfully uploaded ${response.data.succeeded} files`);
        refreshData();
      } else {
        toast.error("Upload responded but format was unexpected.");
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "upload files"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const refreshData = () => {
    setRefreshKey((prev) => prev + 1);
    if (refreshKey > 0) {
      refresh();
    }
  };

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchDrawingTypes = async () => {
      try {
        setDataLoading(true);
        const response = await apiClient.get(`/drawingtype/${projectId}`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          const payloadData = response.data;
          const dataArray = Array.isArray(payloadData)
            ? payloadData
            : (payloadData?.data || []);
          setDrawingType(dataArray);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch drawing types",
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "drawing types data"));
        }
      } finally {
        setDataLoading(false);
      }
    };

    fetchDrawingTypes();

    return () => {
      source.cancel();
    };
  }, [refreshKey]);

  //   fetch uploaded files
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchUploadedFiles = async () => {
      try {
        setDataLoading(true);
        const response = await apiClient.get(
          `/unmapped_drawings?project_id=${projectId}`,
          {
            cancelToken: source.token,
          },
        );

        if (response.status === 200) {
          const payloadData = response.data;
          const dataArray = Array.isArray(payloadData)
            ? payloadData
            : (payloadData?.data || []);
          setData(dataArray);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch uploaded files",
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "uploaded files data"));
        }
      } finally {
        setDataLoading(false);
      }
    };

    fetchUploadedFiles();

    return () => {
      source.cancel();
    };
  }, [refreshKey]);

  const table = useReactTable({
    data,
    columns: getColumns(
      drawingType,
      elementTypesMap,
      loadingElementTypes,
      assignments,
      handleAssignmentChange,
    ),
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

  if (!dataLoading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">
              No Uploaded Files Yet
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Uploaded files are the files that are uploaded in the project.
            </p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-4 text-left space-y-2">
            <h3 className="text-sm font-medium">Getting started</h3>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Upload files to get started</li>
            </ul>
          </div>
          <input
            type="file"
            multiple
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            variant="outline"
            size="sm">
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="mr-2 h-4 w-4" />
            )}
            Upload Files
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      <PageHeader title="Drawing Upload" />
      {/* top toolbar */}
      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Filter by file name..."
          value={
            (table.getColumn("path")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("path")?.setFilterValue(event.target.value)
          }
          className="w-full max-w-sm sm:max-w-xs"
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
          <input
            type="file"
            multiple
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            variant="outline"
            size="sm">
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="mr-2 h-4 w-4" />
            )}
            Upload Files
          </Button>
          <Button onClick={handleBulkSave} disabled={savingBulk} size="sm">
            {savingBulk ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Assignments
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Columns <ChevronDown className="" />
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
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="[&_td]:py-1">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-0.5">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="h-12">
                  <TableCell
                    colSpan={table.getAllColumns().length}
                    className="h-24 text-center py-2">
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
