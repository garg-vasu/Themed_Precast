export interface ElementType {
  floor_id: number;
  element_type: string;
  element_type_id: number;
  element_type_name: string;
  total_quantity: number;
  Balance_quantity: number;
}

export interface FloorData {
  [category: string]: ElementType[];
}

export interface TowerData {
  [floor: string]: FloorData;
}

export interface ApiResponse {
  [tower: string]: TowerData;
}

export interface SelectedItemData {
  item: ElementType;
  chosenQuantity: number;
  error?: string;
  stockyardId?: number | null;
}

export interface SelectionRow {
  id: number;
  category: string;
  selectedItems: SelectedItemData[];
}

export interface TowerSelection {
  tower: string;
  floor: string;
  selections: SelectionRow[];
}

export interface SelectedItem {
  element_type_id: number;
  element_type_name: string;
  quantity: number;
  stockyard_id: number | null;
  stockyard_name?: string; // optional display-only
  floor_id: number;
  floor_name?: string; // optional display-only
  compositeKey: `${number}-${number}`; // Format: "element_type_id-floor_id"
  billable: boolean; // Billable flag, default true
}
