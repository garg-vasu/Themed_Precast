import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Trash2,
  Play,
  Download,
  Copy,
  Layers,
  Box,
  Maximize2,
  Ruler,
  Scissors,
  LayoutGrid,
} from "lucide-react";
import { apiClient } from "@/utils/apiClient";
import ThreeDVisualizer from "./ThreeDVisualizer";

// Types
type StockSheet = { width: number; height: number; qty: number; name?: string };
type Panel = { width: number; height: number; qty: number };
type Placement = {
  id?: string | number;
  panel_id?: string | number;
  stock_id?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  depth?: number;
};
type Leftover = {
  stock_id?: number;
  x: number;
  y: number;
  width: number;
  height: number;
};
type CutLog = {
  index?: number;
  panel?: string;
  result?: string;
  length?: number;
  cut_axis?: string;
  StockID?: number;
  stock_id?: number;
  stockId?: number;
};
type UsedStockSheet = {
  used_area?: number;
  stock_sheet: { width: number; height: number };
};
type CuttingResponse = {
  placements?: Placement[];
  leftovers?: Leftover[];
  cuts?: CutLog[];
  used_stock_sheets?: UsedStockSheet[];
};
type Payload = {
  optimization_priority: string;
  cut_thickness: number;
  number_of_cuts: number;
  mode: "2d" | "3d";
  stock_sheets: StockSheet[];
  panels: Panel[];
};
type Sheet = { width: number; height: number; name?: string };
type SheetData = {
  placements: Placement[];
  leftovers: Leftover[];
  cuts: CutLog[];
};

// Helper functions
function getDefaultPayload(): Payload {
  return {
    optimization_priority: "least_wasted_area",
    cut_thickness: 1,
    number_of_cuts: 0,
    mode: "2d",
    stock_sheets: [{ width: 50, height: 20, qty: 3 }],
    panels: [
      { width: 10, height: 5, qty: 4 },
      { width: 20, height: 10, qty: 1 },
    ],
  };
}

function expandSheets(stockSheets: StockSheet[]): Sheet[] {
  const arr: Sheet[] = [];
  for (const s of stockSheets) {
    const qty = Math.max(1, s.qty || 1);
    for (let i = 0; i < qty; i++) {
      arr.push({ width: s.width, height: s.height, name: s.name || "" });
    }
  }
  return arr;
}

function computeScale(
  sheetW: number,
  sheetH: number,
  maxW: number = 800,
  maxH: number = 400
): number {
  const pad = 40;
  const sx = (maxW - pad) / (sheetW || 1);
  const sy = (maxH - pad) / (sheetH || 1);
  return Math.min(sx, sy, 15);
}

