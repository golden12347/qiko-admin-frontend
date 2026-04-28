// ============================================================
// Customers — Platform-wide customer management & oversight
// Full account summary table with all columns, sorting, filters,
// search, and row-click navigation to Customer Detail page
// Design: Dark Lattice — data-dense, Stripe/Linear-inspired
// ============================================================

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Users,
  TrendingUp,
  DollarSign,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CreditCard,
  FlaskConical,
  UserX,
  Download,
  ChevronRight,
  Bot,
  MessageSquare,
  Target,
} from "lucide-react";
import { customers, type Customer } from "@/lib/data";
import { toast } from "sonner";

/* ── animation ─────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const } },
};

/* ── status / plan badge colors ────────────────────────────── */
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

/* ── sortable column keys ──────────────────────────────────── */
type SortKey =
  | "name"
  | "plan"
  | "status"
  | "workersCount"
  | "conversationsTotal"
  | "leadsTotal"
  | "paidSubscribers"
  | "totalEarnings"
  | "mrr"
  | "joinedDate"
  | "lastActive";

type SortDir = "asc" | "desc";

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

function parseLastActive(s: string): number {
  if (s.includes("Just now") || s.includes("1 min")) return 0;
  const num = parseInt(s);
  if (s.includes("min")) return num;
  if (s.includes("hour")) return num * 60;
  if (s.includes("day")) return num * 1440;
  return 99999;
}

