// ============================================================
// Alerts — Platform-wide alert management for Qiko Super Admin
// Severity tabs, alert types, acknowledge/resolve actions, history
// Design: Dark Lattice — data-dense, strong visibility
// ============================================================

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  XCircle,
  Info,
  CheckCircle2,
  Search,
  Bell,
  BellOff,
  Clock,
  Shield,
  ChevronDown,
  ChevronRight,
  UserX,
  TrendingDown,
  CreditCard,
  Zap,
  Eye,
  Check,
  X,
  ArrowUpRight,
  Filter,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { isDateInGlobalRange, useGlobalDateFilter } from "@/contexts/DateFilterContext";

/* ── Alert data model ─────────────────────────────────────── */

interface Alert {
  id: string;
  type: "integration_failure" | "low_confidence" | "payment_issue" | "worker_error" | "inactive_customer" | "conversion_drop" | "trial_expiring" | "system_outage";
  severity: "critical" | "warning" | "info";
  status: "active" | "acknowledged" | "resolved" | "escalated";
  title: string;
  description: string;
  customer: string;
  customerId?: string;
  worker?: string;
  workerId?: string;
  createdAt: string;
  updatedAt: string;
  acknowledgedBy?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  escalationLevel: number;
  occurrences: number;
  impact: string;
}

