import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Factory,
  Warehouse,
  ArrowUpCircle,
  Package,
  Layers,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { YearMonthFilter } from "@/components/common/yearmonthfilter";
import { apiClient } from "@/utils/apiClient";
import PageHeader from "@/components/ui/PageHeader";

export type TowerData = {
  id: number;
  project_id: number;
  name: string;
  description: string;
  child_count: number;
};

export type Tower = {
  total_towers: number;
  towers: TowerData[];
};

interface ElementDetails {
  balance: number;
  balance_concrete: number;
  dispatch: number;
  dispatch_concrete: number;
  erected: number;
  erected_concrete: number;
  erectedbalance: number;
  erectedbalance_concrete: number;
  erection: number;
  erection_concrete: number;
  notinproduction: number;
  notinproduction_concrete: number;
  production: number;
  production_concrete: number;
  stockyard: number;
  stockyard_concrete: number;
  totalelement: number;
  totalelement_concrete: number;
}

interface FloorSummary {
  [elementType: string]: ElementDetails | number;
balance: 8412,
        balance_concrete: number;
    dispatch: number;
    dispatch_concrete: number;
    erected: 286,
    erected_concrete: 131.817248312,
    erectedbalance: number;
    erectedbalance_concrete: number;
    erection: number;
    erection_concrete: number;
    notinproduction: number;
    notinproduction_concrete: number;
    production: number;
    production_concrete: number;
    stockyard: 688,
    stockyard_concrete: number;
    totalelement: number;
    totalelement_concrete: number;
}

interface FloorData {
  [floor: string]: FloorSummary | number;
 balance: number,
 balance_concrete: number,
    dispatch: number;
    dispatch_concrete: number;
    erected: number;
    erected_concrete: number;
    erectedbalance: number;
    erectedbalance_concrete: number;
    erection: number;
    erection_concrete: number;
    notinproduction: number;
    notinproduction_concrete: number;
    production: number;
    production_concrete: number;
    stockyard: number;
    stockyard_concrete: number;
    totalelement: number;
    totalelement_concrete: number;
}

