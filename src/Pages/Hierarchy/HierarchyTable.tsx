import { useParams } from "react-router";
import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  Building2,
  Layers,
  FolderTree,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import AddHierarchy from "./AddHierarchy";


export type Hierarchy = {
  id: number;
  project_id: number;
  name: string;
  description: string;
  parent_id: number;
  prefix: string;
  children?: Hierarchy[];
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
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      `Failed to ${data}.`;
    return errorMessage;
  }
  return "An unexpected error occurred. Please try again later.";
};

// Floor Card Component (shown in grid)
function FloorCard({ floor }: { floor: Hierarchy }) {
  return (
    <div className="border rounded-md bg-card p-2 hover:bg-muted/30 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Icon */}
          <div className="flex items-center justify-center h-6 w-6 rounded bg-blue-500/10 text-blue-500">
            <Layers className="h-3.5 w-3.5" />
          </div>

          {/* Name and Details */}
          <div className="flex flex-col gap-0">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-sm">{floor.name}</span>
              {floor.prefix && (
                <Badge variant="outline" className="text-[10px] px-1 py-0">
                  {floor.prefix}
                </Badge>
              )}
            </div>
            {floor.description && (
              <span className="text-[11px] text-muted-foreground leading-tight">
                {floor.description}
              </span>
            )}
          </div>
        </div>

       
      </div>
    </div>
  );
}

// Tower Component with collapsible floors grid
function TowerNode({
  tower,
  forceExpand,
}: {
  tower: Hierarchy;
  forceExpand?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const hasFloors = tower.children && tower.children.length > 0;

  // Sync with forceExpand prop
  useEffect(() => {
    if (forceExpand !== undefined) {
      setIsOpen(forceExpand);
    }
  }, [forceExpand]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn(
          "border rounded-md bg-card shadow-sm transition-all duration-200",
          isOpen && hasFloors && "ring-1 ring-primary/10"
        )}
      >
        <CollapsibleTrigger asChild>
          <div
            className={cn(
              "flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-muted/50 rounded-md transition-colors",
              isOpen && hasFloors && "border-b"
            )}
          >
            <div className="flex items-center gap-2">
              {/* Expand/Collapse Arrow */}
              {hasFloors && (
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                    isOpen && "rotate-90"
                  )}
                />
              )}
              {!hasFloors && <div className="w-3.5" />}

              {/* Icon */}
              <div className="flex items-center justify-center h-6 w-6 rounded bg-primary/10 text-primary">
                <Building2 className="h-3.5 w-3.5" />
              </div>

              {/* Name and Details */}
              <div className="flex flex-col gap-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-sm">{tower.name}</span>
                  {tower.prefix && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      {tower.prefix}
                    </Badge>
                  )}
                </div>
                {tower.description && (
                  <span className="text-[11px] text-muted-foreground leading-tight">
                    {tower.description}
                  </span>
                )}
              </div>
            </div>

            {/* Right side - badges only (no actions for tower) */}
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                Tower
              </Badge>
              {hasFloors && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  {tower.children?.length} Floor(s)
                </Badge>
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Floors Grid */}
        {hasFloors && (
          <CollapsibleContent>
            <div className="p-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {tower.children?.map((floor) => (
                  <FloorCard key={floor.id} floor={floor} />
                ))}
              </div>
            </div>
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
}

export default function HierarchyTable({ refresh }: { refresh: () => void }) {
  const { projectId } = useParams<{ projectId: string }>();
   const [refreshKey, setRefreshKey] = useState<number>(0);
  const [data, setData] = useState<Hierarchy[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandAll, setExpandAll] = useState<boolean | undefined>(undefined);
   const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHierarchy, setEditingHierarchy] =
    useState<Hierarchy | null>(null);


      const refreshData = () => {
    setRefreshKey((prev) => prev + 1);
    if (refreshKey > 0) {
      refresh();
    }
  };

  const openCreateDialog = () => {
    setEditingHierarchy(null);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchHierarchy = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(
          `/get_precast_project/${projectId}`,
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          setData(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch hierarchy");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "hierarchy data"));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHierarchy();

    return () => {
      source.cancel();
    };
  }, [projectId, refreshKey]);

// Count total items recursively
  const countItems = (items: Hierarchy[]): number => {
    return items.reduce((acc, item) => {
      return acc + 1 + (item.children ? countItems(item.children) : 0);
    }, 0);
  };

  // Dialog component - always render to maintain state properly
  const renderDialog = () => (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setEditingHierarchy(null);
        }
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {editingHierarchy ? "Edit Hierarchy" : "Add Hierarchy"}
          </DialogTitle>
        </DialogHeader>
        <AddHierarchy
          refresh={refreshData}
          onClose={() => {
            setIsDialogOpen(false);
            setEditingHierarchy(null);
          }}
        />
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <div className="w-full">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-muted-foreground text-sm">Loading hierarchy...</div>
          </CardContent>
        </Card>
        {renderDialog()}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
            <FolderTree className="h-10 w-10 text-muted-foreground/50" />
            <div className="text-center">
              <h3 className="font-medium text-sm">No hierarchy found</h3>
              <p className="text-xs text-muted-foreground">
                Start by adding towers and floors to your project.
              </p>
            </div>
            <Button size="sm" onClick={openCreateDialog}>Add Tower</Button>
          </CardContent>
        </Card>
        {renderDialog()}
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="text-xs">
            {data.length} Tower(s)
          </Badge>
          <Badge variant="outline" className="text-xs">
            {countItems(data)} Total Items
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            size="sm"
            onClick={openCreateDialog}
          >
            Add Hierarchy
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandAll((prev) => (prev === true ? false : true))}
          >
            {expandAll === true ? "Collapse All" : "Expand All"}
          </Button>
        </div>
      </div>

      {/* Tree View */}
      <div className="space-y-1.5">
        {data.map((tower) => (
          <TowerNode
            key={tower.id}
            tower={tower}
            forceExpand={expandAll}
          />
        ))}
      </div>

      {renderDialog()}
    </div>
  );
}