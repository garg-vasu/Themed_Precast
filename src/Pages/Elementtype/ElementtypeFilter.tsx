import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/utils/apiClient";
import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useParams } from "react-router";
import { Input } from "@/components/ui/input";
import MultiStage from "@/components/MultiStage/MultiStage";

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

export type FloorData = {
  hierarchy_id: number;
  name: string;
  description: string;
  parent_id: number;
  tower_name: string;
};

export type FilterStateElementtype = {
  selectedTower: number;
  elementType: string;
  typeName: string;
  selectedStages: string[];
  selectedFloor: number;
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

interface ElementtypeFilterProps {
  onFilterChange: (filter: FilterStateElementtype) => void;
  onClose: () => void;
  currentFilter?: FilterStateElementtype;
}
export default function ElementtypeFilter({
  onFilterChange,
  onClose,
  currentFilter,
}: ElementtypeFilterProps) {
  // Available stages for selection
  const availableStages = [
    { id: "production", label: "Production" },
    { id: "stockyard", label: "Stockyard" },
    { id: "erection", label: "Erection" },
    { id: "request", label: "Request" },
    { id: "dispatch", label: "Dispatch" },
  ];
  const [towerData, setTowerData] = useState<TowerData[]>([]);
  const [floorData, setFloorData] = useState<FloorData[]>([]);
  const { projectId } = useParams();

  // Filter state
  const [selectedTower, setSelectedTower] = useState<number>(
    currentFilter?.selectedTower || 0
  );
  const [selectedStages, setSelectedStages] = useState<string[]>(
    currentFilter?.selectedStages || []
  );
  const [elementType, setElementType] = useState<string>(
    currentFilter?.elementType || ""
  );
  const [typeName, setTypeName] = useState<string>(
    currentFilter?.typeName || ""
  );
  const [selectedFloor, setSelectedFloor] = useState<number>(
    currentFilter?.selectedFloor || 0
  );

  // Loading states
  const [towerLoading, setTowerLoading] = useState(false);
  const [floorLoading, setFloorLoading] = useState(false);

  // Fetch projects
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchTower = async (projectId: number) => {
      setTowerLoading(true);
      try {
        const response = await apiClient.get(`/dashboard/towers/${projectId}`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setTowerData(response.data.towers);
        } else if (response.status === 404 || response.status === 204) {
          setTowerData([]);
        } else {
          toast.error(response.data?.message || "Failed to fetch towers");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "towers data"));
        }
      } finally {
        setTowerLoading(false);
      }
    };
    fetchTower(Number(projectId));

    return () => {
      source.cancel();
    };
  }, [projectId]);

  // Fetch floors when tower is selected
  useEffect(() => {
    if (!selectedTower || !projectId) {
      setFloorData([]);
      setSelectedFloor(0);
      return;
    }

    const source = axios.CancelToken.source();

    const fetchFloors = async () => {
      setFloorLoading(true);
      try {
        const response = await apiClient.get(
          `/precast/floors/${projectId}/${selectedTower}`,
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          setFloorData(response.data);
        } else if (response.status === 404 || response.status === 204) {
          setFloorData([]);
        } else {
          toast.error(response.data?.message || "Failed to fetch floors");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "floors data"));
        }
      } finally {
        setFloorLoading(false);
      }
    };
    fetchFloors();

    return () => {
      source.cancel();
    };
  }, [selectedTower, projectId]);

  // Sync local state with currentFilter prop when it changes
  useEffect(() => {
    if (currentFilter) {
      setSelectedTower(currentFilter.selectedTower || 0);
      setSelectedStages(currentFilter.selectedStages || []);
      setElementType(currentFilter.elementType || "");
      setTypeName(currentFilter.typeName || "");
      setSelectedFloor(currentFilter.selectedFloor || 0);
    }
  }, [currentFilter]);

  const handleApplyFilter = () => {
    const filter: FilterStateElementtype = {
      selectedTower,
      selectedStages,
      elementType,
      typeName,
      selectedFloor,
    };
    onFilterChange(filter);
    // Don't close - keep filter open for "Apply & Keep Open"
  };

  const handleApplyAndClose = () => {
    const filter: FilterStateElementtype = {
      selectedTower,
      selectedStages,
      elementType,
      typeName,
      selectedFloor,
    };
    onFilterChange(filter);
    onClose();
  };

  const handleResetFilter = () => {
    setSelectedTower(0);
    setSelectedStages([]);
    setElementType("");
    setTypeName("");
    setSelectedFloor(0);
  };
  return (
    <div className="w-full space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Advance Filter</h2>
      </div>
      {/* filter form grid  */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Project Name */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="project_name">
            Tower Name <span className="text-red-500">*</span>
          </Label>
          <Select
            value={selectedTower ? selectedTower.toString() : ""}
            disabled={towerLoading}
            onValueChange={(value) => setSelectedTower(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={towerLoading ? "Loading..." : "Select a tower"}
              />
            </SelectTrigger>
            <SelectContent>
              {towerData?.map((tower) => (
                <SelectItem key={tower.id} value={tower.id.toString()}>
                  {tower.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Floor */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="floor">Floor</Label>
          <Select
            value={selectedFloor ? selectedFloor.toString() : ""}
            disabled={floorLoading || !selectedTower}
            onValueChange={(value) => setSelectedFloor(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  !selectedTower
                    ? "Select tower first"
                    : floorLoading
                    ? "Loading..."
                    : "Select a floor"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {floorData?.map((floor) => (
                <SelectItem
                  key={floor.hierarchy_id}
                  value={floor.hierarchy_id.toString()}
                >
                  {floor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* element type */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="element_type">
            Element Type <span className="text-red-500">*</span>
          </Label>
          <Input
            id="element_type"
            placeholder="Element Type"
            value={elementType}
            onChange={(e) => setElementType(e.target.value)}
          />
        </div>

        {/* type name */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="type_name">
            Type Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="type_name"
            placeholder="Type Name"
            value={typeName}
            onChange={(e) => setTypeName(e.target.value)}
          />
        </div>

        {/* Stages Multi-Select */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="stages">
            Stages <span className="text-red-500">*</span>
          </Label>
          <MultiStage
            stages={availableStages}
            selectedStages={selectedStages}
            onSelectionChange={setSelectedStages}
            placeholder="Select stages..."
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={handleResetFilter}>
          Reset
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="outline" onClick={handleApplyFilter}>
          Apply & Keep Open
        </Button>
        <Button onClick={handleApplyAndClose}>Apply & Close</Button>
      </div>
    </div>
  );
}
