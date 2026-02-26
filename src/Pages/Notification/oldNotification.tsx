import axios from "axios";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  RefreshCw,
  Clock,
  Check,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";

export type Notification = {
  id: number;
  user_id: number;
  message: string;
  status: string;
  action: string;
  created_at: string;
  updated_at: string;
};

const baseUrl = import.meta.env.VITE_BASE_URL;

export default function NotificationPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<
    Notification[]
  >([]);
  const [activeTab, setActiveTab] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseUrl}/notifications`, {
        headers: {
          Authorization: token,
        },
      });
      if (response.status === 200) {
        setNotifications(response.data);
      } else {
        setNotifications([]);
        setError("No notifications found");
      }
    } catch (error) {
      setError(error as string);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const unread = notifications.filter((n) => n.status === "unread").length;
    setUnreadCount(unread);
  }, [notifications]);

  useEffect(() => {
    let filtered = notifications;

    // Filter by tab
    if (activeTab !== "all") {
      filtered = filtered.filter((n) => n.status.toLowerCase() === activeTab);
    }

    setFilteredNotifications(filtered);
  }, [notifications, activeTab]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-rose-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "success";
      case "error":
        return "destructive";
      case "warning":
        return "warning";
      default:
        return "secondary";
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(
        `${baseUrl}/notifications/read-all`,
        {},
        {
          headers: { Authorization: token },
        },
      );

      // Optimistically update local state to reflect the change without refetching
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, status: "read" })),
      );
    } catch (error) {
      setError("Failed to mark notifications as read");
    }
  };

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      await axios.put(
        `${baseUrl}/notifications/${notificationId}/read`,
        {},
        {
          headers: { Authorization: token },
        },
      );
      // Update local state to reflect the read status
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, status: "read" } : n,
        ),
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark notification as read if it's unread
    if (notification.status === "unread") {
      await markNotificationAsRead(notification.id);
    }

    //  "action": "https://precast.blueinvent.com/warehouses",
    // now we need to trim from start to end of the string "https://precast.blueinvent.com"
    const action = notification.action.replace(
      "https://precast.blueinvent.com",
      "",
    );

    // If no action, just mark as read and return
    if (!notification.action) return;
    navigate(action);

    return;
    // try {
    //   // Try to parse action as JSON first (in case it's a JSON string)
    //   let actionData: any = notification.action;
    //   try {
    //     actionData = JSON.parse(notification.action);
    //   } catch {
    //     // If not JSON, use the string directly
    //     actionData = notification.action;
    //   }

    //   // If action is a direct route path
    //   if (typeof actionData === "string" && actionData.startsWith("/")) {
    //     navigate(actionData);
    //     return;
    //   }

    //   // If action is an object with route information
    //   if (typeof actionData === "object" && actionData.route) {
    //     navigate(actionData.route);
    //     return;
    //   }

    //   // Try to extract route from common patterns
    //   const actionStr = String(notification.action).toLowerCase();

    //   // Work order patterns
    //   if (actionStr.includes("workorder") || actionStr.includes("work_order")) {
    //     const woId = extractId(notification.action);
    //     if (woId) {
    //       navigate(`/workorderdetail/${woId}`);
    //       return;
    //     }
    //   }

    //   // Project patterns
    //   if (actionStr.includes("project")) {
    //     const projectId = extractId(notification.action);
    //     if (projectId) {
    //       navigate(`/project/${projectId}/dashboard`);
    //       return;
    //     }
    //   }

    //   // Invoice patterns
    //   if (actionStr.includes("invoice")) {
    //     const invoiceId = extractId(notification.action);
    //     if (invoiceId) {
    //       navigate(`/invoicedetail/${invoiceId}`);
    //       return;
    //     }
    //   }

    //   // End client patterns
    //   if (actionStr.includes("endclient") || actionStr.includes("end_client")) {
    //     const clientId = extractId(notification.action);
    //     if (clientId) {
    //       navigate(`/endclientprojects/${clientId}`);
    //       return;
    //     }
    //   }

    //   // Default: try to navigate to the action as a route
    //   if (typeof actionData === "string") {
    //     navigate(actionData);
    //   }
    // } catch (error) {
    //   console.error("Error navigating from notification:", error);
    // }
  };

  const extractId = (action: string): string | null => {
    // Try to extract ID from various formats
    const patterns = [
      /\/\d+/, // /123
      /id[:\s=]+(\d+)/i, // id: 123, id=123, id 123
      /(\d+)/, // any number
    ];

    for (const pattern of patterns) {
      const match = action.match(pattern);
      if (match) {
        return match[1] || match[0].replace("/", "");
      }
    }

    return null;
  };

  if (loading) {
    return (
      <div className=" w-full p-2 sm:p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-4">
            <Skeleton className="h-6 sm:h-8 w-24 sm:w-32" />
            <Skeleton className="h-6 sm:h-8 w-6 sm:w-8 rounded-full" />
          </div>
          <Skeleton className="h-8 w-20 sm:w-24" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="w-full">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
                  <div className="space-y-2 flex-1 min-w-0">
                    <Skeleton className="h-4 w-full sm:w-3/4" />
                    <Skeleton className="h-3 w-2/3 sm:w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className=" w-full p-2 sm:p-4 md:p-5 space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 flex-wrap">
            <div className="text-lg sm:text-xl font-semibold tracking-tight">
              Notifications
            </div>
            {unreadCount > 0 && (
              <Badge variant="default" className="ml-1 sm:ml-2 text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="p-1.5 rounded-full bg-primary/10">
            <Bell className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="flex-1 sm:flex-initial text-xs"
                >
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Mark all as read</span>
                  <span className="sm:hidden">Mark all</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mark all notifications as read</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={fetchNotifications}
                  className="h-8 w-8"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh notifications</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Stay updated with your tasks and system alerts
      </p>

      <div className="flex flex-col gap-2 sm:gap-3">
        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 h-8 sm:h-9">
            <TabsTrigger value="all" className="text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              Unread
            </TabsTrigger>
            <TabsTrigger value="read" className="text-xs">
              Read
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Separator />

      {filteredNotifications.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center py-6 sm:py-10 text-muted-foreground">
          <Bell className="h-8 w-8 sm:h-11 sm:w-11 mb-3 opacity-50" />
          <p className="text-sm sm:text-base font-medium">
            No notifications found
          </p>
          <p className="text-xs sm:text-sm text-center px-4">
            We'll notify you when there's something new
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-11rem)] sm:h-[calc(100vh-14rem)]">
          <div className="space-y-2 pr-2 sm:pr-3">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "transition-all duration-200 hover:shadow-md",
                  "border-border/50 bg-card/50 backdrop-blur-sm",
                  "cursor-pointer hover:bg-accent/50 active:scale-[0.98]",
                  notification.status === "unread" &&
                    "border-primary/20 bg-primary/5",
                )}
              >
                <CardContent className="p-2.5 sm:p-3">
                  <div className="flex items-start space-x-2.5">
                    <div className="mt-0.5 flex-shrink-0">
                      {getStatusIcon(notification.status)}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-start sm:items-center justify-between gap-2">
                        <p
                          className={cn(
                            "text-xs font-medium leading-snug break-words flex-1",
                            notification.status === "unread" && "text-primary",
                          )}
                        >
                          {notification.message}
                        </p>
                        <Badge
                          variant={getStatusVariant(notification.status) as any}
                          className="ml-2 w-fit text-[10px] flex-shrink-0"
                        >
                          {notification.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="flex items-center space-x-1 w-fit">
                              <Clock className="h-3 w-3 flex-shrink-0" />
                              <span className="whitespace-nowrap">
                                {format(
                                  new Date(notification.created_at),
                                  "MMM dd, HH:mm",
                                )}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Created at{" "}
                              {format(
                                new Date(notification.created_at),
                                "PPpp",
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
