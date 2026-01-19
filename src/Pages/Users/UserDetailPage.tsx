import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import {
  Loader2,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  User,
  Calendar,
  Shield,
  Briefcase,
  Globe,
  Hash,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import PageHeader from "@/components/ui/PageHeader";
import { formatDateTime } from "@/utils/formatdate";
import { cn } from "@/lib/utils";

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

export interface UserDetail {
  id: number;
  employee_id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
  first_access: string;
  last_access: string;
  profile_picture: string;
  is_admin: boolean;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  phone_no: string;
  role_id: number;
  role_name: string;
  suspended: boolean;
  project_suspend: boolean;
  phone_code: number;
  phone_code_name: string;
}

const getInitials = (first?: string, last?: string) => {
  const firstInitial = first?.[0] ?? "";
  const lastInitial = last?.[0] ?? "";
  return (firstInitial + lastInitial || "US").toUpperCase();
};

const buildAvatarSrc = (profilePicture?: string) => {
  if (!profilePicture) return "";
  const baseUrl = import.meta.env.VITE_API_URL;
  if (!baseUrl) return profilePicture;
  return `${baseUrl}/get-file?file=${encodeURIComponent(profilePicture)}`;
};

interface InfoRowProps {
  label: string;
  value: string | number | null | undefined;
  icon?: React.ReactNode;
  className?: string;
}

function InfoRow({ label, value, icon, className }: InfoRowProps) {
  const displayValue = value ?? "-";
  return (
    <div className={cn("flex items-start gap-3 py-2", className)}>
      {icon && (
        <div className="mt-0.5 text-muted-foreground shrink-0">{icon}</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground mt-0.5 break-words">
          {displayValue}
        </p>
      </div>
    </div>
  );
}

export default function UserDetailPage() {
  const { user_id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user data
  useEffect(() => {
    if (!user_id) {
      toast.error("User ID is required");
      setIsLoading(false);
      return;
    }

    const source = axios.CancelToken.source();

    const fetchUserData = async () => {
      try {
        const response = await apiClient.get(`/user_fetch/${user_id}`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setData(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch user data");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "user data"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();

    return () => {
      source.cancel();
    };
  }, [user_id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-center">
          <p className="text-lg font-medium text-foreground mb-1">
            User not found
          </p>
          <p className="text-sm text-muted-foreground">
            The user you're looking for doesn't exist or has been removed.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/users")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Button>
      </div>
    );
  }

  const fullName =
    `${data.first_name || ""} ${data.last_name || ""}`.trim() || "N/A";
  const fullAddress =
    [data.address, data.city, data.state, data.zip_code, data.country]
      .filter(Boolean)
      .join(", ") || "Not provided";

  return (
    <div className="space-y-2  w-full p-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <PageHeader title="User Details" />

        {/* <Button
          onClick={() => navigate(`/edit-user/${user_id}`)}
          className="gap-2"
        >
          <Edit className="w-4 h-4" />
          Edit User
        </Button> */}
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar className="w-24 h-24 border-2 border-border">
              <AvatarImage
                src={buildAvatarSrc(data.profile_picture)}
                alt={fullName}
              />
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {getInitials(data.first_name, data.last_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold text-foreground">
                  {fullName}
                </h2>
                {data.is_admin && (
                  <Badge variant="default" className="gap-1">
                    <Shield className="w-3 h-3" />
                    Admin
                  </Badge>
                )}
                {data.role_name && (
                  <Badge variant="secondary" className="gap-1">
                    <Briefcase className="w-3 h-3" />
                    {data.role_name}
                  </Badge>
                )}
              </div>
              {data.role_name && (
                <p className="text-muted-foreground flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  {data.role_name}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  {data.email || "No email"}
                </span>
                {data.employee_id && (
                  <span className="flex items-center gap-1.5">
                    <Hash className="w-4 h-4" />
                    {data.employee_id}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Information Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>Basic personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow
              label="Full Name"
              value={fullName}
              icon={<User className="w-4 h-4" />}
            />
            <Separator />
            <InfoRow
              label="First Name"
              value={data.first_name || "-"}
              icon={<User className="w-4 h-4" />}
            />
            <Separator />
            <InfoRow
              label="Last Name"
              value={data.last_name || "-"}
              icon={<User className="w-4 h-4" />}
            />
            <Separator />
            <InfoRow
              label="Employee ID"
              value={data.employee_id || "-"}
              icon={<Hash className="w-4 h-4" />}
            />
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              Contact Information
            </CardTitle>
            <CardDescription>Communication details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow
              label="Email"
              value={data.email || "-"}
              icon={<Mail className="w-4 h-4" />}
            />
            <Separator />
            <InfoRow
              label="Phone"
              value={
                data.phone_code && data.phone_no
                  ? `+${data.phone_code} ${data.phone_no}`
                  : data.phone_no || "-"
              }
              icon={<Phone className="w-4 h-4" />}
            />
            <Separator />
            {data.phone_code_name && (
              <>
                <InfoRow
                  label="Phone Code"
                  value={data.phone_code_name}
                  icon={<Globe className="w-4 h-4" />}
                />
                <Separator />
              </>
            )}
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Address Information
            </CardTitle>
            <CardDescription>Location details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow
              label="Full Address"
              value={fullAddress}
              icon={<MapPin className="w-4 h-4" />}
            />
            {fullAddress !== "Not provided" && (
              <>
                <Separator />
                <InfoRow label="Street" value={data.address || "-"} />
                <Separator />
                <InfoRow label="City" value={data.city || "-"} />
                <Separator />
                <InfoRow label="State" value={data.state || "-"} />
                <Separator />
                <InfoRow label="Zip Code" value={data.zip_code || "-"} />
                <Separator />
                <InfoRow label="Country" value={data.country || "-"} />
              </>
            )}
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Account Information
            </CardTitle>
            <CardDescription>Account and role details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow
              label="Role"
              value={data.role_name || "-"}
              icon={<Briefcase className="w-4 h-4" />}
            />
            <Separator />
            <InfoRow
              label="Admin Status"
              value={data.is_admin ? "Yes" : "No"}
              icon={<Shield className="w-4 h-4" />}
            />
            <Separator />
            <InfoRow
              label="Suspended"
              value={data.suspended ? "Yes" : "No"}
              icon={<Shield className="w-4 h-4" />}
            />
            <Separator />
            <InfoRow
              label="Project Suspended"
              value={data.project_suspend ? "Yes" : "No"}
              icon={<Shield className="w-4 h-4" />}
            />
          </CardContent>
        </Card>

        {/* Access Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Access Information
            </CardTitle>
            <CardDescription>Account activity and timestamps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <InfoRow
                  label="Account Created"
                  value={formatDateTime(data.created_at)}
                  icon={<Calendar className="w-4 h-4" />}
                />
                <Separator className="md:hidden" />
              </div>
              <div className="space-y-1">
                <InfoRow
                  label="Last Updated"
                  value={formatDateTime(data.updated_at)}
                  icon={<Calendar className="w-4 h-4" />}
                />
              </div>
              <Separator className="md:hidden md:col-span-2" />
              <div className="space-y-1">
                <InfoRow
                  label="First Access"
                  value={
                    data.first_access
                      ? formatDateTime(data.first_access)
                      : "Never"
                  }
                  icon={<Calendar className="w-4 h-4" />}
                />
                <Separator className="md:hidden" />
              </div>
              <div className="space-y-1">
                <InfoRow
                  label="Last Access"
                  value={
                    data.last_access
                      ? formatDateTime(data.last_access)
                      : "Never"
                  }
                  icon={<Calendar className="w-4 h-4" />}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
