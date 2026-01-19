import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base md:text-lg">
          Step 1 · Choose tower & floor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasAnyData && (
          <Alert variant="destructive">
            <AlertDescription>
              No towers or floors are available for this project.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="tower-select"
                className="text-sm font-medium text-muted-foreground"
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
                className={towerError ? "border-destructive" : ""}
              >
                <SelectValue placeholder="Select a tower" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(data).map((tower) => (
                  <SelectItem key={tower} value={tower}>
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
                className="text-sm font-medium text-muted-foreground"
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
                className={floorError ? "border-destructive" : ""}
              >
                <SelectValue placeholder="Select a floor" />
              </SelectTrigger>
              <SelectContent>
                {selectedTower &&
                  Object.keys(data[selectedTower]).map((floor) => (
                    <SelectItem key={floor} value={floor}>
                      {floor}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TowerFloorSelector;
