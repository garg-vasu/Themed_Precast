import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import PageHeader from "@/components/ui/PageHeader";
import { apiClient } from "@/utils/apiClient";

type QcRadialDatum = {
  stage: string; // angular category
  status: string; // stacked series key
  count: number; // value
};

const fallbackData: QcRadialDatum[] = [
  { stage: "mesh_mold", status: "approved", count: 1200 },
  { stage: "mesh_mold", status: "hold", count: 30 },
  { stage: "mesh_mold", status: "rejected", count: 100   },

  { stage: "reinforcement", status: "approved", count: 9000 },
  { stage: "reinforcement", status: "hold", count: 400 },
  { stage: "reinforcement", status: "rejected", count: 200 },

  { stage: "mep", status: "approved", count: 1500 },
  { stage: "mep", status: "hold", count: 2345 },
  { stage: "mep", status: "rejected", count: 100 },

  { stage: "prepour", status: "approved", count: 7000 },
  { stage: "prepour", status: "hold", count: 500 },
  { stage: "prepour", status: "rejected", count: 0 },

  { stage: "postpour", status: "approved", count: 10000 },
  { stage: "postpour", status: "hold", count: 1020 },
  { stage: "postpour", status: "rejected", count: 1300 },
];

async function fetchQcRadialData(): Promise<QcRadialDatum[]> {
  // “Mimic API call” via apiClient, but keep UI working without backend.
  // If the backend route exists later, just make it return: { data: QcRadialDatum[] }
  try {
    const res = await apiClient.get<{ data: QcRadialDatum[] }>(
      "/project-report/qc-radial"
    );
    const rows = res.data?.data;
    if (Array.isArray(rows) && rows.length) return rows;
    return fallbackData;
  } catch {
    // simulate network latency so loader states feel real
    await new Promise((r) => setTimeout(r, 350));
    return fallbackData;
  }
}

type StageStatusIndex = d3.InternMap<string, d3.InternMap<string, QcRadialDatum>>;
type StackDatum = readonly [string, d3.InternMap<string, QcRadialDatum>];
type StackSeries = d3.Series<StackDatum, string>;
type StackPoint = d3.SeriesPoint<StackDatum> & { key: string };

