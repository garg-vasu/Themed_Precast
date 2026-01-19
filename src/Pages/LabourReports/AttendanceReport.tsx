import { apiClient } from "@/utils/apiClient";
import axios, { AxiosError } from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export interface Project {
  project_id: string;
  name: string;
  suspend: boolean;
}

export interface FirstLine {
  total_manpower: number;
  total_skills: number;
  total_vendors: number;
}

type ProjectTypeManpowerDate = {
  [key: string]: number | string;
  name: string;
};

type SkilltypeDatum = {
  [key: string]: number | string;
  name: string; // This will be the time period (month name)
};

type SkillDatum = {
  [key: string]: number | string;
  name: string;
};

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

export default function AttendanceReport() {
  const [projectData, setProjectData] = useState<Project[]>([]);
  const [skillData, setSkillData] = useState<SkillDatum[]>([]);
  const [skilltypeData, setSkilltypeData] = useState<SkilltypeDatum[]>([]);
  const [labourDays, setLabourDays] = useState<FirstLine>({
    total_skills: 0,
    total_vendors: 0,
    total_manpower: 0,
  });
  const [projectTypeManpowerDate, setProjectTypeManpowerDate] = useState<
    ProjectTypeManpowerDate[]
  >([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  const projectTypeManpowerDateKeys = useMemo(() => {
    if (!projectTypeManpowerDate || projectTypeManpowerDate.length === 0)
      return [];

    const sample = projectTypeManpowerDate[0];
    return Object.keys(sample).filter((key) => key !== "name" && key !== "day");
  }, [projectTypeManpowerDate]);

  const projectTypeManpowerDateChartData = useMemo(() => {
    if (!projectTypeManpowerDate || projectTypeManpowerDate.length === 0) {
      return [];
    }

    // Format dates for weekly view (YYYY-MM-DD format)
    return projectTypeManpowerDate.map((item) => {
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
  }, [projectTypeManpowerDate]);

  const skillDataKeys = useMemo(() => {
    if (!skillData || skillData.length === 0) return [];

    const sample = skillData[0];
    return Object.keys(sample).filter((key) => key !== "name" && key !== "day");
  }, [skillData]);

  const skillDataChartData = useMemo(() => {
    if (!skillData || skillData.length === 0) {
      return [];
    }

    // Format dates for weekly view (YYYY-MM-DD format)
    return skillData.map((item) => {
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
  }, [skillData]);

  const skilltypeDataKeys = useMemo(() => {
    if (!skilltypeData || skilltypeData.length === 0) return [];

    const sample = skilltypeData[0];
    return Object.keys(sample).filter((key) => key !== "name" && key !== "day");
  }, [skilltypeData]);

  const skilltypeDataChartData = useMemo(() => {
    if (!skillData || skillData.length === 0) {
      return [];
    }

    // Format dates for weekly view (YYYY-MM-DD format)
    return skilltypeData.map((item) => {
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
  }, [skilltypeData]);

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

  const buildQueryParams = useCallback(() => {
    let params = "";

    // Add project_id if selected
    if (selectedProjectId) {
      params = `project_id=${encodeURIComponent(selectedProjectId)}`;
    }

    // Add date filter parameters
    const dateParams = `type=${dateFilter.type}&year=${dateFilter.year}`;
    if (params) {
      params += `&${dateParams}`;
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
  }, [dateFilter, selectedProjectId]);

  //   fetch projects
  const fetchProject = useCallback(async () => {
    const source = axios.CancelToken.source();
    try {
      const response = await apiClient.get(`/projects/basic`, {
        cancelToken: source.token,
      });

      if (response.status === 200) {
        setProjectData(response.data);
        return response.data;
      } else {
        toast.error(response.data?.message || "Failed to fetch projects");
        return null;
      }
    } catch (err: unknown) {
      if (!axios.isCancel(err)) {
        toast.error(getErrorMessage(err, "fetch projects"));
      }
      return null;
    }
  }, []);

  //   fetch labour days
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchLabourDays = async () => {
      try {
        const response = await apiClient.get(
          `/manpower/dashboard?${buildQueryParams()}`,
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          setLabourDays(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch labour days");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "labour days data"));
        }
      }
    };

    fetchLabourDays();

    return () => {
      source.cancel();
    };
  }, [dateFilter, selectedProjectId]);

  //   fetch project type manpower date
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchProjectTypeManpowerDate = async () => {
      try {
        const response = await apiClient.get(
          `/project_manpower/dashboard?${buildQueryParams()}`,
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          setProjectTypeManpowerDate(response.data);
        } else {
          toast.error(
            response.data?.message ||
              "Failed to fetch project type manpower date"
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "project type manpower date data"));
        }
      }
    };

    fetchProjectTypeManpowerDate();

    return () => {
      source.cancel();
    };
  }, [dateFilter, selectedProjectId]);

  //   skill data
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchSkillData = async () => {
      try {
        const response = await apiClient.get(
          `manpower/skills/dashboard?${buildQueryParams()}`,
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          setSkillData(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch skill data");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "skill data"));
        }
      }
    };

    fetchSkillData();

    return () => {
      source.cancel();
    };
  }, [dateFilter, selectedProjectId]);

  //   Skill type data
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchSkilltypeData = async () => {
      try {
        const response = await apiClient.get(
          `manpower/skill_type/dashboard?${buildQueryParams()}`,
          {
            cancelToken: source.token,
          }
        );

        if (response.status === 200) {
          setSkilltypeData(response.data);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch skill type data"
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "skill type data"));
        }
      }
    };

    fetchSkilltypeData();

    return () => {
      source.cancel();
    };
  }, [dateFilter, selectedProjectId]);

  useEffect(() => {
    fetchProject();
  }, []);

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
      <div className="flex item-center justify-between">
        <PageHeader title="Attendance Report" />
        <Select
          value={selectedProjectId ? selectedProjectId : ""}
          onValueChange={(value) => setSelectedProjectId(value)}
        >
          <SelectTrigger className="max-w-[180px]">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Projects</SelectLabel>
              {projectData.map((project) => (
                <SelectItem
                  key={project.project_id}
                  value={project.project_id.toString()}
                >
                  {project.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <DateFilter onChange={handleDateFilterChange} />
      </div>
      {/* body section  */}
      {/* first section will have three column row  */}
      <div className="grid md:grid-cols-3 grid-cols-1 gap-2 mt-2">
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
          {/* <CardHeader>
            <CardTitle>Vendors Engaged</CardTitle>
          </CardHeader> */}
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
      </div>
      {/* project type manpower date chart  */}
      <div className="grid grid-cols-1 gap-4 mt-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg md:text-xl">Labour Count</CardTitle>
            <CardDescription className="text-sm">
              {dateFilter.type === "yearly"
                ? "Monthly manpower distribution by role. X-axis shows month names."
                : dateFilter.type === "weekly"
                ? "Daily manpower distribution by role. X-axis shows dates."
                : "Date range manpower distribution by role. X-axis shows date ranges."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {projectTypeManpowerDateChartData.length ? (
              <>
                {projectTypeManpowerDateKeys.length > 0 && (
                  <div className="mb-4 w-full overflow-x-auto">
                    <div className="flex flex-wrap gap-3 pb-2">
                      {projectTypeManpowerDateKeys.map((key, index) => (
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
                      <LineChart data={projectTypeManpowerDateChartData}>
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
                        {projectTypeManpowerDateKeys.map((key, index) => (
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
                No project type manpower date data available for this period.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      {/* skill chart section  */}
      <div className="grid grid-cols-1 gap-4 mt-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg md:text-xl">
              Skills Deployed
            </CardTitle>
            <CardDescription className="text-sm">
              {dateFilter.type === "yearly"
                ? "Monthly skills distribution by role. X-axis shows month names."
                : dateFilter.type === "weekly"
                ? "Daily skills distribution by role. X-axis shows dates."
                : "Date range skills distribution by role. X-axis shows date ranges."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {skillData.length ? (
              <>
                {skillDataKeys.length > 0 && (
                  <div className="mb-4 w-full overflow-x-auto">
                    <div className="flex flex-wrap gap-3 pb-2">
                      {skillDataKeys.map((key, index) => (
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
                      <LineChart data={skillDataChartData}>
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
                        {skillDataKeys.map((key, index) => (
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
                No skill data available for this period.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      {/* skill type chart section  */}

      <div className="grid grid-cols-1 gap-4 mt-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg md:text-xl">
              Skill Types Deployed
            </CardTitle>
            <CardDescription className="text-sm">
              {dateFilter.type === "yearly"
                ? "Monthly skill types distribution by role. X-axis shows month names."
                : dateFilter.type === "weekly"
                ? "Daily skill types distribution by role. X-axis shows dates."
                : "Date range skill types distribution by role. X-axis shows date ranges."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {skilltypeData.length ? (
              <>
                {skilltypeDataKeys.length > 0 && (
                  <div className="mb-4 w-full overflow-x-auto">
                    <div className="flex flex-wrap gap-3 pb-2">
                      {skilltypeDataKeys.map((key, index) => (
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
                      <LineChart data={skilltypeDataChartData}>
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
                        {skilltypeDataKeys.map((key, index) => (
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
                No skill type data available for this period.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
