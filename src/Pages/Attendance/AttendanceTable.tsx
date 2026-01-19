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
import { ArrowUpDown, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdvanceFilter from "@/Pages/Attendance/AdvanceFilter";
import type { FilterStateAttendance } from "@/Pages/Attendance/AdvanceFilter";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCallback, useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import { formatDisplayDate } from "@/utils/formatdate";

export type Attendance = {
  id: number;
  project_id: number;
  project_name: string;
  tower_id: number;
  tower_name: string;
  people_id: number;
  people_name: string;
  department_id: number;
  department_name: string;
  category_id: number;
  category_name: string;
  skill_type_id: number;
  skill_type_name: string;
  skill_id: number;
  skill_name: string;
  date: string;
  count: number;
};

export const columns: ColumnDef<Attendance>[] = [
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
    accessorKey: "project_name",
    header: "Project Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("project_name")}</div>
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
    accessorKey: "department_name",
    header: "Department Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("department_name")}</div>
    ),
  },

  {
    accessorKey: "category_name",
    header: "Category Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("category_name")}</div>
    ),
  },
  {
    accessorKey: "people_name",
    header: "People Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("people_name")}</div>
    ),
  },
  {
    accessorKey: "skill_type_name",
    header: "Skill Type Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("skill_type_name")}</div>
    ),
  },
  {
    accessorKey: "skill_name",
    header: "Skill Name",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("skill_name")}</div>
    ),
  },
  //   budget
  {
    accessorKey: "count",
    header: () => <div className="text-right"> Labor Count</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right font-medium">{row.getValue("count")}</div>
      );
    },
  },

  //   start date column
  {
    accessorKey: "date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date
        <ArrowUpDown className="ml-1 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const raw = row.getValue("date") as string | undefined;
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

export function AttendanceTable() {
  const [sorting, setSorting] = useState<SortingState>([]);

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [data, setData] = useState<Attendance[]>([]);

  //   server side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);

  //   filter state
  const [filterState, setFilterState] = useState<FilterStateAttendance>({
    selectedProject: 0,
    selectedTower: 0,
    selectedDepartment: 0,
    selectedCategory: 0,
    selectedTotalPeople: 0,
    selectedSkilltype: 0,
    selectedSkill: 0,
  });

  const handleFilterChange = useCallback(
    (filters: FilterStateAttendance) => {
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
      selectedProject: 0,
      selectedDepartment: 0,
      selectedCategory: 0,
      selectedTotalPeople: 0,
      selectedSkilltype: 0,
      selectedSkill: 0,
    });
    setCurrentPage(1);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      filterState.selectedTower > 0 ||
      filterState.selectedProject > 0 ||
      filterState.selectedDepartment > 0 ||
      filterState.selectedCategory > 0 ||
      filterState.selectedTotalPeople > 0 ||
      filterState.selectedSkilltype > 0 ||
      filterState.selectedSkill > 0
    );
  };

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchProjects = async () => {
      try {
        const params: Record<string, number> = {
          page: currentPage,
          limit: pageSize,
        };

        if (filterState.selectedProject > 0)
          params.project_id = filterState.selectedProject;
        if (filterState.selectedTower > 0)
          params.tower_id = filterState.selectedTower;
        if (filterState.selectedDepartment > 0)
          params.department_id = filterState.selectedDepartment;
        if (filterState.selectedCategory > 0)
          params.category_id = filterState.selectedCategory;
        if (filterState.selectedTotalPeople > 0)
          params.people_id = filterState.selectedTotalPeople;
        if (filterState.selectedSkilltype > 0)
          params.skill_type_id = filterState.selectedSkilltype;
        if (filterState.selectedSkill > 0)
          params.skill_id = filterState.selectedSkill;

        const response = await apiClient.get("/manpower-count", {
          cancelToken: source.token,
          params,
        });

        if (response.status === 200) {
          setData(response.data.data);
          setTotalPages(response.data.pagination.total_pages);
          setTotalRecords(response.data.pagination.total_count);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch manpower count"
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "manpower count data"));
        }
      }
    };

    fetchProjects();

    return () => {
      source.cancel();
    };
  }, [currentPage, pageSize, filterState]);

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

  return (
    <div className="w-full">
      {/* top toolbar */}
      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Filter by People Name..."
          value={
            (table.getColumn("people_name")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("people_name")?.setFilterValue(event.target.value)
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
        <AdvanceFilter
          onFilterChange={handleFilterChange}
          onClose={handleFilterClose}
          currentFilter={filterState}
        />
      )}
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
                  colSpan={columns.length}
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
          Showing page {currentPage} of {totalPages} ({totalRecords} total
          records)
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage >= totalPages || totalPages === 0}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
