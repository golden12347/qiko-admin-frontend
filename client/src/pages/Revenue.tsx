// ============================================================
// Revenue — Executive revenue analytics
// Revenue-only KPIs, charts, and tables
// Design: Dark Lattice — Qiko brand tokens
// ============================================================

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DollarSign, TrendingUp, Users, ArrowUpRight, ArrowDownRight,
  Zap, ChevronsUpDown, ChevronUp, ChevronDown,
} from "lucide-react";
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { isDateInGlobalRange, parseDateValue, useGlobalDateFilter } from "@/contexts/DateFilterContext";
import { adminRevenue } from "@/services/adminRevenueApi";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.04, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

type SortDir = "asc" | "desc" | null;
type CustomerSortKey = "name" | "plan" | "totalRevenue" | "lastBilling";

const planBadgeColors: Record<string, string> = {
  Basic: "bg-muted-foreground/10 text-muted-foreground",
  Premium: "bg-qiko-indigo/10 text-qiko-indigo",
  Enterprise: "bg-qiko-warning/10 text-qiko-warning",
};

const tooltipStyle = {
  background: "rgba(15,20,35,0.95)",
  border: "1px solid rgba(99,102,241,0.2)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#e2e8f0",
};

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

function formatBillingDate(value: string): string {
  if (!value) return "—";
  const normalized = value.includes(" ") ? value.replace(" ", "T") : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Revenue() {
  const { filter } = useGlobalDateFilter();
  const [custSort, setCustSort] = useState<{ key: CustomerSortKey; dir: SortDir }>({ key: "totalRevenue", dir: "desc" });
  const [revenueCounts, setRevenueCounts] = useState({
    totalEarning: 0,
    averageRevenuePerUser: 0,
    averageRevenuePerAgent: 0,
  });
  const [revenuePercentages, setRevenuePercentages] = useState({
    totalEarningPercentage: 0,
    averageRevenuePerUserPercentage: 0,
    averageRevenuePerAgentPercentage: 0,
  });
  const [revenueOverTimeApi, setRevenueOverTimeApi] = useState<Array<{ month: string; earning: number }>>([]);
  const [customerRevenueTableApi, setCustomerRevenueTableApi] = useState<
    Array<{ name: string; plan: string; totalRevenue: number; lastBilling: string }>
  >([]);
  const [topCustomersByRevenueApi, setTopCustomersByRevenueApi] = useState<
    Array<{ name: string; amount: number }>
  >([]);
  const [planDistributionApi, setPlanDistributionApi] = useState<
    Array<{ plan: "Basic" | "Premium" | "Enterprise"; customers: number; mrr: number }>
  >([]);

  function toNumber(value: unknown, fallback = 0): number {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const normalized = value.replace(/[^0-9.-]/g, "");
      const parsed = Number(normalized);
      if (Number.isFinite(parsed)) return parsed;
    }
    return fallback;
  }

  const customerRevenueData = useMemo(() => customerRevenueTableApi, [customerRevenueTableApi]);

  const normalizedPlanDistribution = useMemo(() => {
    if (planDistributionApi.length > 0) return planDistributionApi;
    return [
      { plan: "Basic", customers: 0, mrr: 0 },
      { plan: "Premium", customers: 0, mrr: 0 },
      { plan: "Enterprise", customers: 0, mrr: 0 },
    ];
  }, [planDistributionApi]);

  const kpis = [
    {
      label: "Total Revenue",
      value: `$${revenueCounts.totalEarning.toLocaleString()}`,
      trend: revenuePercentages.totalEarningPercentage,
      icon: DollarSign,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      sub: "All time",
    },
    {
      label: "Avg Revenue / Customer",
      value: `$${revenueCounts.averageRevenuePerUser.toLocaleString()}`,
      trend: revenuePercentages.averageRevenuePerUserPercentage,
      icon: Users,
      color: "text-violet-400",
      bg: "bg-violet-400/10",
      sub: "Active accounts",
    },
    {
      label: "Avg Revenue / Worker",
      value: `$${revenueCounts.averageRevenuePerAgent.toLocaleString()}`,
      trend: revenuePercentages.averageRevenuePerAgentPercentage,
      icon: Zap,
      color: "text-qiko-success",
      bg: "bg-qiko-success/10",
      sub: "Live workers",
    },
  ];

  const sortedCustomers = useMemo(() => {
    const data = [...customerRevenueData];
    if (!custSort.dir) return data;
    return data.sort((a, b) => {
      const av = a[custSort.key];
      const bv = b[custSort.key];
      if (typeof av === "number" && typeof bv === "number") {
        return custSort.dir === "asc" ? av - bv : bv - av;
      }
      return custSort.dir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [customerRevenueData, custSort]);

  const filteredMrrTrend = useMemo(
    () =>
      revenueOverTimeApi.filter((point) =>
        isDateInGlobalRange(parseDateValue(point.month) ?? point.month, filter)
      ),
    [filter, revenueOverTimeApi]
  );
  const filteredRevenueOverTime = useMemo(
    () =>
      filteredMrrTrend.map((point) => ({
        month: point.month,
        earning: point.earning,
      })),
    [filteredMrrTrend]
  );

  function toggleCustSort(key: CustomerSortKey) {
    setCustSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : prev.dir === "desc" ? null : "asc" }
        : { key, dir: "desc" }
    );
  }

  function SortIcon({ sortKey, current }: { sortKey: string; current: { key: string; dir: SortDir } }) {
    if (current.key !== sortKey || !current.dir) return <ChevronsUpDown className="size-3 text-muted-foreground/40" />;
    return current.dir === "asc" ? <ChevronUp className="size-3 text-qiko-indigo" /> : <ChevronDown className="size-3 text-qiko-indigo" />;
  }

  useEffect(() => {
    (async () => {
      try {
        const response = await adminRevenue(filter);
        setRevenueCounts({
          totalEarning: toNumber(response.total_earning),
          averageRevenuePerUser: toNumber(response.average_revenue_per_user),
          averageRevenuePerAgent: toNumber(response.average_revenue_per_agent),
        });
        setRevenuePercentages({
          totalEarningPercentage: toNumber(response.total_earning_percentage),
          averageRevenuePerUserPercentage: toNumber(response.average_revenue_per_user_percentage),
          averageRevenuePerAgentPercentage: toNumber(response.average_revenue_per_agent_percentage),
        });
        setRevenueOverTimeApi(
          Array.isArray(response.revenue_over_time)
            ? response.revenue_over_time.map((item) => ({
                month: String(
                  item.month ??
                  (item as Record<string, unknown>).label ??
                  (item as Record<string, unknown>).period ??
                  (item as Record<string, unknown>).date ??
                  "—"
                ),
                earning: toNumber(
                  item.earning ??
                  (item as Record<string, unknown>).total_earning ??
                  (item as Record<string, unknown>).total_earnings ??
                  (item as Record<string, unknown>).revenue ??
                  (item as Record<string, unknown>).mrr
                ),
              }))
            : []
        );
        setCustomerRevenueTableApi(
          Array.isArray(response.customer_revenue_table)
            ? response.customer_revenue_table.map((item) => {
                const row = item as Record<string, unknown>;
                const subscriptionPlans = Array.isArray(row.subscription_plans)
                  ? (row.subscription_plans as Array<Record<string, unknown>>)
                  : [];
                const firstPlan = subscriptionPlans[0] ?? {};

                return {
                  name: String(item.user_name ?? "—"),
                  plan: String(
                    firstPlan.plan_name ??
                    firstPlan.subscription_plan_name ??
                    item.plan_name ??
                    row.subscription_plan_name ??
                    row.plan ??
                    "—"
                  ),
                  totalRevenue: toNumber(item.total_earnings),
                  lastBilling: String(
                    firstPlan.plan_created_at ??
                    firstPlan.created_at ??
                    item.plan_created_at ??
                    row.created_at ??
                    row.updated_at ??
                    row.last_billing ??
                    "—"
                  ),
                };
              })
            : []
        );
        setTopCustomersByRevenueApi(
          Array.isArray(response.top_customers_earnings)
            ? response.top_customers_earnings.map((item) => ({
                name: String(item.user_name ?? "—"),
                amount: toNumber(item.total_earnings),
              }))
            : []
        );
        const planDistribution = response.plan_distribution;
        if (planDistribution && typeof planDistribution === "object") {
          setPlanDistributionApi([
            {
              plan: "Basic",
              customers: toNumber(planDistribution.basic),
              mrr: toNumber(planDistribution.basic_total_amount),
            },
            {
              plan: "Premium",
              customers: toNumber(planDistribution.premium),
              mrr: toNumber(planDistribution.premium_total_amount),
            },
            {
              plan: "Enterprise",
              customers: toNumber(planDistribution.enterprise),
              mrr: toNumber(planDistribution.enterprise_total_amount),
            },
          ]);
        } else {
          setPlanDistributionApi([]);
        }
      } catch {
        toast.error("Failed to fetch revenue data.");
        setRevenueCounts({
          totalEarning: 0,
          averageRevenuePerUser: 0,
          averageRevenuePerAgent: 0,
        });
        setRevenuePercentages({
          totalEarningPercentage: 0,
          averageRevenuePerUserPercentage: 0,
          averageRevenuePerAgentPercentage: 0,
        });
        setRevenueOverTimeApi([]);
        setCustomerRevenueTableApi([]);
        setTopCustomersByRevenueApi([]);
        setPlanDistributionApi([]);
      }
    })();
  }, [filter]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight">Revenue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Revenue performance across all customers and workers
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} custom={i} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="bg-card/80 border-border/40 h-full">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`flex items-center justify-center h-8 w-8 rounded-lg ${kpi.bg}`}>
                    <kpi.icon className={`size-4 ${kpi.color}`} />
                  </div>
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${kpi.trend >= 0 ? "text-qiko-success" : "text-qiko-error"}`}>
                    {kpi.trend >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                    {Math.abs(kpi.trend)}%
                  </div>
                </div>
                <div className="text-xl font-bold font-heading tabular-nums tracking-tight">
                  {kpi.value}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{kpi.label}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">{kpi.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div className="lg:col-span-2" custom={6} variants={fadeUp} initial="hidden" animate="visible">
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
              <div className="h-[300px]">
                {filteredRevenueOverTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredRevenueOverTime} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${fmt(v)}`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`$${value.toLocaleString()}`, "Earning"]} />
                      <Area type="monotone" dataKey="earning" name="Earning" stroke="#10B981" strokeWidth={2} fill="url(#mrrGrad)" />
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

        {/* Top Customers by Revenue — Ranked List */}
        <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible">
          <Card className="bg-card/80 border-border/40 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top Customers by Revenue</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {topCustomersByRevenueApi.slice(0, 8).map((acct, i) => {
                  const maxRev = topCustomersByRevenueApi[0]?.amount || 1;
                  const pct = (acct.amount / maxRev) * 100;
                  return (
                    <div key={acct.name} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground/50 w-4 tabular-nums">{i + 1}</span>
                          <span className="text-xs font-medium truncate max-w-[120px]">{acct.name}</span>
                        </div>
                        <span className="text-xs font-medium tabular-nums">${acct.amount.toLocaleString()}/mo</span>
                      </div>
                      <div className="ml-6 h-1.5 rounded-full bg-secondary/30 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-qiko-indigo to-qiko-cyan transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Customer Revenue Table */}
      <motion.div custom={9} variants={fadeUp} initial="hidden" animate="visible">
        <Card className="bg-card/80 border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Customer Revenue Table</CardTitle>
              <span className="text-xs text-muted-foreground">{sortedCustomers.length} customers</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent">
                    {[
                      { key: "name" as CustomerSortKey, label: "Customer", align: "text-left" },
                      { key: "plan" as CustomerSortKey, label: "Plan", align: "text-left" },
                      { key: "totalRevenue" as CustomerSortKey, label: "Total Revenue", align: "text-right" },
                      { key: "lastBilling" as CustomerSortKey, label: "Last Billing", align: "text-right" },
                    ].map((col) => (
                      <TableHead
                        key={col.key}
                        className={`text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors ${col.align}`}
                        onClick={() => toggleCustSort(col.key)}
                      >
                        <div className={`flex items-center gap-1 ${col.align === "text-right" ? "justify-end" : ""}`}>
                          {col.label}
                          <SortIcon sortKey={col.key} current={custSort} />
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCustomers.map((c) => (
                    <TableRow key={c.name} className="border-border/30 hover:bg-secondary/20 cursor-pointer">
                      <TableCell>
                        <span className="text-sm font-medium">{c.name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-[10px] border-0 ${planBadgeColors[c.plan] || ""}`}>
                          {c.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-medium">
                        ${c.totalRevenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{formatBillingDate(c.lastBilling)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Plan Distribution Summary */}
      <motion.div custom={10} variants={fadeUp} initial="hidden" animate="visible">
        <Card className="bg-card/80 border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {normalizedPlanDistribution.map((plan) => {
                const totalCust = normalizedPlanDistribution.reduce((s, p) => s + p.customers, 0);
                const pct = ((plan.customers / totalCust) * 100).toFixed(0);
                return (
                  <div key={plan.plan} className="rounded-lg border border-border/30 p-4 bg-secondary/10">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className={`text-[10px] border-0 ${planBadgeColors[plan.plan] || ""}`}>
                        {plan.plan}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{pct}%</span>
                    </div>
                    <p className="text-xl font-bold font-heading tabular-nums">{plan.customers}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">customers</p>
                    <div className="flex items-center justify-end mt-2 pt-2 border-t border-border/20">
                      <span className="text-xs font-medium tabular-nums text-qiko-success">${plan.mrr.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
