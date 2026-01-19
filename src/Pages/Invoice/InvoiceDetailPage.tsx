import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Loader2,
  Package,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Building,
  Layers,
} from "lucide-react";
import { formatDateTime, formatDisplayDate } from "@/utils/formatdate";
import { cn } from "@/lib/utils";

export interface InvoiceDetailPage {
  id: number;
  work_order_id: number;
  created_by: number;
  created_at: string;
  revision_no: number;
  items?: Items[];

  billing_address: string;
  shipping_address: string;
  created_by_name: string;
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
  endclient_id: number;
  project_id: number;
  project_name: string;
  end_client: string;
  comments: string;
  phone_code_name: string;
  revision: number;
  total_amount?: number;
}

export interface Items {
  id: number;
  invoice_id: number;
  item_id: number;
  volume: number;
  hsn_code: number;
  tower_id: number;
  floor_id: number[];
  tower_name: string;
  floor_name: string[];
  item_name: string;
  unit_rate: number;
  tax: number;
}

interface StageElementType {
  element_type: string;
  tower_id: number;
  floor_id: number;
  tower_name: string;
  floor_name: string;
  total_volume: number;
  unit_rate: number;
  tax: number;
  amount: number;
}

interface StageSummaryItem {
  stage: string;
  payment_term_percent: number;
  total_amount: number;
  amount_paid_by_payment_term: number;
  element_types: StageElementType[];
}

interface InvoiceDetailResponse {
  invoice: InvoiceDetailPage;
  stage_summary: StageSummaryItem[];
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

export function InvoiceDetailPage() {
  const { invoice_id, wo_number } = useParams<{
    invoice_id: string;
    wo_number: string;
  }>();
  const [data, setData] = useState<InvoiceDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedStages, setExpandedStages] = useState<{
    [key: string]: boolean;
  }>({});
  const navigate = useNavigate();

