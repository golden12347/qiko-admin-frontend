// ============================================================
// Customer Detail — Full account overview for a single customer
// Top summary, KPI cards, workers table, revenue summary,
// activity timeline, and audit history
// Design: Dark Lattice — analytical, Stripe-inspired
// ============================================================

import { useMemo } from "react";
import { useParams, useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Mail,
  Globe,
  CreditCard,
  Bot,
  MessageSquare,
  Target,
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  Clock,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  Zap,
  BarChart3,
  Shield,
  ExternalLink,
} from "lucide-react";
import {
  customers,
  platformWorkers,
  platformConversations,
  activityLogs,
  type Customer,
  type PlatformWorker,
  type ActivityLog,
} from "@/lib/data";

/* ── animation ─────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.05, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

/* ── badge colors ──────────────────────────────────────────── */
const statusColors: Record<string, string> = {
  Active: "bg-qiko-success/15 text-qiko-success border-qiko-success/20",
  Trial: "bg-qiko-cyan/15 text-qiko-cyan border-qiko-cyan/20",
  Churned: "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/20",
  Suspended: "bg-qiko-error/15 text-qiko-error border-qiko-error/20",
};

const planColors: Record<string, string> = {
  Starter: "bg-muted-foreground/10 text-muted-foreground",
  Growth: "bg-qiko-cyan/10 text-qiko-cyan",
  Business: "bg-qiko-indigo/10 text-qiko-indigo",
  Enterprise: "bg-qiko-warning/10 text-qiko-warning",
};

const workerStatusColors: Record<string, string> = {
  Live: "bg-qiko-success/15 text-qiko-success border-qiko-success/20",
  Training: "bg-qiko-cyan/15 text-qiko-cyan border-qiko-cyan/20",
  Paused: "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/20",
  Error: "bg-qiko-error/15 text-qiko-error border-qiko-error/20",
};

const workerTypeColors: Record<string, string> = {
  Sales: "bg-violet-500/10 text-violet-400",
  Support: "bg-blue-500/10 text-blue-400",
  Research: "bg-emerald-500/10 text-emerald-400",
  "Financial Analyst": "bg-amber-500/10 text-amber-400",
  Onboarding: "bg-cyan-500/10 text-cyan-400",
  Retention: "bg-rose-500/10 text-rose-400",
};

const severityConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  success: { icon: CheckCircle2, color: "text-qiko-success", bg: "bg-qiko-success/10" },
  info: { icon: Info, color: "text-qiko-cyan", bg: "bg-qiko-cyan/10" },
  warning: { icon: AlertTriangle, color: "text-qiko-warning", bg: "bg-qiko-warning/10" },
  error: { icon: XCircle, color: "text-qiko-error", bg: "bg-qiko-error/10" },
};

/* ── helpers ───────────────────────────────────────────────── */
function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