/* ── component ─────────────────────────────────────────────── */
export default function Customers() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("totalEarnings");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  /* ── derived stats ────────────────────────────────────────── */
  const stats = useMemo(() => ({
    total: customers.length,
    active: customers.filter((c) => c.status === "Active").length,
    trial: customers.filter((c) => c.status === "Trial").length,
    churned: customers.filter((c) => c.status === "Churned").length,
    totalMRR: customers.reduce((sum, c) => sum + c.mrr, 0),
    totalEarnings: customers.reduce((sum, c) => sum + c.totalEarnings, 0),
    paidSubscribers: customers.reduce((sum, c) => sum + c.paidSubscribers, 0),
  }), []);

  /* ── filter + sort ────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let result = customers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.contactEmail.toLowerCase().includes(search.toLowerCase()) ||
        c.industry.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      const matchPlan = planFilter === "all" || c.plan === planFilter;

      let matchDate = true;
      if (dateFilter !== "all") {
        const joined = new Date(c.joinedDate);
        const now = new Date();
        if (dateFilter === "30d") matchDate = (now.getTime() - joined.getTime()) <= 30 * 86400000;
        else if (dateFilter === "90d") matchDate = (now.getTime() - joined.getTime()) <= 90 * 86400000;
        else if (dateFilter === "6m") matchDate = (now.getTime() - joined.getTime()) <= 180 * 86400000;
        else if (dateFilter === "1y") matchDate = (now.getTime() - joined.getTime()) <= 365 * 86400000;
      }

      return matchSearch && matchStatus && matchPlan && matchDate;
    });

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "plan": cmp = a.plan.localeCompare(b.plan); break;
        case "status": cmp = a.status.localeCompare(b.status); break;
        case "workersCount": cmp = a.workersCount - b.workersCount; break;
        case "conversationsTotal": cmp = a.conversationsTotal - b.conversationsTotal; break;
        case "leadsTotal": cmp = a.leadsTotal - b.leadsTotal; break;
        case "paidSubscribers": cmp = a.paidSubscribers - b.paidSubscribers; break;
        case "totalEarnings": cmp = a.totalEarnings - b.totalEarnings; break;
        case "mrr": cmp = a.mrr - b.mrr; break;
        case "joinedDate": cmp = new Date(a.joinedDate).getTime() - new Date(b.joinedDate).getTime(); break;
        case "lastActive": cmp = parseLastActive(a.lastActive) - parseLastActive(b.lastActive); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [search, statusFilter, planFilter, dateFilter, sortKey, sortDir]);

  /* ── sort handler ─────────────────────────────────────────── */
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

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All organizations using the Qiko platform
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs gap-1.5 border-border/50"
          onClick={() => toast.success("Export started — CSV will download shortly.")}
        >
          <Download className="size-3.5" /> Export CSV
        </Button>
      </div>

      {/* ── Summary KPI Cards ───────────────────────────────── */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <KPICard icon={<Users className="size-4" />} label="Total" value={stats.total} color="text-foreground" />
        <KPICard icon={<TrendingUp className="size-4" />} label="Active" value={stats.active} color="text-qiko-success" />
        <KPICard icon={<FlaskConical className="size-4" />} label="Trial" value={stats.trial} color="text-qiko-cyan" />
        <KPICard icon={<UserX className="size-4" />} label="Churned" value={stats.churned} color="text-muted-foreground" />
        <KPICard icon={<CreditCard className="size-4" />} label="Paid Subs" value={stats.paidSubscribers} color="text-emerald-400" />
        <KPICard icon={<DollarSign className="size-4" />} label="Total MRR" value={`$${stats.totalMRR.toLocaleString()}`} color="text-violet-400" />
        <KPICard icon={<DollarSign className="size-4" />} label="Lifetime Rev" value={`$${fmt(stats.totalEarnings)}`} color="text-amber-400" />
      </motion.div>

      {/* ── Filters Bar ─────────────────────────────────────── */}
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] bg-secondary/50 border-border/50">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Trial">Trial</SelectItem>
            <SelectItem value="Churned">Churned</SelectItem>
            <SelectItem value="Suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[130px] bg-secondary/50 border-border/50">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="Starter">Starter</SelectItem>
            <SelectItem value="Growth">Growth</SelectItem>
            <SelectItem value="Business">Business</SelectItem>
            <SelectItem value="Enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[140px] bg-secondary/50 border-border/50">
            <SelectValue placeholder="Date Joined" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="6m">Last 6 Months</SelectItem>
            <SelectItem value="1y">Last Year</SelectItem>
          </SelectContent>
        </Select>
        {(statusFilter !== "all" || planFilter !== "all" || dateFilter !== "all" || search) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => { setSearch(""); setStatusFilter("all"); setPlanFilter("all"); setDateFilter("all"); }}
          >
            Clear filters
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto tabular-nums">
          {filtered.length} of {customers.length} customers
        </span>
      </div>

      {/* ── Table ───────────────────────────────────────────── */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Card className="bg-card/80 border-border/40">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <SortableHead col="name" label="Customer" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="name" />} />
                    <SortableHead col="plan" label="Plan" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="plan" />} />
                    <SortableHead col="status" label="Status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="status" />} />
                    <SortableHead col="workersCount" label="Workers" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="workersCount" />} align="right" />
                    <SortableHead col="conversationsTotal" label="Conversations" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="conversationsTotal" />} align="right" />
                    <SortableHead col="leadsTotal" label="Conversions" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="leadsTotal" />} align="right" />
                    <SortableHead col="paidSubscribers" label="Paid Subs" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="paidSubscribers" />} align="right" />
                    <SortableHead col="totalEarnings" label="Total Earnings" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="totalEarnings" />} align="right" />
                    <SortableHead col="mrr" label="MRR" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="mrr" />} align="right" />
                    <SortableHead col="joinedDate" label="Joined" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="joinedDate" />} />
                    <SortableHead col="lastActive" label="Last Active" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="lastActive" />} />
                    <TableHead className="text-xs font-medium text-muted-foreground w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow
                      key={c.id}
                      className="border-border/30 cursor-pointer hover:bg-secondary/30 transition-colors group"
                      onClick={() => navigate(`/customers/${c.slug}`)}
                    >
                      {/* Customer Name + Industry */}
                      <TableCell className="min-w-[180px]">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-qiko-indigo/12 text-qiko-indigo font-bold text-xs">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium group-hover:text-qiko-indigo transition-colors">{c.name}</p>
                            <p className="text-[11px] text-muted-foreground">{c.industry} · {c.country}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Plan */}
                      <TableCell>
                        <Badge variant="secondary" className={`text-[10px] border-0 ${planColors[c.plan]}`}>
                          {c.plan}
                        </Badge>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${statusColors[c.status]}`}>
                          {c.status}
                        </Badge>
                      </TableCell>

                      {/* Workers */}
                      <TableCell className="text-right">
                        <span className="tabular-nums text-sm flex items-center justify-end gap-1">
                          <Bot className="size-3 text-muted-foreground/50" />
                          {c.workersCount}
                        </span>
                      </TableCell>

                      {/* Conversations */}
                      <TableCell className="text-right">
                        <span className="tabular-nums text-sm flex items-center justify-end gap-1">
                          <MessageSquare className="size-3 text-muted-foreground/50" />
                          {fmt(c.conversationsTotal)}
                        </span>
                      </TableCell>

                      {/* Conversions */}
                      <TableCell className="text-right">
                        <span className="tabular-nums text-sm flex items-center justify-end gap-1">
                          <Target className="size-3 text-muted-foreground/50" />
                          {fmt(c.leadsTotal)}
                        </span>
                      </TableCell>

                      {/* Paid Subscribers */}
                      <TableCell className="text-right tabular-nums text-sm">
                        {c.paidSubscribers > 0 ? c.paidSubscribers : <span className="text-muted-foreground/40">—</span>}
                      </TableCell>

                      {/* Total Earnings */}
                      <TableCell className="text-right tabular-nums text-sm font-medium">
                        {c.totalEarnings > 0 ? `$${c.totalEarnings.toLocaleString()}` : <span className="text-muted-foreground/40">—</span>}
                      </TableCell>

                      {/* MRR */}
                      <TableCell className="text-right">
                        <span className={`tabular-nums text-sm font-semibold ${c.mrr > 0 ? "text-emerald-400" : "text-muted-foreground/40"}`}>
                          {c.mrr > 0 ? `$${c.mrr.toLocaleString()}` : "—"}
                        </span>
                      </TableCell>

                      {/* Date Joined */}
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(c.joinedDate)}
                      </TableCell>

                      {/* Last Active */}
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {c.lastActive}
                      </TableCell>

                      {/* Chevron */}
                      <TableCell className="w-8">
                        <ChevronRight className="size-4 text-muted-foreground/30 group-hover:text-qiko-indigo transition-colors" />
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-12 text-muted-foreground">
                        No customers match your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Table footer ────────────────────────────────────── */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing {filtered.length} customers · Sorted by {sortKey.replace(/([A-Z])/g, " $1").toLowerCase()} ({sortDir})</span>
        <span>Click any row to view customer details</span>
      </div>
    </div>
  );
}

/* ── KPI Card ──────────────────────────────────────────────── */
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

/* ── Sortable Table Head ───────────────────────────────────── */
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
