// ============================================================
// Overview — Platform-wide operational dashboard for Qiko founders
// KPIs, live ticker, system health, charts, activity feeds, alerts
// Design: Dark Lattice — data-dense, strong visibility, quick drilldowns
// ============================================================

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Users,
  Bot,
  MessageSquare,
  Target,
  DollarSign,
  CreditCard,
  FlaskConical,
  UserX,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Radio,
  Server,
  Database,
  Wifi,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  platformKPIs,
  kpiTrends,
  customers,
  conversationsTrend,
  topCustomersByConversations,
  topCustomersByEarnings,
  revenueHistory,
  customerGrowthTrend,
  recentCustomerActivity,
  recentWorkerActivity,
  platformAlerts,
  systemHealth,
} from "@/lib/data";

/* ── animation ─────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.32, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

/* ── helpers ───────────────────────────────────────────────── */
function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

/* ── derived KPIs ──────────────────────────────────────────── */
const paidSubscribers = customers.filter(c => c.status === "Active" && c.mrr > 0).length;
const activeTrials = customers.filter(c => c.status === "Trial").length;
const churnedCustomers = customers.filter(c => c.status === "Churned").length;
const monthlyEarnings = customers.reduce((sum, c) => sum + c.mrr, 0);

const kpiCards = [
  { label: "Total Customers", value: platformKPIs.totalCustomers, format: "number" as const, trend: kpiTrends.totalCustomers, icon: Users, color: "text-qiko-indigo", bg: "bg-qiko-indigo/10" },
  { label: "Active Workers", value: platformKPIs.liveWorkers, format: "number" as const, trend: kpiTrends.totalWorkers, icon: Bot, color: "text-qiko-cyan", bg: "bg-qiko-cyan/10", subtitle: `${platformKPIs.totalWorkers.toLocaleString()} total` },
  { label: "Total Conversations", value: platformKPIs.conversationsToday, format: "number" as const, trend: kpiTrends.conversationsToday, icon: MessageSquare, color: "text-qiko-success", bg: "bg-qiko-success/10", subtitle: "today" },
  { label: "Leads / Conversions", value: platformKPIs.leadsToday, format: "number" as const, trend: kpiTrends.leadsToday, icon: Target, color: "text-qiko-warning", bg: "bg-qiko-warning/10", subtitle: "today" },
  { label: "Paid Subscribers", value: paidSubscribers, format: "number" as const, trend: { value: 4.2, direction: "up" as const }, icon: CreditCard, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { label: "Monthly Earnings", value: monthlyEarnings, format: "currency" as const, trend: kpiTrends.platformMRR, icon: DollarSign, color: "text-violet-400", bg: "bg-violet-400/10" },
  { label: "Active Trials", value: activeTrials, format: "number" as const, trend: { value: 18.0, direction: "up" as const }, icon: FlaskConical, color: "text-amber-400", bg: "bg-amber-400/10" },
  { label: "Churned Customers", value: churnedCustomers, format: "number" as const, trend: kpiTrends.customerChurnRate, icon: UserX, color: "text-rose-400", bg: "bg-rose-400/10", invertTrend: true },
];

/* ── tooltip style ─────────────────────────────────────────── */
const tooltipStyle = {
  background: "rgba(10,14,28,0.96)",
  border: "1px solid rgba(99,102,241,0.2)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#e2e8f0",
};

const axisTickStyle = { fontSize: 11, fill: "rgba(255,255,255,0.4)" };

/* ── alert type config ─────────────────────────────────────── */
const alertTypeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  inactive_customer: { icon: <UserX className="size-4" />, color: "text-amber-400", bg: "bg-amber-400/8", label: "Inactive" },
  failed_conversation: { icon: <XCircle className="size-4" />, color: "text-rose-400", bg: "bg-rose-400/8", label: "Error" },
  conversion_drop: { icon: <TrendingDown className="size-4" />, color: "text-orange-400", bg: "bg-orange-400/8", label: "Drop" },
  payment_issue: { icon: <AlertTriangle className="size-4" />, color: "text-red-400", bg: "bg-red-400/8", label: "Payment" },
};