const alertsData: Alert[] = [
  // Critical alerts
  {
    id: "alert-001",
    type: "worker_error",
    severity: "critical",
    status: "active",
    title: "Worker error: Helix Support",
    description: "Worker model index corrupted. Internal model unable to process queries. 0 conversations handled today. Customer has Enterprise SLA requiring 99.9% uptime.",
    customer: "InsureTech Global",
    customerId: "cust-014",
    worker: "Helix Support",
    workerId: "w-012",
    createdAt: "2026-03-25 09:30 AM",
    updatedAt: "2026-03-25 09:30 AM",
    escalationLevel: 2,
    occurrences: 1,
    impact: "Enterprise customer — $4,999/mo MRR at risk",
  },
  {
    id: "alert-002",
    type: "payment_issue",
    severity: "critical",
    status: "active",
    title: "Payment failed: GreenEnergy Co",
    description: "3 consecutive payment retries failed. Card declined. Account has been automatically suspended. Customer was on Growth plan at $499/mo.",
    customer: "GreenEnergy Co",
    customerId: "cust-016",
    createdAt: "2026-03-25 08:45 AM",
    updatedAt: "2026-03-25 09:15 AM",
    escalationLevel: 3,
    occurrences: 3,
    impact: "$499/mo MRR lost — account suspended",
  },
  {
    id: "alert-003",
    type: "system_outage",
    severity: "critical",
    status: "acknowledged",
    title: "VAPI voice endpoint degraded",
    description: "Voice endpoint latency >5s affecting 3 workers across 2 customers (Acme Corp, InsureTech Global). Voice conversations failing to connect.",
    customer: "Platform-wide",
    createdAt: "2026-03-25 08:08 AM",
    updatedAt: "2026-03-25 08:22 AM",
    acknowledgedBy: "Platform Ops",
    escalationLevel: 2,
    occurrences: 47,
    impact: "3 workers affected — voice channel down",
  },
  {
    id: "alert-004",
    type: "integration_failure",
    severity: "critical",
    status: "active",
    title: "Salesforce OAuth expired: Acme Corp",
    description: "OAuth token expired for Salesforce integration. Lead sync has stopped. 12 leads pending sync since 09:00 AM.",
    customer: "Acme Corp",
    customerId: "cust-001",
    createdAt: "2026-03-25 09:45 AM",
    updatedAt: "2026-03-25 09:45 AM",
    escalationLevel: 1,
    occurrences: 1,
    impact: "12 leads not synced to CRM",
  },
  // Warning alerts
  {
    id: "alert-005",
    type: "conversion_drop",
    severity: "warning",
    status: "active",
    title: "Conversion drop: RetailMax",
    description: "Conversion rate dropped 34% week-over-week (12.8% → 8.4%). Zen Support Pro handling most conversations. May indicate product catalog sync issue.",
    customer: "RetailMax",
    customerId: "cust-005",
    worker: "Zen Support Pro",
    workerId: "w-006",
    createdAt: "2026-03-25 09:15 AM",
    updatedAt: "2026-03-25 09:15 AM",
    escalationLevel: 1,
    occurrences: 1,
    impact: "Conversion rate -34% WoW",
  },
  {
    id: "alert-006",
    type: "inactive_customer",
    severity: "warning",
    status: "active",
    title: "Inactive customer: EduLearn Pro",
    description: "No worker activity in 7 days. Trial expires in 3 days. No engagement signals detected. Customer has 3 workers provisioned but none active.",
    customer: "EduLearn Pro",
    customerId: "cust-006",
    createdAt: "2026-03-25 09:30 AM",
    updatedAt: "2026-03-25 09:30 AM",
    escalationLevel: 1,
    occurrences: 1,
    impact: "Trial conversion at risk",
  },
  {
    id: "alert-007",
    type: "low_confidence",
    severity: "warning",
    status: "active",
    title: "Low confidence: Spark Sales AI",
    description: "42% confidence on legal compliance question. Response was outside configured scope. Worker continued conversation but flagged for review.",
    customer: "LegalMind",
    customerId: "cust-008",
    worker: "Spark Sales AI",
    workerId: "w-007",
    createdAt: "2026-03-25 07:55 AM",
    updatedAt: "2026-03-25 07:55 AM",
    escalationLevel: 1,
    occurrences: 1,
    impact: "Potential compliance risk",
  },
  {
    id: "alert-008",
    type: "trial_expiring",
    severity: "warning",
    status: "active",
    title: "Trial expiring: StartupLab",
    description: "14-day trial ends in 2 days. No upgrade intent signals detected. Customer has used 1,847 conversations across 2 workers.",
    customer: "StartupLab",
    customerId: "cust-015",
    createdAt: "2026-03-25 07:30 AM",
    updatedAt: "2026-03-25 07:30 AM",
    escalationLevel: 0,
    occurrences: 1,
    impact: "Potential churn — no conversion signal",
  },
  {
    id: "alert-009",
    type: "inactive_customer",
    severity: "warning",
    status: "acknowledged",
    title: "Inactive customer: TravelWise",
    description: "Churned 45 days ago. No re-engagement attempts made. Was on Growth plan at $499/mo before churning.",
    customer: "TravelWise",
    customerId: "cust-009",
    createdAt: "2026-03-25 08:30 AM",
    updatedAt: "2026-03-25 08:45 AM",
    acknowledgedBy: "Platform Ops",
    escalationLevel: 0,
    occurrences: 1,
    impact: "$499/mo MRR lost — no win-back attempt",
  },
  {
    id: "alert-010",
    type: "integration_failure",
    severity: "warning",
    status: "active",
    title: "Calendly sync failed: GlobalHealth Inc",
    description: "Webhook delivery failed with 502 Bad Gateway from Calendly endpoint. 4 bookings pending sync.",
    customer: "GlobalHealth Inc",
    customerId: "cust-003",
    createdAt: "2026-03-24 14:05 PM",
    updatedAt: "2026-03-24 14:05 PM",
    escalationLevel: 1,
    occurrences: 4,
    impact: "4 bookings not synced",
  },
  {
    id: "alert-011",
    type: "low_confidence",
    severity: "warning",
    status: "resolved",
    title: "Low confidence batch: Iris Research",
    description: "3 consecutive low-confidence responses detected. Worker was paused for reconfiguration. Now resolved and back online.",
    customer: "EduLearn Pro",
    customerId: "cust-006",
    worker: "Iris Research",
    workerId: "w-003",
    createdAt: "2026-03-24 16:30 PM",
    updatedAt: "2026-03-24 18:15 PM",
    acknowledgedBy: "Platform Ops",
    resolvedBy: "Platform Ops",
    resolvedAt: "2026-03-24 18:15 PM",
    escalationLevel: 0,
    occurrences: 3,
    impact: "Worker paused — now resolved",
  },
  // Info alerts
  {
    id: "alert-012",
    type: "trial_expiring",
    severity: "info",
    status: "active",
    title: "Trial milestone: EduLearn Pro",
    description: "Customer reached 4,000+ conversations during trial. High engagement signal. Consider proactive outreach for conversion.",
    customer: "EduLearn Pro",
    customerId: "cust-006",
    createdAt: "2026-03-25 07:00 AM",
    updatedAt: "2026-03-25 07:00 AM",
    escalationLevel: 0,
    occurrences: 1,
    impact: "Conversion opportunity",
  },
  {
    id: "alert-013",
    type: "system_outage",
    severity: "info",
    status: "resolved",
    title: "Database maintenance completed",
    description: "Scheduled database maintenance window completed. Automatic failover to replica completed in 2.3s. No data loss or downtime recorded.",
    customer: "Platform-wide",
    createdAt: "2026-03-23 12:05 PM",
    updatedAt: "2026-03-23 12:08 PM",
    resolvedBy: "System",
    resolvedAt: "2026-03-23 12:08 PM",
    escalationLevel: 0,
    occurrences: 1,
    impact: "No impact — maintenance successful",
  },
  {
    id: "alert-014",
    type: "payment_issue",
    severity: "info",
    status: "resolved",
    title: "Payment retry successful: AutoDrive Systems",
    description: "Monthly payment of $2,499 processed successfully on second retry attempt via Stripe.",
    customer: "AutoDrive Systems",
    customerId: "cust-011",
    createdAt: "2026-03-24 22:15 PM",
    updatedAt: "2026-03-24 22:18 PM",
    resolvedBy: "System",
    resolvedAt: "2026-03-24 22:18 PM",
    escalationLevel: 0,
    occurrences: 2,
    impact: "Payment recovered — no action needed",
  },
  {
    id: "alert-015",
    type: "worker_error",
    severity: "warning",
    status: "resolved",
    title: "Worker auto-paused: Zenith Sales",
    description: "Auto-paused after 5 consecutive error responses. Customer notified. Worker reconfigured and reactivated.",
    customer: "PropTech AI",
    customerId: "cust-007",
    worker: "Zenith Sales",
    workerId: "w-014",
    createdAt: "2026-03-22 16:22 PM",
    updatedAt: "2026-03-22 18:45 PM",
    acknowledgedBy: "Platform Ops",
    resolvedBy: "Platform Ops",
    resolvedAt: "2026-03-22 18:45 PM",
    escalationLevel: 1,
    occurrences: 5,
    impact: "Worker downtime — now resolved",
  },
  {
    id: "alert-016",
    type: "integration_failure",
    severity: "info",
    status: "resolved",
    title: "Gmail API quota recovered: LegalMind",
    description: "Daily sending quota was reached (500 emails). Quota reset at midnight. Integration resumed normally.",
    customer: "LegalMind",
    customerId: "cust-008",
    createdAt: "2026-03-22 11:35 AM",
    updatedAt: "2026-03-23 00:05 AM",
    resolvedBy: "System",
    resolvedAt: "2026-03-23 00:05 AM",
    escalationLevel: 0,
    occurrences: 1,
    impact: "Email sending paused — auto-recovered",
  },
];

