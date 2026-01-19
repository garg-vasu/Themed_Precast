import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon, ChevronDown, ChevronUp, Filter } from "lucide-react";

type Payment = {
  id: string;
  amount: number;
  receivedAt: string; // ISO date string
  method: "cash" | "card" | "bank_transfer" | "upi";
  notes?: string;
};

type Invoice = {
  id: string;
  number: string;
  issuedAt: string; // ISO date string
  dueAt?: string; // ISO date string
  total: number;
  status: "paid" | "partial" | "unpaid";
  payments: Payment[];
};

type WorkOrder = {
  id: string;
  code: string;
  title: string;
  createdAt: string; // ISO date string
  customer?: string;
  amendments: Amendment[];
  invoices: Invoice[];
};

type Amendment = {
  id: string;
  amendedAt: string; // ISO date string
  version: number;
  description: string;
  reason?: string;
  changes?: string[];
};

// Mock data (replace with real data later)
const MOCK_WORK_ORDER: WorkOrder = {
  id: "wo_1001",
  code: "WO-1001",
  title: "Fabrication of Steel Frames",
  createdAt: "2025-09-01T10:15:00Z",
  customer: "Acme Construction Ltd",
  amendments: [
    {
      id: "amd_001",
      amendedAt: "2025-09-12T10:00:00Z",
      version: 2,
      description: "Scope increased by 10% for Frame B",
      reason: "Client request",
      changes: [
        "Added 12 beams to section B",
        "Revised finishing from primer to epoxy",
      ],
    },
    {
      id: "amd_002",
      amendedAt: "2025-09-28T09:30:00Z",
      version: 3,
      description: "Payment terms updated: split into 3 milestones",
      reason: "Contract alignment",
      changes: ["Advance reduced to 40%", "Second milestone due on dispatch"],
    },
  ],
  invoices: [
    {
      id: "inv_001",
      number: "INV-001",
      issuedAt: "2025-09-05T09:00:00Z",
      dueAt: "2025-09-20T23:59:59Z",
      total: 120000,
      status: "paid",
      payments: [
        {
          id: "pay_001a",
          amount: 60000,
          receivedAt: "2025-09-10T12:30:00Z",
          method: "bank_transfer",
          notes: "Advance",
        },
        {
          id: "pay_001b",
          amount: 60000,
          receivedAt: "2025-09-15T16:45:00Z",
          method: "upi",
        },
      ],
    },
    {
      id: "inv_002",
      number: "INV-002",
      issuedAt: "2025-09-18T11:20:00Z",
      dueAt: "2025-10-05T23:59:59Z",
      total: 95000,
      status: "partial",
      payments: [
        {
          id: "pay_002a",
          amount: 40000,
          receivedAt: "2025-09-25T14:10:00Z",
          method: "bank_transfer",
        },
      ],
    },
    {
      id: "inv_003",
      number: "INV-003",
      issuedAt: "2025-10-01T08:05:00Z",
      dueAt: "2025-10-15T23:59:59Z",
      total: 78000,
      status: "unpaid",
      payments: [],
    },
  ],
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

type TimelineFilter = {
  showPayments: boolean;
  showAmendments: boolean;
  showPaid: boolean;
  showPartial: boolean;
  showUnpaid: boolean;
  sortDirection: "asc" | "desc"; // by issuedAt
};

export default function WoTimelinePage() {
  const [filters, setFilters] = useState<TimelineFilter>({
    showPayments: true,
    showAmendments: true,
    showPaid: true,
    showPartial: true,
    showUnpaid: true,
    sortDirection: "asc",
  });
  const [expandedInvoiceIds, setExpandedInvoiceIds] = useState<Set<string>>(
    new Set()
  );

  const workOrder = MOCK_WORK_ORDER;

  const filteredSortedInvoices = useMemo(() => {
    const statusAllowed = new Set<string>();
    if (filters.showPaid) statusAllowed.add("paid");
    if (filters.showPartial) statusAllowed.add("partial");
    if (filters.showUnpaid) statusAllowed.add("unpaid");

    const list = workOrder.invoices.filter((inv) =>
      statusAllowed.has(inv.status)
    );
    list.sort((a, b) => {
      const aTime = new Date(a.issuedAt).getTime();
      const bTime = new Date(b.issuedAt).getTime();
      return filters.sortDirection === "asc" ? aTime - bTime : bTime - aTime;
    });
    return list;
  }, [filters, workOrder.invoices]);

  type TimelineItem =
    | { type: "amendment"; data: Amendment; at: string }
    | { type: "invoice"; data: Invoice; at: string };

  const timelineItems = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];

    if (filters.showAmendments) {
      for (const amd of workOrder.amendments) {
        items.push({ type: "amendment", data: amd, at: amd.amendedAt });
      }
    }

    for (const inv of filteredSortedInvoices) {
      items.push({ type: "invoice", data: inv, at: inv.issuedAt });
    }

    items.sort((a, b) => {
      const at = new Date(a.at).getTime();
      const bt = new Date(b.at).getTime();
      return filters.sortDirection === "asc" ? at - bt : bt - at;
    });
    return items;
  }, [
    filteredSortedInvoices,
    filters.showAmendments,
    filters.sortDirection,
    workOrder.amendments,
  ]);

  function toggleInvoiceExpand(id: string) {
    setExpandedInvoiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <Card>
        <CardHeader className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <CardTitle className="text-base md:text-lg">
                Work Order Timeline
              </CardTitle>
              <div className="text-xs md:text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                <span>
                  {workOrder.code} · {workOrder.title}
                </span>
                {workOrder.customer ? (
                  <span className="hidden md:inline">
                    • {workOrder.customer}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarIcon className="h-3 w-3" />
                <span>Created {formatDateTime(workOrder.createdAt)}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 text-xs">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    sortDirection: f.sortDirection === "asc" ? "desc" : "asc",
                  }))
                }
              >
                <Filter className="h-3 w-3 mr-1" />
                Sort:{" "}
                {filters.sortDirection === "asc" ? "Old → New" : "New → Old"}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Checkbox
                id="timeline-amendments"
                checked={filters.showAmendments}
                onCheckedChange={(checked) =>
                  setFilters((f) => ({
                    ...f,
                    showAmendments: Boolean(checked),
                  }))
                }
              />
              <label htmlFor="timeline-amendments">Show amendments</label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="timeline-payments"
                checked={filters.showPayments}
                onCheckedChange={(checked) =>
                  setFilters((f) => ({
                    ...f,
                    showPayments: Boolean(checked),
                  }))
                }
              />
              <label htmlFor="timeline-payments">Show payments</label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="timeline-paid"
                checked={filters.showPaid}
                onCheckedChange={(checked) =>
                  setFilters((f) => ({ ...f, showPaid: Boolean(checked) }))
                }
              />
              <label htmlFor="timeline-paid">Paid</label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="timeline-partial"
                checked={filters.showPartial}
                onCheckedChange={(checked) =>
                  setFilters((f) => ({ ...f, showPartial: Boolean(checked) }))
                }
              />
              <label htmlFor="timeline-partial">Partial</label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="timeline-unpaid"
                checked={filters.showUnpaid}
                onCheckedChange={(checked) =>
                  setFilters((f) => ({ ...f, showUnpaid: Boolean(checked) }))
                }
              />
              <label htmlFor="timeline-unpaid">Unpaid</label>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm">Timeline</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-[420px] pr-2">
            <div className="relative py-2">
              <div
                className="absolute left-3 md:left-4 top-0 h-full w-px bg-border"
                aria-hidden
              />

              <div className="relative pl-10 md:pl-12 mb-4">
                <div className="absolute left-1.5 md:left-3 top-2 h-2.5 w-2.5 rounded-full bg-primary shadow" />
                <div className="rounded-md border p-3 bg-background">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Parent
                      </div>
                      <div className="text-sm font-medium">
                        Work Order {workOrder.code}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(workOrder.createdAt)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {timelineItems.map((item, index) => {
                  if (item.type === "amendment") {
                    const amd = item.data;
                    return (
                      <div
                        key={`amd_${amd.id}`}
                        className="relative pl-10 md:pl-12"
                      >
                        <div className="absolute left-1.5 md:left-3 top-2 h-2.5 w-2.5 rounded-full bg-blue-500" />
                        <div className="rounded-md border p-3 bg-background">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                Amendment
                              </div>
                              <div className="text-sm font-medium mt-1">
                                Version {amd.version}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {amd.description}
                              </div>
                              {amd.changes && amd.changes.length > 0 ? (
                                <ul className="mt-1.5 list-disc pl-4 text-xs text-muted-foreground">
                                  {amd.changes.map((c) => (
                                    <li key={c}>{c}</li>
                                  ))}
                                </ul>
                              ) : null}
                              {amd.reason ? (
                                <div className="mt-1 text-[11px] text-muted-foreground">
                                  Reason: {amd.reason}
                                </div>
                              ) : null}
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">
                                {formatDateTime(amd.amendedAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const invoice = item.data as Invoice;
                  const isExpanded = expandedInvoiceIds.has(invoice.id);
                  const paidAmount = invoice.payments.reduce(
                    (sum, p) => sum + p.amount,
                    0
                  );
                  const remaining = Math.max(invoice.total - paidAmount, 0);
                  return (
                    <div
                      key={`inv_${invoice.id}`}
                      className="relative pl-10 md:pl-12"
                    >
                      <div className="absolute left-1.5 md:left-3 top-2 h-2.5 w-2.5 rounded-full bg-foreground" />
                      <div className="rounded-md border p-3 bg-background">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              Invoice #{index + 1}
                            </div>
                            <div className="text-sm font-medium mt-0.5">
                              {invoice.number}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <StatusBadge status={invoice.status} />
                              <span className="text-xs text-muted-foreground">
                                Total: {formatCurrency(invoice.total)}
                              </span>
                              {invoice.dueAt ? (
                                <span className="text-xs text-muted-foreground">
                                  Due: {formatDateTime(invoice.dueAt)}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">
                              Issued {formatDateTime(invoice.issuedAt)}
                            </div>
                            <div className="text-xs mt-0.5 text-muted-foreground">
                              <span>Paid: {formatCurrency(paidAmount)}</span>
                              {remaining > 0 ? (
                                <span className="ml-2">
                                  Remaining: {formatCurrency(remaining)}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center gap-1.5">
                          {filters.showPayments &&
                          invoice.payments.length > 0 ? (
                            <Button
                              variant="outline"
                              size="icon-sm"
                              className="text-[11px] h-7 px-2"
                              onClick={() => toggleInvoiceExpand(invoice.id)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3 mr-1" />
                              ) : (
                                <ChevronDown className="h-3 w-3 mr-1" />
                              )}
                              {isExpanded
                                ? "Hide payments"
                                : `Show payments (${invoice.payments.length})`}
                            </Button>
                          ) : null}
                        </div>

                        {filters.showPayments && isExpanded ? (
                          <div className="mt-3 space-y-2.5">
                            {invoice.payments
                              .slice()
                              .sort(
                                (a, b) =>
                                  new Date(a.receivedAt).getTime() -
                                  new Date(b.receivedAt).getTime()
                              )
                              .map((payment, idx) => (
                                <div key={payment.id} className="relative pl-7">
                                  <div className="absolute left-0 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
                                  <div className="rounded border p-2.5 bg-background">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div className="text-sm font-medium">
                                        Payment {idx + 1}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {formatDateTime(payment.receivedAt)}
                                      </div>
                                    </div>
                                    <div className="mt-0.5 text-xs">
                                      Amount:{" "}
                                      <span className="font-medium text-sm">
                                        {formatCurrency(payment.amount)}
                                      </span>
                                      <span className="ml-2 text-muted-foreground">
                                        Method: {formatMethod(payment.method)}
                                      </span>
                                      {payment.notes ? (
                                        <span className="ml-2 text-muted-foreground">
                                          · {payment.notes}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: Invoice["status"] }) {
  return (
    <Badge
      variant={
        status === "paid"
          ? "outline"
          : status === "partial"
          ? "secondary"
          : "destructive"
      }
      className="text-[11px] rounded-full px-2.5 py-0.5"
    >
      {status === "paid" ? "Paid" : status === "partial" ? "Partial" : "Unpaid"}
    </Badge>
  );
}

function formatMethod(method: Payment["method"]) {
  switch (method) {
    case "bank_transfer":
      return "Bank Transfer";
    case "card":
      return "Card";
    case "cash":
      return "Cash";
    case "upi":
      return "UPI";
    default:
      return method;
  }
}
