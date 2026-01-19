import { apiClient } from "@/utils/apiClient";
import axios, { AxiosError } from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { TooltipProps } from "recharts";
import { useParams } from "react-router-dom";

type StockyardSummaryDate = {
  [key: string]: number | string;
  name: string;
};

interface ElementTypeReport {
  count: number;
  element_type: string;
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

export default function StockyardSummary() {
  const { projectId } = useParams();

  const [stockyardSummaryDate, setStockyardSummaryDate] = useState<
    StockyardSummaryDate[]
  >([]);
  const [elementTypeData, setElementTypeData] = useState<ElementTypeReport[]>(
    []
  );

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

  const stockyardSummaryDateKeys = useMemo(() => {
    if (!stockyardSummaryDate || stockyardSummaryDate.length === 0) return [];

    const sample = stockyardSummaryDate[0];
    return Object.keys(sample).filter((key) => key !== "name" && key !== "day");
  }, [stockyardSummaryDate]);

  const stockyardSummaryDateChartData = useMemo(() => {
    if (!stockyardSummaryDate || stockyardSummaryDate.length === 0) {
      return [];
    }

    // Format dates based on filter type
    return stockyardSummaryDate.map((item) => {
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
  }, [stockyardSummaryDate, dateFilter.type]);

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

  // Transform element type data for pie chart
  const elementTypeChartData = useMemo(() => {
    return elementTypeData.map((item) => ({
      name: item.element_type,
      value: item.count,
    }));
  }, [elementTypeData]);

  //   fetch Stockyard Summary
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchStockyardSummaryDate = async () => {
      try {
        const response = await apiClient.get(
          `/stockyard_reports/${projectId}?${buildQueryParams()}`,
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          setStockyardSummaryDate(response.data);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch stockyard summary date"
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "stockyard summary date data"));
        }
      }
    };

    fetchStockyardSummaryDate();

    return () => {
      source.cancel();
    };
  }, [dateFilter, buildQueryParams, projectId]);

  //   fetch Element Type Reports
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchElementTypeReports = async () => {
      try {
        const response = await apiClient.get(
          `/element_type_reports/${projectId}?${buildQueryParams()}`,
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          setElementTypeData(response.data);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch element type reports"
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "element type reports data"));
        }
      }
    };

    fetchElementTypeReports();

    return () => {
      source.cancel();
    };
  }, [dateFilter, buildQueryParams, projectId]);

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
        <PageHeader title="Stockyard Summary" />

        <DateFilter onChange={handleDateFilterChange} />
      </div>
      {/* body section  */}

      {/* production overview chart  */}
      <div className="grid grid-cols-1 gap-4 mt-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg md:text-xl">
              Stockyard Summary
            </CardTitle>
            <CardDescription className="text-sm">
              {dateFilter.type === "yearly"
                ? "Monthly stockyard summary distribution by role. X-axis shows month names."
                : dateFilter.type === "weekly"
                ? "Daily stockyard summary distribution by role. X-axis shows dates."
                : "Date range stockyard summary distribution by role. X-axis shows date ranges."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {stockyardSummaryDateChartData.length ? (
              <>
                {stockyardSummaryDateKeys.length > 0 && (
                  <div className="mb-4 w-full overflow-x-auto">
                    <div className="flex flex-wrap gap-3 pb-2">
                      {stockyardSummaryDateKeys.map((key, index) => (
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
                      <LineChart data={stockyardSummaryDateChartData}>
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
                        {stockyardSummaryDateKeys.map((key, index) => (
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
                No stockyard summary date data available for this period.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Element Type Pie Chart */}
      <div className="grid grid-cols-1 gap-4 mt-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg md:text-xl">
              Element Type Distribution
            </CardTitle>
            <CardDescription className="text-sm">
              Distribution of elements by type for the selected period.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {elementTypeChartData.length > 0 ? (
              <div className="w-full">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={elementTypeChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {elementTypeChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={labourColors[index % labourColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-md border bg-background px-3 py-2 shadow-md text-xs md:text-sm">
                              <div className="font-semibold mb-1">
                                {payload[0].payload.name}
                              </div>
                              <div className="text-muted-foreground">
                                Count: {payload[0].value}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => {
                        const item = elementTypeChartData.find(
                          (d) => d.name === value
                        );
                        return `${value} (${item?.value || 0})`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No element type data available for this period.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
