import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  List,
  MoreHorizontal,
  Download,
  Search,
  Check,
  FileSpreadsheet,
  FileText,
  Loader2,
  Package,
  Building2,
  Layers,
  X,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";

import { useProject } from "@/Provider/ProjectProvider";
import { ElementtypeTable } from "./ElementtypeTable";
import { ElementTable } from "../Element/ElementTable";
import { apiClient } from "@/utils/apiClient";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";

interface TabLink {
  id: string;
  label: string;
  number?: number;
  icon: React.ElementType;
  content: React.ReactNode;
}

interface Bom {
  bom_id: number;
  bom_name: string;
  bom_type: string;
  unit: string;
  created_at: string;
  updated_at: string;
  project_id: number;
  rate: number;
  name_id: string;
  vendor: null;
}

type Tower = {
  id: number;
  project_id?: number;
  name: string;
  description?: string;
  child_count?: number;
};
type Floor = {
  hierarchy_id: number;
  name: string;
  description?: string;
  parent_id?: number;
  tower_name: string;
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

export default function MixElement() {
  const { permissions } = useProject();
  const { projectId } = useParams();
  const [bomData, setBomData] = useState<Bom[]>([]);
  const [floorData, setFloorData] = useState<Floor[]>([]);
  const [towerData, setTowerData] = useState<Tower[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [bomLoading, setBomLoading] = useState<boolean>(false);
  const [towerLoading, setTowerLoading] = useState<boolean>(false);
  const [floorLoading, setFloorLoading] = useState<boolean>(false);

  // Download dialog states
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [bomList, setBomList] = useState<Bom[]>([]);
  const [selectedBoms, setSelectedBoms] = useState<Bom[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Tower and Floor selection states
  const [towers, setTowers] = useState<Tower[]>([]);
  const [loadingTowers, setLoadingTowers] = useState(false);
  const [towerSearch, setTowerSearch] = useState("");
  const [selectedTowerIds, setSelectedTowerIds] = useState<number[]>([]);
  const [floorsByTower, setFloorsByTower] = useState<Record<number, Floor[]>>(
    {}
  );
  const [loadingFloorsByTower, setLoadingFloorsByTower] = useState<
    Record<number, boolean>
  >({});
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [selectedFloorIdsByTower, setSelectedFloorIdsByTower] = useState<
    Record<number, number[]>
  >({});

  const tabLinks = useMemo<TabLink[]>(() => {
    const tabs: TabLink[] = [];

    if (permissions?.includes("ViewElementType")) {
      tabs.push({
        id: "1",
        label: "Element Type",
        number: 1,
        icon: List,
        content: <ElementtypeTable />,
      });
    }

    if (permissions?.includes("ViewElement")) {
      tabs.push({
        id: "2",
        label: "Element",
        number: 24,
        icon: MoreHorizontal,
        content: <ElementTable />,
      });
    }

    return tabs;
  }, [permissions]);

  useEffect(() => {
    if (!projectId) {
      toast.error("Project ID is required");
      setBomLoading(false);
      return;
    }

    const source = axios.CancelToken.source();

    const fetchBomData = async () => {
      try {
        const response = await apiClient.get(
          `/fetch_bom_products/${projectId}`,
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          setBomData(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch bom data");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "bom data"));
        }
      } finally {
        setBomLoading(false);
      }
    };

    fetchBomData();

    return () => {
      source.cancel();
    };
  }, [projectId]);

  // fetch tower data
  useEffect(() => {
    if (!projectId) {
      toast.error("Project ID is required");
      setTowerLoading(false);
      return;
    }

    const source = axios.CancelToken.source();

    const fetchTowerData = async () => {
      try {
        const response = await apiClient.get(`/dashboard/towers/${projectId}`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setTowerData(response.data.towers);
        } else {
          toast.error(response.data?.message || "Failed to fetch tower data");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "tower data"));
        }
      } finally {
        setTowerLoading(false);
      }
    };

    fetchTowerData();

    return () => {
      source.cancel();
    };
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      toast.error("Project ID is required");
      setFloorLoading(false);
      return;
    }

    const source = axios.CancelToken.source();

    const fetchFloorData = async (towerId: number) => {
      try {
        const response = await apiClient.get(
          `/precast/floors/${projectId}/${towerId}`,
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          setFloorData(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch floor data");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "floor data"));
        }
      } finally {
        setFloorLoading(false);
      }
    };

    return () => {
      source.cancel();
    };
  }, [projectId, towerData]);

  // Set initial active tab to first available tab when tabs are loaded
  useEffect(() => {
    if (tabLinks.length > 0 && !activeTab) {
      setActiveTab(tabLinks[0].id);
    }
  }, [tabLinks, activeTab]);

  // Fetch towers when download dialog opens
  useEffect(() => {
    if (downloadDialogOpen && projectId) {
      setLoadingTowers(true);
      apiClient
        .get(`/dashboard/towers/${projectId}`)
        .then((response) => {
          if (response.status === 200) {
            const data = response.data;
            // API returns { towers: [...] } object, extract the towers array
            const towersArray = data?.towers || data;
            setTowers(Array.isArray(towersArray) ? towersArray : []);
          }
        })
        .catch((err) => {
          if (!axios.isCancel(err)) {
            toast.error(getErrorMessage(err, "towers"));
          }
        })
        .finally(() => {
          setLoadingTowers(false);
        });

      // Also load BOMs for the dialog
      setLoading(true);
      apiClient
        .get(`/fetch_bom_products/${projectId}`)
        .then((response) => {
          if (response.status === 200) {
            const data = response.data;
            setBomList(Array.isArray(data) ? data : []);
          }
        })
        .catch((err) => {
          if (!axios.isCancel(err)) {
            toast.error(getErrorMessage(err, "BOMs"));
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [downloadDialogOpen, projectId]);

  // Fetch floors for a specific tower
  const fetchFloors = async (towerId: number) => {
    if (!projectId) return;

    setLoadingFloorsByTower((prev) => ({ ...prev, [towerId]: true }));
    try {
      const response = await apiClient.get(
        `/precast/floors/${projectId}/${towerId}`
      );
      if (response.status === 200) {
        const data = response.data;
        setFloorsByTower((prev) => ({
          ...prev,
          [towerId]: Array.isArray(data) ? data : [],
        }));
      }
    } catch (err) {
      if (!axios.isCancel(err)) {
        toast.error(getErrorMessage(err, "floors"));
      }
    } finally {
      setLoadingFloorsByTower((prev) => ({ ...prev, [towerId]: false }));
    }
  };

  // Handle download dialog open/close
  const handleDownloadDialogChange = (open: boolean) => {
    setDownloadDialogOpen(open);
    if (!open) {
      // Reset selections when dialog closes
      setSelectedBoms([]);
      setSelectedTowerIds([]);
      setSelectedFloorIdsByTower({});
      setSearchTerm("");
      setTowerSearch("");
    }
  };

  // Handle download
  const handleDownload = async (format: "excel" | "csv") => {
    const exportUrl =
      format === "excel"
        ? `/export_excel_element_type/${projectId}`
        : `/export/element_type/csv/${projectId}`;

    // Require hierarchy selection (at least one tower and one floor)
    const allSelectedFloorIds = Object.values(selectedFloorIdsByTower).flat();
    if (selectedTowerIds.length === 0 || allSelectedFloorIds.length === 0) {
      toast.error(
        "Please select at least one tower and one floor before downloading."
      );
      return;
    }

    setDownloading(true);

    // Prepare payload data
    const bom = selectedBoms.map((bomItem) => ({
      bom_id: bomItem.bom_id,
      bom_name: bomItem.bom_name,
      bom_type: bomItem.bom_type,
      unit: bomItem.unit,
      rate: bomItem.rate,
      vendor: bomItem.vendor ?? null,
      created_at: bomItem.created_at,
      updated_at: bomItem.updated_at,
    }));

    // Build hierarchy as an array of full objects for selected towers and floors
    const towersArray = Array.isArray(towers) ? towers : [];
    const selectedTowerObjects = towersArray.filter((t) =>
      selectedTowerIds.includes(t.id)
    );
    const selectedFloorObjects = selectedTowerIds.flatMap((towerId) => {
      const selectedFloorIds = selectedFloorIdsByTower[towerId] || [];
      const floors = floorsByTower[towerId] || [];
      return (Array.isArray(floors) ? floors : []).filter((f) =>
        selectedFloorIds.includes(f.hierarchy_id)
      );
    });
    const hierarchy = [...selectedTowerObjects, ...selectedFloorObjects];

    try {
      const response = await apiClient.post(
        exportUrl,
        {
          bom,
          hierarchy,
          project_id: projectId,
        },
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `element_type_export.${
        format === "excel" ? "xlsx" : "csv"
      }`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(`Downloaded ${format.toUpperCase()} file successfully`);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error(getErrorMessage(error, "download"));
    } finally {
      setDownloading(false);
    }

    // Ensure dialog close also triggers selection reset logic
    handleDownloadDialogChange(false);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // Handle BOM selection
  const handleBomSelect = (bom: Bom) => {
    setSelectedBoms((prev) => [...prev, bom]);
    setBomList((prev) => prev.filter((item) => item.bom_id !== bom.bom_id));
  };

  // Handle BOM deselection (move back to first column)
  const handleBomDeselect = (bom: Bom) => {
    setSelectedBoms((prev) =>
      prev.filter((item) => item.bom_id !== bom.bom_id)
    );
    setBomList((prev) =>
      [...prev, bom].sort((a, b) => a.bom_name.localeCompare(b.bom_name))
    );
  };

  // Filter available BOMs based on search term
  const filteredBomList = (Array.isArray(bomList) ? bomList : []).filter(
    (bom) => bom.bom_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // If no tabs are available, show a message
  if (tabLinks.length === 0) {
    return (
      <div className="flex flex-col gap-2 py-4 px-4">
        <div className="flex items-center justify-between">
          <PageHeader title="Element Type" />
        </div>
        <div className="text-center py-8 text-muted-foreground">
          You do not have permission to view any element type sections.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex items-center justify-between">
        <PageHeader title="Element Type" />
      </div>
      {/* pills section  */}
      <div className="flex justify-between item-center gap-2">
        {/* FOR DESKTOP and TABLET  */}

        <div className=" hidden md:flex flex-wrap gap-2">
          {tabLinks.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              className={activeTab === tab.id ? "text-white" : ""}
              onClick={() => handleTabChange(tab.id)}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Button>
          ))}
        </div>
        {/* for mobile  */}
        <div className="md:hidden w-full">
          <Select value={activeTab} onValueChange={handleTabChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a tab" />
            </SelectTrigger>
            <SelectContent>
              {tabLinks.map((tab) => (
                <SelectItem key={tab.id} value={tab.id}>
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 items-center">
          {permissions?.includes("DownloadElementtypeTemplate") && (
            <Dialog
              open={downloadDialogOpen}
              onOpenChange={handleDownloadDialogChange}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex gap-2 items-center text-xs sm:text-sm"
                >
                  <Download className="h-4 w-4" />
                  Template
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[900px] w-full max-h-[85vh] overflow-y-auto p-0">
                {/* Header */}
                <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
                  <DialogTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                    <Download className="h-5 w-5 text-primary" />
                    Export Element Type Template
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Configure your export by selecting BOMs and hierarchy
                  </DialogDescription>
                </DialogHeader>

                <div className="px-6 py-4 space-y-6">
                  {/* Step 1: BOM Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-sm font-medium">
                        1
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        <h3 className="font-medium">Select BOMs</h3>
                      </div>
                      {selectedBoms.length > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          {selectedBoms.length} selected
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-10">
                      {/* Available BOMs */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Available ({bomList.length})
                          </span>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search BOMs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-9"
                          />
                        </div>
                        <div className="border rounded-lg max-h-[200px] overflow-y-auto">
                          {loading ? (
                            <div className="flex flex-col items-center justify-center py-8 gap-2">
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                Loading BOMs...
                              </span>
                            </div>
                          ) : filteredBomList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 gap-2">
                              <Package className="h-8 w-8 text-muted-foreground/50" />
                              <span className="text-sm text-muted-foreground">
                                {searchTerm
                                  ? "No BOMs match your search"
                                  : "No BOMs available"}
                              </span>
                            </div>
                          ) : (
                            <div className="divide-y">
                              {filteredBomList.map((bom) => (
                                <div
                                  key={bom.bom_id}
                                  className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors group"
                                  onClick={() => handleBomSelect(bom)}
                                >
                                  <div className="w-4 h-4 rounded border border-muted-foreground/30 group-hover:border-primary transition-colors" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {bom.bom_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {bom.bom_type}
                                    </p>
                                  </div>
                                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Selected BOMs */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Selected ({selectedBoms.length})
                          </span>
                          {selectedBoms.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                setBomList((prev) =>
                                  [...prev, ...selectedBoms].sort((a, b) =>
                                    a.bom_name.localeCompare(b.bom_name)
                                  )
                                );
                                setSelectedBoms([]);
                              }}
                            >
                              Clear all
                            </Button>
                          )}
                        </div>
                        <div className="border rounded-lg min-h-[200px] max-h-[200px] overflow-y-auto bg-green-50/30">
                          {selectedBoms.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[200px] gap-2">
                              <ChevronRight className="h-8 w-8 text-muted-foreground/30" />
                              <span className="text-sm text-muted-foreground">
                                Click BOMs to select
                              </span>
                            </div>
                          ) : (
                            <div className="divide-y">
                              {selectedBoms.map((bom) => (
                                <div
                                  key={bom.bom_id}
                                  className="flex items-center gap-3 p-3 hover:bg-green-100/50 cursor-pointer transition-colors group"
                                  onClick={() => handleBomDeselect(bom)}
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {bom.bom_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {bom.bom_type}
                                    </p>
                                  </div>
                                  <X className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Hierarchy Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium ${
                          selectedBoms.length > 0
                            ? "bg-primary text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        2
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <h3 className="font-medium">Select Hierarchy</h3>
                      </div>
                      {selectedTowerIds.length > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          {selectedTowerIds.length} tower(s),{" "}
                          {Object.values(selectedFloorIdsByTower).flat().length}{" "}
                          floor(s)
                        </Badge>
                      )}
                    </div>

                    <div className="ml-10 space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search towers..."
                          value={towerSearch}
                          onChange={(e) => setTowerSearch(e.target.value)}
                          className="pl-9 h-9"
                        />
                      </div>

                      <div className="border rounded-lg max-h-[280px] overflow-y-auto">
                        {loadingTowers ? (
                          <div className="flex flex-col items-center justify-center py-8 gap-2">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Loading towers...
                            </span>
                          </div>
                        ) : !Array.isArray(towers) || towers.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 gap-2">
                            <Building2 className="h-8 w-8 text-muted-foreground/50" />
                            <span className="text-sm text-muted-foreground">
                              No towers available
                            </span>
                          </div>
                        ) : (
                          <div className="divide-y">
                            {(Array.isArray(towers) ? towers : [])
                              .filter((t) =>
                                t.name
                                  .toLowerCase()
                                  .includes(towerSearch.toLowerCase())
                              )
                              .map((t) => {
                                const isTowerSelected =
                                  selectedTowerIds.includes(t.id);
                                const rawFloors = floorsByTower[t.id];
                                const towerFloors = Array.isArray(rawFloors)
                                  ? rawFloors
                                  : [];
                                const isLoadingFloors =
                                  !!loadingFloorsByTower[t.id];
                                const selectedFloorsForTower =
                                  selectedFloorIdsByTower[t.id] || [];
                                const allFloorsSelected =
                                  towerFloors.length > 0 &&
                                  selectedFloorsForTower.length ===
                                    towerFloors.length;

                                return (
                                  <div key={t.id} className="p-3">
                                    <div
                                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                        isTowerSelected
                                          ? "bg-primary/10"
                                          : "hover:bg-muted/50"
                                      }`}
                                      onClick={() => {
                                        const already =
                                          selectedTowerIds.includes(t.id);
                                        const next = already
                                          ? selectedTowerIds.filter(
                                              (x) => x !== t.id
                                            )
                                          : [...selectedTowerIds, t.id];
                                        setSelectedTowerIds(next);
                                        if (!already && !floorsByTower[t.id]) {
                                          fetchFloors(t.id);
                                        }
                                        if (already) {
                                          setSelectedFloorIdsByTower((prev) => {
                                            const { [t.id]: _, ...rest } = prev;
                                            return rest;
                                          });
                                        }
                                      }}
                                    >
                                      <Checkbox checked={isTowerSelected} />
                                      <Building2 className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium text-sm">
                                        {t.name}
                                      </span>
                                      {t.child_count !== undefined && (
                                        <Badge
                                          variant="outline"
                                          className="ml-auto text-xs"
                                        >
                                          {t.child_count} floors
                                        </Badge>
                                      )}
                                    </div>

                                    {isTowerSelected && (
                                      <div className="mt-3 ml-6 p-3 bg-muted/30 rounded-lg border">
                                        {isLoadingFloors ? (
                                          <div className="flex items-center gap-2 py-2">
                                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground">
                                              Loading floors...
                                            </span>
                                          </div>
                                        ) : towerFloors.length === 0 ? (
                                          <div className="flex items-center gap-2 py-2">
                                            <Layers className="h-4 w-4 text-muted-foreground/50" />
                                            <span className="text-xs text-muted-foreground">
                                              No floors available
                                            </span>
                                          </div>
                                        ) : (
                                          <>
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Layers className="h-3 w-3" />
                                                Select floors
                                              </span>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-xs"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (allFloorsSelected) {
                                                    setSelectedFloorIdsByTower(
                                                      (prev) => ({
                                                        ...prev,
                                                        [t.id]: [],
                                                      })
                                                    );
                                                  } else {
                                                    setSelectedFloorIdsByTower(
                                                      (prev) => ({
                                                        ...prev,
                                                        [t.id]: towerFloors.map(
                                                          (f) => f.hierarchy_id
                                                        ),
                                                      })
                                                    );
                                                  }
                                                }}
                                              >
                                                {allFloorsSelected
                                                  ? "Deselect all"
                                                  : "Select all"}
                                              </Button>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
                                              {towerFloors.map((f) => {
                                                const checked =
                                                  selectedFloorsForTower.includes(
                                                    f.hierarchy_id
                                                  );
                                                return (
                                                  <div
                                                    key={f.hierarchy_id}
                                                    className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors text-xs ${
                                                      checked
                                                        ? "bg-primary/10 text-primary"
                                                        : "hover:bg-muted"
                                                    }`}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setSelectedFloorIdsByTower(
                                                        (prev) => {
                                                          const current =
                                                            prev[t.id] || [];
                                                          const next = checked
                                                            ? current.filter(
                                                                (x) =>
                                                                  x !==
                                                                  f.hierarchy_id
                                                              )
                                                            : [
                                                                ...current,
                                                                f.hierarchy_id,
                                                              ];
                                                          return {
                                                            ...prev,
                                                            [t.id]: next,
                                                          };
                                                        }
                                                      );
                                                    }}
                                                  >
                                                    <Checkbox
                                                      checked={checked}
                                                      className="h-3 w-3"
                                                    />
                                                    <span className="truncate font-medium">
                                                      {f.name}
                                                    </span>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Download */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium ${
                          selectedBoms.length > 0 &&
                          selectedTowerIds.length > 0 &&
                          Object.values(selectedFloorIdsByTower).flat().length >
                            0
                            ? "bg-primary text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        3
                      </div>
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4 text-primary" />
                        <h3 className="font-medium">Download Template</h3>
                      </div>
                    </div>

                    <div className="ml-10">
                      {selectedBoms.length === 0 ||
                      selectedTowerIds.length === 0 ||
                      Object.values(selectedFloorIdsByTower).flat().length ===
                        0 ? (
                        <div className="p-4 rounded-lg border border-dashed bg-muted/30 text-center">
                          <p className="text-sm text-muted-foreground">
                            {selectedBoms.length === 0
                              ? "Select at least one BOM to continue"
                              : selectedTowerIds.length === 0
                              ? "Select at least one tower to continue"
                              : "Select at least one floor to continue"}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Summary */}
                          <div className="p-3 rounded-lg bg-muted/50 border">
                            <p className="text-sm font-medium mb-2">
                              Export Summary
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="gap-1">
                                <Package className="h-3 w-3" />
                                {selectedBoms.length} BOM(s)
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <Building2 className="h-3 w-3" />
                                {selectedTowerIds.length} Tower(s)
                              </Badge>
                              <Badge variant="outline" className="gap-1">
                                <Layers className="h-3 w-3" />
                                {
                                  Object.values(selectedFloorIdsByTower).flat()
                                    .length
                                }{" "}
                                Floor(s)
                              </Badge>
                            </div>
                          </div>

                          {/* Download Buttons */}
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              variant="outline"
                              className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-green-50 hover:border-green-300 transition-all"
                              onClick={() => handleDownload("excel")}
                              disabled={downloading}
                            >
                              {downloading ? (
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                              ) : (
                                <FileSpreadsheet className="h-8 w-8 text-green-600" />
                              )}
                              <span className="font-medium">Excel (.xlsx)</span>
                              <span className="text-xs text-muted-foreground">
                                Best for editing
                              </span>
                            </Button>
                            <Button
                              variant="outline"
                              className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-all"
                              onClick={() => handleDownload("csv")}
                              disabled={downloading}
                            >
                              {downloading ? (
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                              ) : (
                                <FileText className="h-8 w-8 text-blue-600" />
                              )}
                              <span className="font-medium">CSV (.csv)</span>
                              <span className="text-xs text-muted-foreground">
                                Universal format
                              </span>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {permissions?.includes("AddElementType") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/project/${projectId}/add-element-type`)}
              className="flex gap-2 items-center text-xs sm:text-sm"
            >
              Add Element Type
            </Button>
          )}
          {permissions?.includes("ViewUploadElementType") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/project/${projectId}/upload-elementtype`)}
              className="flex gap-2 items-center text-xs sm:text-sm"
            >
              Upload Element Type
            </Button>
          )}
        </div>
      </div>

      {/*content area   */}

      {tabLinks.find((tab) => tab.id === activeTab)?.content}
    </div>
  );
}
