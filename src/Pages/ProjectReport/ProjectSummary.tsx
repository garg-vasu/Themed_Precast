import { apiClient } from "@/utils/apiClient";
import axios, { AxiosError } from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DateFilter } from "@/components/DateFilter";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import { useParams } from "react-router-dom";
import * as d3 from "d3";

export interface FirstLine {
  total_manpower: number;
  total_skills: number;
  total_vendors: number;
}

type ProductionOverviewDate = {
  [key: string]: number | string;
  name: string;
};

type QcRadialDatum = {
  stage: string;
  status: string;
  count: number;
};

export interface elementOverviewData {
  [key: string]: number | string;
  name: string;
}
export interface ConcreteOverviewData {
  [key: string]: number | string;
  name: string;
}

export interface HumanOverviewData {
  [key: string]: number | string;
  name: string;
}

// steel usuage
export interface SteelUsageData {
  [key: string]: number | string;
  name: string;
}

// Format date string to "2 Sep" format
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid

    const day = date.getDate();
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = monthNames[date.getMonth()];

    return `${day} ${month}`;
  } catch {
    return dateString;
  }
};

// Format date range string like "2025-01-06 to 2025-01-10" to "06-10"
const formatDateRange = (dateRangeString: string): string => {
  try {
    // Match pattern: "YYYY-MM-DD to YYYY-MM-DD"
    const dateRangePattern = /^(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})$/;
    const match = String(dateRangeString).match(dateRangePattern);

    if (match) {
      const startDate = new Date(match[1]);
      const endDate = new Date(match[2]);

      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        const startDay = String(startDate.getDate()).padStart(2, "0");
        const endDay = String(endDate.getDate()).padStart(2, "0");
        return `${startDay}-${endDay}`;
      }
    }

    return dateRangeString;
  } catch {
    return dateRangeString;
  }
};

// Helper function to format tooltip item name
const formatTooltipName = (name: string, maxWords: number = 4): string => {
  // Replace underscores with spaces
  const nameWithoutUnderscores = String(name).replace(/_/g, " ");

  // Split into words
  const words = nameWithoutUnderscores.trim().split(/\s+/);

  // If name has more than maxWords, truncate and add ellipsis
  if (words.length > maxWords) {
    return words.slice(0, maxWords).join(" ") + "...";
  }

  return nameWithoutUnderscores;
};

