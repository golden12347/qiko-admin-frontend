// ============================================================
// Revenue & Conversions — Executive commercial analytics
// 6 KPIs, 5 charts, 2 sortable tables, period filter
// Design: Dark Lattice — Qiko brand tokens
// ============================================================

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign, TrendingUp, Users, ArrowUpRight, ArrowDownRight,
  Target, Zap, BarChart3, ChevronsUpDown, ChevronUp, ChevronDown,
  Download, CreditCard, UserCheck,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend,
} from "recharts";
import {
  revenueKPIs, mrrTrend, planDistribution, conversionFunnel,
  topAccountsByRevenue, customers, platformWorkers,
  subscribersTrend, conversionTrend, topWorkersByRevenue,
} from "@/lib/data";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.04, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

type SortDir = "asc" | "desc" | null;
type CustomerSortKey = "name" | "plan" | "paidSubscribers" | "conversions" | "totalRevenue" | "mrr" | "lastBilling";
type WorkerSortKey = "name" | "customer" | "conversations" | "conversions" | "paidSubscribers" | "revenue";

const planBadgeColors: Record<string, string> = {
  Starter: "bg-muted-foreground/10 text-muted-foreground",
  Growth: "bg-qiko-cyan/10 text-qiko-cyan",
  Business: "bg-qiko-indigo/10 text-qiko-indigo",
  Enterprise: "bg-qiko-warning/10 text-qiko-warning",
};

const tooltipStyle = {
  background: "rgba(15,20,35,0.95)",
  border: "1px solid rgba(99,102,241,0.2)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#e2e8f0",
};

