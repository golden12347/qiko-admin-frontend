// ============================================================
// Customers — Platform-wide customer management & oversight
// API-backed table with server-side pagination
// ============================================================

import { FormEvent, useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Users,
  TrendingUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  ChevronRight,
  Bot,
  MessageSquare,
  MailPlus,
  UserRound,
} from "lucide-react";
import { adminCustomerList, type CustomerListApiResponse } from "@/services/adminCustomersApi";
import { useGlobalDateFilter } from "@/contexts/DateFilterContext";
import { toast } from "sonner";
import {
  CustomersKpiSkeleton,
  CustomersSearchRowSkeleton,
  CustomersTableSkeletonBody,
} from "@/components/tabPageSkeletons";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const statusColors: Record<string, string> = {
  Active: "bg-qiko-success/15 text-qiko-success border-qiko-success/20",
  "Non-active": "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/20",
};

const planColors: Record<string, string> = {
  Basic: "bg-muted-foreground/10 text-muted-foreground",
  Premium: "bg-qiko-indigo/10 text-qiko-indigo",
  Enterprise: "bg-qiko-warning/10 text-qiko-warning",
  null: "bg-muted/20 text-muted-foreground",
};

const customerInviteStatusBadge: Record<string, string> = {
  pending: "bg-qiko-warning/15 text-qiko-warning border-qiko-warning/30",
  accepted: "bg-qiko-success/15 text-qiko-success border-qiko-success/30",
  revoked: "bg-muted/40 text-muted-foreground border-border/30",
};

type SortKey =
  | "name"
  | "plan"
  | "status"
  | "workersCount"
  | "conversationsTotal"
  | "totalEarnings"
  | "joinedDate";

type SortDir = "asc" | "desc";

type DisplayPlan = "Basic" | "Premium" | "Enterprise" | "null";
type DisplayStatus = string;

interface CustomerRow {
  id: string;
  name: string;
  slug: string;
  plan: DisplayPlan;
  status: DisplayStatus;
  workersCount: number;
  conversationsTotal: number;
  totalEarnings: number;
  joinedDate: string;
  contactEmail: string;
  industry: string;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr || "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function escapeCsv(value: string | number): string {
  const stringValue = String(value ?? "");
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/[^0-9.-]/g, "");
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function extractCustomerArray(payload: CustomerListApiResponse): unknown[] {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.customers)) return payload.customers;

  const nested = payload?.data as Record<string, unknown> | undefined;
  if (nested) {
    if (Array.isArray(nested.data)) return nested.data;
    if (Array.isArray(nested.items)) return nested.items;
    if (Array.isArray(nested.customers)) return nested.customers;
  }

  return [];
}

function getDisplayPlan(plan: unknown): DisplayPlan {
  if (plan === null) return "null";
  if (typeof plan !== "string") return "Basic";
  const normalized = plan.toLowerCase();
  if (normalized.includes("enterprise")) return "Enterprise";
  if (normalized.includes("premium") || normalized.includes("business") || normalized.includes("growth")) return "Premium";
  return "Basic";
}

function getDisplayStatus(status: unknown): DisplayStatus {
  if (typeof status !== "string" || status.trim().length === 0) return "null";
  return status;
}

function getStatusBadgeClass(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === "active") return statusColors.Active;
  if (normalized === "non-active" || normalized === "inactive") return statusColors["Non-active"];
  return "bg-muted/20 text-muted-foreground border-border/40";
}

function normalizeCustomer(item: unknown): CustomerRow {
  const row = (item ?? {}) as Record<string, unknown>;
  const name = typeof row.name === "string"
    ? row.name
    : typeof row.user_name === "string"
      ? row.user_name
      : "Unknown";
  const slug = typeof row.slug === "string" && row.slug.length > 0 ? row.slug : slugify(name);
  const isNullPlan = row.subscription_plan_name === null;
  return {
    id: String(row.id ?? slug),
    name,
    slug,
    plan: isNullPlan
      ? "null"
      : getDisplayPlan(row.subscription_plan_name ?? row.plan ?? row.subscription_plan ?? ""),
    status: getDisplayStatus(row.stripe_status ?? row.status ?? ""),
    workersCount: isNullPlan ? 0 : toNumber(row.agents_count ?? row.workers_count ?? row.workersCount),
    conversationsTotal: toNumber(row.total_conversations ?? row.conversations_total ?? row.conversationsCount ?? row.conversationsTotal),
    totalEarnings: toNumber(
      row.total_earning ??
      row.total_earnings ??
      row.total_earning_amount ??
      row.earning ??
      row.earnings ??
      row.revenue
    ),
    joinedDate: String(row.joined_date ?? row.joinedDate ?? row.created_at ?? row.createdAt ?? ""),
    contactEmail: String(row.user_email ?? row.email ?? row.contact_email ?? row.contactEmail ?? ""),
    industry: String(row.industry ?? ""),
  };
}

