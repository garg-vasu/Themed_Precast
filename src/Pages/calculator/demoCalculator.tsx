// src/App.jsx
import { useState, useMemo } from "react";
import "../../index.css";

import ThreeDVisualizer from "./ThreeDVisualizer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

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

/*
  Enhanced App:
  - multiple sheet support
  - sheet dropdown selector
  - cut-log table per sheet
  - shows leftovers (sheet remains)
  - uses exact placements/leftovers from backend if present, else fallback
*/
const baseUrl = import.meta.env.VITE_BASE_URL;
const apiUrl = `${baseUrl}/solve`;

function samplePayload(): Payload {
  return {
    optimization_priority: "least_wasted_area",
    cut_thickness: 1,
    number_of_cuts: 0,
    mode: "2d",
    stock_sheets: [
      { width: 50, height: 20, qty: 3 }, // sample: 3 identical sheets
    ],
    panels: [
      { width: 10, height: 5, qty: 4 },
      { width: 20, height: 10, qty: 1 },
    ],
  };
}

function computeScale(
  sheetW: number,
  sheetH: number,
  maxW: number = 900,
  maxH: number = 420
): number {
  const pad = 40;
  const sx = (maxW - pad) / (sheetW || 1);
  const sy = (maxH - pad) / (sheetH || 1);
  return Math.min(sx, sy, 15);
}

type VisualizerProps = {
  sheet?: Sheet | null;
  placements: Placement[];
  leftovers: Leftover[];
  highlight: { type: "placement" | "leftover"; index: number } | null;
};

