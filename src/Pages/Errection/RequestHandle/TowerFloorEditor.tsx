import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { apiClient } from "@/utils/apiClient";
import TowerFloorSelector from "./TowerFloorSelector";

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export interface ElementType {
  total_quantity: number;
  floor_id: number;
  element_type: string;
  balance_elements: number;
  disable: boolean;
  element_type_id: number;
  element_type_name: string;
}

export interface SelectedItemData {
  item: ElementType;
  chosenQuantity: number;
  error?: string;
}

export interface SelectionRow {
  id: number;
  category: string;
  selectedItems: SelectedItemData[];
}

export interface OnSavePayload {
  tower: string;
  floor: string;
  selections: SelectionRow[];
}

export interface OnNewSave {
  [floorId: number]: {
    element_type_id: number;
    quantity: number;
  }[];
}

interface Data {
  [tower: string]: {
    [floor: string]: {
      [category: string]: ElementType[];
    };
  };
}

interface TowerFloorEditorProps {
  onSave: (allBlocks: {
    [floorId: number]: { element_type_id: number; quantity: number }[];
  }) => void;
}

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------

const TowerFloorEditor: React.FC<TowerFloorEditorProps> = ({ onSave }) => {
  const { projectId } = useParams<{ projectId: string }>();

  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showBlockErrors, setShowBlockErrors] = useState(false);

  // All blocks created by the user; each block contains tower, floor, and rows.
  const [blocks, setBlocks] = useState<OnSavePayload[]>([
    {
      tower: "",
      floor: "",
      selections: [{ id: Date.now(), category: "", selectedItems: [] }],
    },
  ]);

  // Index of the block currently being edited.
  const [activeIndex, setActiveIndex] = useState(0);

  // ----------------------------------------------------------------
  // Transform API Data
  // ----------------------------------------------------------------
  const transformData = (rawData: any): Data => {
    const result: Data = {};
    for (const tower in rawData) {
      result[tower] = {};
      for (const floor in rawData[tower]) {
        result[tower][floor] = {};
        for (const category in rawData[tower][floor]) {
          const item = rawData[tower][floor][category];
          // Map API field names to our expected fields.
          result[tower][floor][category] = [
            {
              element_type_id: item.element_type_id,
              element_type_name: item.element_type_name,
              total_quantity: item.Balance_elements + item["left _elements"],
              floor_id: item.floor_id,
              balance_elements: item.Balance_elements,
              element_type: item.element_type,
              disable: item.disable,
            },
          ];
        }
      }
    }
    return result;
  };

  // ----------------------------------------------------------------
  // Fetch Data
  // ----------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/stockyard_item/${projectId}`);
        // Transform the raw API response to our expected data format.
        const transformed = transformData(response.data);
        setData(transformed);
        setGlobalError(null);
      } catch (err) {
        setGlobalError("Error fetching data. Please try again later.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------
  const currentBlock = blocks[activeIndex];

  // Get total allocated for an item across all blocks.
  const getTotalAllocatedForItem = (elementTypeId: number): number => {
    let sum = 0;
    for (const block of blocks) {
      for (const row of block.selections) {
        for (const sel of row.selectedItems) {
          if (sel.item.element_type_id === elementTypeId) {
            sum += sel.chosenQuantity;
          }
        }
      }
    }
    return sum;
  };

  // ----------------------------------------------------------------
  // Block Removal Handler
  // ----------------------------------------------------------------
  const removeBlock = (blockIndex: number) => {
    // If only one block exists, reset it instead of removing.
    if (blocks.length === 1) {
      handleReset();
      return;
    }
    setBlocks((prev) => {
      const newBlocks = prev.filter((_, i) => i !== blockIndex);
      let newActiveIndex = activeIndex;
      if (blockIndex === activeIndex) {
        // If the active block is removed, set active to first block.
        newActiveIndex = 0;
      } else if (blockIndex < activeIndex) {
        // Adjust active index if a block before the active one was removed.
        newActiveIndex = activeIndex - 1;
      }
      setActiveIndex(newActiveIndex);
      return newBlocks;
    });
  };

  // ----------------------------------------------------------------
  // "Add More" new block via dropdown selection
  // ----------------------------------------------------------------
  const handleAddMoreOption = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const option = e.target.value;
    let newBlock: OnSavePayload;
    if (option === "keep-tower-floor") {
      newBlock = {
        tower: currentBlock.tower,
        floor: currentBlock.floor,
        selections: [{ id: Date.now(), category: "", selectedItems: [] }],
      };
    } else if (option === "keep-tower-change-floor") {
      newBlock = {
        tower: currentBlock.tower,
        floor: "",
        selections: [{ id: Date.now(), category: "", selectedItems: [] }],
      };
    } else if (option === "change-both") {
      newBlock = {
        tower: "",
        floor: "",
        selections: [{ id: Date.now(), category: "", selectedItems: [] }],
      };
    } else {
      return;
    }
    setBlocks((prev) => {
      const newBlocks = [...prev, newBlock];
      setActiveIndex(newBlocks.length - 1);
      return newBlocks;
    });
    // Reset the select value
    e.target.value = "";
  };

  // ----------------------------------------------------------------
  // Handlers for updating tower/floor in the active block.
  // ----------------------------------------------------------------
  const handleSelectTower = (tower: string) => {
    // If user changes tower, reset floor and selections.
    const updated = {
      ...currentBlock,
      tower,
      floor: "",
      selections: [{ id: Date.now(), category: "", selectedItems: [] }],
    };
    updateBlockAtIndex(activeIndex, updated);
  };

  const handleSelectFloor = (floor: string) => {
    // When floor is selected, load one default row.
    const updated = {
      ...currentBlock,
      floor,
      selections: [{ id: Date.now(), category: "", selectedItems: [] }],
    };
    updateBlockAtIndex(activeIndex, updated);
  };

  // ----------------------------------------------------------------
  // Handlers for active block's rows (category, items, quantity).
  // ----------------------------------------------------------------
  const handleCategoryChange = (rowId: number, category: string) => {
    const newRows = currentBlock.selections.map((row) =>
      row.id === rowId ? { ...row, category, selectedItems: [] } : row
    );
    updateBlockAtIndex(activeIndex, { ...currentBlock, selections: newRows });
  };

  const toggleItemSelection = (rowId: number, item: ElementType) => {
    const newRows = currentBlock.selections.map((row) => {
      if (row.id === rowId) {
        const exists = row.selectedItems.find(
          (sel) => sel.item.element_type_id === item.element_type_id
        );
        if (exists) {
          return {
            ...row,
            selectedItems: row.selectedItems.filter(
              (sel) => sel.item.element_type_id !== item.element_type_id
            ),
          };
        } else {
          const allocatedSoFar = getTotalAllocatedForItem(item.element_type_id);
          const available = item.balance_elements - allocatedSoFar;
          if (available <= 0) return row;
          return {
            ...row,
            selectedItems: [
              ...row.selectedItems,
              { item, chosenQuantity: 0, error: "" },
            ],
          };
        }
      }
      return row;
    });
    updateBlockAtIndex(activeIndex, { ...currentBlock, selections: newRows });
  };

  const handleQuantityChange = (
    rowId: number,
    itemIndex: number,
    newQuantityStr: string
  ) => {
    const newQuantity = newQuantityStr === "" ? 0 : Number(newQuantityStr);
    const newRows = currentBlock.selections.map((row) => {
      if (row.id === rowId) {
        const updatedSelected = row.selectedItems.map((sel, idx) => {
          if (idx === itemIndex) {
            let errorMsg = "";
            if (newQuantity < 0) {
              errorMsg = "Quantity cannot be negative.";
              return { ...sel, error: errorMsg };
            }
            // Calculate allocated so far for this element type, excluding this row's current quantity
            const allocatedSoFar =
              getTotalAllocatedForItem(sel.item.element_type_id) -
              sel.chosenQuantity;
            // Validation: newQuantity + allocatedSoFar should not exceed total_quantity (Balance_elements)
            if (newQuantity + allocatedSoFar > sel.item.balance_elements) {
              errorMsg = "Quantity exceeds available amount.";
              return { ...sel, error: errorMsg };
            }
            return { ...sel, chosenQuantity: newQuantity, error: "" };
          }
          return sel;
        });
        return { ...row, selectedItems: updatedSelected };
      }
      return row;
    });
    updateBlockAtIndex(activeIndex, { ...currentBlock, selections: newRows });
  };

  const removeRow = (rowId: number) => {
    const newRows = currentBlock.selections.filter((row) => row.id !== rowId);
    if (newRows.length === 0) {
      newRows.push({ id: Date.now(), category: "", selectedItems: [] });
    }
    updateBlockAtIndex(activeIndex, { ...currentBlock, selections: newRows });
  };

  const addRow = () => {
    const newRow: SelectionRow = {
      id: Date.now(),
      category: "",
      selectedItems: [],
    };
    updateBlockAtIndex(activeIndex, {
      ...currentBlock,
      selections: [...currentBlock.selections, newRow],
    });
  };

  const handleReset = () => {
    setBlocks([
      {
        tower: "",
        floor: "",
        selections: [{ id: Date.now(), category: "", selectedItems: [] }],
      },
    ]);
    setActiveIndex(0);
  };

  function updateBlockAtIndex(idx: number, newBlock: OnSavePayload) {
    setBlocks((prev) => {
      const copy = [...prev];
      copy[idx] = newBlock;
      return copy;
    });
  }

  // ----------------------------------------------------------------
  // Handle Submit & Transform Data for Output
  // ----------------------------------------------------------------
  const handleSubmitAll = () => {
    setShowBlockErrors(true);

    // Validate that we have at least one selection with positive quantity
    const hasAtLeastOneLine = blocks.some((block) =>
      block.selections.some((row) =>
        row.selectedItems.some((sel) => sel.chosenQuantity > 0)
      )
    );

    const hasErrors = blocks.some((block) =>
      block.selections.some((row) =>
        row.selectedItems.some((sel) => sel.error && sel.error.trim() !== "")
      )
    );

    const hasMissingTowerFloor = blocks.some(
      (block) => !block.tower || !block.floor
    );

    if (hasMissingTowerFloor || hasErrors || !hasAtLeastOneLine) {
      return;
    }

    // Transform the data into the expected format for API
    const output: {
      [floorId: number]: { element_type_id: number; quantity: number }[];
    } = {};

    blocks.forEach((block) => {
      block.selections.forEach((row) => {
        row.selectedItems.forEach((sel) => {
          const floorId = Number(sel.item.floor_id);
          if (!output[floorId]) output[floorId] = [];
          // Check if this element_type_id already exists for this floor
          const existing = output[floorId].find(
            (e) => e.element_type_id === sel.item.element_type_id
          );
          if (existing) {
            existing.quantity += sel.chosenQuantity;
          } else {
            output[floorId].push({
              element_type_id: sel.item.element_type_id,
              quantity: sel.chosenQuantity,
            });
          }
        });
      });
    });

    onSave(output);
  };

  // ----------------------------------------------------------------
  // Rendering
  // ----------------------------------------------------------------
  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Loading available stockyard items...
        </CardContent>
      </Card>
    );
  }
  if (globalError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{globalError}</AlertDescription>
      </Alert>
    );
  }
  if (!data) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No data available.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      {!data || Object.keys(data).length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No data available.
          </CardContent>
        </Card>
      ) : (
        <>
          {blocks.map((block, blockIndex) => {
            const isActive = blockIndex === activeIndex;
            const hasSelections = block.selections.some((row) =>
              row.selectedItems.some((sel) => sel.chosenQuantity > 0)
            );
            return (
              <Card key={blockIndex} className="relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div className="space-y-0.5">
                    <CardTitle className="text-sm font-medium">
                      Block {blockIndex + 1}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Map elements from stockyard to a specific floor.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveIndex(blockIndex)}
                      >
                        Edit
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => removeBlock(blockIndex)}
                      aria-label="Remove block"
                    >
                      ×
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  {isActive ? (
                    <>
                      <TowerFloorSelector
                        data={data}
                        selectedTower={block.tower}
                        selectedFloor={block.floor}
                        onSelectTower={handleSelectTower}
                        onSelectFloor={handleSelectFloor}
                        showErrors={showBlockErrors}
                      />
                      {block.tower && block.floor && (
                        <>
                          <Card className="border-dashed">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm font-medium">
                                Step 2 · Choose categories & elements
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-0">
                              {block.selections.map((row, rowIndex) => (
                                <div
                                  key={row.id}
                                  className="rounded-md border bg-muted/40 p-3 space-y-3"
                                >
                                  <div className="flex flex-wrap items-end gap-3">
                                    <div className="flex-1 min-w-[180px]">
                                      <Label className="text-xs font-medium text-muted-foreground">
                                        Category
                                      </Label>
                                      <Select
                                        value={row.category}
                                        onValueChange={(value) =>
                                          handleCategoryChange(row.id, value)
                                        }
                                      >
                                        <SelectTrigger className="w-full h-9">
                                          <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {Object.keys(
                                            data[block.tower][block.floor]
                                          )
                                            // Filter out categories already selected in other rows of this block
                                            .filter(
                                              (cat) =>
                                                !block.selections.some(
                                                  (r) =>
                                                    r.category === cat &&
                                                    r.id !== row.id
                                                )
                                            )
                                            .map((cat) => {
                                              let items =
                                                data[block.tower][block.floor][
                                                  cat
                                                ] || [];
                                              if (!Array.isArray(items)) {
                                                items = Object.values(items);
                                              }
                                              // Calculate total allocated for all items in this category
                                              let allocated = 0;
                                              items.forEach((it) => {
                                                allocated +=
                                                  getTotalAllocatedForItem(
                                                    it.element_type_id
                                                  );
                                              });
                                              // Available is balance_elements minus allocated for all items
                                              const available =
                                                items[0]?.balance_elements -
                                                allocated;
                                              return (
                                                <SelectItem
                                                  key={cat}
                                                  value={cat}
                                                  disabled={available <= 0}
                                                >
                                                  {cat} (
                                                  {items[0]?.balance_elements}/
                                                  {items[0]?.total_quantity})
                                                </SelectItem>
                                              );
                                            })}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="flex-1 min-w-[180px]">
                                      {row.category && (
                                        <div className="space-y-1">
                                          <Label className="text-xs font-medium text-muted-foreground">
                                            Elements
                                          </Label>
                                          <Popover>
                                            <PopoverTrigger asChild>
                                              <Button
                                                variant="outline"
                                                className="w-full justify-between h-9"
                                              >
                                                <span className="truncate">
                                                  {row.selectedItems.length ===
                                                  0
                                                    ? "Select elements"
                                                    : `${row.selectedItems.length} element(s) selected`}
                                                </span>
                                              </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-72 p-0">
                                              <ScrollArea className="h-56 p-2">
                                                <div className="space-y-2">
                                                  {(() => {
                                                    let itemsForCategory =
                                                      data[block.tower][
                                                        block.floor
                                                      ][row.category] || [];
                                                    if (
                                                      !Array.isArray(
                                                        itemsForCategory
                                                      )
                                                    ) {
                                                      itemsForCategory =
                                                        Object.values(
                                                          itemsForCategory
                                                        );
                                                    }
                                                    return itemsForCategory.map(
                                                      (item) => {
                                                        const globalAvail =
                                                          item.balance_elements -
                                                          getTotalAllocatedForItem(
                                                            item.element_type_id
                                                          );
                                                        const isChecked =
                                                          row.selectedItems.some(
                                                            (sel) =>
                                                              sel.item
                                                                .element_type_id ===
                                                              item.element_type_id
                                                          );
                                                        return (
                                                          <button
                                                            key={
                                                              item.element_type_id
                                                            }
                                                            type="button"
                                                            onClick={() =>
                                                              toggleItemSelection(
                                                                row.id,
                                                                item
                                                              )
                                                            }
                                                            disabled={
                                                              globalAvail <=
                                                                0 && !isChecked
                                                            }
                                                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted/80 disabled:opacity-60"
                                                          >
                                                            <Checkbox
                                                              checked={
                                                                isChecked
                                                              }
                                                              onCheckedChange={() =>
                                                                toggleItemSelection(
                                                                  row.id,
                                                                  item
                                                                )
                                                              }
                                                              disabled={
                                                                globalAvail <=
                                                                  0 &&
                                                                !isChecked
                                                              }
                                                            />
                                                            <div className="flex flex-col">
                                                              <span className="font-medium">
                                                                {
                                                                  item.element_type_name
                                                                }
                                                              </span>
                                                              <span className="text-[10px] text-muted-foreground">
                                                                Available:{" "}
                                                                {globalAvail}/
                                                                {
                                                                  item.total_quantity
                                                                }
                                                              </span>
                                                            </div>
                                                          </button>
                                                        );
                                                      }
                                                    );
                                                  })()}
                                                </div>
                                              </ScrollArea>
                                            </PopoverContent>
                                          </Popover>
                                        </div>
                                      )}
                                    </div>

                                    {rowIndex > 0 && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive"
                                        onClick={() => removeRow(row.id)}
                                        aria-label="Remove row"
                                      >
                                        ×
                                      </Button>
                                    )}
                                  </div>

                                  {row.selectedItems.length > 0 && (
                                    <div className="w-full pt-2">
                                      <div className="flex flex-col w-full gap-2">
                                        {row.selectedItems.map(
                                          (sel, itemIndex) => (
                                            <div
                                              key={sel.item.element_type_id}
                                              className="w-full flex flex-wrap lg:flex-nowrap items-center gap-3 rounded-md border bg-background px-3 py-2"
                                            >
                                              <div className="flex flex-col w-full lg:w-auto">
                                                <span className="text-[11px] text-muted-foreground">
                                                  Element
                                                </span>
                                                <span className="text-sm">
                                                  {sel.item.element_type_name}
                                                </span>
                                              </div>
                                              <div className="flex flex-col w-full lg:w-auto">
                                                <span className="text-[11px] text-muted-foreground">
                                                  Total
                                                </span>
                                                <span className="text-sm">
                                                  {sel.item.total_quantity}
                                                </span>
                                              </div>
                                              <div className="flex flex-col w-full lg:w-auto">
                                                <span className="text-[11px] text-muted-foreground">
                                                  Available
                                                </span>
                                                <span className="text-sm">
                                                  {sel.item.balance_elements}
                                                </span>
                                              </div>
                                              <div className="flex flex-col w-full lg:w-[160px]">
                                                <Label className="text-[11px] text-muted-foreground">
                                                  Quantity
                                                </Label>
                                                <Input
                                                  type="number"
                                                  value={
                                                    sel.chosenQuantity === 0
                                                      ? ""
                                                      : sel.chosenQuantity
                                                  }
                                                  min={0}
                                                  max={
                                                    sel.item.balance_elements
                                                  }
                                                  onChange={(e) =>
                                                    handleQuantityChange(
                                                      row.id,
                                                      itemIndex,
                                                      e.target.value
                                                    )
                                                  }
                                                  className="h-9"
                                                />
                                                {sel.error && (
                                                  <p className="text-[11px] text-destructive pt-1">
                                                    {sel.error}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                              <div className="flex justify-start">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={addRow}
                                >
                                  + Add category
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">Tower:</span>{" "}
                        {block.tower || "Not selected"}
                      </div>
                      <div>
                        <span className="font-medium">Floor:</span>{" "}
                        {block.floor || "Not selected"}
                      </div>
                      <div>
                        <span className="font-medium">Lines:</span>{" "}
                        {hasSelections ? "Configured" : "None"}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          <Card>
            <CardContent className="flex flex-col gap-3 pt-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Add another block
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      handleAddMoreOption({
                        target: { value },
                      } as React.ChangeEvent<HTMLSelectElement>)
                    }
                  >
                    <SelectTrigger className="h-9 w-[210px]">
                      <SelectValue placeholder="Choose how to duplicate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keep-tower-change-floor">
                        Keep tower, change floor
                      </SelectItem>
                      <SelectItem value="change-both">
                        Change tower & floor
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {showBlockErrors && (
                <Alert variant="destructive" className="text-xs">
                  <AlertDescription>
                    Please select tower & floor for each block, choose at least
                    one element with a positive quantity, and fix any quantity
                    errors.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap gap-2 justify-end pt-2 border-t mt-2">
                <Button variant="outline" onClick={handleReset} size="sm">
                  Reset
                </Button>
                <Button variant="default" onClick={handleSubmitAll} size="sm">
                  Submit request
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default TowerFloorEditor;
