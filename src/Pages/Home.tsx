import PageHeader from "@/components/ui/PageHeader";
import { apiClient } from "@/utils/apiClient";
import axios, { AxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipProps } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Average = {
  average_casted_elements: number;
};

export type TotalRejections = {
  total_rejections: number;
};

export type MonthlyRejections = {
  monthly_rejections: number;
};

export type Trends = {
  current_month_count: number;
  difference: string;
  previous_month_count: number;
};

export type ProjectStats = {
  closed: number;
  inactive: number;
  suspended: number;
  total_projects: number;
};

export type ElementStatus = {
  casted_elements: number;
  erected_elements: number;
  in_production: number;
  in_stock: number;
};

export type Project = {
  id: number;
  name: string;
};

export type AverageErectedElements = {
  average_erected_elements: number;
};

export interface HumanResouce {
  name: string;
  [key: string]: number | string;
}

export interface ProjectData {
  day: string;
  [key: string]: number | string;
}

const LabourTooltip = ({
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

const ProjectTooltip = ({
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

const getErrorMessage = (error: AxiosError | unknown): string => {
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
    return error.response?.data?.message || "Failed to fetch project data.";
  }
  return "An unexpected error occurred. Please try again later.";
};

const chartConfig = {
  projects: {
    label: "Projects",
  },
  Casted: {
    label: "Casted",
    color: "#0EA5E9",
  },
  Erected: {
    label: "Erected",
    color: "#22C55E",
  },
  "In Production": {
    label: "In Production",
    color: "#F59E0B",
  },
  "In Stock": {
    label: "In Stock",
    color: "#6366F1",
  },
} satisfies ChartConfig;

export default function Home() {
  const [projectStats, setProjectStats] = useState<ProjectStats>();
  const [elementStatus, setElementStatus] = useState<ElementStatus>();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [average, setAverage] = useState<Average>();
  const [totalRejections, setTotalRejections] = useState<TotalRejections>();
  const [averageErectedElements, setAverageErectedElements] =
    useState<AverageErectedElements>();
  const [trends, setTrends] = useState<Trends>();
  const [humanResources, setHumanResources] = useState<HumanResouce[]>([]);
  const [projectData, setProjectData] = useState<ProjectData[]>([]);

  // project id query parameter
  const WithProjectParam = (endpoint: string) => {
    return selectedProject
      ? `${endpoint}?${`project_id=${selectedProject.id}`}`
      : endpoint;
  };

  // fetch trends
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchTrends = async () => {
      try {
        const response = await apiClient.get(
          WithProjectParam("/dashboard_trends"),
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          setTrends(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch trends");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err));
        }
      }
    };

    fetchTrends();

    return () => {
      source.cancel();
    };
  }, []);

  // fetch human resources
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchHumanResources = async () => {
      try {
        const response = await apiClient.get(
          WithProjectParam("/manpower-count/dashboard"),
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          if (Array.isArray(response.data) && response.data.length > 0) {
            const validateData = response.data.filter(
              (item: HumanResouce) =>
                item && typeof item === "object" && "name" in item
            );
            setHumanResources(validateData);
          } else {
            toast.error(
              response.data?.message || "Failed to fetch human resources"
            );
          }
        } else {
          toast.error(
            response.data?.message || "Failed to fetch human resources"
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err));
        }
      }
    };

    fetchHumanResources();

    return () => {
      source.cancel();
    };
  }, []);

  // fetch project data
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchProjectData = async () => {
      try {
        const response = await apiClient.get(
          WithProjectParam("/element_graph"),
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          if (Array.isArray(response.data) && response.data.length > 0) {
            const validateData = response.data.filter(
              (item: ProjectData) =>
                item && typeof item === "object" && "day" in item
            );
            setProjectData(validateData);
          } else {
            toast.error(
              response.data?.message || "Failed to fetch project data"
            );
          }
        } else {
          toast.error(response.data?.message || "Failed to fetch project data");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err));
        }
      }
    };

    fetchProjectData();

    return () => {
      source.cancel();
    };
  }, []);

  // project stats

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchElementStatus = async () => {
      try {
        const response = await apiClient.get(
          WithProjectParam("/element_status"),
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          setElementStatus(response.data);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch element status"
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err));
        }
      }
    };

    fetchElementStatus();

    return () => {
      source.cancel();
    };
  }, []);

  // fetch average casted elements
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchAverageCastedElements = async () => {
      try {
        const response = await apiClient.get(
          WithProjectParam("/average_casted"),
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          setAverage(response.data);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch average casted elements"
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err));
        }
      }
    };

    fetchAverageCastedElements();

    return () => {
      source.cancel();
    };
  }, []);

  // fetch average erected elements
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchAverageErectedElements = async () => {
      try {
        const response = await apiClient.get(
          WithProjectParam("/average_erected"),
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          setAverageErectedElements(response.data);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch average erected elements"
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err));
        }
      }
    };

    fetchAverageErectedElements();

    return () => {
      source.cancel();
    };
  }, []);

  // total rejections
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchTotalRejections = async () => {
      try {
        const response = await apiClient.get(
          WithProjectParam("/total_rejections"),
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          setTotalRejections(response.data);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch total rejections"
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err));
        }
      }
    };

    fetchTotalRejections();

    return () => {
      source.cancel();
    };
  }, []);

  const chartData = useMemo(
    () =>
      projectStats
        ? [
            {
              name: "Total",
              value: projectStats.total_projects,
              fill: "#6366F1",
            },
            {
              name: "Closed",
              value: projectStats.closed,
              fill: "#22C55E",
            },
            {
              name: "Inactive",
              value: projectStats.inactive,
              fill: "#F97316",
            },
            {
              name: "Suspended",
              value: projectStats.suspended,
              fill: "#EF4444",
            },
          ]
        : [],
    [projectStats]
  );

  const pieData = useMemo(
    () =>
      elementStatus
        ? [
            {
              name: "Casted",
              value: elementStatus.casted_elements,
              fill: "#0EA5E9",
            },
            {
              name: "Erected",
              value: elementStatus.erected_elements,
              fill: "#22C55E",
            },
            {
              name: "In Production",
              value: elementStatus.in_production,
              fill: "#F59E0B",
            },
            {
              name: "In Stock",
              value: elementStatus.in_stock,
              fill: "#6366F1",
            },
          ]
        : [],
    [elementStatus]
  );

  const labourMetricKeys = useMemo(() => {
    if (!humanResources || humanResources.length === 0) return [];

    const sample = humanResources[0];
    return Object.keys(sample).filter((key) => key !== "name" && key !== "day");
  }, [humanResources]);

  const labourChartData = useMemo(
    () =>
      humanResources && humanResources.length > 0
        ? humanResources.map((item, index) => ({
            ...item,
            index: index + 1, // 1, 2, 3, ... for X-axis
          }))
        : [],
    [humanResources]
  );

  const projectMetricKeys = useMemo(() => {
    if (!projectData || projectData.length === 0) return [];

    const sample = projectData[0];
    return Object.keys(sample).filter((key) => key !== "day");
  }, [projectData]);

  const projectChartData = useMemo(
    () =>
      projectData && projectData.length > 0
        ? projectData.map((item, index) => ({
            ...item,
            index: index + 1, // 1, 2, 3, ... for X-axis
          }))
        : [],
    [projectData]
  );

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

  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex item-center justify-between">
        <PageHeader title="Monthly Overview" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pie Chart Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="space-y-1">
              <div>Element Status</div>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {elementStatus ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={2}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-pie-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend
                    content={<ChartLegendContent nameKey="name" />}
                    verticalAlign="bottom"
                    height={36}
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground mt-4">
                Loading element status...
              </p>
            )}
          </CardContent>
        </Card>
        <div className="grid grid-rows-1 md:grid-rows-2 gap-4 ">
          {/* first column with 4 card in grid layout  */}
          <div className="grid grid-cols-2 gap-4">
            {/* first card  */}
            <Card>
              <CardContent>
                {/* two block in the card content */}
                {/* two row   */}
                <div className="flex flex-col gap-2 items-center justify-center">
                  <div className="text-lg md:text-2xl font-semibold">
                    {average?.average_casted_elements.toFixed(2)}
                  </div>
                  {/* can we use lighter vesrion of text-primary color for this text */}
                  <div className="text-sm text-primary/80">
                    Average Casted Elements
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="flex flex-col gap-2 items-center justify-center">
                  <div className="text-lg md:text-2xl font-semibold">
                    {averageErectedElements?.average_erected_elements.toFixed(
                      2
                    )}
                  </div>
                  <div className="text-sm text-primary/80">
                    Avg. Elements Erected Daily
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="flex flex-col gap-2 items-center justify-center">
                  <div className="text-lg md:text-2xl font-semibold">
                    {totalRejections?.total_rejections.toFixed(2)}
                  </div>
                  <div className="text-sm text-primary/80">
                    Total Rejections
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="flex flex-col gap-2 items-center justify-center">
                  <div className="text-lg md:text-2xl font-semibold">
                    {averageErectedElements?.average_erected_elements
                      ? (
                          averageErectedElements.average_erected_elements * 30
                        ).toFixed(2)
                      : 0}
                  </div>
                  <div className="text-sm text-primary/80">
                    Erections Forecasted This Month
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* second column with a single card  */}
          <Card>
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg md:text-xl">
                Erections Forecasted This Month
              </CardTitle>
              {/* make description content smaller  */}
              <CardDescription className="text-sm">
                The forecasted number of erections for the current month based
                on the average number of elements erected daily.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* body has 3 metric blocks; keep them aligned across breakpoints */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  {/* show current month count */}
                  <div className="text-lg md:text-3xl font-semibold leading-tight">
                    {trends?.current_month_count}
                  </div>
                  <div className="text-xs md:text-sm text-primary/80">
                    Current Month Count
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-lg md:text-3xl font-semibold leading-tight">
                    {trends?.previous_month_count}
                  </div>
                  <div className="text-xs md:text-sm text-primary/80">
                    Previous Month Count
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-lg md:text-2xl font-semibold leading-tight break-words">
                    {trends?.difference}
                  </div>
                  <div className="text-xs md:text-sm text-primary/80">
                    Difference
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* second row   */}

      {/* labour graph first row  */}
      <div className="grid grid-cols-1 gap-4 mt-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg md:text-xl">
              Manpower Report
            </CardTitle>
            {/* <CardDescription className="text-sm">
              Daily manpower distribution by role. X-axis shows the day of the
              month.
            </CardDescription> */}
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
                        <Tooltip content={<LabourTooltip />} />
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
      </div>

      {/* project graph second row  */}
      <div className="grid grid-cols-1 gap-4 mt-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg md:text-xl">
              Daily Project Report (Current Month)
            </CardTitle>
            {/* <CardDescription className="text-sm">
              Daily project distribution by status. X-axis shows the day of the
              month and Y-axis shows the number of elements.
            </CardDescription> */}
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
                        <Tooltip content={<LabourTooltip />} />
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
      </div>
    </div>
  );
}