const activityTypeConfig: Record<string, { icon: React.ReactNode; bg: string }> = {
  success: { icon: <CheckCircle2 className="size-3.5 text-qiko-success" />, bg: "bg-qiko-success/8" },
  error: { icon: <XCircle className="size-3.5 text-qiko-error" />, bg: "bg-qiko-error/8" },
  warning: { icon: <AlertTriangle className="size-3.5 text-qiko-warning" />, bg: "bg-qiko-warning/8" },
  info: { icon: <Info className="size-3.5 text-qiko-cyan" />, bg: "bg-qiko-cyan/8" },
};

/* ── live ticker events (simulated) ───────────────────────── */
const tickerEvents = [
  { id: 1, text: "Luna Sales Bot captured a lead from Sarah Mitchell", type: "success", customer: "Acme Corp", time: "just now" },
  { id: 2, text: "New conversation started on Vega Sales Pro", type: "info", customer: "InsureTech Global", time: "12s ago" },
  { id: 3, text: "Zen Support Pro resolved ticket #4,892", type: "success", customer: "RetailMax", time: "28s ago" },
  { id: 4, text: "Spark Sales AI booked a demo meeting", type: "success", customer: "LegalMind", time: "45s ago" },
  { id: 5, text: "Helix Support returned error on query", type: "error", customer: "InsureTech Global", time: "1m ago" },
  { id: 6, text: "Atlas Support escalated conversation to human agent", type: "warning", customer: "Acme Corp", time: "1m ago" },
  { id: 7, text: "Echo Retention completed retention call", type: "success", customer: "AutoDrive Systems", time: "2m ago" },
  { id: 8, text: "Drift Sales generated $2,400 payment link", type: "success", customer: "PropTech AI", time: "2m ago" },
  { id: 9, text: "Orion Qualifier captured 3 leads in batch", type: "success", customer: "GlobalHealth Inc", time: "3m ago" },
  { id: 10, text: "Nova Onboarding completed user walkthrough", type: "info", customer: "TechFlow Solutions", time: "3m ago" },
  { id: 11, text: "Bolt Financial processed compliance check", type: "info", customer: "FinanceHub", time: "4m ago" },
  { id: 12, text: "Pixel Assistant moved to training mode", type: "warning", customer: "CloudNine SaaS", time: "5m ago" },
];

/* ── system status config ─────────────────────────────────── */
const systemServices = [
  { name: "API Gateway", status: systemHealth.apiUptime > 99.9 ? "healthy" : "degraded", icon: Server, metric: `${systemHealth.apiUptime}%` },
  { name: "Database", status: systemHealth.dbStatus, icon: Database, metric: systemHealth.avgLatency },
  { name: "VAPI Voice", status: systemHealth.vapiStatus, icon: Radio, metric: systemHealth.vapiStatus === "degraded" ? ">5s" : "OK" },
  { name: "Cache", status: systemHealth.cacheStatus, icon: Zap, metric: "OK" },
  { name: "Connections", status: "healthy" as const, icon: Wifi, metric: systemHealth.activeConnections.toLocaleString() },
];

