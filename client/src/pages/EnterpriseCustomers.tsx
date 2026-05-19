// ============================================================
// Enterprise Customers — Custom subscription enterprise accounts
// UI-only: mock data, no API / Stripe
// ============================================================

import { FormEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  Building2,
  TrendingUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  Bot,
  MessageSquare,
  UserPlus,
  Link2,
} from "lucide-react";
import { useIsSuperAdmin } from "@/store/hooks";
import { toast } from "sonner";
import {
  getEnterpriseCustomers,
  setEnterpriseCustomers,
  updateEnterpriseCustomer,
  createEnterpriseCustomerId,
  slugifyEnterpriseName,
  canSendPaymentLink,
  getEnterpriseStatusLabel,
  type EnterpriseCustomer,
} from "@/lib/enterpriseData";
import { PaymentLinkDialog } from "@/components/enterprise/PaymentLinkDialog";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const statusColors: Record<string, string> = {
  Active: "bg-qiko-success/15 text-qiko-success border-qiko-success/20",
  "Pending payment": "bg-qiko-warning/15 text-qiko-warning border-qiko-warning/20",
};

type SortKey =
  | "name"
  | "subscriptionAmount"
  | "status"
  | "nextPaymentDate"
  | "workersCount"
  | "conversationsTotal"
  | "revenue"
  | "joinedDate";

type SortDir = "asc" | "desc";

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

function formatCurrency(n: number): string {
  return `$${n.toLocaleString()}`;
}

function formatSubscription(amount: number | null): string {
  if (amount == null) return "Pending";
  return `${formatCurrency(amount)}/mo`;
}

