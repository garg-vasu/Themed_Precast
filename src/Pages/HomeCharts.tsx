import { memo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HumanResouce, ProjectData } from "./Home";

type LabourChartProps = {
  labourChartData: HumanResouce[];
  labourMetricKeys: string[];
  labourColors: string[];
};

type ProjectChartProps = {
  projectChartData: ProjectData[];
  projectMetricKeys: string[];
  labourColors: string[];
};

const formatFullDateLabel = (raw: string | number | undefined): string => {
  if (!raw) return "";

  const value = String(raw).trim();

  // Try parsing as date - supports YYYY-MM-DD and ISO format
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
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
    const dayNum = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month} ${dayNum} ${year}`;
  }

  return value;
};

const ChartTooltip = ({
  active,
  payload,
  excludeKeys,
  dateLabelKey = "name",
}: TooltipProps<number, string> & {
  excludeKeys?: string[];
  dateLabelKey?: "name" | "day";
}) => {
  if (!active || !payload || payload.length === 0) return null;

  const firstPayload = payload[0]?.payload as
    | (HumanResouce & ProjectData & { index?: number })
    | undefined;

  const rawLabel =
    (firstPayload && dateLabelKey in firstPayload
      ? firstPayload[dateLabelKey]
      : firstPayload?.name ?? firstPayload?.day) as string | undefined;
  const formattedLabel = formatFullDateLabel(rawLabel);

  const filteredPayload = excludeKeys?.length
    ? payload.filter((item) => !excludeKeys.includes(String(item.dataKey)))
    : payload;

  return (
    <div className="rounded-md border bg-background px-3 py-2 shadow-md text-xs md:text-sm">
      {formattedLabel && (
        <div className="mb-2 font-semibold">{formattedLabel}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 max-w-xs md:max-w-md">
        {filteredPayload.map((item) => (
          <div key={String(item.dataKey)} className="flex items-center gap-1">
            <span
              className="h-2 w-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color || "#22C55E" }}
            />
            <span className="flex items-center gap-1 min-w-0">
              <span
                className="truncate max-w-[140px]"
                title={String(item.name ?? "")}
              >
                {item.name}
              </span>
              <span className="whitespace-nowrap">: {item.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const LabourChart = memo(function LabourChart({
  labourChartData,
  labourMetricKeys,
  labourColors,
}: LabourChartProps) {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg md:text-xl">Manpower Report</CardTitle>
      </CardHeader>

      <CardContent>
        {labourChartData.length ? (
          <>
            {labourMetricKeys.length > 0 && (
              <div className="mb-4 w-full overflow-x-auto">
                <div className="flex flex-wrap gap-3 pb-2">
                  {labourMetricKeys.map((key, index) => (
                    <div
                      key={key}
                      className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground whitespace-nowrap"
                    >
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            labourColors[index % labourColors.length],
                        }}
                      />
                      <span className="truncate max-w-[160px]" title={key}>
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
                  <BarChart data={labourChartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="index"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      label={{
                        value: "No. of people",
                        angle: -90,
                        position: "insideLeft",
                        style: { textAnchor: "middle" },
                      }}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    {labourMetricKeys.map((key, index) => (
                      <Bar
                        key={key}
                        dataKey={key}
                        stackId="labour"
                        fill={labourColors[index % labourColors.length]}
                        radius={
                          index === labourMetricKeys.length - 1
                            ? [4, 4, 0, 0]
                            : 0
                        }
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No labour data available for this period.
          </p>
        )}
      </CardContent>
    </Card>
  );
});

export const ProjectChart = memo(function ProjectChart({
  projectChartData,
  projectMetricKeys,
  labourColors,
}: ProjectChartProps) {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg md:text-xl">
          Daily Project Report (Current Month)
        </CardTitle>
      </CardHeader>

      <CardContent>
        {projectChartData.length ? (
          <>
            {projectMetricKeys.length > 0 && (
              <div className="mb-4 w-full overflow-x-auto">
                <div className="flex flex-wrap gap-3 pb-2">
                  {projectMetricKeys.map((key, index) => (
                    <div
                      key={key}
                      className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground whitespace-nowrap"
                    >
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            labourColors[index % labourColors.length],
                        }}
                      />
                      <span className="truncate max-w-[160px]" title={key}>
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
                  <LineChart data={projectChartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="index"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      label={{
                        value: "No. of elements",
                        angle: -90,
                        position: "insideLeft",
                        style: { textAnchor: "middle" },
                      }}
                    />
                    <Tooltip
                      content={
                        <ChartTooltip
                          dateLabelKey="day"
                          excludeKeys={["name", "day"]}
                        />
                      }
                    />
                    {projectMetricKeys.map((key, index) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={labourColors[index % labourColors.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No project data available for this period.
          </p>
        )}
      </CardContent>
    </Card>
  );
});