/* ── animation ─────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.32, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const listItem = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, x: 8, transition: { duration: 0.15 } },
};

/* ── type config ───────────────────────────────────────────── */
const typeConfig: Record<Alert["type"], { icon: React.ReactNode; label: string; color: string }> = {
  integration_failure: { icon: <Zap className="size-4" />, label: "Integration", color: "text-amber-400" },
  low_confidence: { icon: <AlertTriangle className="size-4" />, label: "Low Confidence", color: "text-orange-400" },
  payment_issue: { icon: <CreditCard className="size-4" />, label: "Payment", color: "text-red-400" },
  worker_error: { icon: <XCircle className="size-4" />, label: "Worker Error", color: "text-rose-400" },
  inactive_customer: { icon: <UserX className="size-4" />, label: "Inactive", color: "text-amber-400" },
  conversion_drop: { icon: <TrendingDown className="size-4" />, label: "Conv. Drop", color: "text-orange-400" },
  trial_expiring: { icon: <Clock className="size-4" />, label: "Trial", color: "text-blue-400" },
  system_outage: { icon: <Shield className="size-4" />, label: "System", color: "text-red-400" },
};

const severityConfig = {
  critical: { icon: <XCircle className="size-4" />, color: "text-rose-400", bg: "bg-rose-400/8", border: "border-rose-400/20", badge: "bg-rose-500/20 text-rose-400" },
  warning: { icon: <AlertTriangle className="size-4" />, color: "text-amber-400", bg: "bg-amber-400/8", border: "border-amber-400/20", badge: "bg-amber-500/20 text-amber-400" },
  info: { icon: <Info className="size-4" />, color: "text-blue-400", bg: "bg-blue-400/8", border: "border-blue-400/20", badge: "bg-blue-500/20 text-blue-400" },
};