export default function Customers() {
  const [, navigate] = useLocation();
  const { filter } = useGlobalDateFilter();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("totalEarnings");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [inviteCustomerOpen, setInviteCustomerOpen] = useState(false);
  const [customerInviteName, setCustomerInviteName] = useState("");
  const [customerInviteEmail, setCustomerInviteEmail] = useState("");
  /** UI-only — replace with API-driven list when backend exists */
  const [customerInvitesUi] = useState<
    Array<{ id: string; name: string; email: string; status: string; invitedAt: string }>
  >([]);
  const [customersApi, setCustomersApi] = useState<CustomerRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [activeStripeStatusCount, setActiveStripeStatusCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminCustomerList(page, filter);
      console.log("[Customers] customer-list API response:", data);
      const list = extractCustomerArray(data);

      const normalized = list.map((item) => normalizeCustomer(item));
      setCustomersApi(normalized);

      const nested = data?.data as Record<string, unknown> | undefined;
      const total = toNumber(
        data?.meta?.total ??
        data?.total ??
        (nested?.total as unknown) ??
        (nested?.length as unknown),
        normalized.length
      );
      const pages = toNumber(
        data?.meta?.last_page ??
        data?.last_page ??
        (nested?.last_page as unknown),
        1
      );
      const activeCount = toNumber(
        data?.active_stripe_status_count ??
        data?.meta?.active_stripe_status_count ??
        (nested?.active_stripe_status_count as unknown),
        normalized.filter((c) => c.status.toLowerCase() === "active").length
      );
      setTotalCustomers(total);
      setActiveStripeStatusCount(activeCount);
      setTotalPages(Math.max(1, pages));
    } catch {
      toast.error("Failed to fetch customers list.");
      setCustomersApi([]);
      setTotalCustomers(0);
      setActiveStripeStatusCount(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const stats = useMemo(() => ({
    total: totalCustomers,
    active: activeStripeStatusCount,
  }), [activeStripeStatusCount, totalCustomers]);

  const pendingCustomerInvites = useMemo(
    () => customerInvitesUi.filter((i) => String(i.status).toLowerCase() === "pending").length,
    [customerInvitesUi]
  );

  const filtered = useMemo(() => {
    const result = customersApi.filter((c) => {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.contactEmail.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q)
      );
    });

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "plan": cmp = a.plan.localeCompare(b.plan); break;
        case "status": cmp = a.status.localeCompare(b.status); break;
        case "workersCount": cmp = a.workersCount - b.workersCount; break;
        case "conversationsTotal": cmp = a.conversationsTotal - b.conversationsTotal; break;
        case "totalEarnings": cmp = a.totalEarnings - b.totalEarnings; break;
        case "joinedDate": cmp = new Date(a.joinedDate).getTime() - new Date(b.joinedDate).getTime(); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [customersApi, search, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="size-3 text-muted-foreground/40 ml-1" />;
    return sortDir === "asc"
      ? <ArrowUp className="size-3 text-qiko-indigo ml-1" />
      : <ArrowDown className="size-3 text-qiko-indigo ml-1" />;
  }

  function handleExportCsv() {
    if (filtered.length === 0) {
      toast.error("No data to export.");
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Plan",
      "Status",
      "Workers",
      "Conversations",
      "Total Earnings",
      "Joined",
    ];

    const rows = filtered.map((c) => [
      c.name,
      c.contactEmail,
      c.plan,
      c.status,
      c.workersCount,
      c.conversationsTotal,
      c.totalEarnings,
      c.joinedDate,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCsv(cell)).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const datePart = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `customers-${datePart}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filtered.length} customers.`);
  }

  function handleCustomerInviteSubmit(e: FormEvent) {
    e.preventDefault();
    // UI only — wire API when backend is ready
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All organizations using the Qiko platform
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant={inviteCustomerOpen ? "secondary" : "default"}
            size="sm"
            className="text-xs gap-1.5"
            onClick={() => setInviteCustomerOpen((o) => !o)}
          >
            <MailPlus className="size-3.5" />
            Invite Customer
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 border-border/50"
            onClick={handleExportCsv}
          >
            <Download className="size-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {inviteCustomerOpen && (
        <Card className="bg-card/80 border-border/40">
          <CardHeader>
            <CardTitle className="text-base">Invite Customer</CardTitle>
            <CardDescription>Add full name and email to invite a customer.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCustomerInviteSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="customer-invite-name">Full name</Label>
                <Input
                  id="customer-invite-name"
                  type="text"
                  placeholder="Jane Customer"
                  value={customerInviteName}
                  onChange={(e) => setCustomerInviteName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="customer-invite-email">Email address</Label>
                <Input
                  id="customer-invite-email"
                  type="email"
                  placeholder="new-customer@company.com"
                  value={customerInviteEmail}
                  onChange={(e) => setCustomerInviteEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="md:col-span-3 flex items-center justify-end">
                <Button type="submit" className="gap-1.5">
                  <MailPlus className="size-3.5" />
                  Send Invite
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList className="bg-secondary/40">
          <TabsTrigger value="customers">Customers ({totalCustomers})</TabsTrigger>
          <TabsTrigger value="invites">Invites ({customerInvitesUi.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-6 mt-0 outline-none">
      {isLoading ? (
        <CustomersKpiSkeleton />
      ) : (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <KPICard icon={<Users className="size-4" />} label="Total" value={stats.total} color="text-foreground" />
          <KPICard icon={<TrendingUp className="size-4" />} label="Active" value={stats.active} color="text-qiko-success" />
        </motion.div>
      )}

      {isLoading ? (
        <CustomersSearchRowSkeleton />
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, industry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary/50 border-border/50"
            />
          </div>
          {search && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => { setSearch(""); }}
            >
              Clear search
            </Button>
          )}
          <span className="text-xs text-muted-foreground ml-auto tabular-nums">
            {filtered.length} on this page · {totalCustomers} total
          </span>
        </div>
      )}

      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Card className="bg-card/80 border-border/40">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <SortableHead col="name" label="Customer" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="name" />} />
                    <TableHead className="text-xs font-medium text-muted-foreground">Email</TableHead>
                    <SortableHead col="plan" label="Plan" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="plan" />} />
                    <SortableHead col="status" label="Status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="status" />} />
                    <SortableHead col="workersCount" label="Workers" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="workersCount" />} align="right" />
                    <SortableHead col="conversationsTotal" label="Conversations" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="conversationsTotal" />} align="right" />
                    <SortableHead col="totalEarnings" label="Total Earnings" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="totalEarnings" />} align="right" />
                    <SortableHead col="joinedDate" label="Joined" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="joinedDate" />} />
                    <TableHead className="text-xs font-medium text-muted-foreground w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && <CustomersTableSkeletonBody />}
                  {!isLoading && filtered.map((c) => (
                    <TableRow
                      key={c.id}
                      className="border-border/30 cursor-pointer hover:bg-secondary/30 transition-colors group"
                      onClick={() => navigate(`/customers/${encodeURIComponent(c.slug)}?userId=${encodeURIComponent(c.id)}`)}
                    >
                      <TableCell className="min-w-[180px]">
                        <p className="text-sm font-medium group-hover:text-qiko-indigo transition-colors">{c.name}</p>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.contactEmail || "—"}</TableCell>

                      <TableCell>
                        <Badge variant="secondary" className={`text-[10px] border-0 ${planColors[c.plan]}`}>
                          {c.plan}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${getStatusBadgeClass(c.status)}`}>
                          {c.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <span className="tabular-nums text-sm flex items-center justify-end gap-1">
                          <Bot className="size-3 text-muted-foreground/50" />
                          {c.workersCount}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        <span className="tabular-nums text-sm flex items-center justify-end gap-1">
                          <MessageSquare className="size-3 text-muted-foreground/50" />
                          {fmt(c.conversationsTotal)}
                        </span>
                      </TableCell>

                      <TableCell className="text-right tabular-nums text-sm font-medium">
                        {c.totalEarnings > 0 ? `$${c.totalEarnings.toLocaleString()}` : "$0"}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(c.joinedDate)}
                      </TableCell>

                      <TableCell className="w-8">
                        <ChevronRight className="size-4 text-muted-foreground/30 group-hover:text-qiko-indigo transition-colors" />
                      </TableCell>
                    </TableRow>
                  ))}

                  {!isLoading && filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                        No customers found for this page.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing page {page} of {totalPages} · Sorted by {sortKey.replace(/([A-Z])/g, " $1").toLowerCase()} ({sortDir})</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </Button>
          <span>
            Page {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
          <span className="ml-2">Click any row to view customer details</span>
        </div>
      </div>
        </TabsContent>

        <TabsContent value="invites" className="space-y-4 mt-0 outline-none">
          <Card className="bg-card/80 border-border/40">
            <CardHeader>
              <CardTitle className="text-base">Invitation History</CardTitle>
              <CardDescription>{pendingCustomerInvites} pending invitations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {customerInvitesUi.length === 0 && (
                <div className="rounded-lg border border-dashed border-border/40 p-6 text-center text-sm text-muted-foreground">
                  No customer invitations sent yet.
                </div>
              )}
              {customerInvitesUi.map((invite) => (
                <div key={invite.id} className="rounded-lg border border-border/40 bg-secondary/20 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{invite.name || invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {invite.email}
                        {invite.invitedAt ? ` • ${formatDate(invite.invitedAt)}` : ""}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={customerInviteStatusBadge[String(invite.status).toLowerCase()] ?? customerInviteStatusBadge.pending}
                    >
                      <UserRound className="size-3 mr-1" />
                      {invite.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KPICard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <Card className="bg-card/80 border-border/40">
      <CardContent className="p-3 flex items-center gap-2.5">
        <span className={`${color} opacity-50`}>{icon}</span>
        <div>
          <p className={`text-base font-bold font-heading tabular-nums ${color}`}>{value}</p>
          <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SortableHead({
  col,
  label,
  onSort,
  icon,
  align = "left",
}: {
  col: SortKey;
  label: string;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  icon: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <TableHead
      className={`text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none whitespace-nowrap ${
        align === "right" ? "text-right" : "text-left"
      }`}
      onClick={() => onSort(col)}
    >
      <span className={`inline-flex items-center gap-0.5 ${align === "right" ? "justify-end" : ""}`}>
        {label}{icon}
      </span>
    </TableHead>
  );
}