export default function NewProjectDashboard() {
  const { projectId } = useParams<{ projectId: string }>();
  const [downloading, setDownloading] = useState<boolean>(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState<boolean>(false);
  const [viewType, setViewType] = useState<
    "all" | "production" | "stockyard" | "dispatch" | "erected"
  >("all");
  const [pdfFilter, setPdfFilter] = useState<
    | { type: "yearly"; year: number }
    | { type: "monthly"; year: number; month: number }
    | { type: "custom"; start_date: string; end_date: string }
  >({ type: "yearly", year: new Date().getFullYear() });
  const [selectedTower, setSelectedTower] = useState<number>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FloorData>();
  const [towerData, setTowerData] = useState<Tower>();
  const [selectedFloor, setSelectedFloor] = useState<string | null>("all");
  const [selectedElementType, setSelectedElementType] = useState<string | null>(
    "all"
  );
  const [collapsedFloors, setCollapsedFloors] = useState<Record<string, boolean>>({});

  const toggleFloorCollapse = (floorName: string) => {
    setCollapsedFloors((prev) => ({
      ...prev,
      [floorName]: !prev[floorName],
    }));
  };

  const openPdfDialog = () => setPdfDialogOpen(true);
  const closePdfDialog = () => setPdfDialogOpen(false);

  const isPdfRangeValid = (() => {
    if (pdfFilter.type === "custom") {
      const { start_date, end_date } = pdfFilter;
      return Boolean(start_date && end_date && end_date >= start_date);
    }
    if (pdfFilter.type === "monthly") return true;
    return true;
  })();

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const params = new URLSearchParams();
      params.set("project_id", String(projectId));
      if (viewType !== "all") {
        params.set("view", viewType);
      }
      params.set("type", pdfFilter.type);
      if (pdfFilter.type === "yearly") {
        params.set("year", String(pdfFilter.year));
      } else if (pdfFilter.type === "monthly") {
        params.set("year", String(pdfFilter.year));
        params.set("month", String(pdfFilter.month));
      } else if (pdfFilter.type === "custom") {
        params.set("start_date", pdfFilter.start_date);
        params.set("end_date", pdfFilter.end_date);
      }

      const response = await apiClient.get(
        `/dashboard_pdf?${params.toString()}`,
        {
          responseType: "blob",
        }
      );

      // Create a blob from the response data
      const blob = new Blob([response.data], { type: "application/pdf" });

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element to trigger download
      const link = document.createElement("a");
      link.href = url;
      const filenameParts = [
        "project",
        String(projectId),
        "dashboard",
        pdfFilter.type,
        viewType,
      ];
      if (pdfFilter.type === "yearly") {
        filenameParts.push(String(pdfFilter.year));
      } else if (pdfFilter.type === "monthly") {
        filenameParts.push(
          String(pdfFilter.year),
          String((pdfFilter as any).month)
        );
      } else if (pdfFilter.type === "custom") {
        filenameParts.push(
          (pdfFilter as any).start_date,
          (pdfFilter as any).end_date
        );
      }
      link.download = `${filenameParts.join("_")}.pdf`;

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL object
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      // You might want to show a toast notification here
    } finally {
      setDownloading(false);
      closePdfDialog();
    }
  };

  useEffect(() => {
    setSelectedTower(undefined);
    setData(undefined);
    setTowerData(undefined);
    setSelectedFloor("all");
    setSelectedElementType("all");
  }, [projectId]);

  const fetchTowerData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/dashboard/towers/${projectId}`);
      if (response.status === 200) {
        setTowerData(response.data);
        // Set the first tower as default selected
        if (response.data.towers && response.data.towers.length > 0) {
          setSelectedTower(response.data.towers[0].id);
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (!selectedTower) return;

    setLoading(true);
    try {
      const response = await apiClient.get(
        `/element_type_status_breakdown_multiple/${projectId}?hierarchy_ids=${selectedTower}`
      );
      if (response.status === 200) {
        setData(response.data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTowerData();
  }, [projectId]);

  useEffect(() => {
    if (selectedTower) {
      fetchData();
      setSelectedFloor("all"); // Reset floor selection on tower change
      setSelectedElementType("all"); // Reset element type selection on tower change
    }
  }, [selectedTower, projectId]);

  const renderTowerPills = () => {
    if (!towerData?.towers) return null;

    return (
      <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
        {towerData.towers.map((tower) => (
          <button
            key={tower.id}
            onClick={() => setSelectedTower(tower.id)}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              selectedTower === tower.id
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {tower.name}
          </button>
        ))}
      </div>
    );
  };

  const renderFiltersRow = () => {
    if (!data) return null;
    const summaryKeys = [
      "balance",
      "balance_concrete",
      "dispatch",
      "dispatch_concrete",
      "erected",
      "erected_concrete",
      "erectedbalance",
      "erectedbalance_concrete",
      "production",
      "production_concrete",
      "stockyard",
      "stockyard_concrete",
      "totalelement",
      "totalelement_concrete",
    ];
    const floorNames = Object.keys(data).filter(
      (key) => typeof data[key] === "object" && !summaryKeys.includes(key)
    );
    if (floorNames.length === 0) return null;

    // Get element types for the selected floor
    let elementTypes: [string, any][] = [];
    if (selectedFloor !== "all" && selectedFloor) {
      const floorData = data[selectedFloor] as FloorSummary;
      if (floorData) {
        elementTypes = Object.entries(floorData).filter(
          ([, value]) =>
            typeof value === "object" && value && "totalelement" in value
        );
      }
    }

    return (
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          {/* Floor Dropdown */}
          <div className="flex-1 sm:flex-none">
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Floor
            </label>
            <Select
              value={selectedFloor || "all"}
              onValueChange={setSelectedFloor}
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select a floor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Floors</SelectItem>
                {floorNames.map((floor) => (
                  <SelectItem key={floor} value={floor}>
                    {floor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Element Type Dropdown */}
          {selectedFloor !== "all" &&
            selectedFloor &&
            elementTypes.length > 0 && (
              <div className="flex-1 sm:flex-none">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Filter by Element Type
                </label>
                <Select
                  value={selectedElementType || "all"}
                  onValueChange={setSelectedElementType}
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Select an element type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Element Types</SelectItem>
                    {elementTypes.map(([key]) => (
                      <SelectItem key={key} value={key}>
                        {key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
        </div>
      </div>
    );
  };

  const renderFloorSummaryCards = (floorData: FloorSummary) => {
    const cardConfig = [
      {
        label: "Total Elements",
        value: floorData.totalelement,
        concrete: floorData.totalelement_concrete,
        icon: Layers,
      },
      {
        label: "Produced",
        value: floorData.production,
        concrete: floorData.production_concrete,
        icon: Factory,
      },
      {
        label: "Balance",
        value: floorData.balance,
        concrete: floorData.balance_concrete,
        icon: Package,
      },
      {
        label: "Dispatched",
        value: floorData.dispatch,
        concrete: floorData.dispatch_concrete,
        icon: ArrowUpCircle,
      },
      {
        label: "Stockyard",
        value: floorData.stockyard,
        concrete: floorData.stockyard_concrete,
        icon: Warehouse,
      },
      
      {
        label: "Erected",
        value: floorData.erected,
        concrete: floorData.erected_concrete,
        icon: ArrowUpCircle,
      },
      {
        label: "Erected Balance",
        value: floorData.erectedbalance,
        concrete: floorData.erectedbalance_concrete,
        icon: Package,
      },

    ];

    return (
      <div className="grid gap-2 sm:gap-4 mb-3 sm:mb-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {cardConfig.map((config, index) => {
          const Icon = config.icon;
          return (
            <Card key={index}>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {config.label}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-base sm:text-lg font-semibold text-foreground">
                    {config.value}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {(config.concrete ?? 0).toFixed(2)} m³
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderElementTable = (floorData: FloorSummary) => {
    // Get all element types (keys that are objects with 'totalelement')
    let elementTypes = Object.entries(floorData).filter(
      ([, value]) =>
        typeof value === "object" && value && "totalelement" in value
    );

    // Filter by selected element type if a specific floor is selected
    if (
      selectedFloor !== "all" &&
      selectedElementType !== "all" &&
      selectedElementType
    ) {
      elementTypes = elementTypes.filter(
        ([key]) => key === selectedElementType
      );
    }

    if (elementTypes.length === 0) return null;

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Element Type</TableHead>
            <TableHead>Total Elements</TableHead>
            <TableHead>Produced</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Dispatched</TableHead>
            <TableHead>Stockyard</TableHead>
            <TableHead>Erected</TableHead>
            <TableHead>Erected Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {elementTypes.map(([key, value]) => {
            const el = value as ElementDetails;
            return (
              <TableRow key={key}>
                <TableCell className="font-medium">{key}</TableCell>
                <TableCell>
                  <span className="text-sm sm:text-base font-semibold">
                    {el.totalelement} /{" "}
                    {(el.totalelement_concrete ?? 0).toFixed(2)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm sm:text-base font-semibold">
                    {el.production} / {(el.production_concrete ?? 0).toFixed(2)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm sm:text-base font-semibold">
                    {el.balance} / {(el.balance_concrete ?? 0).toFixed(2)}
                  </span>
                </TableCell>
                  <TableCell>
                  <span className="text-sm sm:text-base font-semibold">
                    {el.dispatch} / {(el.dispatch_concrete ?? 0).toFixed(2)}
                  </span>
                </TableCell>
                
                <TableCell>
                  <span className="text-sm sm:text-base font-semibold">
                    {el.stockyard} / {(el.stockyard_concrete ?? 0).toFixed(2)}
                  </span>
                </TableCell>
              
                <TableCell>
                  <span className="text-sm sm:text-base font-semibold">
                    {el.erected} / {(el.erected_concrete ?? 0).toFixed(2)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm sm:text-base font-semibold">
                    {el.erectedbalance} /{" "}
                    {(el.erectedbalance_concrete ?? 0).toFixed(2)}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  const renderFloorDetails = (floorData: FloorSummary, floorName: string) => {
    const isCollapsed = collapsedFloors[floorName] ?? false;
    
    return (
      <div key={floorName} className="mb-3 sm:mb-4 border rounded-lg overflow-hidden">
        <button
          onClick={() => toggleFloorCollapse(floorName)}
          className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors"
        >
          <h5 className="text-xl font-bold text-primary">{floorName}</h5>
          {isCollapsed ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
        
        {!isCollapsed && (
          <div className="p-4">
            {renderFloorSummaryCards(floorData)}
            {renderElementTable(floorData)}
          </div>
        )}
      </div>
    );
  };

  const renderFloorContent = () => {
    if (!data) return null;

    return (
      <div className="space-y-2 sm:space-y-3">
        {Object.entries(data).map(([key, value]) => {
          // Skip the summary properties
          if (
            typeof value === "number" ||
            key === "balance" ||
            key === "balance_concrete" ||
            key === "dispatch" ||
            key === "dispatch_concrete" ||
            key === "erected" ||
            key === "erected_concrete" ||
            key === "erectedbalance" ||
            key === "erectedbalance_concrete" ||
            key === "production" ||
            key === "production_concrete" ||
            key === "stockyard" ||
            key === "stockyard_concrete" ||
            key === "totalelement" ||
            key === "totalelement_concrete"
          ) {
            return null;
          }

          if (typeof value === "object") {
            return renderFloorDetails(value as FloorSummary, key);
          }

          return null;
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-1 sm:p-2 md:p-4">
        <div className="flex items-center justify-center h-48 sm:h-64">
          <div className="text-base sm:text-lg animate-pulse text-muted-foreground">
            Loading, please wait...
          </div>
        </div>
      </div>
    );
  }

  // Fallback: No towers found
  if (!towerData || !towerData.towers || towerData.towers.length === 0) {
    return (
      <div className="p-1 sm:p-2 md:p-4">
        <div className="flex items-center justify-center h-48 sm:h-64">
          <div className="text-base sm:text-lg text-muted-foreground">
            No towers found for this project.
          </div>
        </div>
      </div>
    );
  }

  // Fallback: No data for selected tower
  if (!data) {
    return (
      <div className="p-1 sm:p-2 md:p-4">
        <div className="flex items-center justify-center h-48 sm:h-64">
          <div className="text-base sm:text-lg text-muted-foreground">
            No data available for the selected tower.
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN RENDER ---
  return (
    <div className="w-full p-4">
      <div className="w-full mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <PageHeader title="Project Dashboard" />
          </div>
          <Button
            variant="outline"
            onClick={openPdfDialog}
            disabled={downloading}
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {downloading ? "Generating..." : "Download Report"}
          </Button>
        </div>

        <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select period</DialogTitle>
            </DialogHeader>
            <div className="mt-2">
              <YearMonthFilter
                onChange={(filter) => {
                  // Accept yearly/monthly/custom
                  if (filter.type === "yearly") {
                    setPdfFilter({ type: "yearly", year: filter.year });
                  } else if (filter.type === "monthly") {
                    setPdfFilter({
                      type: "monthly",
                      year: filter.year,
                      month: filter.month!,
                    });
                  } else if (filter.type === "custom") {
                    setPdfFilter({
                      type: "custom",
                      start_date: filter.start_date!,
                      end_date: filter.end_date!,
                    });
                  }
                }}
              />
              <div className="mt-3">
                <div className="mb-1 text-sm font-medium text-foreground">
                  View
                </div>
                <RadioGroup
                  value={viewType}
                  onValueChange={(v) =>
                    setViewType(
                      v as
                        | "all"
                        | "production"
                        | "stockyard"
                        | "dispatch"
                        | "erected"
                    )
                  }
                  className="flex flex-wrap items-center gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      id="view-all"
                      value="all"
                    />
                    <Label htmlFor="view-all">
                      All
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      id="view-production"
                      value="production"
                    />
                    <Label htmlFor="view-production">
                      Production
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      id="view-stockyard"
                      value="stockyard"
                    />
                    <Label htmlFor="view-stockyard">
                      Stockyard
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      id="view-dispatch"
                      value="dispatch"
                    />
                    <Label htmlFor="view-dispatch">
                      Dispatch
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      id="view-erected"
                      value="erected"
                    />
                    <Label htmlFor="view-erected">
                      Erected
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              {pdfFilter.type === "custom" && !isPdfRangeValid && (
                <p className="mt-2 text-xs text-destructive">
                  Please choose an end date on/after the start date to continue.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={closePdfDialog}
                disabled={downloading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDownloadPDF}
                disabled={downloading || !isPdfRangeValid}
              >
                {downloading ? "Generating..." : "Download"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {renderTowerPills()}
        {/* Overview section always visible */}
        {data && (
          <div>
           <h4 className="text-xl font-bold mb-2 ">Overview</h4>
            <div>
              {renderFloorSummaryCards(data as FloorSummary)}
            </div>
          </div>
        )}
        {/* Filters Row */}
        {renderFiltersRow()}
        {/* Floor details below pills */}
        {selectedFloor === "all"
          ? renderFloorContent()
          : selectedFloor && data && data[selectedFloor]
          ? renderFloorDetails(
              data[selectedFloor] as FloorSummary,
              selectedFloor
            )
          : null}
      </div>
    </div>
  );
}
