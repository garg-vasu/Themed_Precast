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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ArrowUpDown, ChevronDown, Download, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
import { ProjectContext } from "@/Provider/ProjectProvider";
import Elementdisplay from "./Elementdisplay";

export type PendingApproval = {
  load_id: number;
  type: string;
  address: string;
  incharge: string;
  capacity: number;
  incharge_phone: string;
  remaining_capacity: number; // can alos be negative and positive
  item_no: number;
  created_at: string;
  created_by: string;
  items: item[];
  tower_name: string;
};

export type item = {
  element_id: number;
  element_name: string;
  mass: number;
  volume: number;
  element_type: string;
  element_type_name: string;
  floor_name: string;
  tower_name: string;
  element_type_id: number;
};

export const getColumns = (
  handleApprove: (loadId: number) => void,
  handleReject: (loadId: number) => void,
  permissions: string[],
): ColumnDef<PendingApproval>[] => [
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
      const isDisabled = (row.original as any).disable;
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
    accessorKey: "load_id",
    header: "Load ID",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("load_id")}</div>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <div className="capitalize">{row.getValue("type")}</div>,
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate" title={row.getValue("address")}>
        {row.getValue("address")}
      </div>
    ),
  },
  {
    accessorKey: "incharge",
    header: "Incharge",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("incharge")}</div>
    ),
  },
  {
    accessorKey: "incharge_phone",
    header: "Phone",
    cell: ({ row }) => <div>{row.getValue("incharge_phone")}</div>,
  },
  {
    accessorKey: "capacity",
    header: "Capacity",
    cell: ({ row }) => <div>{row.getValue("capacity")}</div>,
  },
  {
    accessorKey: "remaining_capacity",
    header: "Remaining",
    cell: ({ row }) => <div>{row.getValue("remaining_capacity")}</div>,
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return <div>{date.toLocaleDateString()}</div>;
    },
  },
  {
    id: "items",
    header: "Items",
    cell: ({ row }) => {
      const items = row.original.items;
      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="w-4 h-4" />
              View
            </Button>
          </DialogTrigger>
          {/*  */}
          <DialogContent className=" sm:max-w-[1200px] w-full flex flex-col">
            <DialogHeader>
              <DialogTitle>
                Items for Load ID: {row.original.load_id}
              </DialogTitle>
            </DialogHeader>
            <Elementdisplay items={items || []} />
          </DialogContent>
        </Dialog>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const pendingApproval = row.original;
      const isDisabled = (pendingApproval as any).disable;
      return (
        <div className="flex gap-2 items-center justify-center">
          <Button
            variant="default"
            size="sm"
            className="bg-green-500 hover:bg-green-600 text-white"
            disabled={isDisabled}
            onClick={() => {
              if (isDisabled) return;
              handleApprove(pendingApproval.load_id);
            }}>
            Approve
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-destructive hover:bg-destructive/90 text-white"
            disabled={isDisabled}
            onClick={() => {
              if (isDisabled) return;
              handleReject(pendingApproval.load_id);
            }}>
            Reject
          </Button>
        </div>
      );
    },
  },
];

const COLUMN_LABELS: Record<string, string> = {
  load_id: "Load ID",
  type: "Type",
  address: "Address",
  incharge: "Incharge",
  incharge_phone: "Phone",
  capacity: "Capacity",
  remaining_capacity: "Remaining",
  created_at: "Created At",
};

const getColumnDisplayName = (columnId: string): string =>
  COLUMN_LABELS[columnId] ??
  columnId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

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

export function PendingApprovalTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { projectId } = useParams();
  const projectCtx = useContext(ProjectContext);
  const permissions = projectCtx?.permissions || [];
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [data, setData] = useState<PendingApproval[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshData = () => {
    setRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    if (!projectId) return;

    const source = axios.CancelToken.source();

    const fetchPendingErectionOrders = async () => {
      try {
        const response = await apiClient.get(`/erection_orders/${projectId}`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setData(response.data);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch pending erection orders",
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "pending erection orders data"));
        }
      }
    };

    fetchPendingErectionOrders();

    return () => {
      source.cancel();
    };
  }, [projectId, refreshKey]);

  const handleApprove = async (loadId: number) => {
    try {
      const response = await apiClient.put(`/update_stock`, [
        { load_id: loadId, approved_status: true },
      ]);

      if (response.status === 200) {
        toast.success(`Load ${loadId} approved successfully!`);
        refreshData();
      } else {
        toast.error(response.data?.message || "Failed to approve load");
      }
    } catch (error: unknown) {
      console.error("Error approving load:", error);
      toast.error(getErrorMessage(error, "approve load"));
      refreshData();
    }
  };

  const handleReject = async (loadId: number) => {
    try {
      const response = await apiClient.put(`/update_stock`, [
        { load_id: [loadId], approved_status: false },
      ]);

      if (response.status === 200) {
        toast.success(`Load ${loadId} rejected successfully!`);
        refreshData();
      } else {
        toast.error(response.data?.message || "Failed to reject load");
      }
    } catch (error: unknown) {
      console.error("Error rejecting load:", error);
      toast.error(getErrorMessage(error, "reject load"));
      refreshData();
    }
  };

  const table = useReactTable({
    data,
    columns: getColumns(handleApprove, handleReject, permissions),
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
      doc.text("Pending Erection Orders Report", 14, 20);

      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

      // Prepare table data with all columns
      const tableData = selectedRows.map((row) => {
        const pending = row.original;
        return [
          pending.load_id || "—",
          pending.type || "—",
          pending.address || "—",
          pending.incharge || "—",
          pending.incharge_phone || "—",
          pending.capacity !== undefined && pending.capacity !== null
            ? pending.capacity.toString()
            : "—",
          pending.remaining_capacity !== undefined &&
          pending.remaining_capacity !== null
            ? pending.remaining_capacity.toString()
            : "—",
          pending.created_at
            ? new Date(pending.created_at).toLocaleDateString()
            : "—",
        ];
      });

      // Prepare headers
      const headers = [
        "Load ID",
        "Type",
        "Address",
        "Incharge",
        "Phone No.",
        "Capacity",
        "Remaining",
        "Created At",
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
      const fileName = `pending-erection-orders-report-${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      doc.save(fileName);

      toast.success(
        `PDF downloaded successfully with ${selectedRows.length} pending erection order(s)`,
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
          placeholder="Filter by Type..."
          value={(table.getColumn("type")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("type")?.setFilterValue(event.target.value)
          }
          className="w-full max-w-sm sm:max-w-xs"
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <Button variant="default" size="sm" onClick={handleDownloadPDF}>
              <Download className="" />
              Download PDF ({table.getFilteredSelectedRowModel().rows.length})
            </Button>
          )}
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
                      {getColumnDisplayName(column.id)}
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
          <TableBody className="[&_td]:py-1">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const isDisabled = (row.original as any).disable;
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={
                      isDisabled
                        ? "opacity-50 bg-gray-100 cursor-not-allowed"
                        : ""
                    }>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={`${isDisabled ? "text-gray-500" : ""}`}>
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
                  colSpan={
                    getColumns(handleApprove, handleReject, permissions).length
                  }
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
