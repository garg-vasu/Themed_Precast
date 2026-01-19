import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type DrawingRevision = {
  version: string;
  drawing_type_id: number;
  drawing_type_name: string;
  comments: string;
  file: string;
  drawing_revision_id: number;
  // Add more fields (like created_at) here if your API returns them
};

type FileDetailModalProps = {
  drawing_id: number;
  current_version: string;
  drawing_type_id: number;
  drawing_type_name: string;
  comments: string;
  file: string;
  drawingsRevision: DrawingRevision[];
};

export function DrawingFileModal({
  file,
  drawingsRevision,
  drawing_id,
  current_version,
  drawing_type_id,
  drawing_type_name,
  comments,
}: FileDetailModalProps) {
  return (
    <div className="w-full max-h-80 overflow-y-auto pr-1">
      <Table>
        <TableCaption>
          Current version and list of previous versions for drawing #
          {drawing_id}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Version</TableHead>
            <TableHead>Comments</TableHead>
            <TableHead>File</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Current version row (visually separated) */}
          <TableRow className="bg-muted/60">
            <TableCell className="font-semibold">
              {current_version}{" "}
              <span className="text-xs text-muted-foreground">(Current)</span>
            </TableCell>
            <TableCell>{comments || "-"}</TableCell>
            <TableCell className="text-blue-600 underline">
              {file || "-"}
            </TableCell>
          </TableRow>

          {/* Previous versions */}
          {drawingsRevision && drawingsRevision.length > 0 ? (
            drawingsRevision.map((rev) => (
              <TableRow key={rev.drawing_revision_id}>
                <TableCell className="font-medium">{rev.version}</TableCell>
                <TableCell>{rev.comments || "-"}</TableCell>
                <TableCell className="text-blue-600 underline">
                  {rev.file || "-"}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={3}
                className="text-center text-sm text-muted-foreground"
              >
                No previous versions available.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
