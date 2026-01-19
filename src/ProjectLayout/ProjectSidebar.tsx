import {
  Home,
  Users,
  FileText,
  ShoppingBasket,
  Calendar,
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  List,
  ChevronsUpDown,
  BarChart,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { NavLink, useLocation, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { apiClient } from "@/utils/apiClient";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

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
    return error.response?.data?.message || `Failed to fetch ${data}.`;
  }
  return "An unexpected error occurred. Please try again later.";
};

export interface ProjectView {
  project_id: number;
  name: string;
  suspend: boolean;
}

export interface NavigationItem {
  name: string;
  href?: string;
  icon: any;
  children?: NavigationItem[];
}

function NavigationItemComponent({
  item,
  isCollapsed,
  level = 0,
}: {
  item: NavigationItem;
  isCollapsed: boolean;
  level?: number;
}) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const Icon = item.icon;

  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.href ? location.pathname === item.href : false;
  const hasActiveChild =
    hasChildren && item.children
      ? item.children.some((child) => child.href === location.pathname)
      : false;

  // Auto-expand if child is active
  useEffect(() => {
    if (hasActiveChild && !isCollapsed) {
      setIsOpen(true);
    }
  }, [hasActiveChild, isCollapsed]);

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => !isCollapsed && setIsOpen(!isOpen)}
          className={`flex items-center w-full ${
            isCollapsed ? "justify-center" : "justify-between"
          } px-3 py-2 rounded-md text-sm font-normal transition-colors duration-150 ${
            hasActiveChild
              ? "bg-sidebar-accent/50 border-l-2 border-sidebar-primary text-sidebar-foreground"
              : "hover:bg-sidebar-accent text-sidebar-foreground"
          }`}
          style={{
            paddingLeft: isCollapsed
              ? undefined
              : `${0.75 + level * 0.5 - (hasActiveChild ? 0.125 : 0)}rem`,
          }}
          title={isCollapsed ? item.name : ""}
        >
          <div className="flex items-center space-x-3">
            <Icon
              className={`h-5 w-5 flex-shrink-0 ${
                hasActiveChild
                  ? "text-sidebar-primary"
                  : "text-sidebar-foreground"
              }`}
            />
            {!isCollapsed && <span className="truncate">{item.name}</span>}
          </div>
          {!isCollapsed && (
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-150 ease-out flex-shrink-0 ${
                isOpen ? "rotate-0" : "-rotate-90"
              }`}
              style={{ willChange: "transform" }}
            />
          )}
        </button>

        {!isCollapsed && (
          <div
            className={`overflow-hidden transition-all duration-150 ease-out ${
              isOpen
                ? "max-h-[500px] opacity-100 translate-y-0"
                : "max-h-0 opacity-0 -translate-y-2"
            }`}
            style={{
              transitionProperty: "max-height, opacity, transform",
            }}
          >
            <div className="py-1 space-y-1 pl-2">
              {item.children?.map((child) => (
                <NavigationItemComponent
                  key={child.href || child.name}
                  item={child}
                  isCollapsed={isCollapsed}
                  level={level + 1}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.href!}
      className={`flex items-center ${
        isCollapsed ? "justify-center" : "justify-start"
      } space-x-3 px-3 py-2 rounded-md text-sm font-normal transition-colors duration-150 ${
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "hover:bg-sidebar-accent text-sidebar-foreground"
      }`}
      style={{
        paddingLeft: isCollapsed ? undefined : `${0.75 + level * 0.5}rem`,
      }}
      title={isCollapsed ? item.name : ""}
    >
      <Icon
        className={`h-5 w-5 flex-shrink-0 ${
          isActive ? "text-sidebar-primary-foreground" : ""
        }`}
      />
      {!isCollapsed && <span className="truncate">{item.name}</span>}
    </NavLink>
  );
}

export default function ProjectSidebar({
  isCollapsed,
  onToggle,
}: SidebarProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [projectData, setProjectData] = useState<ProjectView[]>([]);

  const navigationItems: NavigationItem[] = [
    {
      name: "Dashboard",
      href: `/project/${projectId}/dashboard`,
      icon: BarChart,
    },
    {
      name: "Config",
      icon: Home,
      children: [
        {
          name: "Members",
          href: `/project/${projectId}/member`,
          icon: Calendar,
        },
        {
          name: "Stages",
          href: `/project/${projectId}/stages`,
          icon: List,
        },
        {
          name: "Drawing",
          href: `/project/${projectId}/drawing`,
          icon: List,
        },
        {
          name: "Element Type",
          href: `/project/${projectId}/element-type`,
          icon: List,
        },
        {
          name: "Bom",
          href: `/project/${projectId}/bom`,
          icon: List,
        },
      ],
    },
    {
      name: "Stockyard",
      href: `/project/${projectId}/element-stockyard`,
      icon: List,
    },
    {
      name: "Stockyard Assign",
      href: `/project/${projectId}/stockyard-assign`,
      icon: Users,
    },
    {
      name: "Approval",
      href: `/project/${projectId}/planning-approval`,
      icon: FileText,
    },
    {
      name: "Erect Log",
      href: `/project/${projectId}/errection-receving`,
      icon: List,
    },
    {
      name: "Rectification",
      href: `/project/${projectId}/retification`,
      icon: List,
    },
    {
      name: "Erection Request",
      href: `/project/${projectId}/errection-request`,
      icon: List,
    },
    {
      name: "Dispatch",
      href: `/project/${projectId}/dispatch-log`,
      icon: List,
    },
    { name: "Plan", href: `/project/${projectId}/plan`, icon: Calendar },
    {
      name: "Erection Element",
      href: `/project/${projectId}/erection-element`,
      icon: List,
    },
    {
      name: "Reports",
      icon: Home,
      children: [
        {
          name: "Project Summary",
          href: `/project/${projectId}/project-summary`,
          icon: FileText,
        },
        {
          name: "Stockyard Summary",
          href: `/project/${projectId}/stockyard-summary`,
          icon: FileText,
        },
      ],
    },
  ];

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchProjects = async () => {
      try {
        const response = await apiClient.get("/projects_overview", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setProjectData(response.data.projects);
        } else {
          toast.error(response.data?.message || "Failed to fetch projects");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "projects data"));
        }
      }
    };

    fetchProjects();

    return () => {
      source.cancel();
    };
  }, []);

  // Find current project based on projectId from URL
  // Memoized for performance during fast project changes
  const currentProject = useMemo(() => {
    if (!projectId) return undefined;
    const id = Number(projectId);
    return projectData.find((project) => project.project_id === id);
  }, [projectId, projectData]);

  // Handle project selection
  const handleProjectSelect = (project: ProjectView) => {
    navigate(`/project/${project.project_id}`);
  };

  return (
    <div
      className={`flex flex-col h-full bg-sidebar text-sidebar-foreground transition-[width] duration-150 ease-out ${
        isCollapsed ? "w-16" : "w-64"
      }`}
      style={{ willChange: "width" }}
    >
      {/* Header */}
      <div
        className={`flex items-center h-16 p-4 ${
          isCollapsed ? "justify-center" : "justify-between"
        }`}
      >
        <div
          className={`flex items-center space-x-2 overflow-hidden transition-all duration-150 ease-out ${
            isCollapsed
              ? "opacity-0 w-0 scale-95"
              : "opacity-100 w-auto scale-100"
          }`}
          style={{ willChange: "opacity, width, transform" }}
        >
          <div className="w-8 h-8 bg-primary flex items-center justify-center rounded">
            <span className="text-primary-foreground font-medium text-sm">
              PC
            </span>
          </div>
          <span className="font-medium text-lg whitespace-nowrap">Precast</span>
        </div>

        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors flex-shrink-0"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <Menu className="h-5 w-5" />
          ) : (
            <X className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* PROJECT SELECTION DROPDOWN */}
      {isCollapsed ? (
        <></>
      ) : (
        <div className="px-2 mb-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="data-[state=open]:bg-sidebar-accent hover:bg-sidebar-accent flex w-full p-2 items-center gap-2 data-[state=open]:text-sidebar-accent-foreground rounded-lg transition-colors"
              >
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg flex-shrink-0">
                  <FileText className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                  <span className="truncate font-normal">
                    {currentProject?.name || "Select Project"}
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/70">
                    {currentProject?.suspend ? "Suspended" : "Active"}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-lg"
              align="start"
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Projects
              </DropdownMenuLabel>
              {projectData.length === 0 ? (
                <DropdownMenuItem disabled className="text-muted-foreground">
                  No projects available
                </DropdownMenuItem>
              ) : (
                projectData.map((project, index) => {
                  const isSelected =
                    projectId && project.project_id === Number(projectId);
                  return (
                    <DropdownMenuItem
                      key={project.project_id}
                      onClick={() => handleProjectSelect(project)}
                      className={`gap-2 p-2 ${
                        isSelected ? "bg-sidebar-accent" : ""
                      }`}
                    >
                      <div className="flex size-6 items-center justify-center rounded-md border bg-sidebar-primary/10 flex-shrink-0">
                        <FileText className="size-3.5 shrink-0" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-normal">
                          {project.name}
                        </div>
                        {project.suspend && (
                          <div className="text-xs text-muted-foreground">
                            Suspended
                          </div>
                        )}
                      </div>
                      {index < 9 && (
                        <DropdownMenuShortcut>
                          ⌘{index + 1}
                        </DropdownMenuShortcut>
                      )}
                    </DropdownMenuItem>
                  );
                })
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => (
          <NavigationItemComponent
            key={item.href || item.name}
            item={item}
            isCollapsed={isCollapsed}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <NavLink
          to="/"
          className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-normal transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/70"
          title={isCollapsed ? "Homepage" : undefined}
        >
          <Home className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="truncate">Homepage</span>}
        </NavLink>
      </div>
    </div>
  );
}
