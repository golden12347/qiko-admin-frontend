// ============================================================
// Customers — Platform-wide customer management & oversight
// Full account summary table with all columns, sorting, filters,
// search, and row-click navigation to Customer Detail page
// Design: Dark Lattice — data-dense, Stripe/Linear-inspired
// ============================================================

import { useEffect, useState, useMemo } from "react";
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
  "Non-active": "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/20",
};

const planColors: Record<string, string> = {
  Basic: "bg-muted-foreground/10 text-muted-foreground",
  Premium: "bg-qiko-indigo/10 text-qiko-indigo",
  Enterprise: "bg-qiko-warning/10 text-qiko-warning",
};

/* ── sortable column keys ──────────────────────────────────── */
type SortKey =
  | "name"
  | "plan"
  | "status"
  | "workersCount"
  | "conversationsTotal"
  | "totalEarnings"
  | "joinedDate"
  | "lastActive";

type SortDir = "asc" | "desc";
const ROWS_PER_PAGE = 10;

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

function escapeCsv(value: string | number): string {
  const stringValue = String(value ?? "");
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function getDisplayPlan(plan: Customer["plan"]): "Basic" | "Premium" | "Enterprise" {
  if (plan === "Enterprise") return "Enterprise";
  if (plan === "Business") return "Premium";
  return "Basic";
}

function getDisplayStatus(status: Customer["status"]): "Active" | "Non-active" {
  return status === "Active" ? "Active" : "Non-active";
}

/* ── component ─────────────────────────────────────────────── */
export default function Customers() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("totalEarnings");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  /* ── derived stats ────────────────────────────────────────── */
  const stats = useMemo(() => ({
    total: customers.length,
    active: customers.filter((c) => c.status === "Active").length,
  }), []);

  /* ── filter + sort ────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let result = customers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.contactEmail.toLowerCase().includes(search.toLowerCase()) ||
        c.industry.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "plan": cmp = getDisplayPlan(a.plan).localeCompare(getDisplayPlan(b.plan)); break;
        case "status": cmp = getDisplayStatus(a.status).localeCompare(getDisplayStatus(b.status)); break;
        case "workersCount": cmp = a.workersCount - b.workersCount; break;
        case "conversationsTotal": cmp = a.conversationsTotal - b.conversationsTotal; break;
        case "totalEarnings": cmp = a.totalEarnings - b.totalEarnings; break;
        case "joinedDate": cmp = new Date(a.joinedDate).getTime() - new Date(b.joinedDate).getTime(); break;
        case "lastActive": cmp = parseLastActive(a.lastActive) - parseLastActive(b.lastActive); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return filtered.slice(start, start + ROWS_PER_PAGE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [search, sortKey, sortDir]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

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

  function handleExportCsv() {
    if (filtered.length === 0) {
      toast.error("No data to export.");
      return;
    }

    const headers = [
      "Name",
      "Plan",
      "Status",
      "Workers",
      "Conversations",
      "Total Earnings",
      "Joined",
      "Last Active",
    ];

    const rows = filtered.map((c) => [
      c.name,
      getDisplayPlan(c.plan),
      getDisplayStatus(c.status),
      c.workersCount,
      c.conversationsTotal,
      c.totalEarnings,
      c.joinedDate,
      c.lastActive,
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
          onClick={handleExportCsv}
        >
          <Download className="size-3.5" /> Export CSV
        </Button>
      </div>

      {/* ── Summary KPI Cards ───────────────────────────────── */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <KPICard icon={<Users className="size-4" />} label="Total" value={stats.total} color="text-foreground" />
        <KPICard icon={<TrendingUp className="size-4" />} label="Active" value={stats.active} color="text-qiko-success" />
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
                    <SortableHead col="totalEarnings" label="Total Earnings" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="totalEarnings" />} align="right" />
                    <SortableHead col="joinedDate" label="Joined" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="joinedDate" />} />
                    <SortableHead col="lastActive" label="Last Active" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} icon={<SortIcon col="lastActive" />} />
                    <TableHead className="text-xs font-medium text-muted-foreground w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((c) => (
                    <TableRow
                      key={c.id}
                      className="border-border/30 cursor-pointer hover:bg-secondary/30 transition-colors group"
                      onClick={() => navigate(`/customers/${c.slug}`)}
                    >
                      {/* Customer Name + Industry */}
                      <TableCell className="min-w-[180px]">
                        <p className="text-sm font-medium group-hover:text-qiko-indigo transition-colors">{c.name}</p>
                      </TableCell>

                      {/* Plan */}
                      <TableCell>
                        <Badge variant="secondary" className={`text-[10px] border-0 ${planColors[getDisplayPlan(c.plan)]}`}>
                          {getDisplayPlan(c.plan)}
                        </Badge>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${statusColors[getDisplayStatus(c.status)]}`}>
                          {getDisplayStatus(c.status)}
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

                      {/* Total Earnings */}
                      <TableCell className="text-right tabular-nums text-sm font-medium">
                        {c.totalEarnings > 0 ? `$${c.totalEarnings.toLocaleString()}` : <span className="text-muted-foreground/40">—</span>}
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
                  {paginated.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={page <= 1}
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
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
          <span className="ml-2">Click any row to view customer details</span>
        </div>
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
