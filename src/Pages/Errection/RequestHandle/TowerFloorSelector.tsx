import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Data {
  [tower: string]: {
    [floor: string]: {
      // Minimal shape needed for this component (keys only)
      [category: string]: unknown[];
    };
  };
}

interface TowerFloorSelectorProps {
  data: Data;
  selectedTower: string;
  selectedFloor: string;
  onSelectTower: (tower: string) => void;
  onSelectFloor: (floor: string) => void;
  showErrors?: boolean;
}

const TowerFloorSelector: React.FC<TowerFloorSelectorProps> = ({
  data,
  selectedTower,
  selectedFloor,
  onSelectTower,
  onSelectFloor,
  showErrors = false,
}) => {
  const hasAnyData = Object.keys(data || {}).length > 0;
  const towerError = showErrors && !selectedTower;
  const floorError = showErrors && !!selectedTower && !selectedFloor;

  return (
    <section className="space-y-3 ">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold md:text-base">
          Step 1 · Choose tower &amp; floor
        </p>
        {!hasAnyData && (
          <span className="text-xs text-muted-foreground">
            No towers or floors configured for this project.
          </span>
        )}
      </div>

      {!hasAnyData && (
        <Alert variant="destructive">
          <AlertDescription>
            No towers or floors are available for this project.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-2  grid-cols-2 w-full ">
        <div className="space-y-1.5 w-full">
          <div className="flex items-center justify-between w-full">
            <Label
              htmlFor="tower-select"
              className="text-xs font-medium text-muted-foreground sm:text-sm"
            >
              Tower
            </Label>
            {towerError && (
              <span className="text-xs text-destructive">Required</span>
            )}
          </div>
          <Select
            value={selectedTower}
            onValueChange={onSelectTower}
            disabled={!hasAnyData}
          >
            <SelectTrigger
              id="tower-select"
              className={`h-9 text-xs sm:text-sm ${
                towerError ? "border-destructive" : ""
              }`}
            >
              <SelectValue placeholder="Select a tower" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(data).map((tower) => (
                <SelectItem
                  key={tower}
                  value={tower}
                  className="text-xs sm:text-sm"
                >
                  {tower}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="floor-select"
              className="text-xs font-medium text-muted-foreground sm:text-sm"
            >
              Floor
            </Label>
            {floorError && (
              <span className="text-xs text-destructive">Required</span>
            )}
          </div>
          <Select
            value={selectedFloor}
            onValueChange={onSelectFloor}
            disabled={!selectedTower}
          >
            <SelectTrigger
              id="floor-select"
              className={`h-9 text-xs sm:text-sm ${
                floorError ? "border-destructive" : ""
              }`}
            >
              <SelectValue placeholder="Select a floor" />
            </SelectTrigger>
            <SelectContent>
              {selectedTower &&
                Object.keys(data[selectedTower]).map((floor) => (
                  <SelectItem
                    key={floor}
                    value={floor}
                    className="text-xs sm:text-sm"
                  >
                    {floor}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
};

export default TowerFloorSelector;
