import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Download,
  Calendar,
  User,
  Package,
  File,
  Mail,
  Phone,
  Building,
  Building2,
  MapPin,
  Hash,
  Globe,
  CreditCard,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { formatDateTime, formatDisplayDate } from "@/utils/formatdate";
import { cn } from "@/lib/utils";

const baseUrl = import.meta.env.VITE_BASE_URL;

export interface SingLeClient {
  id: number;
  wo_number: string;
  wo_date: string;
  wo_validate: string;
  total_value: number;
  contact_person: string;
  contact_email: string;
  contact_number: string;
  phone_code: number;
  payment_term:
    | Record<string, number>
    | Array<{ stage_name: string; percentage: number }>
    | string;
  wo_description: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: string;
  material: Material[];
  wo_attachment: string[];
  endclient_id: number;
  project_id: number;
  project_name: string;
  end_client: string;
  comments: string;
  revision_no: number;
  phone_code_name: string;
  shipped_address: string;
  billed_address: string;
  created_by_name: string;
}

export interface Material {
  id: number;
  item_name: string;
  unit_rate: number;
  volume: number;
  hsn_code: number;
  volume_used: number;
  tax: number;
  revision_no: number;
  balance: number;
  tower_id: number;
  floor_id: number[];
  tower_name: string;
  floor_name: string[];
}

interface WorkOrderDetailPageProps {
  workOrder?: SingLeClient;
}

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

const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === null || amount === undefined) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatPaymentTerms = (
  paymentTerm:
    | Record<string, number>
    | Array<{ stage_name: string; percentage: number }>
    | string
): Array<{ stage_name: string; percentage: number }> => {
  if (typeof paymentTerm === "string") {
    try {
      const parsed = JSON.parse(paymentTerm);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === "object") {
        return Object.entries(parsed).map(([stage_name, percentage]) => ({
          stage_name,
          percentage: typeof percentage === "number" ? percentage : 0,
        }));
      }
    } catch {
      return [];
    }
  }
  if (Array.isArray(paymentTerm)) return paymentTerm;
  if (typeof paymentTerm === "object" && paymentTerm !== null) {
    return Object.entries(paymentTerm).map(([stage_name, percentage]) => ({
      stage_name,
      percentage: typeof percentage === "number" ? percentage : 0,
    }));
  }
  return [];
};

const buildFileUrl = (fileName: string) => {
  if (!baseUrl) return fileName;
  return `${baseUrl}/get-file?file=${encodeURIComponent(fileName)}`;
};

