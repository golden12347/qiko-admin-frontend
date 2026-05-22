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
  DollarSign, Users, ArrowUpRight, ArrowDownRight,
  ChevronsUpDown, ChevronUp, ChevronDown,
} from "lucide-react";
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { isDateInGlobalRange, parseDateValue, useGlobalDateFilter } from "@/contexts/DateFilterContext";
import {
  adminCustomerInvoices,
  extractCustomerInvoiceRowsFromPayload,
  extractCustomerInvoicesPagination,
  extractInvoiceRevenueSummaryFromPayload,
  extractRevenueOverTimeFromPayload,
  extractTopCustomersByRevenueFromPayload,
  mapCustomerInvoicesToTableRows,
  mapTopCustomersByRevenueFromInvoices,
} from "@/services/adminCustomerInvoicesApi";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";
import { RevenueDashboardSkeleton } from "@/components/tabPageSkeletons";

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
  Standard: "bg-qiko-indigo/10 text-qiko-indigo",
  Enterprise: "bg-qiko-warning/10 text-qiko-warning",
  "N/A": "bg-muted-foreground/10 text-muted-foreground",
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

function formatUsd(amount: number): string {
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatBillingDate(value: string): string {
  if (!value || value === "N/A") return value || "N/A";
  const normalized = value.includes(" ") ? value.replace(" ", "T") : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function displayOrNa(value: unknown): string {
  if (value == null) return "N/A";
  const s = String(value).trim();
  if (!s || s.toLowerCase() === "null") return "N/A";
  return s;
}

type CustomerRevenueRow = {
  id: string;
  name: string;
  plan: string;
  totalRevenue: number | null;
  lastBilling: string;
};

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/[^0-9.-]/g, "");
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export default function Revenue() {
  const { filter } = useGlobalDateFilter();
  const reduxState = useAppSelector((state) => state);

  useEffect(() => {
    console.log("[Revenue] Redux state:", reduxState);
  }, [reduxState]);

  const [custSort, setCustSort] = useState<{ key: CustomerSortKey; dir: SortDir }>({ key: "totalRevenue", dir: "desc" });
  const [revenueCounts, setRevenueCounts] = useState({
    totalEarning: 0,
    averageRevenuePerUser: 0,
  });
  const [revenuePercentages, setRevenuePercentages] = useState({
    totalEarningPercentage: 0,
    averageRevenuePerUserPercentage: 0,
  });
  const [revenueOverTimeApi, setRevenueOverTimeApi] = useState<Array<{ month: string; earning: number }>>([]);
  const [customerRevenueTableApi, setCustomerRevenueTableApi] = useState<CustomerRevenueRow[]>([]);
  const [customerInvoicePage, setCustomerInvoicePage] = useState(1);
  const [customerInvoiceTotalPages, setCustomerInvoiceTotalPages] = useState(1);
  const [customerInvoiceTotal, setCustomerInvoiceTotal] = useState(0);
  const [customerTableLoading, setCustomerTableLoading] = useState(false);
  const [topCustomersByRevenueApi, setTopCustomersByRevenueApi] = useState<
    Array<{ name: string; amount: number; stripeCustomerId: string }>
  >([]);
  const [revenueLoading, setRevenueLoading] = useState(true);

  const filterKey = useMemo(
    () => `${filter.preset}\0${filter.customStartDate}\0${filter.customEndDate}`,
    [filter.preset, filter.customStartDate, filter.customEndDate]
  );

  const customerRevenueData = useMemo(() => customerRevenueTableApi, [customerRevenueTableApi]);

  const kpis = [
    {
      label: "Total Revenue",
      value: formatUsd(revenueCounts.totalEarning),
      trend: revenuePercentages.totalEarningPercentage,
      icon: DollarSign,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      sub: "All time",
    },
    {
      label: "Avg Revenue / Customer",
      value: formatUsd(revenueCounts.averageRevenuePerUser),
      trend: revenuePercentages.averageRevenuePerUserPercentage,
      icon: Users,
      color: "text-violet-400",
      bg: "bg-violet-400/10",
      sub: "Active accounts",
    },
    // Avg Revenue / Worker — hidden (customer-invoices does not drive this KPI)
    // {
    //   label: "Avg Revenue / Worker",
    //   value: formatUsd(revenueCounts.averageRevenuePerAgent),
    //   trend: revenuePercentages.averageRevenuePerAgentPercentage,
    //   icon: Zap,
    //   color: "text-qiko-success",
    //   bg: "bg-qiko-success/10",
    //   sub: "Live workers",
    // },
  ];

  const sortedCustomers = useMemo(() => {
    const data = [...customerRevenueData];
    if (!custSort.dir) return data;
    return data.sort((a, b) => {
      const av = a[custSort.key];
      const bv = b[custSort.key];
      if (custSort.key === "totalRevenue") {
        const an = av == null ? -Infinity : Number(av);
        const bn = bv == null ? -Infinity : Number(bv);
        return custSort.dir === "asc" ? an - bn : bn - an;
      }
      if (custSort.key === "lastBilling") {
        const at = parseDateValue(String(av))?.getTime() ?? 0;
        const bt = parseDateValue(String(bv))?.getTime() ?? 0;
        return custSort.dir === "asc" ? at - bt : bt - at;
      }
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
    setCustomerInvoicePage(1);
    setRevenueLoading(true);
  }, [filterKey]);

  useEffect(() => {
    let cancelled = false;
    setCustomerTableLoading(true);

    (async () => {
      try {
        const invoiceResponse = await adminCustomerInvoices(filter, {
          page: customerInvoicePage,
        });
        if (cancelled) return;
        const rawInvoices = extractCustomerInvoiceRowsFromPayload(invoiceResponse);
        setCustomerRevenueTableApi(mapCustomerInvoicesToTableRows(rawInvoices));

        const topFromApi = extractTopCustomersByRevenueFromPayload(invoiceResponse);
        setTopCustomersByRevenueApi(
          topFromApi.length > 0
            ? topFromApi
            : mapTopCustomersByRevenueFromInvoices(rawInvoices, 5)
        );

        const pagination = extractCustomerInvoicesPagination(invoiceResponse);
        setCustomerInvoiceTotal(pagination?.total ?? rawInvoices.length);
        setCustomerInvoiceTotalPages(pagination?.last_page ?? 1);

        setRevenueOverTimeApi(extractRevenueOverTimeFromPayload(invoiceResponse));

        const invoiceSummary = extractInvoiceRevenueSummaryFromPayload(invoiceResponse);
        if (invoiceSummary) {
          setRevenueCounts({
            totalEarning: invoiceSummary.totalEarning,
            averageRevenuePerUser: invoiceSummary.averageRevenuePerUser,
          });
          setRevenuePercentages({
            totalEarningPercentage: invoiceSummary.totalEarningPercentage,
            averageRevenuePerUserPercentage: invoiceSummary.averageRevenuePerUserPercentage,
          });
        } else {
          setRevenueCounts({
            totalEarning: 0,
            averageRevenuePerUser: 0,
          });
          setRevenuePercentages({
            totalEarningPercentage: 0,
            averageRevenuePerUserPercentage: 0,
          });
        }
      } catch {
        if (cancelled) return;
        toast.error("Failed to fetch customer invoices.");
        setCustomerRevenueTableApi([]);
        setTopCustomersByRevenueApi([]);
        setCustomerInvoiceTotal(0);
        setCustomerInvoiceTotalPages(1);
        setRevenueCounts({
          totalEarning: 0,
          averageRevenuePerUser: 0,
        });
        setRevenuePercentages({
          totalEarningPercentage: 0,
          averageRevenuePerUserPercentage: 0,
        });
        setRevenueOverTimeApi([]);
      } finally {
        if (!cancelled) {
          setCustomerTableLoading(false);
          setRevenueLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filter, filterKey, customerInvoicePage]);

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

      {revenueLoading ? (
        <RevenueDashboardSkeleton />
      ) : (
        <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="h-[300px] overflow-visible">
                {filteredRevenueOverTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" className="[&_.recharts-wrapper]:overflow-visible [&_.recharts-surface]:overflow-visible">
                    <AreaChart data={filteredRevenueOverTime} margin={{ top: 8, right: 48, left: -10, bottom: 22 }}>
                      <defs>
                        <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      minTickGap={8}
                      tickMargin={10}
                    />
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
                {topCustomersByRevenueApi.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No customer invoice data yet.
                  </p>
                ) : (
                  topCustomersByRevenueApi.map((acct, i) => {
                    const maxRev = topCustomersByRevenueApi[0]?.amount || 1;
                    const pct = maxRev > 0 ? (acct.amount / maxRev) * 100 : 0;
                    return (
                      <div key={acct.stripeCustomerId} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground/50 w-4 tabular-nums">{i + 1}</span>
                            <span className="text-xs font-medium truncate max-w-[120px]">{acct.name}</span>
                          </div>
                          <span className="text-xs font-medium tabular-nums">
                            ${acct.amount.toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="ml-6 h-1.5 rounded-full bg-secondary/30 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-qiko-indigo to-qiko-cyan transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Customer Revenue Table */}
      <motion.div custom={9} variants={fadeUp} initial="hidden" animate="visible">
        <Card className="bg-card/80 border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-sm font-medium">Customer Revenue Table</CardTitle>
              <span className="text-xs text-muted-foreground tabular-nums">
                {sortedCustomers.length} on this page · {customerInvoiceTotal} total
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className={`overflow-x-auto relative ${customerTableLoading ? "opacity-60 pointer-events-none" : ""}`}>
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
                  {sortedCustomers.length === 0 && !customerTableLoading ? (
                    <TableRow className="border-border/30 hover:bg-transparent">
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                        No customer invoices found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedCustomers.map((c) => (
                      <TableRow key={c.id} className="border-border/30 hover:bg-secondary/20 cursor-pointer">
                        <TableCell>
                          <span className="text-sm font-medium">{c.name}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`text-[10px] border-0 ${planBadgeColors[c.plan] || ""}`}>
                            {c.plan}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm font-medium">
                          {c.totalRevenue == null
                          ? "N/A"
                          : `$${c.totalRevenue.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {formatBillingDate(c.lastBilling)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 text-xs text-muted-foreground">
              <span>
                Page {customerInvoicePage} of {customerInvoiceTotalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="h-7 px-2 rounded-md border border-border/50 hover:bg-secondary/40 disabled:opacity-40 disabled:pointer-events-none"
                  disabled={customerInvoicePage <= 1 || customerTableLoading}
                  onClick={() => setCustomerInvoicePage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="h-7 px-2 rounded-md border border-border/50 hover:bg-secondary/40 disabled:opacity-40 disabled:pointer-events-none"
                  disabled={
                    customerInvoicePage >= customerInvoiceTotalPages || customerTableLoading
                  }
                  onClick={() => setCustomerInvoicePage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
        </>
      )}
    </div>
  );
}
