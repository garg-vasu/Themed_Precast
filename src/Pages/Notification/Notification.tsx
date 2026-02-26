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
import { apiClient } from "@/utils/apiClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingState } from "@/components/ui/loading-state";

export type Notification = {
  id: number;
  user_id: number;
  message: string;
  status: string;
  action: string;
  created_at: string;
  updated_at: string;
};

export default function NotificationPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<
    Notification[]
  >([]);
  const [activeTab, setActiveTab] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get("/notifications");
      if (response.status === 200) {
        setNotifications(response.data);
      } else {
        setNotifications([]);
        setError("No notifications found");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load notifications",
      );
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
    if (activeTab !== "all") {
      filtered = filtered.filter((n) => n.status.toLowerCase() === activeTab);
    }
    setFilteredNotifications(filtered);
  }, [notifications, activeTab]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getStatusVariant = (
    status: string,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case "completed":
        return "default";
      case "error":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.put("/notifications/read-all", {});
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, status: "read" })),
      );
    } catch {
      setError("Failed to mark notifications as read");
    }
  };

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`, {});
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, status: "read" } : n,
        ),
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.status === "unread") {
      await markNotificationAsRead(notification.id);
    }

    const action = notification.action.replace(
      "https://precast.blueinvent.com",
      "",
    );

    if (!notification.action) return;
    navigate(action);
  };

  if (loading) {
    return (
      <div className="w-full p-2 flex items-center justify-center min-h-[60vh]">
        <LoadingState label="Loading notifications..." />
      </div>
    );
  }

  return (
    <div className="w-full p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Bell className="h-4 w-4 text-primary" />
          </div>
          <h1 className="text-md font-semibold text-primary">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="h-7 text-xs px-2"
          >
            <Check className="h-3 w-3 mr-1" />
            Mark all read
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchNotifications}
            className="h-7 w-7"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 h-8">
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

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-3.5 w-3.5" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      <Separator />

      {filteredNotifications.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <Bell className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm font-medium">No notifications</p>
          <p className="text-xs">We'll notify you when something new arrives</p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-1.5 pr-2">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "transition-all duration-150 cursor-pointer py-0",
                  "hover:bg-accent/50 active:scale-[0.99]",
                  notification.status === "unread"
                    ? "border-primary/30 bg-primary/5"
                    : "border-border/50",
                )}
              >
                <CardContent className="p-2">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex-shrink-0">
                      {getStatusIcon(notification.status)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-xs leading-snug break-words flex-1",
                            notification.status === "unread"
                              ? "font-medium text-primary"
                              : "text-foreground",
                          )}
                        >
                          {notification.message}
                        </p>
                        <Badge
                          variant={getStatusVariant(notification.status)}
                          className="text-[10px] px-1.5 py-0 flex-shrink-0"
                        >
                          {notification.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-2.5 w-2.5" />
                        <span>
                          {format(
                            new Date(notification.created_at),
                            "MMM dd, HH:mm",
                          )}
                        </span>
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