/* 2D Visualizer that expects coords bottom-left (x,y) */
function Visualizer2D({
  sheet,
  placements,
  leftovers,
  highlight,
}: VisualizerProps) {
  if (!sheet) return <div className="kv">No sheet to preview</div>;
  const vw = 980;
  const vh = 420;
  const scale = computeScale(sheet.width, sheet.height, vw, vh);
  const toPx = (v: number) => v * scale + 20;

  return (
    <div className="visualizer">
      <svg
        className="sheet-svg"
        viewBox={`0 0 ${Math.max(
          300,
          Math.round(sheet.width * scale) + 48
        )} ${Math.max(160, Math.round(sheet.height * scale) + 48)}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* sheet background */}
        <rect
          x={12}
          y={12}
          width={toPx(sheet.width)}
          height={toPx(sheet.height)}
          rx={8}
          fill="#fff"
          stroke="rgba(2,6,23,0.06)"
        />

        {/* placements */}
        {placements.map((p: Placement, i: number) => {
          // convert backend bottom-left (x,y) to svg top-left y
          const x = toPx(p.x);
          const y = toPx(sheet.height - p.y - p.height);
          const w = p.width * scale;
          const h = p.height * scale;
          const isH =
            highlight &&
            highlight.type === "placement" &&
            highlight.index === i;
          const fill = isH ? "#2563eb" : "#60a5fa";
          return (
            <g
              key={p.id || `${p.panel_id}-${i}`}
              transform={`translate(${x},${y})`}
            >
              <rect
                className={`placed ${isH ? "highlight" : ""}`}
                x={0}
                y={0}
                width={w}
                height={h}
                rx={6}
                fill={fill}
                opacity="0.95"
              />
              <text x={6} y={16} className="placed-label">
                {p.panel_id}
              </text>
            </g>
          );
        })}

        {/* leftovers */}
        {leftovers.map((l: Leftover, i: number) => {
          const x = toPx(l.x);
          const y = toPx(sheet.height - l.y - l.height);
          const w = l.width * scale;
          const h = l.height * scale;
          const isH =
            highlight && highlight.type === "leftover" && highlight.index === i;
          return (
            <g key={`lf-${i}`} transform={`translate(${x},${y})`}>
              <rect
                className={`leftover ${isH ? "highlight" : ""}`}
                x={0}
                y={0}
                width={w}
                height={h}
                rx={6}
                fill="rgba(253,230,138,0.95)"
                stroke="rgba(2,6,23,0.06)"
              />
              <text
                x={6}
                y={14}
                style={{ fontSize: 11, fill: "#92400e", fontWeight: 700 }}
              >{`${Math.round(l.width)}×${Math.round(l.height)}`}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* Simple SVG export for the selected sheet */
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
    const sy = margin + (sheet.height - y - h) * scale; // convert bottom-left to top-left space
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

  placements.forEach((p: Placement) => {
    svg += rectToSvg(
      p.x,
      p.y,
      p.width,
      p.height,
      `fill="#60a5fa" stroke="#0f172a" stroke-width="0.6" opacity="0.95"`
    );
    svg += `<text x="${margin + (p.x + 0.5) * scale}" y="${
      margin + (sheet.height - (p.y + 0.2)) * scale
    }" font-size="${Math.max(8, scale * 0.8)}" fill="#fff">${
      p.panel_id
    }</text>`;
  });

  leftovers.forEach((l: Leftover) => {
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

/* Utility: expand sheets by qty into an array */
function expandSheets(stockSheets: StockSheet[]): Sheet[] {
  const arr: Sheet[] = [];
  for (const s of stockSheets) {
    const qty = Math.max(1, s.qty || 1);
    for (let i = 0; i < qty; i++) {
      // let user-specified name if provided, else default to "Sheet #"
      arr.push({ width: s.width, height: s.height, name: s.name || "" });
    }
  }
  return arr;
}

export default function Calculator() {
  const [payload, setPayload] = useState<Payload>(samplePayload());
  const [response, setResponse] = useState<CuttingResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [mode3D, setMode3D] = useState<boolean>(false);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState<number>(0);
  const [highlight, setHighlight] = useState<{
    type: "placement" | "leftover";
    index: number;
  } | null>(null);

  /* Editable helpers */
  function updateField(path: string, value: number) {
    const copy: Payload = JSON.parse(JSON.stringify(payload));
    const parts = path.split(".");
    let cur: any = copy;
    for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
    cur[parts[parts.length - 1]] = value;
    setPayload(copy);
  }
  function addStockSheet() {
    const copy: Payload = JSON.parse(JSON.stringify(payload));
    copy.stock_sheets.push({ width: 100, height: 50, qty: 1 });
    setPayload(copy);
  }
  function addPanel() {
    const copy: Payload = JSON.parse(JSON.stringify(payload));
    copy.panels.push({ width: 10, height: 5, qty: 1 });
    setPayload(copy);
  }
  function updateStock(
    idx: number,
    key: keyof StockSheet,
    value: string | number
  ) {
    const copy: Payload = JSON.parse(JSON.stringify(payload));
    if (key === "name") {
      copy.stock_sheets[idx][key] = String(value);
    } else {
      copy.stock_sheets[idx][key] = Number(value);
    }
    setPayload(copy);
  }
  function updatePanel(idx: number, key: keyof Panel, value: string | number) {
    const copy: Payload = JSON.parse(JSON.stringify(payload));
    copy.panels[idx][key] = Number(value);
    setPayload(copy);
  }
  function removeStock(idx: number) {
    const copy: Payload = JSON.parse(JSON.stringify(payload));
    copy.stock_sheets.splice(idx, 1);
    setPayload(copy);
  }
  function removePanel(idx: number) {
    const copy: Payload = JSON.parse(JSON.stringify(payload));
    copy.panels.splice(idx, 1);
    setPayload(copy);
  }

  /* API call */
  async function callAPI() {
    setLoading(true);
    setResponse(null);
    setHighlight(null);
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || res.statusText);
      }
      const data: CuttingResponse = await res.json();
      // if backend returns used_stock_sheets with qty expansion we respect it. set response as-is.
      setResponse(data);
      // make sure selected sheet index remains valid
      const expanded = expandSheets(payload.stock_sheets);
      if (selectedSheetIndex >= expanded.length) setSelectedSheetIndex(0);
    } catch (err: any) {
      alert("Error calling backend: " + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  }

  /* Derive sheets array (expanded by qty) and UI labels */
  const sheetsExpanded: Sheet[] = useMemo(() => {
    return expandSheets(payload.stock_sheets);
  }, [payload.stock_sheets]);

  /* Build placements/leftovers grouped by stock_id (1-based) if backend provided; else fallback distribution */
  const sheetsData: { arr: SheetData[]; totalSheets: number } = useMemo(() => {
    // Build empty structure for each expanded sheet
    const N = Math.max(1, sheetsExpanded.length);
    const arr: SheetData[] = new Array(N)
      .fill(0)
      .map(() => ({ placements: [], leftovers: [], cuts: [] } as SheetData));

    if (!response) {
      // No backend result: keep arr empty and return
      return { arr, totalSheets: N };
    }

    // prefer backend placements if present
    if (Array.isArray(response.placements) && response.placements.length > 0) {
      for (const p of response.placements) {
        // expect p.stock_id to be 1-based index of sheet
        const sid = Math.max(1, p.stock_id || 1);
        const idx = Math.min(N - 1, sid - 1);
        arr[idx].placements.push(p);
      }
    } else if (Array.isArray(response.cuts) && response.cuts.length > 0) {
      // fallback: distribute cuts -> create rudimentary placements (not exact)
      // We'll create one placement per cut entry as a placeholder; backend should supply real placements.
      let idx = 0;
      for (const c of response.cuts) {
        const sidx = idx % N;
        // parse panel dims from c.panel (like "10×5")
        const dims = (c.panel || "").split("×").map((t) => Number(t));
        const pw = dims[0] || 10;
        const ph = dims[1] || 5;
        arr[sidx].placements.push({
          id: `${c.panel}#${idx}`,
          panel_id: c.panel,
          stock_id: sidx + 1,
          x: 0,
          y: 0,
          width: pw,
          height: ph,
          depth: 1,
        });
        idx++;
      }
    }

    // leftovers: if backend provided, group by stock_id
    if (Array.isArray(response.leftovers) && response.leftovers.length > 0) {
      for (const lf of response.leftovers) {
        const sid = Math.max(1, lf.stock_id || 1);
        const idx = Math.min(N - 1, sid - 1);
        arr[idx].leftovers.push(lf);
      }
    } else {
      // fallback: approximate leftover by sheet used area if backend provided used_stock_sheets
      if (
        Array.isArray(response.used_stock_sheets) &&
        response.used_stock_sheets.length > 0
      ) {
        // attempt to match one-to-one by index
        for (
          let i = 0;
          i < Math.min(response.used_stock_sheets.length, N);
          i++
        ) {
          const us = response.used_stock_sheets[i];
          const sheetDef = {
            width: sheetsExpanded[i]?.width || us.stock_sheet.width,
            height: sheetsExpanded[i]?.height || us.stock_sheet.height,
          };
          // create one large leftover if used_area < sheet area
          const usedArea = us.used_area || 0;
          const sheetArea = sheetDef.width * sheetDef.height || 1;
          if (usedArea < sheetArea - 1e-9) {
            // crude: place leftover as a block at x=0,y=0 with width = full width, height = remaining height
            // This is just a visual hint — prefer backend leftovers for exact layout
            const approxH = Math.max(
              0,
              sheetDef.height - usedArea / Math.max(1, sheetDef.width)
            );
            if (approxH > 0.001) {
              arr[i].leftovers.push({
                stock_id: i + 1,
                x: 0,
                y: 0,
                width: sheetDef.width,
                height: approxH,
              });
            }
          }
        }
      }
    }

    // cut logs: group response.cuts by StockID if present
    if (Array.isArray(response.cuts) && response.cuts.length > 0) {
      for (const c of response.cuts) {
        const sid = Math.max(1, c.StockID || c.stock_id || c.stockId || 1);
        const idx = Math.min(N - 1, sid - 1);
        arr[idx].cuts.push(c);
      }
    }

    return { arr, totalSheets: N };
  }, [response, sheetsExpanded]);

  /* selected sheet data */
  /* sheet label list for dropdown */
  const sheetOptions = useMemo(() => {
    const opts: { label: string; index: number }[] = [];
    for (let i = 0; i < sheetsExpanded.length; i++) {
      const sheet = sheetsExpanded[i];
      const name =
        sheet && sheet.name && sheet.name.trim()
          ? sheet.name
          : `Sheet ${i + 1}`;
      opts.push({ label: name, index: i });
    }
    if (opts.length === 0) opts.push({ label: "Sheet 1", index: 0 });
    return opts;
  }, [sheetsExpanded]);

  const sheetIndex = Math.max(
    0,
    Math.min(sheetsData.totalSheets - 1, selectedSheetIndex)
  );
  const selectedSheetDef: Sheet = sheetsExpanded[sheetIndex] || {
    width: 50,
    height: 20,
  };
  const selectedSheetData: SheetData = sheetsData.arr[sheetIndex] || {
    placements: [],
    leftovers: [],
    cuts: [],
  };
  const sheetLabel =
    sheetOptions[sheetIndex]?.label || `Sheet ${sheetIndex + 1}`;
  const placementCount = selectedSheetData.placements?.length || 0;
  const leftoverCount = selectedSheetData.leftovers?.length || 0;

  /* UI handlers */
  function onSelectSheet(value: string) {
    setSelectedSheetIndex(Number(value));
    setHighlight(null);
  }

  return (
    <div className="min-h-screen p-4 ">
      <div className=" mx-auto space-y-2">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h4 className="text-lg sm:text-xl font-semibold capitalize text-purple-500 mb-2 sm:mb-0">
              Cutting Stock — Visual Planner
            </h4>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* <button
              className="btn"
              onClick={() => {
                setPayload(samplePayload());
                setResponse(null);
              }}
            >
              Load sample
            </button> */}
            <Button
              variant="default"
              onClick={async () => await callAPI()}
              disabled={loading}
            >
              {loading ? "Running…" : "Run Optimizer"}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                exportSVG(
                  selectedSheetDef,
                  selectedSheetData.placements,
                  selectedSheetData.leftovers
                )
              }
            >
              Export SVG
            </Button>
            <Button variant="outline" onClick={() => setMode3D((m) => !m)}>
              {mode3D ? "Switch to 2D" : "Switch to 3D"}
            </Button>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="card ">
            <div className="kv">Viewing</div>
            <div className="stat text-base">
              {sheetLabel} · {selectedSheetDef.width} ×{" "}
              {selectedSheetDef.height}
            </div>
          </div>
          <div className="card py-3 px-4">
            <div className="kv">Placements</div>
            <div className="stat">{placementCount}</div>
          </div>
          <div className="card py-3 px-4">
            <div className="kv">Leftovers</div>
            <div className="stat">{leftoverCount}</div>
          </div>
        </section>

        <main className="grid grid-cols-12 gap-6">
          <section className="col-span-12 lg:col-span-4 space-y-3">
            <div className="card space-y-3">
              <h3 className="font-bold">Request</h3>

              <div className="space-y-1">
                <label className="kv">Cut thickness</label>
                <Input
                  type="number"
                  className="mt-1 w-full"
                  value={payload.cut_thickness}
                  onChange={(e) =>
                    updateField("cut_thickness", Number(e.target.value))
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="kv">Number of cuts (0 = unlimited)</label>
                <Input
                  type="number"
                  className="mt-1 w-full"
                  value={payload.number_of_cuts}
                  onChange={(e) =>
                    updateField("number_of_cuts", Number(e.target.value))
                  }
                />
              </div>

              <div className="space-y-2">
                <h4 className="font-bold mt-2">Stock sheets</h4>
                {payload.stock_sheets.map((s, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      className="w-1/3"
                      value={s.width}
                      onChange={(e) =>
                        updateStock(idx, "width", e.target.value)
                      }
                    />
                    <Input
                      className="w-1/3"
                      value={s.height}
                      onChange={(e) =>
                        updateStock(idx, "height", e.target.value)
                      }
                    />
                    <Input
                      className="w-1/4"
                      value={s.qty}
                      onChange={(e) => updateStock(idx, "qty", e.target.value)}
                    />
                    {/* red delete icon */}
                    <div
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                      onClick={() => removeStock(idx)}
                      aria-label="Remove stock sheet"
                    >
                      <X className="h-4 w-4" />
                    </div>
                  </div>
                ))}
                <div>
                  <Button variant="secondary" onClick={addStockSheet}>
                    Add sheet
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold mt-2">Panels</h4>
                {payload.panels.map((p, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      className="w-1/3"
                      value={p.width}
                      onChange={(e) =>
                        updatePanel(idx, "width", e.target.value)
                      }
                    />
                    <Input
                      className="w-1/3"
                      value={p.height}
                      onChange={(e) =>
                        updatePanel(idx, "height", e.target.value)
                      }
                    />
                    <Input
                      className="w-1/4"
                      value={p.qty}
                      onChange={(e) => updatePanel(idx, "qty", e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                      onClick={() => removePanel(idx)}
                      aria-label="Remove panel"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={addPanel}>
                    Add panel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        JSON.stringify(payload, null, 2)
                      )
                    }
                  >
                    Copy JSON
                  </Button>
                </div>
              </div>
            </div>

            <div className="card space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-bold">
                  Cut Log —{" "}
                  <span className="font-semibold">
                    {sheetOptions[sheetIndex]?.label ||
                      `Sheet ${sheetIndex + 1}`}
                  </span>
                </h3>
                <Select
                  value={String(sheetIndex)}
                  onValueChange={onSelectSheet}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sheetOptions.map((o) => (
                      <SelectItem key={o.index} value={String(o.index)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                {selectedSheetData.cuts && selectedSheetData.cuts.length > 0 ? (
                  <table className="w-full border-collapse text-sm">
                    <thead className="text-left text-slate-500">
                      <tr>
                        <th className="p-2">#</th>
                        <th className="p-2">Panel</th>
                        <th className="p-2">Result</th>
                        <th className="p-2">Length</th>
                        <th className="p-2">Axis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSheetData.cuts.map((c, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="p-2">{c.index || i + 1}</td>
                          <td className="p-2">{c.panel}</td>
                          <td className="p-2">{c.result}</td>
                          <td className="p-2">{c.length}</td>
                          <td className="p-2">{c.cut_axis}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="kv">No cuts for this sheet yet.</div>
                )}
              </div>
            </div>

            <div className="card space-y-2">
              <h3 className="font-bold">Sheet Remains</h3>
              <div className="kv">Leftover rectangles</div>
              {selectedSheetData.leftovers &&
              selectedSheetData.leftovers.length > 0 ? (
                selectedSheetData.leftovers.map((l, i) => (
                  <div
                    key={i}
                    className="mt-2 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-bold">{`${Math.round(
                        l.width
                      )}×${Math.round(l.height)}`}</div>
                      <div className="kv">{`@ (${l.x.toFixed(2)}, ${l.y.toFixed(
                        2
                      )})`}</div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setHighlight({ type: "leftover", index: i })
                      }
                    >
                      Highlight
                    </Button>
                  </div>
                ))
              ) : (
                <div className="kv">
                  No leftover rectangles reported for this sheet.
                </div>
              )}
            </div>
          </section>

          <section className="col-span-12 lg:col-span-8">
            <div className="card space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="text-lg sm:text-xl font-semibold capitalize text-purple-500 mb-2 sm:mb-0">
                  {mode3D ? "3D Preview" : "2D Preview"}
                </h4>
                <div className="kv">
                  Viewing:{" "}
                  <strong>
                    {sheetOptions[sheetIndex]?.label ||
                      `Sheet ${sheetIndex + 1}`}
                  </strong>
                </div>
              </div>

              <div>
                {mode3D ? (
                  <ThreeDVisualizer
                    sheet={selectedSheetDef}
                    placements={selectedSheetData.placements}
                    leftovers={selectedSheetData.leftovers}
                    highlight={highlight}
                  />
                ) : (
                  <Visualizer2D
                    sheet={selectedSheetDef}
                    placements={selectedSheetData.placements}
                    leftovers={selectedSheetData.leftovers}
                    highlight={highlight}
                  />
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