export default function WorkOrderDetailPage({
  workOrder,
}: WorkOrderDetailPageProps) {
  if (!workOrder) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading work order data...
          </p>
        </div>
      </div>
    );
  }

  const paymentTerms = formatPaymentTerms(workOrder.payment_term);
  const handleDownloadAttachment = (attachment: string) => {
    const fileUrl = buildFileUrl(attachment);
    window.open(fileUrl, "_blank");
  };

  const calculateMaterialTotal = (material: Material): number => {
    return material.volume * material.unit_rate * (1 + material.tax / 100);
  };

  const totalMaterialsValue =
    workOrder.material?.reduce(
      (sum, mat) => sum + calculateMaterialTotal(mat),
      0
    ) || 0;

  return (
    <div className="space-y-6 w-full">
      {/* Work Order Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold text-foreground">
                  Work Order #{workOrder.wo_number || workOrder.id}
                </h2>
                <Badge variant="secondary" className="gap-1">
                  <Hash className="w-3 h-3" />
                  Revision {workOrder.revision_no || 0}
                </Badge>
              </div>
              <p className="text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Work Order ID: {workOrder.id}
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(workOrder.total_value)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <InfoRow
              label="Work Order Number"
              value={workOrder.wo_number || "-"}
              icon={<FileText className="w-4 h-4" />}
            />
            <InfoRow
              label="Work Order Date"
              value={
                workOrder.wo_date ? formatDisplayDate(workOrder.wo_date) : "-"
              }
              icon={<Calendar className="w-4 h-4" />}
            />
            <InfoRow
              label="Valid Until"
              value={
                workOrder.wo_validate
                  ? formatDisplayDate(workOrder.wo_validate)
                  : "-"
              }
              icon={<Calendar className="w-4 h-4" />}
            />
            <InfoRow
              label="Created By"
              value={workOrder.created_by_name || "-"}
              icon={<User className="w-4 h-4" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Project & Client Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              Project Information
            </CardTitle>
            <CardDescription>Project and client details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow
              label="Project Name"
              value={workOrder.project_name || "-"}
              icon={<Building2 className="w-4 h-4" />}
            />
            <Separator />
            <InfoRow
              label="End Client"
              value={workOrder.end_client || "-"}
              icon={<Building2 className="w-4 h-4" />}
            />
            <Separator />
            <InfoRow
              label="Project ID"
              value={workOrder.project_id || "-"}
              icon={<Hash className="w-4 h-4" />}
            />
            <Separator />
            <InfoRow
              label="End Client ID"
              value={workOrder.endclient_id || "-"}
              icon={<Hash className="w-4 h-4" />}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Contact Information
            </CardTitle>
            <CardDescription>Primary contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow
              label="Contact Person"
              value={workOrder.contact_person || "-"}
              icon={<User className="w-4 h-4" />}
            />
            <Separator />
            <InfoRow
              label="Email"
              value={workOrder.contact_email || "-"}
              icon={<Mail className="w-4 h-4" />}
            />
            <Separator />
            <InfoRow
              label="Phone"
              value={
                workOrder.phone_code && workOrder.contact_number
                  ? `+${workOrder.phone_code} ${workOrder.contact_number}`
                  : workOrder.contact_number || "-"
              }
              icon={<Phone className="w-4 h-4" />}
            />
            {workOrder.phone_code_name && (
              <>
                <Separator />
                <InfoRow
                  label="Phone Code"
                  value={workOrder.phone_code_name}
                  icon={<Globe className="w-4 h-4" />}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Address Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Billing Address
            </CardTitle>
            <CardDescription>Invoice billing location</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {workOrder.billed_address || "Not provided"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Shipping Address
            </CardTitle>
            <CardDescription>Delivery location</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {workOrder.shipped_address || "Not provided"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Terms */}
      {paymentTerms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Payment Terms
            </CardTitle>
            <CardDescription>Payment schedule breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {paymentTerms.map((term, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-md bg-muted/50"
                >
                  <span className="text-sm font-medium">{term.stage_name}</span>
                  <Badge variant="outline">{term.percentage}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Materials Table */}
      {workOrder.material && workOrder.material.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Materials
                </CardTitle>
                <CardDescription>
                  {workOrder.material.length} material(s) in this work order
                </CardDescription>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm text-muted-foreground">
                  Total Materials Value
                </p>
                <p className="text-lg font-semibold text-primary">
                  {formatCurrency(totalMaterialsValue)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Tower</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead className="text-right">Volume</TableHead>
                    <TableHead className="text-right">Volume Used</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Unit Rate</TableHead>
                    <TableHead className="text-right">HSN Code</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workOrder.material.map((material) => {
                    const itemAmount = calculateMaterialTotal(material);
                    return (
                      <TableRow key={material.id}>
                        <TableCell className="font-medium">
                          {material.item_name || "N/A"}
                        </TableCell>
                        <TableCell>{material.tower_name || "-"}</TableCell>
                        <TableCell>
                          {Array.isArray(material.floor_name)
                            ? material.floor_name.join(", ")
                            : material.floor_name || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {material.volume.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {material.volume_used.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {material.balance.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(material.unit_rate)}
                        </TableCell>
                        <TableCell className="text-right">
                          {material.hsn_code || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {material.tax}%
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(itemAmount)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attachments */}
      {workOrder.wo_attachment && workOrder.wo_attachment.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="w-5 h-5 text-primary" />
              Attachments
            </CardTitle>
            <CardDescription>
              {workOrder.wo_attachment.length} file(s) attached
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {workOrder.wo_attachment.map((attachment, index) => (
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
          </CardContent>
        </Card>
      )}

      {/* Additional Information */}
      <div className="grid gap-6 md:grid-cols-2">
        {workOrder.wo_description && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Work Order Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {workOrder.wo_description}
              </p>
            </CardContent>
          </Card>
        )}

        {workOrder.comments && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {workOrder.comments}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Work Order Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Work Order Metadata
          </CardTitle>
          <CardDescription>Creation and revision information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoRow
              label="Created At"
              value={formatDateTime(workOrder.created_at)}
              icon={<Calendar className="w-4 h-4" />}
            />
            <InfoRow
              label="Updated At"
              value={formatDateTime(workOrder.updated_at)}
              icon={<Calendar className="w-4 h-4" />}
            />
            <InfoRow
              label="Created By ID"
              value={workOrder.created_by || "-"}
              icon={<User className="w-4 h-4" />}
            />
            <InfoRow
              label="Updated By"
              value={workOrder.updated_by || "-"}
              icon={<User className="w-4 h-4" />}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
