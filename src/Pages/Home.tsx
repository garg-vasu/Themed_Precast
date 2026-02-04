import PageHeader from "@/components/ui/PageHeader";
import { apiClient } from "@/utils/apiClient";
import axios, { AxiosError } from "axios";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Cell,
  Pie,
  PieChart,
} from "recharts";
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

const LabourChart = lazy(() =>
  import("./HomeCharts").then((module) => ({
    default: module.LabourChart,
  }))
);

const ProjectChart = lazy(() =>
  import("./HomeCharts").then((module) => ({
    default: module.ProjectChart,
  }))
);

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
  const chartsRef = useRef<HTMLDivElement | null>(null);
  const [chartsInView, setChartsInView] = useState(false);

  const chartConfig = useMemo(
    () =>
      ({
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
      }) satisfies ChartConfig,
    []
  );

  const labourColors = useMemo(
    () => [
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
    ],
    []
  );

  // project id query parameter
  const WithProjectParam = (endpoint: string) =>
    selectedProject
      ? `${endpoint}?${`project_id=${selectedProject.id}`}`
      : endpoint;

  // observe chart visibility for lazy loading
  useEffect(() => {
    if (!chartsRef.current || chartsInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setChartsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(chartsRef.current);

    return () => {
      observer.disconnect();
    };
  }, [chartsInView]);

  // batched fetch for dashboard data
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchAll = async () => {
      const requests = [
        apiClient.get(WithProjectParam("/dashboard_trends"), {
          cancelToken: source.token,
        }),
        apiClient.get(WithProjectParam("/manpower-count/dashboard"), {
          cancelToken: source.token,
        }),
        apiClient.get(WithProjectParam("/element_graph"), {
          cancelToken: source.token,
        }),
        apiClient.get(WithProjectParam("/element_status"), {
          cancelToken: source.token,
        }),
        apiClient.get(WithProjectParam("/average_casted"), {
          cancelToken: source.token,
        }),
        apiClient.get(WithProjectParam("/average_erected"), {
          cancelToken: source.token,
        }),
        apiClient.get(WithProjectParam("/total_rejections"), {
          cancelToken: source.token,
        }),
      ];

      const results = await Promise.allSettled(requests);

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          if (!axios.isCancel(result.reason)) {
            toast.error(getErrorMessage(result.reason));
          }
          return;
        }

        const response = result.value;
        if (response.status !== 200) {
          toast.error(response.data?.message || "Failed to fetch dashboard data");
          return;
        }

        switch (index) {
          case 0:
            setTrends(response.data);
            break;
          case 1:
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
            break;
          case 2:
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
            break;
          case 3:
            setElementStatus(response.data);
            break;
          case 4:
            setAverage(response.data);
            break;
          case 5:
            setAverageErectedElements(response.data);
            break;
          case 6:
            setTotalRejections(response.data);
            break;
          default:
            break;
        }
      });
    };

    fetchAll();

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

  const averageCastedText = useMemo(
    () => average?.average_casted_elements.toFixed(2) ?? "--",
    [average]
  );

  const averageErectedText = useMemo(
    () => averageErectedElements?.average_erected_elements.toFixed(2) ?? "--",
    [averageErectedElements]
  );

  const totalRejectionsText = useMemo(
    () => totalRejections?.total_rejections.toFixed(2) ?? "--",
    [totalRejections]
  );

  const monthlyForecastText = useMemo(() => {
    if (!averageErectedElements?.average_erected_elements) return "0";
    return (averageErectedElements.average_erected_elements * 30).toFixed(2);
  }, [averageErectedElements]);

  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex item-center justify-between">
        <PageHeader title="Monthly Overview" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Pie Chart Card */}
        <Card className="flex flex-col lg:col-span-7">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg md:text-xl">Element Status</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {elementStatus ? (
              <ChartContainer
                config={chartConfig}
                className="h-[260px] sm:h-[300px] lg:h-[340px] w-full"
              >
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
        <div className="grid gap-4 lg:col-span-5">
          {/* first column with 4 card in grid layout  */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* first card  */}
            <Card>
              <CardContent className="p-4 md:p-6">
                {/* two block in the card content */}
                {/* two row   */}
                <div className="flex flex-col gap-1.5 items-center justify-center text-center">
                  <div className="text-lg md:text-2xl font-semibold tabular-nums">
                    {averageCastedText}
                  </div>
                  {/* can we use lighter vesrion of text-primary color for this text */}
                  <div className="text-sm text-primary/80">
                    Average Casted Elements
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col gap-1.5 items-center justify-center text-center">
                  <div className="text-lg md:text-2xl font-semibold tabular-nums">
                    {averageErectedText}
                  </div>
                  <div className="text-sm text-primary/80">
                    Avg. Elements Erected Daily
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col gap-1.5 items-center justify-center text-center">
                  <div className="text-lg md:text-2xl font-semibold tabular-nums">
                    {totalRejectionsText}
                  </div>
                  <div className="text-sm text-primary/80">
                    Total Rejections
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col gap-1.5 items-center justify-center text-center">
                  <div className="text-lg md:text-2xl font-semibold tabular-nums">
                    {monthlyForecastText}
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
            <CardContent className="p-4 md:p-6">
              {/* body has 3 metric blocks; keep them aligned across breakpoints */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1 text-center sm:text-left">
                  {/* show current month count */}
                  <div className="text-lg md:text-3xl font-semibold leading-tight tabular-nums">
                    {trends?.current_month_count}
                  </div>
                  <div className="text-xs md:text-sm text-primary/80">
                    Current Month Count
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-center sm:text-left">
                  <div className="text-lg md:text-3xl font-semibold leading-tight tabular-nums">
                    {trends?.previous_month_count}
                  </div>
                  <div className="text-xs md:text-sm text-primary/80">
                    Previous Month Count
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-center sm:text-left">
                  <div className="text-lg md:text-2xl font-semibold leading-tight break-words tabular-nums">
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

      <div ref={chartsRef} className="grid grid-cols-1 gap-4 mt-4">
        <Suspense
          fallback={
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg md:text-xl">
                  Manpower Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Loading manpower report...
                </p>
              </CardContent>
            </Card>
          }
        >
          {chartsInView ? (
            <LabourChart
              labourChartData={labourChartData}
              labourMetricKeys={labourMetricKeys}
              labourColors={labourColors}
            />
          ) : (
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg md:text-xl">
                  Manpower Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Scroll to load chart...
                </p>
              </CardContent>
            </Card>
          )}
        </Suspense>
      </div>

      <div className="grid grid-cols-1 gap-4 mt-4">
        <Suspense
          fallback={
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg md:text-xl">
                  Daily Project Report (Current Month)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Loading project report...
                </p>
              </CardContent>
            </Card>
          }
        >
          {chartsInView ? (
            <ProjectChart
              projectChartData={projectChartData}
              projectMetricKeys={projectMetricKeys}
              labourColors={labourColors}
            />
          ) : (
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg md:text-xl">
                  Daily Project Report (Current Month)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Scroll to load chart...
                </p>
              </CardContent>
            </Card>
          )}
        </Suspense>
      </div>
    </div>
  );
}