const LabourTooltip = ({
  active,
  label,
  payload,
}: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return null;

  // Format label if it's a date string (YYYY-MM-DD format)
  const formattedLabel = /^\d{4}-\d{2}-\d{2}$/.test(String(label))
    ? formatDate(String(label))
    : label;

  return (
    <div className="rounded-md border bg-background px-3 py-2 shadow-md text-xs md:text-sm">
      <div className="mb-2 font-semibold">{formattedLabel}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 max-w-xs md:max-w-md">
        {payload.map((item) => {
          const formattedName = formatTooltipName(String(item.name || ""), 4);
          const numberValue = item.value;

          return (
            <div key={String(item.dataKey)} className="flex items-center gap-1">
              <span
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color || "#22C55E" }}
              />
              <span className="flex items-center gap-1 min-w-0">
                <span className="truncate">{formattedName}</span>
                <span className="whitespace-nowrap">: {numberValue}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
const getErrorMessage = (error: AxiosError | unknown, data: string): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Unauthorized. Please log in.";
    }
    if (error.response?.status === 403) {
      return "Access denied. Please contact your administrator.";
    }
    if (error.code === "ECONNABORTED") {
      return "Request timed out. Please try again later.";
    }
    // Check both 'error' and 'message' fields in the response
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      `Failed to ${data}.`;
    return errorMessage;
  }
  return "An unexpected error occurred. Please try again later.";
};

export default function ProjectSummary() {
  const { projectId } = useParams();
  const [productionOverviewDate, setProductionOverviewDate] = useState<
    ProductionOverviewDate[]
  >([]);
  // element overview data
  const [elementOverviewData, setElementOverviewData] = useState<
    elementOverviewData[]
  >([]);
  // concrete overview data
  const [concreteOverviewData, setConcreteOverviewData] = useState<
    ConcreteOverviewData[]
  >([]);
  // human overview data
  const [humanOverviewData, setHumanOverviewData] = useState<
    HumanOverviewData[]
  >([]);
  // steel usage data
  const [steelUsageData, setSteelUsageData] = useState<SteelUsageData[]>([]);

  // QC radial chart state
  const qcChartHostRef = useRef<HTMLDivElement | null>(null);
  const [qcRadialRows, setQcRadialRows] = useState<QcRadialDatum[] | null>(null);
  const [qcRadialLoading, setQcRadialLoading] = useState(false);
  const [qcRadialError, setQcRadialError] = useState<string | null>(null);

  // Date Filter State
  const [dateFilter, setDateFilter] = useState<{
    type: "yearly" | "monthly" | "weekly";
    year: number;
    month?: number;
    week?: number;
    date?: Date;
  }>({
    type: "yearly",
    year: new Date().getFullYear(),
  });

  const productionOverviewDateKeys = useMemo(() => {
    if (!productionOverviewDate || productionOverviewDate.length === 0)
      return [];

    const sample = productionOverviewDate[0];
    const excludedKeys = [
      "name",
      "day",
      "concrete_balance",
      "concrete_required",
      "concrete_used",
    ];
    return Object.keys(sample).filter((key) => !excludedKeys.includes(key));
  }, [productionOverviewDate]);

  const productionOverviewDateChartData = useMemo(() => {
    if (!productionOverviewDate || productionOverviewDate.length === 0) {
      return [];
    }

    // Format dates based on filter type
    return productionOverviewDate.map((item) => {
      const nameStr = String(item.name || "");

      // Check if name is a date range (for monthly type): "YYYY-MM-DD to YYYY-MM-DD"
      if (
        dateFilter.type === "monthly" &&
        /^\d{4}-\d{2}-\d{2}\s+to\s+\d{4}-\d{2}-\d{2}$/.test(nameStr)
      ) {
        return {
          ...item,
          name: formatDateRange(nameStr),
        };
      }

      // Check if name is a date string (YYYY-MM-DD format) and format it
      if (/^\d{4}-\d{2}-\d{2}$/.test(nameStr)) {
        const date = new Date(nameStr);
        if (!isNaN(date.getTime())) {
          const day = date.getDate();
          const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          const month = monthNames[date.getMonth()];
          return {
            ...item,
            name: `${day} ${month}`,
          };
        }
      }
      return item;
    });
  }, [productionOverviewDate, dateFilter.type]);

  // human overview data keys
  const humanOverviewDataKeys = useMemo(() => {
    if (!humanOverviewData || humanOverviewData.length === 0) return [];

    const sample = humanOverviewData[0];
    return Object.keys(sample).filter((key) => key !== "name" && key !== "day");
  }, [humanOverviewData]);

  const humanOverviewDataChartData = useMemo(() => {
    if (!humanOverviewData || humanOverviewData.length === 0) {
      return [];
    }

    // Format dates based on filter type
    return humanOverviewData.map((item) => {
      const nameStr = String(item.name || "");

      // Check if name is a date range (for monthly type): "YYYY-MM-DD to YYYY-MM-DD"
      if (
        dateFilter.type === "monthly" &&
        /^\d{4}-\d{2}-\d{2}\s+to\s+\d{4}-\d{2}-\d{2}$/.test(nameStr)
      ) {
        return {
          ...item,
          name: formatDateRange(nameStr),
        };
      }

      // Check if name is a date string (YYYY-MM-DD format) and format it
      if (/^\d{4}-\d{2}-\d{2}$/.test(nameStr)) {
        const date = new Date(nameStr);
        if (!isNaN(date.getTime())) {
          const day = date.getDate();
          const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          const month = monthNames[date.getMonth()];
          return {
            ...item,
            name: `${day} ${month}`,
          };
        }
      }
      return item;
    });
  }, [humanOverviewData, dateFilter.type]);

  // element overview data keys
  const elementOverviewDataKeys = useMemo(() => {
    if (!elementOverviewData || elementOverviewData.length === 0) return [];

    const sample = elementOverviewData[0];
    return Object.keys(sample).filter((key) => key !== "name" && key !== "day");
  }, [elementOverviewData]);

  const elementOverviewDataChartData = useMemo(() => {
    if (!elementOverviewData || elementOverviewData.length === 0) {
      return [];
    }

    // Format dates based on filter type
    return elementOverviewData.map((item) => {
      const nameStr = String(item.name || "");

      // Check if name is a date range (for monthly type): "YYYY-MM-DD to YYYY-MM-DD"
      if (
        dateFilter.type === "monthly" &&
        /^\d{4}-\d{2}-\d{2}\s+to\s+\d{4}-\d{2}-\d{2}$/.test(nameStr)
      ) {
        return {
          ...item,
          name: formatDateRange(nameStr),
        };
      }

      // Check if name is a date string (YYYY-MM-DD format) and format it
      if (/^\d{4}-\d{2}-\d{2}$/.test(nameStr)) {
        const date = new Date(nameStr);
        if (!isNaN(date.getTime())) {
          const day = date.getDate();
          const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          const month = monthNames[date.getMonth()];
          return {
            ...item,
            name: `${day} ${month}`,
          };
        }
      }
      return item;
    });
  }, [elementOverviewData, dateFilter.type]);

  // steel usage data keys
  const steelUsageDataKeys = useMemo(() => {
    if (!steelUsageData || steelUsageData.length === 0) return [];

    const sample = steelUsageData[0];
    return Object.keys(sample).filter((key) => key !== "name" && key !== "day");
  }, [steelUsageData]);

  const qcRadialNormalized = useMemo(() => {
    if (!qcRadialRows) return [];
    return [...qcRadialRows].sort((a, b) =>
      a.stage === b.stage ? a.status.localeCompare(b.status) : a.stage.localeCompare(b.stage)
    );
  }, [qcRadialRows]);

  const steelUsageDataChartData = useMemo(() => {
    if (!steelUsageData || steelUsageData.length === 0) {
      return [];
    }

    // Format dates for weekly view (YYYY-MM-DD format)
    return steelUsageData.map((item) => {
      // Check if name is a date string (YYYY-MM-DD format) and format it
      if (item.name && /^\d{4}-\d{2}-\d{2}$/.test(String(item.name))) {
        const date = new Date(String(item.name));
        if (!isNaN(date.getTime())) {
          const day = date.getDate();
          const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          const month = monthNames[date.getMonth()];
          return {
            ...item,
            name: `${day} ${month}`,
          };
        }
      }
      return item;
    });
  }, [steelUsageData]);

  // concrete overview data keys
  const concreteOverviewDataKeys = useMemo(() => {
    if (!concreteOverviewData || concreteOverviewData.length === 0) return [];

    const sample = concreteOverviewData[0];
    return Object.keys(sample).filter((key) => key !== "name" && key !== "day");
  }, [concreteOverviewData]);

  const concreteOverviewDataChartData = useMemo(() => {
    if (!concreteOverviewData || concreteOverviewData.length === 0) {
      return [];
    }

    // Format dates based on filter type
    return concreteOverviewData.map((item) => {
      const nameStr = String(item.name || "");

      // Check if name is a date range (for monthly type): "YYYY-MM-DD to YYYY-MM-DD"
      if (
        dateFilter.type === "monthly" &&
        /^\d{4}-\d{2}-\d{2}\s+to\s+\d{4}-\d{2}-\d{2}$/.test(nameStr)
      ) {
        return {
          ...item,
          name: formatDateRange(nameStr),
        };
      }

      // Check if name is a date string (YYYY-MM-DD format) and format it
      if (/^\d{4}-\d{2}-\d{2}$/.test(nameStr)) {
        const date = new Date(nameStr);
        if (!isNaN(date.getTime())) {
          const day = date.getDate();
          const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          const month = monthNames[date.getMonth()];
          return {
            ...item,
            name: `${day} ${month}`,
          };
        }
      }
      return item;
    });
  }, [concreteOverviewData, dateFilter.type]);

  const labourColors = [
    "#0EA5E9",
    "#22C55E",
    "#F97316",
    "#6366F1",
    "#EC4899",
    "#14B8A6",
    "#EAB308",
    "#8B5CF6",
    "#F97373",
    "#10B981",
  ];

  const buildQueryParams = useCallback(() => {
    let params = "";

    // Add date filter parameters
    const dateParams = `type=${dateFilter.type}&year=${dateFilter.year}`;
    if (params) {
      params += `?${dateParams}`;
    } else {
      params = dateParams;
    }

    if (dateFilter.month) {
      params += `&month=${dateFilter.month}`;
    }

    if (dateFilter.type === "weekly" && dateFilter.date) {
      const day = dateFilter.date.getDate();
      params += `&date=${day}`;
    }

    return params;
  }, [dateFilter]);

  // fetch QC stagewise radial data (independent from QcChart.tsx)
  useEffect(() => {
    if (!projectId) return;

    const source = axios.CancelToken.source();

    const fetchQcStagewiseRadialData = async () => {
      try {
        setQcRadialLoading(true);
        setQcRadialError(null);

        const response = await apiClient.get<{
          data: { stage: string; status: string; count: number }[];
        }>(`/qc_reports_stagewise/${projectId}?${buildQueryParams()}`, {
          cancelToken: source.token,
        });

        if (response.status === 200 && Array.isArray(response.data?.data)) {
          const rows = response.data.data.map((r) => ({
            stage: String(r.stage)
              .replace(/_/g, " ")
              .replace(/\s*&\s*/g, " & ")
              .replace(/\s+/g, " ")
              .trim(),
            status: String(r.status),
            count: Number(r.count ?? 0),
          }));
          setQcRadialRows(rows);
        } else {
          setQcRadialRows([]);
          toast.error(
            // @ts-expect-error backend shape
            response.data?.message || "Failed to fetch qc stagewise data"
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          setQcRadialError(getErrorMessage(err as AxiosError, "qc stagewise data"));
        }
      } finally {
        setQcRadialLoading(false);
      }
    };

    fetchQcStagewiseRadialData();

    return () => {
      source.cancel();
    };
  }, [projectId, buildQueryParams]);

  // render QC radial chart with D3
  useEffect(() => {
    const host = qcChartHostRef.current;
    if (!host) return;

    if (!qcRadialNormalized.length) {
      host.innerHTML = "";
      return;
    }

    host.innerHTML = "";

    const width = 600;
    const height = width;
    const innerRadius = 120;
    const outerRadius = Math.min(width, height) / 2;

    const stages = Array.from(new Set(qcRadialNormalized.map((d) => d.stage)));
    const statuses = Array.from(new Set(qcRadialNormalized.map((d) => d.status)));

    type StageStatusIndex = d3.InternMap<
      string,
      d3.InternMap<string, QcRadialDatum>
    >;
    type StackDatum = readonly [string, d3.InternMap<string, QcRadialDatum>];
    type StackSeries = d3.Series<StackDatum, string>;
    type StackPoint = d3.SeriesPoint<StackDatum> & { key: string };

    const series: StackSeries[] = d3
      .stack<StackDatum, string>()
      .keys(statuses)
      .value(([, byStatus], key) => byStatus.get(key)?.count ?? 0)(
      d3.index(
        qcRadialNormalized,
        (d) => d.stage,
        (d) => d.status
      ) as StageStatusIndex
    );

    const x = d3
      .scaleBand<string>()
      .domain(stages)
      .range([0, 2 * Math.PI])
      .align(0);

    const y = d3
      .scaleRadial()
      .domain([0, d3.max(series, (s) => d3.max(s, (p) => p[1]) ?? 0) ?? 0])
      .range([innerRadius, outerRadius]);

    const isDark =
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark");

    const basePalette = isDark ? d3.schemeTableau10 : d3.schemeSet2;

    const statusColorMap: Record<string, string> = {
      approved: "#15803d", // dark green
      hold: "#b45309", // dark amber
      pending: "#1d4ed8", // dark blue
    };

    const colorRange = statuses.map((s, i) => {
      const key = String(s).toLowerCase();
      if (statusColorMap[key]) return statusColorMap[key];
      if (basePalette && basePalette.length) {
        return basePalette[i % basePalette.length]!;
      }
      return "#3b82f6";
    });

    const color = d3
      .scaleOrdinal<string, string>()
      .domain(statuses)
      .range(colorRange)
      .unknown(isDark ? "#4b5563" : "#9ca3af");

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
          .attr("fill", "currentColor")
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

    svg
      .append("g")
      .attr("text-anchor", "middle")
      .call((g) =>
        g
          .append("text")
          .attr("y", -y(y.ticks(5).pop() ?? 0))
          .attr("dy", "-1em")
          .attr("font-weight", 600)
          .attr("fill", "currentColor")
          .text("Count")
      )
      .call((g) => {
        const ticks = y.ticks(5);
        
        // Render all tick circles
        g.selectAll("g")
          .data(ticks.slice(1))
          .join("g")
          .attr("fill", "none")
          .call((gg) =>
            gg
              .append("circle")
              .attr("stroke", "currentColor")
              .attr("stroke-opacity", 0.3)
              .attr("stroke-width", 1)
              .attr("r", y)
          )
          .call((gg) =>
            gg
              .append("text")
              .attr("y", (d) => -y(d))
              .attr("dy", "0.35em")
              .attr("stroke", "currentColor")
              .attr("stroke-opacity", 0.25)
              .attr("stroke-width", 1)
              .text(y.tickFormat(5, "s"))
              .clone(true)
              .attr("fill", "currentColor")
              .attr("stroke", "none")
          );
        
        // Explicitly render the outermost circle at max value to ensure visibility
        g.append("circle")
          .attr("stroke", "currentColor")
          .attr("stroke-opacity", 0.3)
          .attr("stroke-width", 1)
          .attr("r", outerRadius)
          .attr("fill", "none");
      });

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
          .attr("fill", "currentColor")
          .text((d) => d)
      );

    host.appendChild(svg.node() as SVGSVGElement);
  }, [qcRadialNormalized]);

  //   fetch Production Overview
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchProductionOverviewDate = async () => {
      try {
        const response = await apiClient.get(
          `/production_reports/${projectId}?${buildQueryParams()}`,
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          setProductionOverviewDate(response.data);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch production overview date"
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "production overview date data"));
        }
      }
    };

    fetchProductionOverviewDate();

    return () => {
      source.cancel();
    };
  }, [dateFilter, buildQueryParams]);

  //   fetch Element Overview
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchElementOverviewData = async () => {
      try {
        const response = await apiClient.get(
          `/planned_casted?project_id=${projectId}&${buildQueryParams()}`,
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          setElementOverviewData(response.data);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch element overview data"
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "element overview data"));
        }
      }
    };

    fetchElementOverviewData();

    return () => {
      source.cancel();
    };
  }, [dateFilter, projectId]);

  //   fetch Concrete Overview
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchConcreteOverviewData = async () => {
      try {
        const response = await apiClient.get(
          `/material_usage_reports_concrete/${projectId}?${buildQueryParams()}`,
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          setConcreteOverviewData(response.data);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch concrete overview data"
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "concrete overview data"));
        }
      }
    };

    fetchConcreteOverviewData();

    return () => {
      source.cancel();
    };
  }, [dateFilter, projectId]);

  //   fetch Human Overview
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchHumanOverviewData = async () => {
      try {
        const response = await apiClient.get(
          `/manpower-count/dashboard?project_id=${projectId}&${buildQueryParams()}`,
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          setHumanOverviewData(response.data);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch human overview data"
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "human overview data"));
        }
      }
    };

    fetchHumanOverviewData();

    return () => {
      source.cancel();
    };
  }, [dateFilter, buildQueryParams]);
  //   fetch Steel Usage
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchSteelUsageData = async () => {
      try {
        const response = await apiClient.get(
          `/material_usage_reports_steel/${projectId}?${buildQueryParams()}`,
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          setSteelUsageData(response.data);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch steel usage data"
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "steel usage data"));
        }
      }
    };

    fetchSteelUsageData();

    return () => {
      source.cancel();
    };
  }, [dateFilter, buildQueryParams]);

  const handleDateFilterChange = async (filter: {
    type: "yearly" | "monthly" | "weekly";
    year: number;
    month?: number;
    date?: Date;
  }) => {
    setDateFilter(filter);
  };

  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex item-bottom justify-between">
        <PageHeader title="Project Summary" />

        <DateFilter onChange={handleDateFilterChange} />
      </div>
      {/* body section  */}
      {/* first section will have three column row  */}
      {/* <div className="grid md:grid-cols-3 grid-cols-1 gap-2 mt-2">
        <Card>
          <CardContent>
            <div className="flex flex-col gap-2">
              <h4 className="md:text-md md:font-semibold text-sm font-small">
                Labour Days
              </h4>
              <div className="text-primary  text-4xl font-semibold">
                {labourDays.total_manpower}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex flex-col gap-2">
              <h4 className="md:text-md md:font-semibold text-sm font-small">
                Vendors Engaged
              </h4>
              <div className="text-primary  text-4xl font-semibold">
                {labourDays.total_vendors}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex flex-col gap-2">
              <h4 className="md:text-md md:font-semibold text-sm font-small">
                Skills Deployed
              </h4>
              <div className="text-primary  text-4xl font-semibold">
                {labourDays.total_skills}
              </div>
            </div>
          </CardContent>
        </Card>
      </div> */}
      {/* production overview chart  */}
      <div className="grid grid-cols-1 gap-4 mt-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg md:text-xl">
              Production Overview
            </CardTitle>
            <CardDescription className="text-sm">
              {dateFilter.type === "yearly"
                ? "Monthly production distribution by role. X-axis shows month names."
                : dateFilter.type === "weekly"
                ? "Daily production distribution by role. X-axis shows dates."
                : "Date range production distribution by role. X-axis shows date ranges."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {productionOverviewDateChartData.length ? (
              <>
                {productionOverviewDateKeys.length > 0 && (
                  <div className="mb-4 w-full overflow-x-auto">
                    <div className="flex flex-wrap gap-3 pb-2">
                      {productionOverviewDateKeys.map((key, index) => (
                        <div
                          key={key}
                          className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground"
                        >
                          <span
                            className="h-2 w-2 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor:
                                labourColors[index % labourColors.length],
                            }}
                          />
                          <span
                            className="whitespace-normal break-words"
                            title={key}
                          >
                            {key}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="w-full overflow-x-auto overflow-y-hidden pb-2">
                  <div className="h-[480px] min-w-[720px] md:min-w-0 md:w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={productionOverviewDateChartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          className="stroke-muted"
                        />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          angle={dateFilter.type === "monthly" ? -45 : 0}
                          textAnchor={
                            dateFilter.type === "monthly" ? "end" : "middle"
                          }
                          height={dateFilter.type === "monthly" ? 60 : 30}
                        />
                        <YAxis
                          allowDecimals={false}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip content={<LabourTooltip />} />
                        {productionOverviewDateKeys.map((key, index) => (
                          <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={labourColors[index % labourColors.length]}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No production overview date data available for this period.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      {/* qc overview chart  */}
      <div className="grid grid-cols-1 gap-4 mt-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg md:text-xl">QC Overview</CardTitle>
            <CardDescription className="text-sm">
              Stagewise QC distribution (approved/hold/pending) for the selected
              period.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!projectId && (
              <p className="text-sm text-foreground">Missing project id.</p>
            )}
            {projectId && (
              <div className="flex justify-center text-primary">
                {qcRadialLoading && (
                  <div className="text-sm text-foreground">
                    Loading chart…
                  </div>
                )}
                {!qcRadialLoading && qcRadialError && (
                  <div className="text-sm text-destructive">
                    Failed to load QC chart.
                  </div>
                )}
                {!qcRadialLoading &&
                  !qcRadialError &&
                  !qcRadialNormalized.length && (
                    <div className="text-sm text-foreground">
                      No qc data available.
                    </div>
                  )}
                <div ref={qcChartHostRef} className="flex justify-center text-foreground" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* element overview chart  */}
      <div className="grid grid-cols-1 gap-4 mt-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg md:text-xl">
              Element Overview
            </CardTitle>
            <CardDescription className="text-sm">
              {dateFilter.type === "yearly"
                ? "Monthly element distribution by role. X-axis shows month names."
                : dateFilter.type === "weekly"
                ? "Daily element distribution by role. X-axis shows dates."
                : "Date range element distribution by role. X-axis shows date ranges."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {elementOverviewDataChartData.length ? (
              <>
                {elementOverviewDataKeys.length > 0 && (
                  <div className="mb-4 w-full overflow-x-auto">
                    <div className="flex flex-wrap gap-3 pb-2">
                      {elementOverviewDataKeys.map((key, index) => (
                        <div
                          key={key}
                          className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground"
                        >
                          <span
                            className="h-2 w-2 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor:
                                labourColors[index % labourColors.length],
                            }}
                          />
                          <span
                            className="whitespace-normal break-words"
                            title={key}
                          >
                            {key}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="w-full overflow-x-auto overflow-y-hidden pb-2">
                  <div className="h-[480px] min-w-[720px] md:min-w-0 md:w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={elementOverviewDataChartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          className="stroke-muted"
                        />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          angle={dateFilter.type === "monthly" ? -45 : 0}
                          textAnchor={
                            dateFilter.type === "monthly" ? "end" : "middle"
                          }
                          height={dateFilter.type === "monthly" ? 60 : 30}
                        />
                        <YAxis
                          allowDecimals={false}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip content={<LabourTooltip />} />
                        {elementOverviewDataKeys.map((key, index) => (
                          <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={labourColors[index % labourColors.length]}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No element overview data available for this period.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      {/* concrete overview chart  */}
      <div className="grid grid-cols-1 gap-4 mt-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg md:text-xl">
              Concrete Overview
            </CardTitle>
            <CardDescription className="text-sm">
              {dateFilter.type === "yearly"
                ? "Monthly concrete distribution by role. X-axis shows month names."
                : dateFilter.type === "weekly"
                ? "Daily concrete distribution by role. X-axis shows dates."
                : "Date range concrete distribution by role. X-axis shows date ranges."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {concreteOverviewDataChartData.length ? (
              <>
                {concreteOverviewDataKeys.length > 0 && (
                  <div className="mb-4 w-full overflow-x-auto">
                    <div className="flex flex-wrap gap-3 pb-2">
                      {concreteOverviewDataKeys.map((key, index) => (
                        <div
                          key={key}
                          className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground"
                        >
                          <span
                            className="h-2 w-2 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor:
                                labourColors[index % labourColors.length],
                            }}
                          />
                          <span
                            className="whitespace-normal break-words"
                            title={key}
                          >
                            {key}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="w-full overflow-x-auto overflow-y-hidden pb-2">
                  <div className="h-[480px] min-w-[720px] md:min-w-0 md:w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={concreteOverviewDataChartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          className="stroke-muted"
                        />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          angle={dateFilter.type === "monthly" ? -45 : 0}
                          textAnchor={
                            dateFilter.type === "monthly" ? "end" : "middle"
                          }
                          height={dateFilter.type === "monthly" ? 60 : 30}
                        />
                        <YAxis
                          allowDecimals={false}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip content={<LabourTooltip />} />
                        {concreteOverviewDataKeys.map((key, index) => (
                          <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={labourColors[index % labourColors.length]}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No concrete overview data available for this period.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      {/* human overview chart  */}
      <div className="grid grid-cols-1 gap-4 mt-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg md:text-xl">
              Manpower Overview
            </CardTitle>
            {/* <CardDescription className="text-sm">
              {dateFilter.type === "yearly"
                ? "Monthly manpower distribution by role. X-axis shows month names."
                : dateFilter.type === "weekly"
                ? "Daily manpower distribution by role. X-axis shows dates."
                : "Date range manpower distribution by role. X-axis shows date ranges."}
            </CardDescription> */}
          </CardHeader>

          <CardContent>
            {humanOverviewDataChartData.length ? (
              <>
                {humanOverviewDataKeys.length > 0 && (
                  <div className="mb-4 w-full overflow-x-auto">
                    <div className="flex flex-wrap gap-3 pb-2">
                      {humanOverviewDataKeys.map((key, index) => (
                        <div
                          key={key}
                          className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground"
                        >
                          <span
                            className="h-2 w-2 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor:
                                labourColors[index % labourColors.length],
                            }}
                          />
                          <span
                            className="whitespace-normal break-words"
                            title={key}
                          >
                            {key}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="w-full overflow-x-auto overflow-y-hidden pb-2">
                  <div className="h-[480px] min-w-[720px] md:min-w-0 md:w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={humanOverviewDataChartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          className="stroke-muted"
                        />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          angle={dateFilter.type === "monthly" ? -45 : 0}
                          textAnchor={
                            dateFilter.type === "monthly" ? "end" : "middle"
                          }
                          height={dateFilter.type === "monthly" ? 60 : 30}
                        />
                        <YAxis
                          allowDecimals={false}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip content={<LabourTooltip />} />
                        {humanOverviewDataKeys.map((key, index) => (
                          <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={labourColors[index % labourColors.length]}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No human overview data available for this period.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      {/* steel usage chart  */}
      <div className="grid grid-cols-1 gap-4 mt-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg md:text-xl">Steel Usage</CardTitle>
            <CardDescription className="text-sm">
              {dateFilter.type === "yearly"
                ? "Monthly steel usage distribution by role. X-axis shows month names."
                : dateFilter.type === "weekly"
                ? "Daily steel usage distribution by role. X-axis shows dates."
                : "Date range steel usage distribution by role. X-axis shows date ranges."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {steelUsageDataChartData.length ? (
              <>
                {steelUsageDataKeys.length > 0 && (
                  <div className="mb-4 w-full overflow-x-auto">
                    <div className="flex flex-wrap gap-3 pb-2">
                      {steelUsageDataKeys.map((key, index) => (
                        <div
                          key={key}
                          className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground"
                        >
                          <span
                            className="h-2 w-2 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor:
                                labourColors[index % labourColors.length],
                            }}
                          />
                          <span
                            className="whitespace-normal break-words"
                            title={key}
                          >
                            {key}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="w-full overflow-x-auto overflow-y-hidden pb-2">
                  <div className="h-[480px] min-w-[720px] md:min-w-0 md:w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={steelUsageDataChartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          className="stroke-muted"
                        />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          angle={dateFilter.type === "monthly" ? -45 : 0}
                          textAnchor={
                            dateFilter.type === "monthly" ? "end" : "middle"
                          }
                          height={dateFilter.type === "monthly" ? 60 : 30}
                        />
                        <YAxis
                          allowDecimals={false}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip content={<LabourTooltip />} />
                        {steelUsageDataKeys.map((key, index) => (
                          <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={labourColors[index % labourColors.length]}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No human overview data available for this period.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
