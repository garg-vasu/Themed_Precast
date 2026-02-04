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

const ChartTooltip = ({
  active,
  label,
  payload,
}: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-md border bg-background px-3 py-2 shadow-md text-xs md:text-sm">
      <div className="mb-2 font-semibold">{label}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 max-w-xs md:max-w-md">
        {payload.map((item) => (
          <div
            key={String(item.dataKey)}
            className="flex items-center gap-1 whitespace-nowrap"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color || "#22C55E" }}
            />
            <span className="truncate">
              {item.name} : {item.value}
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
                    />
                    <Tooltip content={<ChartTooltip />} />
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
