import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingState } from "@/components/ui/loading-state";
import { apiClient } from "@/utils/apiClient";
// types.ts
export interface Revision {
  name: string;
  created_at: string;
  updated_at: string;
  version: string;
  file_path: string;
}

export interface Drawing {
  name: string;
  version: string;
  created_at: string;
  updated_at: string;
  file_path: string;

  revesion: Revision[];
}

export interface BOMItem {
  material_id: number;
  name: string;
  Quantity: number;
}

export interface Stage {
  stage_id: number;
  stage_name: string;
  quantity: number;
  qc: number;
  production: number;
}

export interface ElementTypeInterface {
  id: number;
  element_type: string;
  element_type_version: string;
  element_type_id: number;
  thickness: number;
  length: number;
  width: number;
  height: number;
  weight: number;
  total_quantity: number;
  DrawingType: Drawing[];
  BOM: BOMItem[];
  stages: Stage[];
}

const apiBaseUrl = import.meta.env.VITE_API_URL as string;

export default function Elementtypedetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const { elementtypeId, floorId } = useParams<{
    elementtypeId: string;
    floorId: string;
  }>();

  const [loading, setLoading] = useState(false);
  const [elementypeData, setElementypeData] = useState<ElementTypeInterface>();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDrawings, setExpandedDrawings] = useState<number[]>([]);

  const fetchElementtypeData = async () => {
    setLoading(true);
    const data = {
      element_type_id: Number(elementtypeId),
      target_location: Number(floorId),
      project_id: Number(projectId),
    };
    try {
      const response = await apiClient.post("/element_details", data);
      setElementypeData(response.data);
    } catch (error) {
      console.error("Error fetching element type data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElementtypeData();
  }, []);

  if (loading) {
    return (
      <div className="flex w-full flex-col">
        <PageHeader title="Element Type Details" />
        <LoadingState
          label="Loading element type details..."
          className="grow"
        />
      </div>
    );
  }

  if (!elementypeData) {
    return (
      <div className="flex w-full flex-col gap-2">
        <PageHeader title="Element Type Details" />
        <Card>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              No data available.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const toggleDrawing = (index: number) => {
    setExpandedDrawings((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const filteredBOM =
    elementypeData?.BOM?.filter(
      (bom) =>
        bom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bom.material_id.toString().includes(searchQuery)
    ) || [];

  return (
    <div className="flex w-full px-4 py-4 flex-col gap-2">
      <PageHeader title={`${elementypeData.element_type} details`} />

      {/* Basic Details */}
      <Card>
        <CardHeader>
          <CardTitle>Basic details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Element type</span>
              <span className="font-medium">{elementypeData.element_type}</span>
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">
                {elementypeData.element_type_version}
              </span>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Thickness</span>
              <span className="font-medium">{elementypeData.thickness} mm</span>
              <span className="text-muted-foreground">Length</span>
              <span className="font-medium">{elementypeData.length} mm</span>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Height</span>
              <span className="font-medium">{elementypeData.height} mm</span>
              <span className="text-muted-foreground">Weight</span>
              <span className="font-medium">{elementypeData.weight} kg</span>
              <span className="text-muted-foreground">Total quantity</span>
              <span className="font-medium">
                {elementypeData.total_quantity}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Production stages</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stage name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>QC</TableHead>
                <TableHead>Production</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {elementypeData.stages.map((stage) => (
                <TableRow key={stage.stage_id}>
                  <TableCell>{stage.stage_name}</TableCell>
                  <TableCell>{stage.quantity}</TableCell>
                  <TableCell>{stage.qc}</TableCell>
                  <TableCell>{stage.production}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* BOM Table with Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Bill of materials</CardTitle>
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name or ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material ID</TableHead>
                <TableHead>Material name</TableHead>
                <TableHead>Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBOM.map((bom, index) => (
                <TableRow key={index}>
                  <TableCell>{bom.material_id}</TableCell>
                  <TableCell>{bom.name}</TableCell>
                  <TableCell>{bom.Quantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Drawings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Drawings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Drawing type</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Revisions</TableHead>
                <TableHead>Created at</TableHead>
                <TableHead>Updated at</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {elementypeData.DrawingType.map((drawing, index) => (
                <>
                  <TableRow key={index}>
                    <TableCell>{drawing.name}</TableCell>
                    <TableCell>
                      <a
                        href={`${apiBaseUrl}/get-file?file=${encodeURIComponent(
                          drawing.file_path
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        View file
                      </a>
                    </TableCell>
                    <TableCell>{drawing.version}</TableCell>
                    <TableCell>
                      {drawing.revesion.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDrawing(index)}
                          className="flex items-center gap-1"
                        >
                          {expandedDrawings.includes(index) ? (
                            <>
                              <ChevronUp className="h-4 w-4" />
                              Hide revisions
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" />
                              Show revisions
                            </>
                          )}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(drawing.created_at).toLocaleDateString("en-GB")}
                    </TableCell>
                    <TableCell>
                      {new Date(drawing.updated_at).toLocaleDateString("en-GB")}
                    </TableCell>
                  </TableRow>
                  {expandedDrawings.includes(index) &&
                    drawing.revesion.map((revision, revIndex) => (
                      <TableRow key={`${index}-${revIndex}`}>
                        <TableCell className="text-muted-foreground">
                          Revision {revIndex + 1}
                        </TableCell>
                        <TableCell>
                          <a
                            href={`${apiBaseUrl}/get-file?file=${encodeURIComponent(
                              revision.file_path
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                          >
                            View file
                          </a>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {revision.version}
                        </TableCell>
                        <TableCell />
                        <TableCell />
                        <TableCell />
                      </TableRow>
                    ))}
                </>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