export default function Revenue() {
  const [period, setPeriod] = useState("30d");
  const [activeChart, setActiveChart] = useState<"revenue" | "subscribers" | "conversion">("revenue");

  // Customer revenue table
  const [custSort, setCustSort] = useState<{ key: CustomerSortKey; dir: SortDir }>({ key: "totalRevenue", dir: "desc" });
  // Worker revenue table
  const [workerSort, setWorkerSort] = useState<{ key: WorkerSortKey; dir: SortDir }>({ key: "revenue", dir: "desc" });

  // Derive customer revenue data
  const customerRevenueData = useMemo(() => {
    return customers.map((c) => ({
      name: c.name,
      slug: c.slug,
      plan: c.plan,
      paidSubscribers: c.paidSubscribers,
      conversions: c.leadsTotal,
      totalRevenue: c.totalEarnings,
      mrr: c.mrr,
      lastBilling: c.status === "Active" ? "Mar 1, 2026" : c.status === "Trial" ? "Trial" : c.status === "Churned" ? "Cancelled" : "Suspended",
    }));
  }, []);

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

  const sortedWorkers = useMemo(() => {
    const data = [...topWorkersByRevenue];
    if (!workerSort.dir) return data;
    return data.sort((a, b) => {
      const av = a[workerSort.key];
      const bv = b[workerSort.key];
      if (typeof av === "number" && typeof bv === "number") {
        return workerSort.dir === "asc" ? av - bv : bv - av;
      }
      return workerSort.dir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [workerSort]);

  function toggleCustSort(key: CustomerSortKey) {
    setCustSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : prev.dir === "desc" ? null : "asc" }
        : { key, dir: "desc" }
    );
  }

  function toggleWorkerSort(key: WorkerSortKey) {
    setWorkerSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : prev.dir === "desc" ? null : "asc" }
        : { key, dir: "desc" }
    );
  }

  function SortIcon({ sortKey, current }: { sortKey: string; current: { key: string; dir: SortDir } }) {
    if (current.key !== sortKey || !current.dir) return <ChevronsUpDown className="size-3 text-muted-foreground/40" />;
    return current.dir === "asc" ? <ChevronUp className="size-3 text-qiko-indigo" /> : <ChevronDown className="size-3 text-qiko-indigo" />;
  }

  // Computed totals
  const totalRevenue = customers.reduce((s, c) => s + c.totalEarnings, 0);
  const totalMRR = customers.reduce((s, c) => s + c.mrr, 0);
  const totalPaidSubs = customers.reduce((s, c) => s + c.paidSubscribers, 0);
  const totalConversions = customers.reduce((s, c) => s + c.leadsTotal, 0);
  const totalConversations = customers.reduce((s, c) => s + c.conversationsTotal, 0);
  const convRate = totalConversations > 0 ? ((totalConversions / totalConversations) * 100).toFixed(2) : "0";
  const activeCustomers = customers.filter((c) => c.status === "Active").length;
  const avgRevenuePerCustomer = activeCustomers > 0 ? Math.round(totalRevenue / activeCustomers) : 0;
  const activeWorkers = platformWorkers.filter((w) => w.status === "Live").length;
  const avgRevenuePerWorker = activeWorkers > 0 ? Math.round(totalRevenue / activeWorkers) : 0;

  const kpis = [
    { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, trend: 14.2, icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-400/10", sub: "All time" },
    { label: "Monthly Recurring Revenue", value: `$${totalMRR.toLocaleString()}`, trend: revenueKPIs.mrrGrowth, icon: TrendingUp, color: "text-qiko-indigo", bg: "bg-qiko-indigo/10", sub: "Current month" },
    { label: "Paid Subscribers", value: totalPaidSubs.toLocaleString(), trend: 18.0, icon: UserCheck, color: "text-qiko-cyan", bg: "bg-qiko-cyan/10", sub: "Across all customers" },
    { label: "Conversion Rate", value: `${convRate}%`, trend: 2.4, icon: Target, color: "text-qiko-warning", bg: "bg-qiko-warning/10", sub: "Conversations → Leads" },
    { label: "Avg Revenue / Customer", value: `$${avgRevenuePerCustomer.toLocaleString()}`, trend: 5.2, icon: Users, color: "text-violet-400", bg: "bg-violet-400/10", sub: "Active accounts" },
    { label: "Avg Revenue / Worker", value: `$${avgRevenuePerWorker.toLocaleString()}`, trend: 8.7, icon: Zap, color: "text-qiko-success", bg: "bg-qiko-success/10", sub: "Live workers" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight">Revenue & Conversions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Commercial performance across all customers and workers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => toast.success("Report exported")}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-secondary/50 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Download className="size-3.5" />
            Export
          </button>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[130px] bg-secondary/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards — 6 cards in 2 rows of 3 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

      {/* Charts Row — Revenue Trend + Subscribers + Conversion (tabbed) + Top by Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Chart — Tabbed */}
        <motion.div className="lg:col-span-2" custom={6} variants={fadeUp} initial="hidden" animate="visible">
          <Card className="bg-card/80 border-border/40">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Tabs value={activeChart} onValueChange={(v) => setActiveChart(v as typeof activeChart)}>
                  <TabsList className="bg-secondary/30 h-8">
                    <TabsTrigger value="revenue" className="text-xs h-6 px-3">Revenue</TabsTrigger>
                    <TabsTrigger value="subscribers" className="text-xs h-6 px-3">Subscribers</TabsTrigger>
                    <TabsTrigger value="conversion" className="text-xs h-6 px-3">Conversions</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  {activeChart === "revenue" ? (
                    <AreaChart data={mrrTrend} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="newMrrGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name === "mrr" ? "MRR" : name === "newMrr" ? "New MRR" : name]} />
                      <Legend wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }} />
                      <Area type="monotone" dataKey="mrr" name="MRR" stroke="#10B981" strokeWidth={2} fill="url(#mrrGrad)" />
                      <Area type="monotone" dataKey="newMrr" name="New MRR" stroke="#6366F1" strokeWidth={1.5} fill="url(#newMrrGrad)" />
                    </AreaChart>
                  ) : activeChart === "subscribers" ? (
                    <AreaChart data={subscribersTrend} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="subGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }} />
                      <Area type="monotone" dataKey="total" name="Total Subscribers" stroke="#22D3EE" strokeWidth={2} fill="url(#subGrad)" />
                      <Bar dataKey="new" name="New" fill="#6366F1" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="churned" name="Churned" fill="#EF4444" radius={[2, 2, 0, 0]} />
                    </AreaChart>
                  ) : (
                    <LineChart data={conversionTrend} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}K`} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }} />
                      <Line yAxisId="left" type="monotone" dataKey="leads" name="Leads" stroke="#6366F1" strokeWidth={2} dot={false} />
                      <Line yAxisId="left" type="monotone" dataKey="conversions" name="Conversions" stroke="#22D3EE" strokeWidth={2} dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="rate" name="Conv. Rate %" stroke="#F59E0B" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                    </LineChart>
                  )}
                </ResponsiveContainer>
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
                {topAccountsByRevenue.slice(0, 8).map((acct, i) => {
                  const maxRev = topAccountsByRevenue[0].mrr;
                  const pct = (acct.mrr / maxRev) * 100;
                  return (
                    <div key={acct.name} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground/50 w-4 tabular-nums">{i + 1}</span>
                          <span className="text-xs font-medium truncate max-w-[120px]">{acct.name}</span>
                        </div>
                        <span className="text-xs font-medium tabular-nums">${acct.mrr.toLocaleString()}/mo</span>
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

      {/* Top Workers by Revenue — Horizontal Bar Chart */}
      <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible">
        <Card className="bg-card/80 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Workers by Revenue</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topWorkersByRevenue.slice(0, 8).sort((a, b) => a.revenue - b.revenue)}
                  layout="vertical"
                  margin={{ top: 4, right: 30, left: 10, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }} tickLine={false} axisLine={false} width={120} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Conversion Funnel */}
      <motion.div custom={9} variants={fadeUp} initial="hidden" animate="visible">
        <Card className="bg-card/80 border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Conversion Funnel — Platform Wide</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-2">
              {conversionFunnel.map((step, i) => (
                <div key={step.stage} className="flex items-center gap-2 flex-1">
                  <div className="flex-1">
                    <div
                      className="rounded-lg p-4 text-center transition-all"
                      style={{
                        background: `rgba(99, 102, 241, ${0.06 + i * 0.04})`,
                        border: `1px solid rgba(99, 102, 241, ${0.08 + i * 0.05})`,
                      }}
                    >
                      <p className="text-xl font-bold font-heading tabular-nums">
                        {step.count.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{step.stage}</p>
                      {i > 0 && (
                        <p className="text-[10px] text-qiko-indigo font-medium mt-1">
                          {((step.count / conversionFunnel[i - 1].count) * 100).toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>
                  {i < conversionFunnel.length - 1 && (
                    <div className="text-muted-foreground/30">
                      <ChevronDown className="size-4 rotate-[-90deg]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Customer Revenue Table */}
      <motion.div custom={10} variants={fadeUp} initial="hidden" animate="visible">
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
                      { key: "paidSubscribers" as CustomerSortKey, label: "Paid Subs", align: "text-right" },
                      { key: "conversions" as CustomerSortKey, label: "Total Conversions", align: "text-right" },
                      { key: "totalRevenue" as CustomerSortKey, label: "Total Revenue", align: "text-right" },
                      { key: "mrr" as CustomerSortKey, label: "MRR", align: "text-right" },
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
                      <TableCell className="text-right tabular-nums text-sm">{c.paidSubscribers.toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{c.conversions.toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-medium">
                        ${c.totalRevenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-medium text-qiko-success">
                        ${c.mrr.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{c.lastBilling}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Worker Revenue Table */}
      <motion.div custom={11} variants={fadeUp} initial="hidden" animate="visible">
        <Card className="bg-card/80 border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Worker Revenue Table</CardTitle>
              <span className="text-xs text-muted-foreground">{sortedWorkers.length} workers</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent">
                    {[
                      { key: "name" as WorkerSortKey, label: "Worker", align: "text-left" },
                      { key: "customer" as WorkerSortKey, label: "Customer", align: "text-left" },
                      { key: "conversations" as WorkerSortKey, label: "Conversations", align: "text-right" },
                      { key: "conversions" as WorkerSortKey, label: "Conversions", align: "text-right" },
                      { key: "paidSubscribers" as WorkerSortKey, label: "Paid Subs", align: "text-right" },
                      { key: "revenue" as WorkerSortKey, label: "Revenue Attributed", align: "text-right" },
                    ].map((col) => (
                      <TableHead
                        key={col.key}
                        className={`text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors ${col.align}`}
                        onClick={() => toggleWorkerSort(col.key)}
                      >
                        <div className={`flex items-center gap-1 ${col.align === "text-right" ? "justify-end" : ""}`}>
                          {col.label}
                          <SortIcon sortKey={col.key} current={workerSort} />
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedWorkers.map((w) => (
                    <TableRow key={w.name} className="border-border/30 hover:bg-secondary/20 cursor-pointer">
                      <TableCell>
                        <span className="text-sm font-medium">{w.name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{w.customer}</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{w.conversations.toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{w.conversions.toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{w.paidSubscribers.toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-medium text-qiko-success">
                        ${w.revenue.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Plan Distribution Summary */}
      <motion.div custom={12} variants={fadeUp} initial="hidden" animate="visible">
        <Card className="bg-card/80 border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {planDistribution.map((plan) => {
                const totalCust = planDistribution.reduce((s, p) => s + p.customers, 0);
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
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
                      <span className="text-[10px] text-muted-foreground">MRR</span>
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