const statusColors = {
  healthy: { dot: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-400/8" },
  degraded: { dot: "bg-amber-400", text: "text-amber-400", bg: "bg-amber-400/8" },
  down: { dot: "bg-rose-400", text: "text-rose-400", bg: "bg-rose-400/8" },
};

/* ── component ─────────────────────────────────────────────── */
export default function Overview() {
  const [alertFilter, setAlertFilter] = useState<string>("all");
  const [tickerIndex, setTickerIndex] = useState(0);
  const [liveConvCount, setLiveConvCount] = useState(platformKPIs.conversationsToday);
  const [liveLeadCount, setLiveLeadCount] = useState(platformKPIs.leadsToday);

  // Simulate live ticker rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % tickerEvents.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Simulate live conversation counter incrementing
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveConvCount(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Simulate live lead counter incrementing
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.4) {
        setLiveLeadCount(prev => prev + 1);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const filteredAlerts = alertFilter === "all"
    ? platformAlerts
    : platformAlerts.filter(a => a.type === alertFilter);

  const currentTicker = tickerEvents[tickerIndex];
  const tickerConfig = activityTypeConfig[currentTicker.type] || activityTypeConfig.info;

  return (
    <div className="p-6 space-y-6">
      {/* ── Header + System Health Bar ──────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight">Platform Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time operational metrics across all customers and workers
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Live indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-400/8 border border-emerald-400/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-xs font-medium text-emerald-400">Live</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={`h-2 w-2 rounded-full ${systemHealth.apiUptime > 99.9 ? "bg-qiko-success" : "bg-qiko-warning"} animate-pulse`} />
            API {systemHealth.apiUptime}% uptime
            <span className="mx-1">·</span>
            {systemHealth.activeConnections.toLocaleString()} connections
          </div>
        </div>
      </div>

      {/* ── Live Activity Ticker + System Health ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live Activity Ticker */}
        <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible" className="lg:col-span-2">
          <Card className="bg-card/80 border-border/40 overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center h-12 px-4">
                <div className="flex items-center gap-2 shrink-0 mr-4 pr-4 border-r border-border/30">
                  <Activity className="size-4 text-qiko-indigo" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Live Feed</span>
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={tickerIndex}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-3"
                    >
                      <div className="shrink-0">{tickerConfig.icon}</div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm truncate block">{currentTicker.text}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground/60 shrink-0">{currentTicker.customer}</span>
                      <span className="text-[11px] text-muted-foreground/40 shrink-0 tabular-nums">{currentTicker.time}</span>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* System Health Mini-Bar */}
        <motion.div variants={fadeUp} custom={1} initial="hidden" animate="visible">
          <Card className="bg-card/80 border-border/40">
            <CardContent className="p-0">
              <div className="flex items-center h-12 px-4 gap-3 overflow-x-auto">
                {systemServices.map((svc) => {
                  const colors = statusColors[svc.status as keyof typeof statusColors] || statusColors.healthy;
                  return (
                    <div key={svc.name} className="flex items-center gap-1.5 shrink-0" title={`${svc.name}: ${svc.status}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot} ${svc.status === "degraded" ? "animate-pulse" : ""}`} />
                      <svc.icon className={`size-3 ${colors.text}`} />
                      <span className="text-[11px] text-muted-foreground">{svc.metric}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── KPI Cards (2 rows of 4) ─────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => {
          // Use live counts for conversations and leads
          const displayValue = kpi.label === "Total Conversations" ? liveConvCount
            : kpi.label === "Leads / Conversions" ? liveLeadCount
            : kpi.value;

          return (
            <motion.div key={kpi.label} custom={i + 2} variants={fadeUp} initial="hidden" animate="visible">
              <Card className="bg-card/80 border-border/40 hover:border-border/70 transition-colors group cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`flex items-center justify-center h-9 w-9 rounded-lg ${kpi.bg}`}>
                      <kpi.icon className={`size-[18px] ${kpi.color}`} />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium ${
                      (kpi.invertTrend ? kpi.trend.direction === "down" : kpi.trend.direction === "up")
                        ? "text-qiko-success"
                        : "text-qiko-error"
                    }`}>
                      {kpi.trend.direction === "up" ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                      {kpi.trend.value}%
                    </div>
                  </div>
                  <div className="tabular-nums text-2xl font-bold font-heading tracking-tight flex items-center gap-2">
                    {kpi.format === "currency" ? `$${displayValue.toLocaleString()}` : fmt(displayValue)}
                    {(kpi.label === "Total Conversations" || kpi.label === "Leads / Conversions") && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
                  {kpi.subtitle && <p className="text-[11px] text-muted-foreground/60 mt-0.5">{kpi.subtitle}</p>}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ── Row 1: Conversations over time + Revenue over time ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Conversations over time */}
        <motion.div variants={fadeUp} custom={10} initial="hidden" animate="visible">
          <Card className="bg-card/80 border-border/40">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Conversations Over Time</CardTitle>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-qiko-indigo" />Conversations</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />Leads</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={conversationsTrend} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34D399" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" tick={axisTickStyle} tickLine={false} axisLine={false} interval={1} />
                    <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} tickFormatter={(v: number) => fmt(v)} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [value.toLocaleString(), name === "conversations" ? "Conversations" : name === "leads" ? "Leads" : name]} />
                    <Area type="monotone" dataKey="conversations" stroke="#6366F1" strokeWidth={2} fill="url(#convGrad)" />
                    <Area type="monotone" dataKey="leads" stroke="#34D399" strokeWidth={1.5} fill="url(#leadGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Revenue over time */}
        <motion.div variants={fadeUp} custom={11} initial="hidden" animate="visible">
          <Card className="bg-card/80 border-border/40">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Revenue Over Time (MRR)</CardTitle>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />MRR</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-400" />New MRR</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueHistory} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34D399" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="newMrrGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#A78BFA" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#A78BFA" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" tick={axisTickStyle} tickLine={false} axisLine={false} interval={1} />
                    <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${fmt(v)}`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name === "mrr" ? "MRR" : name === "newMrr" ? "New MRR" : name]} />
                    <Area type="monotone" dataKey="mrr" stroke="#34D399" strokeWidth={2} fill="url(#mrrGrad)" />
                    <Area type="monotone" dataKey="newMrr" stroke="#A78BFA" strokeWidth={1.5} fill="url(#newMrrGrad)" strokeDasharray="4 2" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Row 2: New vs Churned + Top by Usage + Top by Earnings ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* New vs Churned customers */}
        <motion.div variants={fadeUp} custom={12} initial="hidden" animate="visible">
          <Card className="bg-card/80 border-border/40 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">New vs Churned Customers</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={customerGrowthTrend} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" tick={axisTickStyle} tickLine={false} axisLine={false} interval={1} tickFormatter={(v: string) => v.split(" ")[0].slice(0, 3)} />
                    <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [value, name === "newCustomers" ? "New" : "Churned"]} />
                    <Bar dataKey="newCustomers" fill="#34D399" radius={[3, 3, 0, 0]} barSize={14} name="newCustomers" />
                    <Bar dataKey="churnedCustomers" fill="#F87171" radius={[3, 3, 0, 0]} barSize={14} name="churnedCustomers" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />New</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" />Churned</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top customers by usage */}
        <motion.div variants={fadeUp} custom={13} initial="hidden" animate="visible">
          <Card className="bg-card/80 border-border/40 h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Top Customers by Usage</CardTitle>
                <a href="/customers" className="text-xs text-qiko-indigo hover:underline flex items-center gap-0.5">View all <ChevronRight className="size-3" /></a>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {topCustomersByConversations.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-3 group cursor-pointer">
                    <span className="text-xs text-muted-foreground w-4 tabular-nums font-medium">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-qiko-indigo transition-colors">{c.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span>{c.conversations.toLocaleString()} convs</span>
                        <span>{c.leads.toLocaleString()} leads</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] bg-qiko-success/10 text-qiko-success border-0 tabular-nums">
                      {c.conversion}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top customers by earnings */}
        <motion.div variants={fadeUp} custom={14} initial="hidden" animate="visible">
          <Card className="bg-card/80 border-border/40 h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Top Customers by Earnings</CardTitle>
                <a href="/revenue" className="text-xs text-qiko-indigo hover:underline flex items-center gap-0.5">View all <ChevronRight className="size-3" /></a>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {topCustomersByEarnings.slice(0, 5).map((c, i) => (
                  <div key={c.name} className="flex items-center gap-3 group cursor-pointer">
                    <span className="text-xs text-muted-foreground w-4 tabular-nums font-medium">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-qiko-indigo transition-colors">{c.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span>{c.plan}</span>
                        <span>{c.workers} workers</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">${c.mrr.toLocaleString()}</p>
                      <p className="text-[10px] text-qiko-success flex items-center gap-0.5 justify-end">
                        <TrendingUp className="size-2.5" />{c.trend}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Row 3: Activity Feeds (Customer + Worker) + Alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Customer Activity */}
        <motion.div variants={fadeUp} custom={15} initial="hidden" animate="visible">
          <Card className="bg-card/80 border-border/40 h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Recent Customer Activity</CardTitle>
                <a href="/activity" className="text-xs text-qiko-indigo hover:underline flex items-center gap-0.5">View all <ChevronRight className="size-3" /></a>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[340px] pr-2">
                <div className="space-y-1">
                  {recentCustomerActivity.map((item) => {
                    const config = activityTypeConfig[item.type];
                    return (
                      <div key={item.id} className={`flex items-start gap-3 rounded-lg px-3 py-2.5 ${config.bg} cursor-pointer hover:opacity-80 transition-opacity`}>
                        <div className="mt-0.5 shrink-0">{config.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{item.customer}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.action}</p>
                          {item.detail && <p className="text-[11px] text-muted-foreground/60 mt-0.5">{item.detail}</p>}
                        </div>
                        <span className="text-[11px] text-muted-foreground/60 shrink-0 tabular-nums">{item.timestamp}</span>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Worker Activity */}
        <motion.div variants={fadeUp} custom={16} initial="hidden" animate="visible">
          <Card className="bg-card/80 border-border/40 h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Recent Worker Activity</CardTitle>
                <a href="/workers" className="text-xs text-qiko-indigo hover:underline flex items-center gap-0.5">View all <ChevronRight className="size-3" /></a>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[340px] pr-2">
                <div className="space-y-1">
                  {recentWorkerActivity.map((item) => {
                    const config = activityTypeConfig[item.type];
                    return (
                      <div key={item.id} className={`flex items-start gap-3 rounded-lg px-3 py-2.5 ${config.bg} cursor-pointer hover:opacity-80 transition-opacity`}>
                        <div className="mt-0.5 shrink-0">{config.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">{item.workerName}</span>
                            <span className="text-[11px] text-muted-foreground/60">• {item.customer}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.action}</p>
                        </div>
                        <span className="text-[11px] text-muted-foreground/60 shrink-0 tabular-nums">{item.timestamp}</span>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* Alerts / Issues Panel */}
        <motion.div variants={fadeUp} custom={17} initial="hidden" animate="visible">
          <Card className="bg-card/80 border-border/40 h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  Alerts & Issues
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 rounded-full">
                    {platformAlerts.filter(a => a.severity === "error").length}
                  </Badge>
                </CardTitle>
                <a href="/alerts" className="text-xs text-qiko-indigo hover:underline flex items-center gap-0.5">View all <ChevronRight className="size-3" /></a>
              </div>
              {/* Alert type filter tabs */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {[
                  { key: "all", label: "All" },
                  { key: "inactive_customer", label: "Inactive" },
                  { key: "failed_conversation", label: "Errors" },
                  { key: "conversion_drop", label: "Drops" },
                  { key: "payment_issue", label: "Payment" },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setAlertFilter(f.key)}
                    className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                      alertFilter === f.key
                        ? "bg-qiko-indigo/20 text-qiko-indigo"
                        : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[290px] pr-2">
                <div className="space-y-2">
                  {filteredAlerts.map((alert) => {
                    const config = alertTypeConfig[alert.type];
                    return (
                      <div key={alert.id} className={`rounded-lg px-3 py-3 ${config.bg} border border-transparent hover:border-border/30 transition-colors`}>
                        <div className="flex items-start gap-2.5">
                          <div className={`mt-0.5 shrink-0 ${config.color}`}>{config.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{alert.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[11px] text-muted-foreground/60">{alert.customer}</span>
                              <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2 text-qiko-indigo hover:text-qiko-indigo hover:bg-qiko-indigo/10">
                                {alert.actionLabel} <ChevronRight className="size-3 ml-0.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