const statusConfig = {
  active: { label: "Active", color: "text-rose-400", bg: "bg-rose-400/10", dot: "bg-rose-400" },
  acknowledged: { label: "Acknowledged", color: "text-amber-400", bg: "bg-amber-400/10", dot: "bg-amber-400" },
  resolved: { label: "Resolved", color: "text-emerald-400", bg: "bg-emerald-400/10", dot: "bg-emerald-400" },
  escalated: { label: "Escalated", color: "text-red-400", bg: "bg-red-400/10", dot: "bg-red-400" },
};

/* ── component ─────────────────────────────────────────────── */
export default function Alerts() {
  const { filter } = useGlobalDateFilter();
  const [alerts, setAlerts] = useState<Alert[]>(alertsData);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  /* ── derived counts ──────────────────────────────────────── */
  const counts = useMemo(() => {
    const active = alerts.filter(a => a.status !== "resolved");
    return {
      all: active.length,
      critical: active.filter(a => a.severity === "critical").length,
      warning: active.filter(a => a.severity === "warning").length,
      info: active.filter(a => a.severity === "info").length,
      resolved: alerts.filter(a => a.status === "resolved").length,
    };
  }, [alerts]);

  /* ── filter logic ────────────────────────────────────────── */
  const filterAlerts = (severity: string) => {
    let filtered = alerts;

    // Severity tab filter
    if (severity === "resolved") {
      filtered = filtered.filter(a => a.status === "resolved");
    } else if (severity !== "all") {
      filtered = filtered.filter(a => a.severity === severity && a.status !== "resolved");
    } else {
      filtered = filtered.filter(a => a.status !== "resolved");
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.customer.toLowerCase().includes(q) ||
        (a.worker && a.worker.toLowerCase().includes(q))
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(a => a.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    filtered = filtered.filter(a => isDateInGlobalRange(a.createdAt, filter));

    return filtered;
  };

  /* ── actions ─────────────────────────────────────────────── */
  const handleAcknowledge = (id: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === id
        ? { ...a, status: "acknowledged" as const, acknowledgedBy: "Platform Ops", updatedAt: new Date().toLocaleString() }
        : a
    ));
    toast.success("Alert acknowledged", { description: "You've acknowledged this alert." });
  };

  const handleResolve = (id: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === id
        ? { ...a, status: "resolved" as const, resolvedBy: "Platform Ops", resolvedAt: new Date().toLocaleString(), updatedAt: new Date().toLocaleString() }
        : a
    ));
    toast.success("Alert resolved", { description: "This alert has been marked as resolved." });
  };

  const handleEscalate = (id: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === id
        ? { ...a, status: "escalated" as const, escalationLevel: a.escalationLevel + 1, updatedAt: new Date().toLocaleString() }
        : a
    ));
    toast.info("Alert escalated", { description: "Escalation level increased. Team notified." });
  };

  const handleReopen = (id: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === id
        ? { ...a, status: "active" as const, resolvedBy: undefined, resolvedAt: undefined, updatedAt: new Date().toLocaleString() }
        : a
    ));
    toast.info("Alert reopened", { description: "This alert has been reopened." });
  };

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight flex items-center gap-3">
            <Bell className="size-6 text-qiko-indigo" />
            Alerts & Incidents
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor, acknowledge, and resolve platform-wide alerts across all customers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs border-border/50"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="size-3.5 mr-1.5" />
            Filters
            {(typeFilter !== "all" || statusFilter !== "all") && (
              <span className="ml-1.5 h-4 w-4 rounded-full bg-qiko-indigo/20 text-qiko-indigo text-[10px] flex items-center justify-center">
                {(typeFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0)}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* ── Summary Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Active Alerts", value: counts.all, icon: Bell, color: "text-foreground", bg: "bg-muted/40" },
          { label: "Critical", value: counts.critical, icon: XCircle, color: "text-rose-400", bg: "bg-rose-400/8" },
          { label: "Warning", value: counts.warning, icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-400/8" },
          { label: "Info", value: counts.info, icon: Info, color: "text-blue-400", bg: "bg-blue-400/8" },
          { label: "Resolved (7d)", value: counts.resolved, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/8" },
        ].map((card, i) => (
          <motion.div key={card.label} custom={i} variants={fadeUp} initial="hidden" animate="visible">
            <Card className={`${card.bg} border-border/30`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <card.icon className={`size-4 ${card.color}`} />
                  <span className="text-xs text-muted-foreground">{card.label}</span>
                </div>
                <p className={`text-2xl font-bold font-heading tabular-nums ${card.color}`}>{card.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Search + Filters ───────────────────────────────── */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search alerts by title, description, customer, or worker..."
            className="pl-10 h-10 bg-secondary/50 border-border/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Type:</span>
                  <div className="flex items-center gap-1">
                    {[
                      { key: "all", label: "All" },
                      { key: "worker_error", label: "Worker Error" },
                      { key: "integration_failure", label: "Integration" },
                      { key: "payment_issue", label: "Payment" },
                      { key: "low_confidence", label: "Low Confidence" },
                      { key: "inactive_customer", label: "Inactive" },
                      { key: "conversion_drop", label: "Conv. Drop" },
                      { key: "trial_expiring", label: "Trial" },
                      { key: "system_outage", label: "System" },
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => setTypeFilter(f.key)}
                        className={`text-[11px] px-2 py-1 rounded-md transition-colors ${
                          typeFilter === f.key
                            ? "bg-qiko-indigo/20 text-qiko-indigo"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-5 w-px bg-border/50" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Status:</span>
                  <div className="flex items-center gap-1">
                    {[
                      { key: "all", label: "All" },
                      { key: "active", label: "Active" },
                      { key: "acknowledged", label: "Ack'd" },
                      { key: "escalated", label: "Escalated" },
                    ].map(f => (
                      <button
                        key={f.key}
                        onClick={() => setStatusFilter(f.key)}
                        className={`text-[11px] px-2 py-1 rounded-md transition-colors ${
                          statusFilter === f.key
                            ? "bg-qiko-indigo/20 text-qiko-indigo"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                {(typeFilter !== "all" || statusFilter !== "all") && (
                  <button
                    onClick={() => { setTypeFilter("all"); setStatusFilter("all"); }}
                    className="text-[11px] text-muted-foreground hover:text-foreground ml-auto flex items-center gap-1"
                  >
                    <X className="size-3" /> Clear
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Tabs: Severity-based ───────────────────────────── */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-secondary/50 border border-border/30">
          <TabsTrigger value="all" className="text-xs gap-1.5">
            All Active
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 rounded-full bg-muted-foreground/10">
              {counts.all}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="critical" className="text-xs gap-1.5">
            <XCircle className="size-3 text-rose-400" />
            Critical
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 rounded-full bg-rose-500/20 text-rose-400">
              {counts.critical}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="warning" className="text-xs gap-1.5">
            <AlertTriangle className="size-3 text-amber-400" />
            Warning
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 rounded-full bg-amber-500/20 text-amber-400">
              {counts.warning}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="info" className="text-xs gap-1.5">
            <Info className="size-3 text-blue-400" />
            Info
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 rounded-full bg-blue-500/20 text-blue-400">
              {counts.info}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="resolved" className="text-xs gap-1.5">
            <CheckCircle2 className="size-3 text-emerald-400" />
            Resolved
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 rounded-full bg-emerald-500/20 text-emerald-400">
              {counts.resolved}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {["all", "critical", "warning", "info", "resolved"].map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-2 mt-0">
            <AlertList
              alerts={filterAlerts(tab)}
              expandedId={expandedId}
              onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
              onEscalate={handleEscalate}
              onReopen={handleReopen}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

/* ── Alert List Component ─────────────────────────────────── */

function AlertList({
  alerts,
  expandedId,
  onToggle,
  onAcknowledge,
  onResolve,
  onEscalate,
  onReopen,
}: {
  alerts: Alert[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
  onEscalate: (id: string) => void;
  onReopen: (id: string) => void;
}) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <BellOff className="size-10 mb-3 opacity-30" />
        <p className="text-sm font-medium">No alerts found</p>
        <p className="text-xs mt-1">Adjust your filters or check back later</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {alerts.map((alert) => {
          const severity = severityConfig[alert.severity];
          const type = typeConfig[alert.type];
          const status = statusConfig[alert.status];
          const isExpanded = expandedId === alert.id;

          return (
            <motion.div
              key={alert.id}
              layout
              variants={listItem}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <Card className={`${severity.bg} border ${severity.border} hover:border-opacity-50 transition-all`}>
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => onToggle(alert.id)}
                >
                  {/* Main row */}
                  <div className="flex items-start gap-3">
                    {/* Severity icon */}
                    <div className={`mt-0.5 shrink-0 ${severity.color}`}>
                      {severity.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{alert.title}</span>
                        <Badge className={`text-[10px] px-1.5 py-0 h-4 border-0 ${severity.badge}`}>
                          {alert.severity}
                        </Badge>
                        <Badge className={`text-[10px] px-1.5 py-0 h-4 border-0 ${status.bg} ${status.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot} mr-1`} />
                          {status.label}
                        </Badge>
                        {alert.escalationLevel > 0 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-border/50 text-muted-foreground">
                            L{alert.escalationLevel}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{alert.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground/70">
                        <span className={`flex items-center gap-1 ${type.color}`}>
                          {type.icon}
                          <span className="text-muted-foreground/70">{type.label}</span>
                        </span>
                        <span>·</span>
                        <span>{alert.customer}</span>
                        {alert.worker && (
                          <>
                            <span>·</span>
                            <span>{alert.worker}</span>
                          </>
                        )}
                        <span>·</span>
                        <span>{alert.createdAt}</span>
                        {alert.occurrences > 1 && (
                          <>
                            <span>·</span>
                            <span className="text-qiko-warning">{alert.occurrences}x</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Expand chevron */}
                    <div className="shrink-0 mt-1">
                      {isExpanded ? (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 border-t border-border/20 mt-0">
                        <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Left: Details */}
                          <div className="space-y-3">
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-1">Description</p>
                              <p className="text-sm text-muted-foreground">{alert.description}</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-1">Impact</p>
                              <p className="text-sm text-muted-foreground">{alert.impact}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-1">Created</p>
                                <p className="text-xs text-muted-foreground">{alert.createdAt}</p>
                              </div>
                              <div>
                                <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-1">Last Updated</p>
                                <p className="text-xs text-muted-foreground">{alert.updatedAt}</p>
                              </div>
                              {alert.acknowledgedBy && (
                                <div>
                                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-1">Acknowledged By</p>
                                  <p className="text-xs text-muted-foreground">{alert.acknowledgedBy}</p>
                                </div>
                              )}
                              {alert.resolvedBy && (
                                <div>
                                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium mb-1">Resolved By</p>
                                  <p className="text-xs text-muted-foreground">{alert.resolvedBy} · {alert.resolvedAt}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="space-y-3">
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">Actions</p>
                            <div className="flex flex-wrap gap-2">
                              {alert.status === "active" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs border-amber-400/30 text-amber-400 hover:bg-amber-400/10 hover:text-amber-400"
                                    onClick={(e) => { e.stopPropagation(); handleAcknowledge(alert.id); }}
                                  >
                                    <Eye className="size-3 mr-1.5" />
                                    Acknowledge
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10 hover:text-emerald-400"
                                    onClick={(e) => { e.stopPropagation(); onResolve(alert.id); }}
                                  >
                                    <Check className="size-3 mr-1.5" />
                                    Resolve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs border-red-400/30 text-red-400 hover:bg-red-400/10 hover:text-red-400"
                                    onClick={(e) => { e.stopPropagation(); onEscalate(alert.id); }}
                                  >
                                    <ArrowUpRight className="size-3 mr-1.5" />
                                    Escalate
                                  </Button>
                                </>
                              )}
                              {alert.status === "acknowledged" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10 hover:text-emerald-400"
                                    onClick={(e) => { e.stopPropagation(); onResolve(alert.id); }}
                                  >
                                    <Check className="size-3 mr-1.5" />
                                    Resolve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs border-red-400/30 text-red-400 hover:bg-red-400/10 hover:text-red-400"
                                    onClick={(e) => { e.stopPropagation(); onEscalate(alert.id); }}
                                  >
                                    <ArrowUpRight className="size-3 mr-1.5" />
                                    Escalate
                                  </Button>
                                </>
                              )}
                              {alert.status === "escalated" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10 hover:text-emerald-400"
                                  onClick={(e) => { e.stopPropagation(); onResolve(alert.id); }}
                                >
                                  <Check className="size-3 mr-1.5" />
                                  Resolve
                                </Button>
                              )}
                              {alert.status === "resolved" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs border-amber-400/30 text-amber-400 hover:bg-amber-400/10 hover:text-amber-400"
                                  onClick={(e) => { e.stopPropagation(); onReopen(alert.id); }}
                                >
                                  <RotateCcw className="size-3 mr-1.5" />
                                  Reopen
                                </Button>
                              )}
                            </div>

                            {/* Quick links */}
                            <div className="pt-2 space-y-1.5">
                              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">Quick Links</p>
                              {alert.customerId && (
                                <a
                                  href={`/customers/${alert.customer.toLowerCase().replace(/\s+/g, "-")}`}
                                  className="flex items-center gap-2 text-xs text-qiko-indigo hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ChevronRight className="size-3" />
                                  View {alert.customer} account
                                </a>
                              )}
                              {alert.workerId && (
                                <a
                                  href={`/workers/${alert.workerId}`}
                                  className="flex items-center gap-2 text-xs text-qiko-indigo hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ChevronRight className="size-3" />
                                  View {alert.worker} worker
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );

  function handleAcknowledge(id: string) {
    onAcknowledge(id);
  }
}