export default function EnterpriseCustomers() {
  const isSuperAdmin = useIsSuperAdmin();
  const [, navigate] = useLocation();

  const [customers, setCustomersState] = useState<EnterpriseCustomer[]>(() => getEnterpriseCustomers());

  const setCustomers = (updater: EnterpriseCustomer[] | ((prev: EnterpriseCustomer[]) => EnterpriseCustomer[])) => {
    setCustomersState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      setEnterpriseCustomers(next);
      return next;
    });
  };
  const [searchInput, setSearchInput] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("joinedDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<EnterpriseCustomer | null>(null);

  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => c.status === "Active").length;
    return { total, active };
  }, [customers]);

  const filtered = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    let rows = customers;
    if (q) {
      rows = rows.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q)
      );
    }
    const sorted = [...rows].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "subscriptionAmount":
          cmp = (a.subscriptionAmount ?? 0) - (b.subscriptionAmount ?? 0);
          break;
        case "status":
          cmp = getEnterpriseStatusLabel(a).localeCompare(getEnterpriseStatusLabel(b));
          break;
        case "nextPaymentDate":
          cmp =
            new Date(a.nextPaymentDate ?? 0).getTime() - new Date(b.nextPaymentDate ?? 0).getTime();
          break;
        case "workersCount":
          cmp = a.workersCount - b.workersCount;
          break;
        case "conversationsTotal":
          cmp = a.conversationsTotal - b.conversationsTotal;
          break;
        case "revenue":
          cmp = a.revenue - b.revenue;
          break;
        case "joinedDate":
          cmp = new Date(a.joinedDate).getTime() - new Date(b.joinedDate).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [customers, searchInput, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="size-3 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />;
  };

  const handleCreateSubmit = (e: FormEvent) => {
    e.preventDefault();
    const name = createName.trim();
    const email = createEmail.trim();
    if (!name || !email) return;

    setCreateSubmitting(true);
    const baseSlug = slugifyEnterpriseName(name);
    let slug = baseSlug || "enterprise-customer";
    if (customers.some((c) => c.slug === slug)) {
      slug = `${slug}-${Date.now()}`;
    }

    const newCustomer: EnterpriseCustomer = {
      id: createEnterpriseCustomerId(),
      slug,
      name,
      email,
      status: "Pending payment",
      subscriptionAmount: null,
      workersCount: 0,
      conversationsTotal: 0,
      revenue: 0,
      joinedDate: new Date().toISOString().slice(0, 10),
      lastPaymentLinkSent: null,
      nextPaymentDate: null,
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    setCreateName("");
    setCreateEmail("");
    setCreateOpen(false);
    setCreateSubmitting(false);
    toast.success(`Enterprise customer "${name}" created.`);
    setPaymentTarget(newCustomer);
    setPaymentDialogOpen(true);
  };

  const openPaymentDialog = (customer: EnterpriseCustomer, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!canSendPaymentLink(customer)) {
      toast.error("A payment link was already sent for this customer.");
      return;
    }
    setPaymentTarget(customer);
    setPaymentDialogOpen(true);
  };

  const handlePaymentConfirm = (amount: number) => {
    if (!paymentTarget || !canSendPaymentLink(paymentTarget)) return;
    const today = new Date().toISOString().slice(0, 10);
    const patch = {
      subscriptionAmount: amount,
      lastPaymentLinkSent: today,
    };
    updateEnterpriseCustomer(paymentTarget.id, patch);
    setCustomers((prev) => prev.map((c) => (c.id === paymentTarget.id ? { ...c, ...patch } : c)));
    setPaymentTarget((prev) => (prev ? { ...prev, ...patch } : null));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight">Enterprise Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Custom subscription plans — unlike Standard ($49/mo via Stripe)
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isSuperAdmin && (
            <Button
              variant={createOpen ? "secondary" : "default"}
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => setCreateOpen((o) => !o)}
            >
              <UserPlus className="size-3.5" />
              Create Enterprise Customer
            </Button>
          )}
        </div>
      </div>

      {isSuperAdmin && createOpen && (
        <Card className="bg-card/80 border-border/40">
          <CardHeader>
            <CardTitle className="text-base">Create Enterprise Customer</CardTitle>
            <CardDescription>
              Add full name and email. Send a payment link after creation to set the monthly amount.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="enterprise-create-name">Full name</Label>
                <Input
                  id="enterprise-create-name"
                  type="text"
                  placeholder="Jane Enterprise"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  autoComplete="name"
                  required
                  disabled={createSubmitting}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="enterprise-create-email">Email address</Label>
                <Input
                  id="enterprise-create-email"
                  type="email"
                  placeholder="billing@company.com"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={createSubmitting}
                />
              </div>
              <div className="md:col-span-3 flex items-center justify-end">
                <Button type="submit" className="gap-1.5" disabled={createSubmitting}>
                  <UserPlus className="size-3.5" />
                  {createSubmitting ? "Creating…" : "Create Enterprise Customer"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <motion.div
        className="grid grid-cols-2 sm:grid-cols-2 gap-3"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <KPICard
          icon={<Building2 className="size-4" />}
          label="Total"
          value={stats.total}
          color="text-foreground"
        />
        <KPICard
          icon={<TrendingUp className="size-4" />}
          label="Active subscriptions"
          value={stats.active}
          color="text-qiko-success"
        />
      </motion.div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 bg-secondary/50 border-border/50"
          />
        </div>
        {searchInput.trim() && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setSearchInput("")}
          >
            Clear search
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto tabular-nums">
          {filtered.length} customer{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Card className="bg-card/80 border-border/40">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <SortableHead col="name" label="Customer" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="name" />} />
                    <TableHead className="text-xs font-medium text-muted-foreground">Email</TableHead>
                    <SortableHead col="subscriptionAmount" label="Subscription" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="subscriptionAmount" />} />
                    <SortableHead col="status" label="Status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="status" />} />
                    <SortableHead col="nextPaymentDate" label="Next payment" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="nextPaymentDate" />} />
                    <SortableHead col="workersCount" label="Workers" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="workersCount" />} align="right" />
                    <SortableHead col="conversationsTotal" label="Conversations" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="conversationsTotal" />} align="right" />
                    <SortableHead col="revenue" label="Revenue" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="revenue" />} align="right" />
                    <SortableHead col="joinedDate" label="Joined" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="joinedDate" />} />
                    {isSuperAdmin && (
                      <TableHead className="text-xs font-medium text-muted-foreground text-right w-[120px]">
                        Actions
                      </TableHead>
                    )}
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow
                      key={c.id}
                      className="border-border/30 cursor-pointer hover:bg-secondary/30 transition-colors group"
                      onClick={() =>
                        navigate(`/enterprise/${encodeURIComponent(c.slug)}?userId=${encodeURIComponent(c.id)}`)
                      }
                    >
                      <TableCell className="min-w-[180px]">
                        <p className="text-sm font-medium group-hover:text-qiko-indigo transition-colors">
                          {c.name}
                        </p>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.email}</TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {c.subscriptionAmount != null ? (
                          <span className="font-medium">{formatSubscription(c.subscriptionAmount)}</span>
                        ) : (
                          <Badge variant="outline" className="text-[10px] border-qiko-warning/30 text-qiko-warning">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            statusColors[c.status] ??
                            (c.lastPaymentLinkSent ? statusColors["Pending payment"] : "")
                          }`}
                        >
                          {getEnterpriseStatusLabel(c)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {c.nextPaymentDate ? formatDate(c.nextPaymentDate) : "—"}
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
                        {formatCurrency(c.revenue)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(c.joinedDate)}
                      </TableCell>
                      {isSuperAdmin && (
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          {canSendPaymentLink(c) ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1.5 text-xs"
                              onClick={(e) => openPaymentDialog(c, e)}
                            >
                              <Link2 className="size-3.5" />
                              Payment link
                            </Button>
                          ) : (
                            <span className="text-[10px] text-muted-foreground pr-2">
                              {c.status === "Active" ? "Subscribed" : "Link sent"}
                            </span>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="w-8">
                        <ChevronRight className="size-4 text-muted-foreground/30 group-hover:text-qiko-indigo transition-colors" />
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={isSuperAdmin ? 11 : 10} className="text-center py-12 text-muted-foreground">
                        No enterprise customers found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <p className="text-xs text-muted-foreground">Click any row to view enterprise customer details</p>

      {paymentTarget && canSendPaymentLink(paymentTarget) && (
        <PaymentLinkDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          customerName={paymentTarget.name}
          customerEmail={paymentTarget.email}
          onConfirm={handlePaymentConfirm}
        />
      )}
    </div>
  );
}

function KPICard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
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
  sortKey,
  sortDir,
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
      <span className={`inline-flex items-center gap-0.5 ${align === "right" ? "justify-end w-full" : ""}`}>
        {label}
        {icon}
      </span>
    </TableHead>
  );
}