function renderRadialStackedBarChart(
  el: HTMLElement,
  data: QcRadialDatum[]
): void {
  el.innerHTML = "";

  const width = 600;
  const height = width;
  const innerRadius = 120;
  const outerRadius = Math.min(width, height) / 2;

  const stages = Array.from(new Set(data.map((d) => d.stage)));
  const statuses = Array.from(new Set(data.map((d) => d.status)));

  // Stack the data into series by status
  const series: StackSeries[] = d3
    .stack<StackDatum, string>()
    .keys(statuses) // distinct series keys, in input order
    .value(([, byStatus], key) => byStatus.get(key)?.count ?? 0)(
    d3.index(data, (d) => d.stage, (d) => d.status) as StageStatusIndex
  );

  // An angular x-scale
  const x = d3
    .scaleBand<string>()
    .domain(stages)
    .range([0, 2 * Math.PI])
    .align(0);

  // A radial y-scale maintains area proportionality of radial bars
  const y = d3
    .scaleRadial()
    .domain([0, d3.max(series, (s) => d3.max(s, (p) => p[1]) ?? 0) ?? 0])
    .range([innerRadius, outerRadius]);

  const color = d3
    .scaleOrdinal<string, string>()
    .domain(statuses)
    .range(d3.schemeSpectral[Math.max(3, Math.min(11, statuses.length))] as any)
    .unknown("#ccc");

  const arc = d3
    .arc<StackPoint>()
    .innerRadius((d) => y(d[0]))
    .outerRadius((d) => y(d[1]))
    .startAngle((d) => x(d.data[0]) ?? 0)
    .endAngle((d) => (x(d.data[0]) ?? 0) + x.bandwidth())
    .padAngle(1.5 / innerRadius)
    .padRadius(innerRadius);

  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height].join(" "))
    .attr(
      "style",
      "width: 100%; height: auto; max-width: 600px; font: 9px Lexend, sans-serif; overflow: visible;"
    );

  // series groups + arcs
  svg
    .append("g")
    .selectAll("g")
    .data(series)
    .join("g")
    .attr("fill", (d) => color(d.key))
    .selectAll("path")
    .data((S) => S.map((p) => Object.assign(p, { key: S.key } as const)))
    .join("path")
    .attr("d", arc)
    .append("title")
    .text((d) => {
      const stage = d.data[0];
      const key = d.key;
      const val = d.data[1].get(key)?.count ?? 0;
      return `${stage} ${key}\n${val.toLocaleString("en")}`;
    });

  // x axis labels
  svg
    .append("g")
    .attr("text-anchor", "middle")
    .selectAll("g")
    .data(x.domain())
    .join("g")
    .attr(
      "transform",
      (d) => `
        rotate(${(((x(d) ?? 0) + x.bandwidth() / 2) * 180) / Math.PI - 90})
        translate(${innerRadius},0)
      `
    )
    .call((g) =>
      g
        .append("line")
        .attr("x2", -5)
        .attr("stroke", "currentColor")
        .attr("opacity", 0.7)
    )
    .call((g) =>
      g
        .append("text")
        .attr(
          "transform",
          (d) =>
            (((x(d) ?? 0) + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI)) <
            Math.PI
              ? "rotate(90)translate(0,16)"
              : "rotate(-90)translate(0,-9)"
        )
        .text((d) => d)
    );

  // y axis rings + labels
  svg
    .append("g")
    .attr("text-anchor", "middle")
    .call((g) =>
      g
        .append("text")
        .attr("y", -y(y.ticks(5).pop() ?? 0))
        .attr("dy", "-1em")
        .attr("font-weight", 600)
        .text("Count")
    )
    .call((g) =>
      g
        .selectAll("g")
        .data(y.ticks(5).slice(1))
        .join("g")
        .attr("fill", "none")
        .call((gg) =>
          gg
            .append("circle")
            .attr("stroke", "currentColor")
            .attr("stroke-opacity", 0.25)
            .attr("r", y)
        )
        .call((gg) =>
          gg
            .append("text")
            .attr("y", (d) => -y(d))
            .attr("dy", "0.35em")
            .attr("stroke", "white")
            .attr("stroke-width", 5)
            .text(y.tickFormat(5, "s"))
            .clone(true)
            .attr("fill", "currentColor")
            .attr("stroke", "none")
        )
    );

  // color legend
  svg
    .append("g")
    .selectAll("g")
    .data(color.domain())
    .join("g")
    .attr(
      "transform",
      (_d, i, nodes) =>
        `translate(-40,${((nodes.length ?? 0) / 2 - i - 1) * 20})`
    )
    .call((g) =>
      g.append("rect").attr("width", 18).attr("height", 18).attr("fill", color)
    )
    .call((g) =>
      g
        .append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", "0.35em")
        .text((d) => d)
    );

  el.appendChild(svg.node() as SVGSVGElement);
}

export function QcChart() {
  const chartHostRef = useRef<HTMLDivElement | null>(null);
  const [rows, setRows] = useState<QcRadialDatum[] | null>(null);
  const [loading, setLoading] = useState(false);

  const normalized = useMemo(() => {
    if (!rows) return [];
    // keep stable ordering: stage then status (helps axis/key ordering)
    return [...rows].sort((a, b) =>
      a.stage === b.stage ? a.status.localeCompare(b.status) : a.stage.localeCompare(b.stage)
    );
  }, [rows]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchQcRadialData()
      .then((d) => {
        if (!cancelled) setRows(d);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!chartHostRef.current) return;
    if (!normalized.length) return;
    renderRadialStackedBarChart(chartHostRef.current, normalized);
  }, [normalized]);

  return (
    <div className="w-full p-4">
      <PageHeader title="Quality Control Chart" />
      <div className="mt-4 rounded-lg border bg-background p-4 flex justify-center">
        {loading && (
          <div className="text-sm text-muted-foreground">Loading chart…</div>
        )}
        <div ref={chartHostRef} className="flex justify-center" />
      </div>
    </div>
  );
}
