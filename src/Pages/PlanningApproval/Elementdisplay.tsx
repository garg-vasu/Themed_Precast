type Item = {
  element_id: number;
  element_name: string;
  element_type: string;
  element_type_name: string;
  floor_name: string;
  tower_name: string;
  volume: number;
  mass: number;
};

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ItemDialogProps = {
  items: Item[];
  onClose?: () => void;
};

export default function Elementdisplay({ items }: ItemDialogProps) {
  const totalMass = items.reduce((sum, item) => sum + (item.mass || 0), 0);
  const totalVolume = items.reduce((sum, item) => sum + (item.volume || 0), 0);

  return (
    <div className="w-full h-full overflow-y-auto border rounded-md min-h-0">
      <Table>
        <TableCaption>Items in this dispatch order</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Element Name</TableHead>
            <TableHead>Element Type Name</TableHead>
            <TableHead>Element Type</TableHead>
            <TableHead>Floor</TableHead>
            <TableHead>Tower</TableHead>
            <TableHead className="text-right">Volume (m³)</TableHead>
            <TableHead className="text-right">Mass (kg)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items && items.length > 0 ? (
            items.map((item: Item) => (
              <TableRow key={item.element_id}>
                <TableCell className="font-medium">
                  {item.element_name || "—"}
                </TableCell>
                <TableCell>
                  {item.element_type_name || "—"}
                </TableCell>
                <TableCell>{item.element_type || "—"}</TableCell>
                <TableCell>{item.floor_name || "—"}</TableCell>
                <TableCell>{item.tower_name || "—"}</TableCell>
                <TableCell className="text-right">
                  {item.volume ? `${item.volume}` : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {item.mass ? `${item.mass} kg` : "—"}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground">
                No items found
              </TableCell>
            </TableRow>
          )}
          {items && items.length > 0 && (
            <TableRow className="font-semibold">
              <TableCell colSpan={5}>Total</TableCell>
              <TableCell className="text-right">
                {totalVolume.toFixed(2)} m³
              </TableCell>
              <TableCell className="text-right">{totalMass} kg</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