// 2D Visualizer Component
function Visualizer2D({
  sheet,
  placements,
  leftovers,
  highlight,
}: {
  sheet?: Sheet | null;
  placements: Placement[];
  leftovers: Leftover[];
  highlight: { type: "placement" | "leftover"; index: number } | null;
}) {
  if (!sheet) {
    return (
      <div className="flex items-center justify-center h-[350px] text-muted-foreground">
        <p>No sheet to preview</p>
      </div>
    );
  }

  const scale = computeScale(sheet.width, sheet.height, 800, 350);
  const toPx = (v: number) => v * scale + 20;
  const svgWidth = Math.max(300, Math.round(sheet.width * scale) + 48);
  const svgHeight = Math.max(200, Math.round(sheet.height * scale) + 48);

  return (
    <div className="w-full overflow-auto">
      <svg
        className="mx-auto"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ maxWidth: "100%", height: "auto", minHeight: "300px" }}
      >
        {/* Sheet background */}
        <rect
          x={12}
          y={12}
          width={toPx(sheet.width)}
          height={toPx(sheet.height)}
          rx={8}
          className="fill-card stroke-border"
          strokeWidth={2}
        />

        {/* Placements */}
        {placements.map((p, i) => {
          const x = toPx(p.x);
          const y = toPx(sheet.height - p.y - p.height);
          const w = p.width * scale;
          const h = p.height * scale;
          const isHighlighted =
            highlight?.type === "placement" && highlight.index === i;

          return (
            <g
              key={p.id || `${p.panel_id}-${i}`}
              transform={`translate(${x},${y})`}
            >
              <rect
                x={0}
                y={0}
                width={w}
                height={h}
                rx={4}
                className={`transition-all duration-200 ${
                  isHighlighted
                    ? "fill-primary stroke-primary-foreground"
                    : "fill-primary/80 stroke-primary-foreground/50"
                }`}
                strokeWidth={isHighlighted ? 2 : 1}
                style={{ opacity: isHighlighted ? 1 : 0.85 }}
              />
              <text
                x={w / 2}
                y={h / 2 + 4}
                textAnchor="middle"
                className="fill-primary-foreground text-xs font-medium"
                style={{ fontSize: Math.max(10, Math.min(14, w / 4)) }}
              >
                {p.panel_id}
              </text>
            </g>
          );
        })}

        {/* Leftovers */}
        {leftovers.map((l, i) => {
          const x = toPx(l.x);
          const y = toPx(sheet.height - l.y - l.height);
          const w = l.width * scale;
          const h = l.height * scale;
          const isHighlighted =
            highlight?.type === "leftover" && highlight.index === i;

          return (
            <g key={`lf-${i}`} transform={`translate(${x},${y})`}>
              <rect
                x={0}
                y={0}
                width={w}
                height={h}
                rx={4}
                className="fill-yellow-400/30 dark:fill-yellow-500/20"
                stroke="hsl(var(--chart-4))"
                strokeWidth={isHighlighted ? 2 : 1}
                strokeDasharray="4 2"
              />
              <text
                x={w / 2}
                y={h / 2 + 4}
                textAnchor="middle"
                className="fill-yellow-700 dark:fill-yellow-400 text-xs font-medium"
                style={{ fontSize: Math.max(9, Math.min(12, w / 5)) }}
              >
                {`${Math.round(l.width)}×${Math.round(l.height)}`}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// SVG Export function
function exportSVG(
  sheet: Sheet | undefined,
  placements: Placement[],
  leftovers: Leftover[],
  filename: string = "cutting_map.svg"
) {
  if (!sheet) return;

  const scale = computeScale(sheet.width, sheet.height, 1200, 1000);
  const margin = 20;
  const svgW = Math.round(sheet.width * scale + margin * 2);
  const svgH = Math.round(sheet.height * scale + margin * 2);

  const rectToSvg = (
    x: number,
    y: number,
    w: number,
    h: number,
    attrs: string
  ) => {
    const sx = margin + x * scale;
    const sy = margin + (sheet.height - y - h) * scale;
    return `<rect x="${sx}" y="${sy}" width="${w * scale}" height="${
      h * scale
    }" ${attrs}/>`;
  };

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
  <rect x="0" y="0" width="${svgW}" height="${svgH}" fill="#ffffff"/>
  <g id="sheet">`;

  svg += rectToSvg(
    0,
    0,
    sheet.width,
    sheet.height,
    `fill="#fff" stroke="#333" stroke-width="1"`
  );

  placements.forEach((p) => {
    svg += rectToSvg(
      p.x,
      p.y,
      p.width,
      p.height,
      `fill="#3b82f6" stroke="#1e40af" stroke-width="0.6" opacity="0.9"`
    );
    svg += `<text x="${margin + (p.x + p.width / 2) * scale}" y="${
      margin + (sheet.height - (p.y + p.height / 2)) * scale + 4
    }" font-size="${Math.max(
      10,
      scale * 0.6
    )}" fill="#fff" text-anchor="middle">${p.panel_id}</text>`;
  });

  leftovers.forEach((l) => {
    svg += rectToSvg(
      l.x,
      l.y,
      l.width,
      l.height,
      `fill="#fde68a" stroke="#b45309" stroke-dasharray="4 3" opacity="0.9"`
    );
  });

  svg += `</g></svg>`;

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CuttingStockCalculator() {
  const [payload, setPayload] = useState<Payload>(getDefaultPayload());
  const [response, setResponse] = useState<CuttingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const [highlight, setHighlight] = useState<{
    type: "placement" | "leftover";
    index: number;
  } | null>(null);

  // Payload update helpers
  const updateField = useCallback(
    (field: keyof Payload, value: number | string) => {
      setPayload((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const addStockSheet = useCallback(() => {
    setPayload((prev) => ({
      ...prev,
      stock_sheets: [...prev.stock_sheets, { width: 100, height: 50, qty: 1 }],
    }));
  }, []);

  const removeStockSheet = useCallback((idx: number) => {
    setPayload((prev) => ({
      ...prev,
      stock_sheets: prev.stock_sheets.filter((_, i) => i !== idx),
    }));
  }, []);

  const updateStockSheet = useCallback(
    (idx: number, key: keyof StockSheet, value: string | number) => {
      setPayload((prev) => {
        const updated = [...prev.stock_sheets];
        if (key === "name") {
          updated[idx] = { ...updated[idx], [key]: String(value) };
        } else {
          updated[idx] = { ...updated[idx], [key]: Number(value) };
        }
        return { ...prev, stock_sheets: updated };
      });
    },
    []
  );

  const addPanel = useCallback(() => {
    setPayload((prev) => ({
      ...prev,
      panels: [...prev.panels, { width: 10, height: 5, qty: 1 }],
    }));
  }, []);

  const removePanel = useCallback((idx: number) => {
    setPayload((prev) => ({
      ...prev,
      panels: prev.panels.filter((_, i) => i !== idx),
    }));
  }, []);

  const updatePanel = useCallback(
    (idx: number, key: keyof Panel, value: string | number) => {
      setPayload((prev) => {
        const updated = [...prev.panels];
        updated[idx] = { ...updated[idx], [key]: Number(value) };
        return { ...prev, panels: updated };
      });
    },
    []
  );

  // API call
  const runOptimizer = useCallback(async () => {
    setLoading(true);
    setResponse(null);
    setHighlight(null);

    try {
      const res = await apiClient.post<CuttingResponse>("/solve", payload);
      setResponse(res.data);
      toast.success("Optimization completed successfully!");

      const expanded = expandSheets(payload.stock_sheets);
      if (selectedSheetIndex >= expanded.length) {
        setSelectedSheetIndex(0);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to run optimization";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [payload, selectedSheetIndex]);

  // Derived data
  const sheetsExpanded = useMemo(
    () => expandSheets(payload.stock_sheets),
    [payload.stock_sheets]
  );

  const sheetsData = useMemo(() => {
    const N = Math.max(1, sheetsExpanded.length);
    const arr: SheetData[] = Array.from({ length: N }, () => ({
      placements: [],
      leftovers: [],
      cuts: [],
    }));

    if (!response) return { arr, totalSheets: N };

    // Process placements
    if (Array.isArray(response.placements) && response.placements.length > 0) {
      for (const p of response.placements) {
        const sid = Math.max(1, p.stock_id || 1);
        const idx = Math.min(N - 1, sid - 1);
        arr[idx].placements.push(p);
      }
    }

    // Process leftovers
    if (Array.isArray(response.leftovers) && response.leftovers.length > 0) {
      for (const lf of response.leftovers) {
        const sid = Math.max(1, lf.stock_id || 1);
        const idx = Math.min(N - 1, sid - 1);
        arr[idx].leftovers.push(lf);
      }
    }

    // Process cuts
    if (Array.isArray(response.cuts) && response.cuts.length > 0) {
      for (const c of response.cuts) {
        const sid = Math.max(1, c.StockID || c.stock_id || c.stockId || 1);
        const idx = Math.min(N - 1, sid - 1);
        arr[idx].cuts.push(c);
      }
    }

    return { arr, totalSheets: N };
  }, [response, sheetsExpanded]);

  const sheetOptions = useMemo(() => {
    return sheetsExpanded.map((sheet, i) => ({
      label: sheet.name?.trim() || `Sheet ${i + 1}`,
      value: String(i),
      dimensions: `${sheet.width} × ${sheet.height}`,
    }));
  }, [sheetsExpanded]);

  const currentSheetIndex = Math.max(
    0,
    Math.min(sheetsData.totalSheets - 1, selectedSheetIndex)
  );
  const currentSheet = sheetsExpanded[currentSheetIndex] || {
    width: 50,
    height: 20,
  };
  const currentSheetData = sheetsData.arr[currentSheetIndex] || {
    placements: [],
    leftovers: [],
    cuts: [],
  };
  const currentSheetLabel =
    sheetOptions[currentSheetIndex]?.label || `Sheet ${currentSheetIndex + 1}`;

  // Stats
  const totalPanels = payload.panels.reduce((sum, p) => sum + p.qty, 0);
  const totalPlacedPanels = response?.placements?.length || 0;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Scissors className="h-6 w-6 text-primary" />
            Cutting Stock Calculator
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Optimize material usage with intelligent panel placement
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="default"
            onClick={runOptimizer}
            disabled={loading}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            {loading ? "Running..." : "Run Optimizer"}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              exportSVG(
                currentSheet,
                currentSheetData.placements,
                currentSheetData.leftovers
              )
            }
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export SVG
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
              toast.success("Copied to clipboard!");
            }}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy JSON
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sheetsExpanded.length}</p>
                <p className="text-xs text-muted-foreground">Total Sheets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-1/10">
                <Box className="h-5 w-5 text-chart-1" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPanels}</p>
                <p className="text-xs text-muted-foreground">Total Panels</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-2/10">
                <LayoutGrid className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPlacedPanels}</p>
                <p className="text-xs text-muted-foreground">Placed Panels</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-4/10">
                <Maximize2 className="h-5 w-5 text-chart-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {currentSheetData.leftovers.length}
                </p>
                <p className="text-xs text-muted-foreground">Leftover Areas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Sidebar - Input Configuration */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Ruler className="h-5 w-5 text-primary" />
                Configuration
              </CardTitle>
              <CardDescription>Set cutting parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="cut-thickness">Cut Thickness</Label>
                  <Input
                    id="cut-thickness"
                    type="number"
                    value={payload.cut_thickness}
                    onChange={(e) =>
                      updateField("cut_thickness", Number(e.target.value))
                    }
                    min={0}
                    step={0.1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="num-cuts">Max Cuts (0 = ∞)</Label>
                  <Input
                    id="num-cuts"
                    type="number"
                    value={payload.number_of_cuts}
                    onChange={(e) =>
                      updateField("number_of_cuts", Number(e.target.value))
                    }
                    min={0}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  Stock Sheets
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addStockSheet}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-3">
                  {payload.stock_sheets.map((sheet, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                    >
                      <div className="grid grid-cols-3 gap-2 flex-1">
                        <Input
                          type="number"
                          placeholder="W"
                          value={sheet.width}
                          onChange={(e) =>
                            updateStockSheet(idx, "width", e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                        <Input
                          type="number"
                          placeholder="H"
                          value={sheet.height}
                          onChange={(e) =>
                            updateStockSheet(idx, "height", e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={sheet.qty}
                          onChange={(e) =>
                            updateStockSheet(idx, "qty", e.target.value)
                          }
                          className="h-8 text-sm"
                          min={1}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeStockSheet(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {payload.stock_sheets.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No stock sheets added
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Box className="h-5 w-5 text-primary" />
                  Panels
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addPanel}
                  className="gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-3">
                  {payload.panels.map((panel, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                    >
                      <div className="grid grid-cols-3 gap-2 flex-1">
                        <Input
                          type="number"
                          placeholder="W"
                          value={panel.width}
                          onChange={(e) =>
                            updatePanel(idx, "width", e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                        <Input
                          type="number"
                          placeholder="H"
                          value={panel.height}
                          onChange={(e) =>
                            updatePanel(idx, "height", e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={panel.qty}
                          onChange={(e) =>
                            updatePanel(idx, "qty", e.target.value)
                          }
                          className="h-8 text-sm"
                          min={1}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removePanel(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {payload.panels.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No panels added
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Content - Visualization & Results */}
        <div className="lg:col-span-8 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">Preview</CardTitle>
                  <Tabs
                    value={viewMode}
                    onValueChange={(v) => setViewMode(v as "2d" | "3d")}
                  >
                    <TabsList className="h-8">
                      <TabsTrigger value="2d" className="text-xs px-3">
                        2D
                      </TabsTrigger>
                      <TabsTrigger value="3d" className="text-xs px-3">
                        3D
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={String(currentSheetIndex)}
                    onValueChange={(v) => {
                      setSelectedSheetIndex(Number(v));
                      setHighlight(null);
                    }}
                  >
                    <SelectTrigger className="w-[180px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sheetOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex flex-col">
                            <span>{opt.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {opt.dimensions}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {currentSheet.width} × {currentSheet.height}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {currentSheetData.placements.length} panels
                </Badge>
                {currentSheetData.leftovers.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30"
                  >
                    {currentSheetData.leftovers.length} leftovers
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-gradient-to-b from-background to-muted/20 overflow-hidden">
                {viewMode === "2d" ? (
                  <Visualizer2D
                    sheet={currentSheet}
                    placements={currentSheetData.placements}
                    leftovers={currentSheetData.leftovers}
                    highlight={highlight}
                  />
                ) : (
                  <ThreeDVisualizer
                    sheet={currentSheet}
                    placements={currentSheetData.placements}
                    leftovers={currentSheetData.leftovers}
                    highlight={highlight}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results Tabs */}
          <Card>
            <Tabs defaultValue="cuts">
              <CardHeader className="pb-0">
                <TabsList>
                  <TabsTrigger value="cuts" className="gap-1">
                    <Scissors className="h-4 w-4" />
                    Cut Log
                  </TabsTrigger>
                  <TabsTrigger value="leftovers" className="gap-1">
                    <Maximize2 className="h-4 w-4" />
                    Leftovers
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="pt-4">
                <TabsContent value="cuts" className="m-0">
                  {currentSheetData.cuts.length > 0 ? (
                    <ScrollArea className="h-[250px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Panel</TableHead>
                            <TableHead>Result</TableHead>
                            <TableHead className="text-right">Length</TableHead>
                            <TableHead className="text-right">Axis</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentSheetData.cuts.map((cut, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">
                                {cut.index || i + 1}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{cut.panel}</Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {cut.result}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {cut.length}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="secondary">
                                  {cut.cut_axis}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Scissors className="h-10 w-10 mb-2 opacity-50" />
                      <p className="text-sm">No cuts recorded for this sheet</p>
                      <p className="text-xs">
                        Run the optimizer to generate cuts
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="leftovers" className="m-0">
                  {currentSheetData.leftovers.length > 0 ? (
                    <ScrollArea className="h-[250px]">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {currentSheetData.leftovers.map((leftover, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-lg border bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800/30"
                          >
                            <div>
                              <p className="font-semibold text-yellow-800 dark:text-yellow-400">
                                {Math.round(leftover.width)} ×{" "}
                                {Math.round(leftover.height)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                @ ({leftover.x.toFixed(1)},{" "}
                                {leftover.y.toFixed(1)})
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setHighlight({ type: "leftover", index: i })
                              }
                              className="text-xs"
                            >
                              Highlight
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Maximize2 className="h-10 w-10 mb-2 opacity-50" />
                      <p className="text-sm">
                        No leftover areas for this sheet
                      </p>
                      <p className="text-xs">
                        Full material utilization achieved!
                      </p>
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
