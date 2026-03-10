type Item = {
  element_id: number;
  element_type: string;
  element_type_name: string;
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

  return (
    <div className="w-full">
      <Table>
        <TableCaption>Items in this dispatch order</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Element Type Name</TableHead>
            <TableHead>Element Type</TableHead>
            <TableHead className="text-right">Mass (kg)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items && items.length > 0 ? (
            items.map((item: Item) => (
              <TableRow key={item.element_id}>
                <TableCell className="font-medium">
                  {item.element_type_name || "—"}
                </TableCell>
                <TableCell>{item.element_type || "—"}</TableCell>
                <TableCell className="text-right">
                  {item.mass ? `${item.mass} kg` : "—"}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center text-muted-foreground">
                No items found
              </TableCell>
            </TableRow>
          )}
          {items && items.length > 0 && (
            <TableRow className="font-semibold">
              <TableCell colSpan={2}>Total Mass</TableCell>
              <TableCell className="text-right">{totalMass} kg</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
