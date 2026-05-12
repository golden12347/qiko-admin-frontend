// ============================================================
// Overview — Platform-wide operational dashboard for Qiko founders
// KPIs, live ticker, system health, charts, activity feeds, alerts
// Design: Dark Lattice — data-dense, strong visibility, quick drilldowns
// ============================================================

import { useState, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  UserX,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ChevronRight,
  TrendingDown,
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
  customers,
  recentCustomerActivity,
  recentWorkerActivity,
  platformAlerts,
} from "@/lib/data";
import { isDateInGlobalRange, parseDateValue, useGlobalDateFilter } from "@/contexts/DateFilterContext";
import { adminOverview } from "@/services/adminOverviewApi";
import { toast } from "sonner";

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

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/[^0-9.-]/g, "");
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

/* ── derived KPIs ──────────────────────────────────────────── */
const paidSubscribers = customers.filter(c => c.status === "Active" && c.mrr > 0).length;
const monthlyEarnings = customers.reduce((sum, c) => sum + c.mrr, 0);

/* ── tooltip style ─────────────────────────────────────────── */
const tooltipStyle = {
  background: "rgba(10,14,28,0.96)",
  border: "1px solid rgba(99,102,241,0.2)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#e2e8f0",
};

const axisTickStyle = { fontSize: 11, fill: "rgba(255,255,255,0.4)" };

function OverviewKpiSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 5 }, (_, i) => (
        <Card key={i} className="bg-card/80 border-border/40">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
              <Skeleton className="h-4 w-10 rounded-md" />
            </div>
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-3 w-28 rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function OverviewChartCardSkeleton({ chartHeight }: { chartHeight: number }) {
  return (
    <Card className="bg-card/80 border-border/40">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-44 max-w-[55%]" />
          <Skeleton className="h-3 w-28 hidden sm:block" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Skeleton className="w-full rounded-lg" style={{ height: chartHeight }} />
      </CardContent>
    </Card>
  );
}

function OverviewGrowthChartSkeleton() {
  return (
    <Card className="bg-card/80 border-border/40 h-full">
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-52 max-w-[90%]" />
      </CardHeader>
      <CardContent className="pt-0">
        <Skeleton className="w-full rounded-lg h-[220px]" />
        <div className="flex items-center justify-center gap-6 mt-2">
          <Skeleton className="h-3 w-14 rounded-md" />
          <Skeleton className="h-3 w-16 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

function OverviewTopListSkeleton({ rows }: { rows: number }) {
  return (
    <Card className="bg-card/80 border-border/40 h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-40 max-w-[60%]" />
          <Skeleton className="h-3 w-14 rounded-md shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-4 w-[72%] max-w-[200px] rounded-md" />
                <Skeleton className="h-3 w-[45%] max-w-[140px] rounded-md" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function OverviewTopRevenueSkeleton({ rows }: { rows: number }) {
  return (
    <Card className="bg-card/80 border-border/40 h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-44 max-w-[65%]" />
          <Skeleton className="h-3 w-14 rounded-md shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-4 w-[68%] max-w-[180px] rounded-md" />
                <Skeleton className="h-3 w-[50%] max-w-[160px] rounded-md" />
              </div>
              <Skeleton className="h-4 w-14 rounded-md shrink-0" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

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

/* ── component ─────────────────────────────────────────────── */
export default function Overview() {
  const auth = useAppSelector((state) => state.auth);
  const { filter } = useGlobalDateFilter();
  const [alertFilter, setAlertFilter] = useState<string>("all");
  const [overviewCounts, setOverviewCounts] = useState({
    totalUsers: 0,
    totalAgents: 0,
    totalConversations: 0,
    totalSubscriptions: 0,
    totalEarning: 0,
  });
  const [overviewPercentages, setOverviewPercentages] = useState({
    totalUsersPercentage: 0,
    totalAgentsPercentage: 0,
    totalConversationsPercentage: 0,
    totalSubscriptionsPercentage: 0,
    totalEarningPercentage: 0,
  });
  const [overviewConversationsTrend, setOverviewConversationsTrend] = useState<Array<{ month: string; conversations: number }>>([]);
  const [overviewRevenueOverTime, setOverviewRevenueOverTime] = useState<Array<{ month: string; earning: number }>>([]);
  const [overviewCustomerGrowthTrend, setOverviewCustomerGrowthTrend] = useState<
    Array<{ month: string; newCustomers: number; churnedCustomers: number }>
  >([]);
  const [overviewTopCustomersByUsage, setOverviewTopCustomersByUsage] = useState<
    Array<{ name: string; conversations: number; subscriptionPlanName: string }>
  >([]);
  const [overviewTopCustomersByEarnings, setOverviewTopCustomersByEarnings] = useState<
    Array<{ name: string; plan: string; workers: number; earnings: number }>
  >([]);
  const [overviewLoading, setOverviewLoading] = useState(true);

  useEffect(() => {
    console.log("[Overview] Redux auth:", auth);
  }, [auth]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setOverviewLoading(true);
      try {
        const response = await adminOverview(filter);
        if (cancelled) return;
        setOverviewCounts({
          totalUsers: toNumber(response.total_users),
          totalAgents: toNumber(response.total_agents),
          totalConversations: toNumber(response.total_conversations),
          totalSubscriptions: toNumber(response.total_subscriptions),
          totalEarning: toNumber(response.total_earning),
        });
        setOverviewPercentages({
          totalUsersPercentage: toNumber(response.total_users_percentage),
          totalAgentsPercentage: toNumber(response.total_agents_percentage),
          totalConversationsPercentage: toNumber(response.total_conversations_percentage),
          totalSubscriptionsPercentage: toNumber(response.total_subscriptions_percentage),
          totalEarningPercentage: toNumber(response.total_earning_percentage),
        });
        setOverviewConversationsTrend(
          Array.isArray(response.conversations_over_time)
            ? response.conversations_over_time.map((item) => ({
                month: item.month,
                conversations: Number(item.conversations ?? 0),
              }))
            : []
        );
        setOverviewTopCustomersByUsage(
          Array.isArray(response.customer_conversations_users)
            ? response.customer_conversations_users.map((item) => ({
                name: String(item.user_name ?? "—"),
                conversations: Number(item.total_conversations ?? 0),
                subscriptionPlanName: String(item.subscription_plan_name ?? "No plan"),
              }))
            : []
        );
        setOverviewRevenueOverTime(
          Array.isArray(response.revenue_over_time)
            ? response.revenue_over_time.map((item) => ({
                month: String(item.month ?? "—"),
                earning: toNumber(item.earning),
              }))
            : []
        );
        setOverviewCustomerGrowthTrend(
          Array.isArray(response.customer_growth_trend)
            ? response.customer_growth_trend.map((item) => ({
                month: String(item.month ?? "—"),
                newCustomers: toNumber(item.new_customers ?? item.newCustomers),
                churnedCustomers: toNumber(item.churned_customers ?? item.churnedCustomers),
              }))
            : []
        );
        setOverviewTopCustomersByEarnings(
          Array.isArray(response.top_customers_earnings)
            ? response.top_customers_earnings.map((item) => ({
                name: String(item.user_name ?? "—"),
                workers: toNumber(item.agents_count),
                plan: String(item.subscription_plan_name ?? "—"),
                earnings: toNumber(item.total_earnings),
              }))
            : []
        );
      } catch {
        if (cancelled) return;
        toast.error("Failed to fetch overview data.");
        setOverviewPercentages({
          totalUsersPercentage: 0,
          totalAgentsPercentage: 0,
          totalConversationsPercentage: 0,
          totalSubscriptionsPercentage: 0,
          totalEarningPercentage: 0,
        });
        setOverviewCustomerGrowthTrend([]);
      } finally {
        if (!cancelled) setOverviewLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const filteredAlerts = alertFilter === "all"
    ? platformAlerts
    : platformAlerts.filter(a => a.type === alertFilter);

  const filteredConversationsTrend = overviewConversationsTrend.filter((point) =>
    isDateInGlobalRange(parseDateValue(point.month) ?? point.month, filter)
  );
  const conversationsChartData =
    filteredConversationsTrend.length > 0 ? filteredConversationsTrend : overviewConversationsTrend;
  const filteredRevenueHistory = overviewRevenueOverTime.filter((point) =>
    isDateInGlobalRange(parseDateValue(point.month) ?? point.month, filter)
  );
  const filteredCustomerGrowthTrend = overviewCustomerGrowthTrend.filter((point) =>
    isDateInGlobalRange(parseDateValue(point.month) ?? point.month, filter)
  );

  const kpiCards: Array<{
    label: string;
    value: number;
    format: "number" | "currency";
    trend: { value: number; direction: "up" | "down" };
    icon: typeof Users;
    color: string;
    bg: string;
    subtitle?: string;
  }> = [
    {
      label: "Total Customers",
      value: overviewCounts.totalUsers,
      format: "number" as const,
      trend: {
        value: Math.abs(overviewPercentages.totalUsersPercentage),
        direction: overviewPercentages.totalUsersPercentage >= 0 ? "up" as const : "down" as const,
      },
      icon: Users,
      color: "text-qiko-indigo",
      bg: "bg-qiko-indigo/10",
    },
    {
      label: "Total Workers",
      value: overviewCounts.totalAgents,
      format: "number" as const,
      trend: {
        value: Math.abs(overviewPercentages.totalAgentsPercentage),
        direction: overviewPercentages.totalAgentsPercentage >= 0 ? "up" as const : "down" as const,
      },
      icon: Bot,
      color: "text-qiko-cyan",
      bg: "bg-qiko-cyan/10",
    },
    {
      label: "Total Conversations",
      value: overviewCounts.totalConversations,
      format: "number" as const,
      trend: {
        value: Math.abs(overviewPercentages.totalConversationsPercentage),
        direction: overviewPercentages.totalConversationsPercentage >= 0 ? "up" as const : "down" as const,
      },
      icon: MessageSquare,
      color: "text-qiko-success",
      bg: "bg-qiko-success/10",
    },
    {
      label: "Paid Subscribers",
      value: overviewCounts.totalSubscriptions,
      format: "number" as const,
      trend: {
        value: Math.abs(overviewPercentages.totalSubscriptionsPercentage),
        direction: overviewPercentages.totalSubscriptionsPercentage >= 0 ? "up" as const : "down" as const,
      },
      icon: CreditCard,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      label: "Total Revenue",
      value: overviewCounts.totalEarning,
      format: "currency" as const,
      trend: {
        value: Math.abs(overviewPercentages.totalEarningPercentage),
        direction: overviewPercentages.totalEarningPercentage >= 0 ? "up" as const : "down" as const,
      },
      icon: DollarSign,
      color: "text-violet-400",
      bg: "bg-violet-400/10",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ───────────────────────────────────────────── */}
      <div>
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight">Platform Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time operational metrics across all customers and workers
          </p>
        </div>
      </div>

      {overviewLoading ? (
        <>
          <OverviewKpiSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <OverviewChartCardSkeleton chartHeight={240} />
            <OverviewChartCardSkeleton chartHeight={240} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <OverviewGrowthChartSkeleton />
            <OverviewTopListSkeleton rows={5} />
            <OverviewTopRevenueSkeleton rows={5} />
          </div>
        </>
      ) : (
        <>
      {/* ── KPI Cards (2 rows of 4) ─────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => {
          return (
            <motion.div key={kpi.label} custom={i + 2} variants={fadeUp} initial="hidden" animate="visible">
              <Card className="bg-card/80 border-border/40 hover:border-border/70 transition-colors group cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`flex items-center justify-center h-9 w-9 rounded-lg ${kpi.bg}`}>
                      <kpi.icon className={`size-[18px] ${kpi.color}`} />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium ${
                      kpi.trend.direction === "up" ? "text-qiko-success" : "text-qiko-error"
                    }`}>
                      {kpi.trend.direction === "up" ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                      {kpi.trend.value}%
                    </div>
                  </div>
                  <div className="tabular-nums text-2xl font-bold font-heading tracking-tight flex items-center gap-2">
                    {kpi.format === "currency" ? `$${kpi.value.toLocaleString()}` : fmt(kpi.value)}
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
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[240px]">
                {conversationsChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={conversationsChartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="month" tick={axisTickStyle} tickLine={false} axisLine={false} interval={1} />
                      <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} tickFormatter={(v: number) => fmt(v)} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [value.toLocaleString(), "Conversations"]} />
                      <Area
                        type="monotone"
                        dataKey="conversations"
                        stroke="#6366F1"
                        strokeWidth={2}
                        fill="url(#convGrad)"
                        dot={{ r: 3, fill: "#6366F1", strokeWidth: 0 }}
                        activeDot={{ r: 4, fill: "#6366F1" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    No data available for selected filter.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Revenue over time */}
        <motion.div variants={fadeUp} custom={11} initial="hidden" animate="visible">
          <Card className="bg-card/80 border-border/40">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Revenue Over Time (Earning)</CardTitle>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />Earning</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[240px]">
                {filteredRevenueHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredRevenueHistory} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#34D399" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="month" tick={axisTickStyle} tickLine={false} axisLine={false} interval={1} />
                      <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${fmt(v)}`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`$${value.toLocaleString()}`, "Earning"]} />
                      <Area type="monotone" dataKey="earning" stroke="#34D399" strokeWidth={2} fill="url(#mrrGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    No data available for selected filter.
                  </div>
                )}
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
                {filteredCustomerGrowthTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredCustomerGrowthTrend} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="month" tick={axisTickStyle} tickLine={false} axisLine={false} interval={1} tickFormatter={(v: string) => v.split(" ")[0].slice(0, 3)} />
                      <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [value, name === "newCustomers" ? "New" : "Churned"]} />
                      <Bar dataKey="newCustomers" fill="#34D399" radius={[3, 3, 0, 0]} barSize={14} name="newCustomers" />
                      <Bar dataKey="churnedCustomers" fill="#F87171" radius={[3, 3, 0, 0]} barSize={14} name="churnedCustomers" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    No data available for selected filter.
                  </div>
                )}
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
                {overviewTopCustomersByUsage.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-3 group cursor-pointer">
                    <span className="text-xs text-muted-foreground w-4 tabular-nums font-medium">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-qiko-indigo transition-colors">{c.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span>{c.conversations.toLocaleString()} convs</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] bg-qiko-success/10 text-qiko-success border-0 tabular-nums">
                      {c.subscriptionPlanName}
                    </Badge>
                  </div>
                ))}
                {overviewTopCustomersByUsage.length === 0 && (
                  <div className="text-xs text-muted-foreground py-6 text-center">
                    No customer usage data found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top customers by earnings */}
        <motion.div variants={fadeUp} custom={14} initial="hidden" animate="visible">
          <Card className="bg-card/80 border-border/40 h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Top Customers by Revenue</CardTitle>
                <a href="/revenue" className="text-xs text-qiko-indigo hover:underline flex items-center gap-0.5">View all <ChevronRight className="size-3" /></a>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {overviewTopCustomersByEarnings.slice(0, 5).map((c, i) => (
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
                      <p className="text-sm font-semibold tabular-nums">${c.earnings.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {overviewTopCustomersByEarnings.length === 0 && (
                  <div className="text-xs text-muted-foreground py-6 text-center">
                    No customer earnings data found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

        </>
      )}

    </div>
  );
}
