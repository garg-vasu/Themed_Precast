import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Mail,
  Phone,
  MapPin,
  Building2,
  User,
  Calendar,
  FileText,
  Hash,
  Globe,
  ArrowLeft,
  Download,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { formatDateTime } from "@/utils/formatdate";
import { cn } from "@/lib/utils";
import EndClientProjectDashboard from "./EndClientProjectDashboard";

export interface EndClientDetail {
  id: number;
  email: string;
  contact_person: string;
  address: string;
  attachment: string[];
  cin: string;
  gst_number: string;
  phone_no: string;
  profile_picture: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  client_id: number;
  organization_name?: string;
  organization?: string;
  abbreviation?: string;
  phone_code: number;
  phone_code_name?: string;
  city?: string;
  state?: string;
  zip_code?: string | number;
  country?: string;
}

const getInitials = (text?: string) => {
  if (!text) return "EC";
  const parts = text.trim().split(" ");
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second || first || "EC").toUpperCase();
};

const buildAvatarSrc = (profilePicture?: string) => {
  if (!profilePicture) return "";
  const baseUrl = import.meta.env.VITE_API_URL;
  if (!baseUrl) return profilePicture;
  return `${baseUrl}/get-file?file=${encodeURIComponent(profilePicture)}`;
};

const buildFileUrl = (fileName: string) => {
  const baseUrl = import.meta.env.VITE_API_URL;
  if (!baseUrl) return fileName;
  return `${baseUrl}/get-file?file=${encodeURIComponent(fileName)}`;
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

export function EndClientDetailPage() {
  const { end_client_id } = useParams<{ end_client_id: string }>();
  const [data, setData] = useState<EndClientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch end client data
  useEffect(() => {
    if (!end_client_id) {
      toast.error("End Client ID is required");
      setIsLoading(false);
      return;
    }

    const source = axios.CancelToken.source();

    const fetchEndClientData = async () => {
      try {
        const response = await apiClient.get(`/end_clients/${end_client_id}`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setData(response.data);
        } else {
          toast.error(
            response.data?.message || "Failed to fetch end client data"
          );
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "end client data"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchEndClientData();

    return () => {
      source.cancel();
    };
  }, [end_client_id]);

  const handleDownloadAttachment = (attachment: string) => {
    const fileUrl = buildFileUrl(attachment);
    window.open(fileUrl, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading end client data...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-center">
          <p className="text-lg font-medium text-foreground mb-1">
            End Client not found
          </p>
          <p className="text-sm text-muted-foreground">
            The end client you're looking for doesn't exist or has been removed.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/end-clients")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to End Clients
        </Button>
      </div>
    );
  }

  const organizationName = data.organization_name || data.organization || "N/A";
  const fullAddress =
    [data.address, data.city, data.state, data.zip_code, data.country]
      .filter(Boolean)
      .join(", ") || "Not provided";

  return (
    <div className="space-y-2 w-full p-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <PageHeader title="End Client Details" />
        <Button
          onClick={() => navigate(`/edit-end-client/${end_client_id}`)}
          className="gap-2"
        >
          <Edit className="w-4 h-4" />
          Edit End Client
        </Button>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar className="w-24 h-24 border-2 border-border">
              <AvatarImage
                src={buildAvatarSrc(data.profile_picture)}
                alt={data.contact_person || organizationName}
              />
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {getInitials(data.contact_person || organizationName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold text-foreground">
                  {data.contact_person || "N/A"}
                </h2>
              </div>
              <p className="text-muted-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {organizationName}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  {data.email || "No email"}
                </span>
                {data.phone_no && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4" />
                    {data.phone_code
                      ? `+${data.phone_code} ${data.phone_no}`
                      : data.phone_no}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Information Grid */}
      <div className="grid gap-6 md:grid-cols-2">
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
              label="Contact Person"
              value={data.contact_person || "-"}
              icon={<User className="w-4 h-4" />}
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
            {data.phone_code_name && (
              <>
                <Separator />
                <InfoRow
                  label="Phone Code"
                  value={data.phone_code_name}
                  icon={<Globe className="w-4 h-4" />}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Organization Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Organization Information
            </CardTitle>
            <CardDescription>Company and registration details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow
              label="Organization Name"
              value={organizationName}
              icon={<Building2 className="w-4 h-4" />}
            />
            {data.abbreviation && (
              <>
                <Separator />
                <InfoRow
                  label="Abbreviation"
                  value={data.abbreviation}
                  icon={<Hash className="w-4 h-4" />}
                />
              </>
            )}
            <Separator />
            <InfoRow
              label="GST Number"
              value={data.gst_number || "-"}
              icon={<Hash className="w-4 h-4" />}
            />
            <Separator />
            <InfoRow
              label="CIN"
              value={data.cin || "-"}
              icon={<Hash className="w-4 h-4" />}
            />
            {data.client_id && (
              <>
                <Separator />
                <InfoRow label="Client ID" value={data.client_id} />
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
                {data.city && (
                  <>
                    <Separator />
                    <InfoRow label="City" value={data.city} />
                  </>
                )}
                {data.state && (
                  <>
                    <Separator />
                    <InfoRow label="State" value={data.state} />
                  </>
                )}
                {data.zip_code && (
                  <>
                    <Separator />
                    <InfoRow label="Zip Code" value={data.zip_code} />
                  </>
                )}
                {data.country && (
                  <>
                    <Separator />
                    <InfoRow label="Country" value={data.country} />
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Attachments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Attachments
            </CardTitle>
            <CardDescription>
              {data.attachment?.length || 0} file(s) attached
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.attachment && data.attachment.length > 0 ? (
              <div className="space-y-2">
                {data.attachment.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-md bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">
                        {attachment.split("/").pop() || `File ${index + 1}`}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleDownloadAttachment(attachment)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No attachments</p>
            )}
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Account Information
            </CardTitle>
            <CardDescription>Account timestamps</CardDescription>
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Section */}
      <div className="w-full mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Projects
            </CardTitle>
            <CardDescription>
              Projects associated with this end client
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EndClientProjectDashboard />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