  // Fetch invoice data
  useEffect(() => {
    if (!invoice_id || !wo_number) {
      toast.error("Invoice ID and Work Order Number are required");
      setIsLoading(false);
      return;
    }

    const source = axios.CancelToken.source();

    const fetchInvoiceData = async () => {
      try {
        const response = await apiClient.get(`/invoice/${invoice_id}`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setData(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch invoice data");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "invoice data"));
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoiceData();

    return () => {
      source.cancel();
    };
  }, [invoice_id, wo_number]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading invoice data...
          </p>
        </div>
      </div>
    );
  }

  if (!data || !data.invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-4">
        <div className="text-center">
          <p className="text-lg font-medium text-foreground mb-1">
            Invoice not found
          </p>
          <p className="text-sm text-muted-foreground">
            The invoice you're looking for doesn't exist or has been removed.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const invoice = data.invoice;
  const stageSummary = data.stage_summary || [];
  const paymentTerms = formatPaymentTerms(invoice.payment_term);

  const toggleStage = (stage: string) => {
    setExpandedStages((prev) => ({ ...prev, [stage]: !prev[stage] }));
  };

  return (
    <div className="space-y-6 w-full p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <PageHeader title="Invoice Details" />
       
      </div>

      {/* Invoice Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold text-foreground">
                  Invoice #{invoice.id}
                </h2>
                <Badge variant="secondary" className="gap-1">
                  <Hash className="w-3 h-3" />
                  Revision {invoice.revision_no || invoice.revision || 0}
                </Badge>
              </div>
              <p className="text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Work Order: {invoice.wo_number || "N/A"}
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(invoice.total_amount || invoice.total_value)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <InfoRow
              label="Work Order Number"
              value={invoice.wo_number || "-"}
              icon={<FileText className="w-4 h-4" />}
            />
            <InfoRow
              label="Work Order Date"
              value={invoice.wo_date ? formatDisplayDate(invoice.wo_date) : "-"}
              icon={<Calendar className="w-4 h-4" />}
            />
            <InfoRow
              label="Valid Until"
              value={
                invoice.wo_validate
                  ? formatDisplayDate(invoice.wo_validate)
                  : "-"
              }
              icon={<Calendar className="w-4 h-4" />}
            />
            <InfoRow
              label="Created By"
              value={invoice.created_by_name || "-"}
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
              value={invoice.project_name || "-"}
              icon={<Building2 className="w-4 h-4" />}
            />
            <Separator />
            <InfoRow
              label="End Client"
              value={invoice.end_client || "-"}
              icon={<Building2 className="w-4 h-4" />}
            />
            <Separator />
            <InfoRow
              label="Project ID"
              value={invoice.project_id || "-"}
              icon={<Hash className="w-4 h-4" />}
            />
            <Separator />
            <InfoRow
              label="End Client ID"
              value={invoice.endclient_id || "-"}
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
              value={invoice.contact_person || "-"}
              icon={<User className="w-4 h-4" />}
            />
            <Separator />
            <InfoRow
              label="Email"
              value={invoice.contact_email || "-"}
              icon={<Mail className="w-4 h-4" />}
            />
            <Separator />
            <InfoRow
              label="Phone"
              value={
                invoice.phone_code && invoice.contact_number
                  ? `+${invoice.phone_code} ${invoice.contact_number}`
                  : invoice.contact_number || "-"
              }
              icon={<Phone className="w-4 h-4" />}
            />
            {invoice.phone_code_name && (
              <>
                <Separator />
                <InfoRow
                  label="Phone Code"
                  value={invoice.phone_code_name}
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
              {invoice.billing_address || "Not provided"}
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
              {invoice.shipping_address || "Not provided"}
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

      {/* Stage Summary */}
      {stageSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Stage Summary
            </CardTitle>
            <CardDescription>
              Detailed breakdown by production stages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stageSummary.map((stage, index) => {
                const isExpanded = expandedStages[stage.stage];
                return (
                  <div
                    key={index}
                    className="border rounded-lg overflow-hidden bg-card"
                  >
                    <button
                      onClick={() => toggleStage(stage.stage)}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 text-left">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{stage.stage}</span>
                            <Badge variant="secondary">
                              {stage.payment_term_percent}%
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Total: {formatCurrency(stage.total_amount)} | Paid:{" "}
                            {formatCurrency(stage.amount_paid_by_payment_term)}
                          </p>
                        </div>
                      </div>
                    </button>
                    {isExpanded && stage.element_types?.length > 0 && (
                      <div className="border-t bg-muted/30">
                        <div className="p-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Element Type</TableHead>
                                <TableHead>Tower</TableHead>
                                <TableHead>Floor</TableHead>
                                <TableHead className="text-right">
                                  Volume
                                </TableHead>
                                <TableHead className="text-right">
                                  Unit Rate
                                </TableHead>
                                <TableHead className="text-right">
                                  Tax
                                </TableHead>
                                <TableHead className="text-right">
                                  Amount
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {stage.element_types.map((element, elemIndex) => (
                                <TableRow key={elemIndex}>
                                  <TableCell className="font-medium">
                                    {element.element_type}
                                  </TableCell>
                                  <TableCell>{element.tower_name}</TableCell>
                                  <TableCell>
                                    {Array.isArray(element.floor_name)
                                      ? element.floor_name.join(", ")
                                      : element.floor_name}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {element.total_volume.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(element.unit_rate)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {element.tax}%
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {formatCurrency(element.amount)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Items */}
      {invoice.items && invoice.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Invoice Items
            </CardTitle>
            <CardDescription>
              {invoice.items.length} item(s) in this invoice
            </CardDescription>
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
                    <TableHead className="text-right">Unit Rate</TableHead>
                    <TableHead className="text-right">HSN Code</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item) => {
                    const itemAmount =
                      item.volume * item.unit_rate * (1 + item.tax / 100);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.item_name || "N/A"}
                        </TableCell>
                        <TableCell>{item.tower_name || "-"}</TableCell>
                        <TableCell>
                          {Array.isArray(item.floor_name)
                            ? item.floor_name.join(", ")
                            : item.floor_name || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.volume.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unit_rate)}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.hsn_code || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.tax}%
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

      {/* Additional Information */}
      <div className="grid gap-6 md:grid-cols-2">
        {invoice.wo_description && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Work Order Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {invoice.wo_description}
              </p>
            </CardContent>
          </Card>
        )}

        {invoice.comments && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {invoice.comments}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Invoice Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Invoice Metadata
          </CardTitle>
          <CardDescription>Creation and revision information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoRow
              label="Created At"
              value={formatDateTime(invoice.created_at)}
              icon={<Calendar className="w-4 h-4" />}
            />
            <InfoRow
              label="Work Order ID"
              value={invoice.work_order_id || "-"}
              icon={<Hash className="w-4 h-4" />}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