/* ── component ─────────────────────────────────────────────── */
export default function CustomerDetail() {
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();

  const customer = useMemo(
    () => customers.find((c) => c.slug === params.slug),
    [params.slug]
  );

  const workers = useMemo(
    () => (customer ? platformWorkers.filter((w) => w.customerId === customer.id) : []),
    [customer]
  );

  const conversations = useMemo(
    () => (customer ? platformConversations.filter((c) => c.customerId === customer.id) : []),
    [customer]
  );

  const logs = useMemo(
    () => (customer ? activityLogs.filter((l) => l.customerId === customer.id) : []),
    [customer]
  );

  /* ── derived KPIs ─────────────────────────────────────────── */
  const kpis = useMemo(() => {
    if (!customer) return null;
    const activeWorkers = workers.filter((w) => w.status === "Live").length;
    const totalConvToday = workers.reduce((s, w) => s + w.conversationsToday, 0);
    const avgConvPerWorker = activeWorkers > 0 ? Math.round(customer.conversationsTotal / workers.length) : 0;
    const conversionRate = customer.conversationsTotal > 0
      ? ((customer.leadsTotal / customer.conversationsTotal) * 100).toFixed(1)
      : "0";
    return {
      conversationsThisMonth: totalConvToday * 30, // estimate
      conversionRate,
      revenueThisMonth: customer.mrr,
      activeWorkers,
      avgConvPerWorker,
    };
  }, [customer, workers]);

  /* ── revenue attribution per worker ───────────────────────── */
  const workerRevenue = useMemo(() => {
    if (!customer || workers.length === 0) return new Map<string, number>();
    const totalLeads = workers.reduce((s, w) => s + w.leadsGenerated, 0);
    const map = new Map<string, number>();
    workers.forEach((w) => {
      const share = totalLeads > 0 ? w.leadsGenerated / totalLeads : 0;
      map.set(w.id, Math.round(customer.totalEarnings * share));
    });
    return map;
  }, [customer, workers]);

  /* ── audit summary ────────────────────────────────────────── */
  const auditSummary = useMemo(() => {
    const byCategory = new Map<string, number>();
    const bySeverity = new Map<string, number>();
    logs.forEach((l) => {
      byCategory.set(l.category, (byCategory.get(l.category) || 0) + 1);
      bySeverity.set(l.severity, (bySeverity.get(l.severity) || 0) + 1);
    });
    return { byCategory, bySeverity, total: logs.length };
  }, [logs]);

  if (!customer) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[60vh] gap-4">
        <Building2 className="size-12 text-muted-foreground/30" />
        <p className="text-muted-foreground">Customer not found.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/customers")}>
          <ArrowLeft className="size-4 mr-2" /> Back to Customers
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* ── Breadcrumb + Back ───────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/customers" className="hover:text-foreground transition-colors">
          Customers
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{customer.name}</span>
      </div>

      {/* ── Top Account Header ──────────────────────────────── */}
      <motion.div
        className="flex flex-col lg:flex-row gap-6"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        {/* Left: Identity */}
        <motion.div variants={fadeUp} custom={0} className="flex-1">
          <Card className="bg-card/80 border-border/40 h-full">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-qiko-indigo/12 text-qiko-indigo font-bold text-xl">
                  {customer.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold font-heading tracking-tight">{customer.name}</h1>
                    <Badge variant="outline" className={`text-xs ${statusColors[customer.status]}`}>
                      {customer.status}
                    </Badge>
                    <Badge variant="secondary" className={`text-xs border-0 ${planColors[customer.plan]}`}>
                      {customer.plan}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{customer.industry} · {customer.country}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 mt-4">
                    <InfoItem icon={<Mail className="size-3.5" />} label="Contact" value={customer.contactEmail} />
                    <InfoItem icon={<Calendar className="size-3.5" />} label="Joined" value={formatDate(customer.joinedDate)} />
                    <InfoItem icon={<Clock className="size-3.5" />} label="Last Active" value={customer.lastActive} />
                    <InfoItem icon={<CreditCard className="size-3.5" />} label="MRR" value={customer.mrr > 0 ? `$${customer.mrr.toLocaleString()}/mo` : "—"} />
                    <InfoItem icon={<Globe className="size-3.5" />} label="Account Age" value={`${daysSince(customer.joinedDate)} days`} />
                    <InfoItem icon={<Shield className="size-3.5" />} label="Account Owner" value="Unassigned" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right: Account Stats */}
        <motion.div variants={fadeUp} custom={1} className="lg:w-[340px]">
          <Card className="bg-card/80 border-border/40 h-full">
            <CardContent className="p-6">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Account Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                <StatBox icon={<Bot className="size-4" />} label="Workers" value={customer.workersCount} color="text-qiko-indigo" />
                <StatBox icon={<MessageSquare className="size-4" />} label="Conversations" value={fmt(customer.conversationsTotal)} color="text-qiko-cyan" />
                <StatBox icon={<Target className="size-4" />} label="Conversions" value={fmt(customer.leadsTotal)} color="text-qiko-success" />
                <StatBox icon={<Users className="size-4" />} label="Paid Subs" value={customer.paidSubscribers} color="text-violet-400" />
                <StatBox icon={<DollarSign className="size-4" />} label="Total Earnings" value={`$${customer.totalEarnings.toLocaleString()}`} color="text-emerald-400" />
                <StatBox icon={<Zap className="size-4" />} label="Conv. Rate" value={customer.conversationsTotal > 0 ? `${((customer.leadsTotal / customer.conversationsTotal) * 100).toFixed(1)}%` : "—"} color="text-amber-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ── KPI Cards Row ───────────────────────────────────── */}
      {kpis && (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <KPICard custom={0} icon={<MessageSquare className="size-4" />} label="Est. Conversations / Month" value={fmt(kpis.conversationsThisMonth)} color="text-qiko-cyan" />
          <KPICard custom={1} icon={<TrendingUp className="size-4" />} label="Conversion Rate" value={`${kpis.conversionRate}%`} color="text-qiko-success" />
          <KPICard custom={2} icon={<DollarSign className="size-4" />} label="Revenue / Month" value={kpis.revenueThisMonth > 0 ? `$${kpis.revenueThisMonth.toLocaleString()}` : "—"} color="text-emerald-400" />
          <KPICard custom={3} icon={<Bot className="size-4" />} label="Active Workers" value={kpis.activeWorkers} color="text-qiko-indigo" />
          <KPICard custom={4} icon={<BarChart3 className="size-4" />} label="Avg Conv / Worker" value={fmt(kpis.avgConvPerWorker)} color="text-violet-400" />
        </motion.div>
      )}

      {/* ── Workers Table ───────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }}>
        <Card className="bg-card/80 border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bot className="size-4 text-qiko-indigo" />
                Workers ({workers.length})
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] border-0 bg-qiko-success/10 text-qiko-success">
                {workers.filter((w) => w.status === "Live").length} Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {workers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="text-xs font-medium text-muted-foreground">Worker Name</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Type</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground text-right">Total Conv.</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground text-right">Conversions</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground text-right">Conv. Rate</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground text-right">Rev. Attributed</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Last Active</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workers.map((w) => (
                    <TableRow
                      key={w.id}
                      className="border-border/30 cursor-pointer hover:bg-secondary/30 transition-colors group"
                      onClick={() => navigate(`/workers/${w.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-qiko-indigo/10 text-qiko-indigo text-[10px] font-bold">
                            {w.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium group-hover:text-qiko-indigo transition-colors">{w.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-[10px] border-0 ${workerTypeColors[w.type] || ""}`}>
                          {w.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${workerStatusColors[w.status]}`}>
                          {w.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{fmt(w.conversationsTotal)}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{fmt(w.leadsGenerated)}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        <span className={w.conversionRate >= 10 ? "text-qiko-success" : "text-muted-foreground"}>
                          {w.conversionRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-medium">
                        ${(workerRevenue.get(w.id) || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{w.lastActive}</TableCell>
                      <TableCell className="w-8">
                        <ChevronRight className="size-4 text-muted-foreground/30 group-hover:text-qiko-indigo transition-colors" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No workers found for this customer.
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Revenue & Subscription + Activity Timeline (side by side) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & Subscription Summary */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}>
          <Card className="bg-card/80 border-border/40 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="size-4 text-emerald-400" />
                Revenue & Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Plan info */}
              <div className="rounded-lg bg-secondary/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Plan</span>
                  <Badge variant="secondary" className={`text-xs border-0 ${planColors[customer.plan]}`}>
                    {customer.plan}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Monthly Recurring</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {customer.mrr > 0 ? `$${customer.mrr.toLocaleString()}/mo` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Lifetime Revenue</span>
                  <span className="text-sm font-semibold tabular-nums text-emerald-400">
                    ${customer.totalEarnings.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Paid Subscribers</span>
                  <span className="text-sm font-semibold tabular-nums">{customer.paidSubscribers}</span>
                </div>
              </div>

              {/* Usage meters */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Usage Metrics</h4>
                <UsageMeter
                  label="Workers"
                  current={customer.workersCount}
                  limit={customer.plan === "Enterprise" ? 50 : customer.plan === "Business" ? 20 : customer.plan === "Growth" ? 10 : 5}
                />
                <UsageMeter
                  label="Conversations / Month"
                  current={workers.reduce((s, w) => s + w.conversationsToday, 0) * 30}
                  limit={customer.plan === "Enterprise" ? 500000 : customer.plan === "Business" ? 100000 : customer.plan === "Growth" ? 25000 : 5000}
                />
              </div>

              {/* Revenue milestones */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue Milestones</h4>
                <div className="space-y-1.5">
                  <MilestoneItem
                    label="First payment"
                    reached={customer.totalEarnings > 0}
                    detail={customer.totalEarnings > 0 ? formatDate(customer.joinedDate) : "Pending"}
                  />
                  <MilestoneItem
                    label="$10K lifetime"
                    reached={customer.totalEarnings >= 10000}
                    detail={customer.totalEarnings >= 10000 ? "Reached" : `$${(10000 - customer.totalEarnings).toLocaleString()} to go`}
                  />
                  <MilestoneItem
                    label="$50K lifetime"
                    reached={customer.totalEarnings >= 50000}
                    detail={customer.totalEarnings >= 50000 ? "Reached" : `$${(50000 - customer.totalEarnings).toLocaleString()} to go`}
                  />
                  <MilestoneItem
                    label="$100K lifetime"
                    reached={customer.totalEarnings >= 100000}
                    detail={customer.totalEarnings >= 100000 ? "Reached" : `$${(100000 - customer.totalEarnings).toLocaleString()} to go`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Timeline */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.25 }}>
          <Card className="bg-card/80 border-border/40 h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="size-4 text-qiko-cyan" />
                  Activity Timeline
                </CardTitle>
                <span className="text-[10px] text-muted-foreground">{logs.length} events</span>
              </div>
            </CardHeader>
            <CardContent>
              {logs.length > 0 ? (
                <div className="relative space-y-0">
                  {/* Timeline line */}
                  <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border/40" />

                  {logs.map((log, idx) => {
                    const cfg = severityConfig[log.severity] || severityConfig.info;
                    const Icon = cfg.icon;
                    return (
                      <div key={log.id} className="relative flex gap-3 py-3">
                        <div className={`relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
                          <Icon className={`size-3.5 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{log.action}</span>
                            <Badge variant="secondary" className="text-[9px] border-0 bg-secondary/50">
                              {log.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.details}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground/60">{log.timestamp}</span>
                            <span className="text-[10px] text-muted-foreground/40">·</span>
                            <span className="text-[10px] text-muted-foreground/60">{log.actor}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No activity recorded for this customer.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Audit Summary ───────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.3 }}>
        <Card className="bg-card/80 border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="size-4 text-violet-400" />
              Account History & Audit Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Severity breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">By Severity</h4>
                <div className="space-y-2">
                  {(["success", "info", "warning", "error"] as const).map((sev) => {
                    const count = auditSummary.bySeverity.get(sev) || 0;
                    const cfg = severityConfig[sev];
                    const Icon = cfg.icon;
                    const pct = auditSummary.total > 0 ? (count / auditSummary.total) * 100 : 0;
                    return (
                      <div key={sev} className="flex items-center gap-3">
                        <Icon className={`size-3.5 shrink-0 ${cfg.color}`} />
                        <span className="text-xs capitalize w-16">{sev}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                          <div className={`h-full rounded-full ${cfg.bg.replace("/10", "/60")}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Category breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">By Category</h4>
                <div className="space-y-2">
                  {Array.from(auditSummary.byCategory.entries())
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, count]) => (
                      <div key={cat} className="flex items-center justify-between">
                        <span className="text-xs">{cat}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-qiko-indigo/60"
                              style={{ width: `${auditSummary.total > 0 ? (count / auditSummary.total) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-xs tabular-nums text-muted-foreground w-6 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Account health indicators */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Account Health</h4>
                <div className="space-y-2.5">
                  <HealthIndicator
                    label="Account Status"
                    status={customer.status === "Active" ? "good" : customer.status === "Trial" ? "neutral" : "bad"}
                    value={customer.status}
                  />
                  <HealthIndicator
                    label="Worker Health"
                    status={workers.some((w) => w.status === "Error") ? "bad" : workers.some((w) => w.status === "Paused") ? "neutral" : "good"}
                    value={workers.some((w) => w.status === "Error") ? "Issues detected" : "All healthy"}
                  />
                  <HealthIndicator
                    label="Activity Level"
                    status={customer.lastActive.includes("min") || customer.lastActive.includes("Just") ? "good" : customer.lastActive.includes("hour") ? "neutral" : "bad"}
                    value={customer.lastActive}
                  />
                  <HealthIndicator
                    label="Errors (24h)"
                    status={(auditSummary.bySeverity.get("error") || 0) === 0 ? "good" : (auditSummary.bySeverity.get("error") || 0) <= 2 ? "neutral" : "bad"}
                    value={`${auditSummary.bySeverity.get("error") || 0} errors`}
                  />
                  <HealthIndicator
                    label="Revenue Trend"
                    status={customer.mrr > 0 ? "good" : customer.totalEarnings > 0 ? "neutral" : "bad"}
                    value={customer.mrr > 0 ? "Paying" : customer.totalEarnings > 0 ? "Previously paid" : "No revenue"}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Recent Conversations ─────────────────────────────── */}
      {conversations.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.35 }}>
          <Card className="bg-card/80 border-border/40">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="size-4 text-muted-foreground" />
                  Recent Conversations
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate("/conversations")}>
                  View All <ExternalLink className="size-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="text-xs font-medium text-muted-foreground">User</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Worker</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Channel</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground text-right">Messages</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Duration</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Lead</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversations.slice(0, 5).map((conv) => (
                    <TableRow key={conv.id} className="border-border/30 hover:bg-secondary/20">
                      <TableCell className="text-sm">{conv.userName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{conv.workerName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] border-0">{conv.channel}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${statusColors[conv.status] || ""}`}>
                          {conv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{conv.messagesCount}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{conv.duration}</TableCell>
                      <TableCell>
                        {conv.leadCaptured ? (
                          <CheckCircle2 className="size-3.5 text-qiko-success" />
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{conv.timestamp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────── */

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-muted-foreground/60">{icon}</span>
      <span className="text-muted-foreground text-xs">{label}:</span>
      <span className="font-medium text-xs truncate">{value}</span>
    </div>
  );
}

function StatBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-lg bg-secondary/30 p-3 text-center">
      <div className={`flex items-center justify-center gap-1.5 mb-1 ${color} opacity-60`}>
        {icon}
      </div>
      <p className={`text-base font-bold font-heading tabular-nums ${color}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function KPICard({ custom, icon, label, value, color }: { custom: number; icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <motion.div variants={fadeUp} custom={custom}>
      <Card className="bg-card/80 border-border/40">
        <CardContent className="p-3.5 flex items-center gap-2.5">
          <span className={`${color} opacity-50`}>{icon}</span>
          <div>
            <p className={`text-base font-bold font-heading tabular-nums ${color}`}>{value}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function UsageMeter({ label, current, limit }: { label: string; current: number; limit: number }) {
  const pct = Math.min((current / limit) * 100, 100);
  const isHigh = pct > 80;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`tabular-nums font-medium ${isHigh ? "text-qiko-warning" : ""}`}>
          {current.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary/50 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isHigh ? "bg-qiko-warning/70" : "bg-qiko-indigo/60"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function MilestoneItem({ label, reached, detail }: { label: string; reached: boolean; detail: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${reached ? "bg-qiko-success/15" : "bg-secondary/50"}`}>
        {reached ? (
          <CheckCircle2 className="size-3 text-qiko-success" />
        ) : (
          <div className="size-1.5 rounded-full bg-muted-foreground/30" />
        )}
      </div>
      <span className={`text-xs flex-1 ${reached ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
      <span className="text-[10px] text-muted-foreground tabular-nums">{detail}</span>
    </div>
  );
}

function HealthIndicator({ label, status, value }: { label: string; status: "good" | "neutral" | "bad"; value: string }) {
  const dotColor = status === "good" ? "bg-qiko-success" : status === "neutral" ? "bg-qiko-warning" : "bg-qiko-error";
  return (
    <div className="flex items-center gap-2.5">
      <div className={`size-2 rounded-full ${dotColor}`} />
      <span className="text-xs text-muted-foreground flex-1">{label}</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}
