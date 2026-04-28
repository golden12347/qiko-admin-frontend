// ============================================================
// Activity Logs — Platform-wide operational audit trail
// Design: Dark Lattice — comprehensive historical record
// Event types: Customer, Worker, Conversation, Revenue, System
// ============================================================

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  ScrollText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Users,
  Bot,
  MessageSquare,
  DollarSign,
  Shield,
  ArrowUpDown,
  X,
  ExternalLink,
} from "lucide-react";
import { activityLogs, type ActivityLog } from "@/lib/data";
import { Link } from "wouter";
import { toast } from "sonner";
import { isDateInGlobalRange, useGlobalDateFilter } from "@/contexts/DateFilterContext";

// ── Config ──────────────────────────────────────────────────

const ROWS_PER_PAGE = 15;

const severityConfig: Record<string, { icon: React.ReactNode; badge: string; dotColor: string }> = {
  success: {
    icon: <CheckCircle2 className="size-3.5 text-qiko-success" />,
    badge: "bg-qiko-success/15 text-qiko-success border-qiko-success/20",
    dotColor: "bg-qiko-success",
  },
  info: {
    icon: <Info className="size-3.5 text-qiko-cyan" />,
    badge: "bg-qiko-cyan/15 text-qiko-cyan border-qiko-cyan/20",
    dotColor: "bg-qiko-cyan",
  },
  warning: {
    icon: <AlertTriangle className="size-3.5 text-qiko-warning" />,
    badge: "bg-qiko-warning/15 text-qiko-warning border-qiko-warning/20",
    dotColor: "bg-qiko-warning",
  },
  error: {
    icon: <XCircle className="size-3.5 text-qiko-error" />,
    badge: "bg-qiko-error/15 text-qiko-error border-qiko-error/20",
    dotColor: "bg-qiko-error",
  },
};

const eventTypeIcons: Record<string, React.ReactNode> = {
  "Customer Created": <Users className="size-3.5 text-qiko-cyan" />,
  "Subscription Changed": <DollarSign className="size-3.5 text-qiko-success" />,
  "Worker Created": <Bot className="size-3.5 text-qiko-indigo" />,
  "Worker Activated": <Bot className="size-3.5 text-qiko-success" />,
  "Worker Paused": <Bot className="size-3.5 text-qiko-warning" />,
  "Worker Error": <Bot className="size-3.5 text-qiko-error" />,
  "Conversation Spike": <MessageSquare className="size-3.5 text-qiko-warning" />,
  "Conversion Recorded": <CheckCircle2 className="size-3.5 text-qiko-success" />,
  "Revenue Event": <DollarSign className="size-3.5 text-qiko-cyan" />,
  "Account Status Changed": <Shield className="size-3.5 text-qiko-warning" />,
  "System Alert": <AlertTriangle className="size-3.5 text-qiko-warning" />,
  "Integration Error": <XCircle className="size-3.5 text-qiko-error" />,
};

const actorTypeColors: Record<string, string> = {
  Customer: "bg-qiko-cyan/15 text-qiko-cyan border-qiko-cyan/20",
  Worker: "bg-qiko-indigo/15 text-qiko-indigo border-qiko-indigo/20",
  System: "bg-secondary/80 text-muted-foreground border-border/40",
  Admin: "bg-qiko-warning/15 text-qiko-warning border-qiko-warning/20",
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: i * 0.05, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

// ── Main Component ──────────────────────────────────────────

export default function ActivityLogs() {
  const { filter } = useGlobalDateFilter();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [workerFilter, setWorkerFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<"timestamp" | "eventType" | "severity">("timestamp");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Derived filter options
  const eventTypes = useMemo(() => {
    const types = new Set(activityLogs.map((l) => l.eventType));
    return Array.from(types).sort();
  }, []);

  const customers = useMemo(() => {
    const custs = new Set(activityLogs.filter((l) => l.customerName).map((l) => l.customerName!));
    return Array.from(custs).sort();
  }, []);

  const workers = useMemo(() => {
    const wkrs = new Set(activityLogs.filter((l) => l.workerName).map((l) => l.workerName!));
    return Array.from(wkrs).sort();
  }, []);

  // Filter logic
  const filtered = useMemo(() => {
    return activityLogs.filter((log) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        (log.customerName || "").toLowerCase().includes(q) ||
        (log.workerName || "").toLowerCase().includes(q) ||
        (log.actor || "").toLowerCase().includes(q) ||
        log.eventType.toLowerCase().includes(q) ||
        log.resource.toLowerCase().includes(q);
      const matchSeverity = severityFilter === "all" || log.severity === severityFilter;
      const matchEventType = eventTypeFilter === "all" || log.eventType === eventTypeFilter;
      const matchCustomer = customerFilter === "all" || log.customerName === customerFilter;
      const matchWorker = workerFilter === "all" || log.workerName === workerFilter;
      const matchDate = isDateInGlobalRange(log.timestamp, filter);

      return matchSearch && matchSeverity && matchEventType && matchCustomer && matchWorker && matchDate;
    });
  }, [search, severityFilter, eventTypeFilter, customerFilter, workerFilter, filter]);

  // Sort
  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortField === "timestamp") cmp = a.timestamp.localeCompare(b.timestamp);
      else if (sortField === "eventType") cmp = a.eventType.localeCompare(b.eventType);
      else if (sortField === "severity") {
        const order = { error: 0, warning: 1, info: 2, success: 3 };
        cmp = (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return copy;
  }, [filtered, sortField, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return sorted.slice(start, start + ROWS_PER_PAGE);
  }, [sorted, page]);

  // Stats
  const stats = useMemo(() => ({
    total: activityLogs.length,
    filtered: filtered.length,
    errors: activityLogs.filter((l) => l.severity === "error").length,
    warnings: activityLogs.filter((l) => l.severity === "warning").length,
    success: activityLogs.filter((l) => l.severity === "success").length,
    info: activityLogs.filter((l) => l.severity === "info").length,
    byCategory: (() => {
      const map: Record<string, number> = {};
      activityLogs.forEach((l) => { map[l.category] = (map[l.category] || 0) + 1; });
      return map;
    })(),
    byEventType: (() => {
      const map: Record<string, number> = {};
      activityLogs.forEach((l) => { map[l.eventType] = (map[l.eventType] || 0) + 1; });
      return map;
    })(),
  }), [filtered.length]);

  const toggleSort = useCallback((field: "timestamp" | "eventType" | "severity") => {
    if (sortField === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(1);
  }, [sortField]);

  const activeFilterCount = [severityFilter, eventTypeFilter, customerFilter, workerFilter]
    .filter((f) => f !== "all").length;

  const clearFilters = () => {
    setSeverityFilter("all");
    setEventTypeFilter("all");
    setCustomerFilter("all");
    setWorkerFilter("all");
    setSearch("");
    setPage(1);
  };

  const handleExport = () => {
    toast.success("Export started", { description: `Exporting ${filtered.length} log entries to CSV...` });
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight">Activity Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Platform-wide operational audit trail — {activityLogs.length} total events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 bg-transparent border-border/50 text-muted-foreground hover:text-foreground"
            onClick={handleExport}
          >
            <Download className="size-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <SummaryCard label="Total Events" value={stats.total} icon={<ScrollText className="size-4" />} color="text-foreground" />
        <SummaryCard label="Success" value={stats.success} icon={<CheckCircle2 className="size-4" />} color="text-qiko-success" />
        <SummaryCard label="Info" value={stats.info} icon={<Info className="size-4" />} color="text-qiko-cyan" />
        <SummaryCard label="Warnings" value={stats.warnings} icon={<AlertTriangle className="size-4" />} color="text-qiko-warning" />
        <SummaryCard label="Errors" value={stats.errors} icon={<XCircle className="size-4" />} color="text-qiko-error" />
        <SummaryCard label="Filtered" value={stats.filtered} icon={<Filter className="size-4" />} color="text-qiko-indigo" />
      </div>

      {/* Event Type Breakdown */}
      <Card className="bg-card/60 border-border/30">
        <CardContent className="p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">Event Distribution</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.byEventType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <button
                  key={type}
                  onClick={() => { setEventTypeFilter(eventTypeFilter === type ? "all" : type); setPage(1); }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all border ${
                    eventTypeFilter === type
                      ? "bg-qiko-indigo/20 border-qiko-indigo/40 text-qiko-indigo"
                      : "bg-secondary/40 border-border/30 text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                  }`}
                >
                  {eventTypeIcons[type] || <Info className="size-3" />}
                  <span>{type}</span>
                  <span className="font-heading font-bold tabular-nums">{count}</span>
                </button>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Search & Filters Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search events, customers, workers, resources..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 bg-secondary/50 border-border/50"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            className={`gap-1.5 bg-transparent border-border/50 ${showFilters ? "text-qiko-indigo border-qiko-indigo/40" : "text-muted-foreground"}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="size-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="size-4 rounded-full bg-qiko-indigo text-[10px] font-bold text-white flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground hover:text-foreground"
              onClick={clearFilters}
            >
              <X className="size-3" />
              Clear all
            </Button>
          )}

          <span className="text-xs text-muted-foreground ml-auto tabular-nums">
            Showing {paginated.length} of {filtered.length} events
          </span>
        </div>

        {/* Expandable Filter Row */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
                <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-[130px] bg-card/60 border-border/40 text-sm">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={eventTypeFilter} onValueChange={(v) => { setEventTypeFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-[180px] bg-card/60 border-border/40 text-sm">
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Event Types</SelectItem>
                    {eventTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={customerFilter} onValueChange={(v) => { setCustomerFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-[160px] bg-card/60 border-border/40 text-sm">
                    <SelectValue placeholder="Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={workerFilter} onValueChange={(v) => { setWorkerFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-[160px] bg-card/60 border-border/40 text-sm">
                    <SelectValue placeholder="Worker" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Workers</SelectItem>
                    {workers.map((w) => (
                      <SelectItem key={w} value={w}>{w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Logs Table */}
      <Card className="bg-card/80 border-border/40 overflow-hidden">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="text-xs font-medium text-muted-foreground w-[36px] pl-4"></TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground w-[160px]">
                  <button
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => toggleSort("timestamp")}
                  >
                    Timestamp
                    <ArrowUpDown className={`size-3 ${sortField === "timestamp" ? "text-qiko-indigo" : ""}`} />
                  </button>
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground w-[160px]">
                  <button
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => toggleSort("eventType")}
                  >
                    Event Type
                    <ArrowUpDown className={`size-3 ${sortField === "eventType" ? "text-qiko-indigo" : ""}`} />
                  </button>
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Customer</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Worker</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Actor</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground max-w-[280px]">Description</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground w-[90px]">
                  <button
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => toggleSort("severity")}
                  >
                    Severity
                    <ArrowUpDown className={`size-3 ${sortField === "severity" ? "text-qiko-indigo" : ""}`} />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                    <ScrollText className="size-8 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No events match your filters</p>
                    <Button variant="ghost" size="sm" className="mt-2 text-qiko-indigo" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((log, i) => {
                  const config = severityConfig[log.severity];
                  const isExpanded = expandedRow === log.id;
                  return (
                    <motion.tr
                      key={log.id}
                      custom={i}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      className={`border-border/30 cursor-pointer transition-colors ${
                        isExpanded ? "bg-secondary/30" : "hover:bg-secondary/15"
                      }`}
                      onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                    >
                      {/* Severity dot */}
                      <td className="pl-4 py-3">
                        <span className={`size-2 rounded-full inline-block ${config.dotColor}`} />
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 pr-3">
                        <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap font-mono">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </td>

                      {/* Event Type */}
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-1.5">
                          {eventTypeIcons[log.eventType] || <Info className="size-3.5 text-muted-foreground" />}
                          <span className="text-xs font-medium whitespace-nowrap">{log.eventType}</span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3 pr-3">
                        {log.customerName ? (
                          <Link
                            href={`/customers/${log.customerId}`}
                            className="text-xs text-qiko-cyan hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {log.customerName}
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </td>

                      {/* Worker */}
                      <td className="py-3 pr-3">
                        {log.workerName ? (
                          <Link
                            href={`/workers/${log.workerId}`}
                            className="text-xs text-qiko-indigo hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {log.workerName}
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </td>

                      {/* Actor */}
                      <td className="py-3 pr-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-normal ${actorTypeColors[log.actorType] || ""}`}
                        >
                          {log.actor}
                        </Badge>
                      </td>

                      {/* Description */}
                      <td className="py-3 pr-3 max-w-[280px]">
                        <p className="text-xs text-muted-foreground truncate">{log.details}</p>
                      </td>

                      {/* Severity */}
                      <td className="py-3 pr-4">
                        <Badge variant="outline" className={`text-[10px] capitalize ${config.badge}`}>
                          {log.severity}
                        </Badge>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Expanded Row Detail */}
        <AnimatePresence>
          {expandedRow && (
            <ExpandedDetail
              log={paginated.find((l) => l.id === expandedRow) || activityLogs.find((l) => l.id === expandedRow)!}
              onClose={() => setExpandedRow(null)}
            />
          )}
        </AnimatePresence>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground tabular-nums">
            Page {page} of {totalPages} — {filtered.length} total events
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="size-8 p-0 bg-transparent border-border/40"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            {generatePageNumbers(page, totalPages).map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} className="text-xs text-muted-foreground px-1">...</span>
              ) : (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  className={`size-8 p-0 text-xs ${
                    p === page
                      ? "bg-qiko-indigo text-white border-qiko-indigo"
                      : "bg-transparent border-border/40"
                  }`}
                  onClick={() => setPage(p as number)}
                >
                  {p}
                </Button>
              )
            )}
            <Button
              variant="outline"
              size="sm"
              className="size-8 p-0 bg-transparent border-border/40"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      <Card className="bg-card/60 border-border/30">
        <CardContent className="p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">Category Breakdown</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(stats.byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, count]) => {
                const pct = Math.round((count / stats.total) * 100);
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{cat}</span>
                      <span className="text-xs font-heading font-bold tabular-nums">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-qiko-indigo/70 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 tabular-nums">{pct}%</p>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Expanded Detail Panel ───────────────────────────────────

function ExpandedDetail({ log, onClose }: { log: ActivityLog; onClose: () => void }) {
  if (!log) return null;
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="border-t border-border/30 bg-secondary/20 overflow-hidden"
    >
      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Event Details */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Event Details</p>
          <div className="space-y-2">
            <DetailRow label="Event ID" value={log.id} />
            <DetailRow label="Event Type" value={log.eventType} />
            <DetailRow label="Action" value={log.action} />
            <DetailRow label="Resource" value={log.resource} />
            <DetailRow label="Timestamp" value={log.timestamp} />
          </div>
        </div>

        {/* Context */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Context</p>
          <div className="space-y-2">
            <DetailRow label="Actor" value={log.actor} />
            <DetailRow label="Actor Type" value={log.actorType} />
            <DetailRow label="Category" value={log.category} />
            <DetailRow label="Severity" value={log.severity} />
            {log.customerName && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Customer</span>
                <Link href={`/customers/${log.customerId}`} className="text-xs text-qiko-cyan hover:underline flex items-center gap-1">
                  {log.customerName}
                  <ExternalLink className="size-2.5" />
                </Link>
              </div>
            )}
            {log.workerName && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Worker</span>
                <Link href={`/workers/${log.workerId}`} className="text-xs text-qiko-indigo hover:underline flex items-center gap-1">
                  {log.workerName}
                  <ExternalLink className="size-2.5" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Full Description */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Description</p>
          <p className="text-sm text-foreground/80 leading-relaxed">{log.details}</p>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={onClose}>
            Collapse
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Helper Components ───────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className="bg-card/60 border-border/30">
      <CardContent className="p-3.5 flex items-center gap-3">
        <span className={`${color} opacity-50`}>{icon}</span>
        <div>
          <p className={`text-lg font-bold font-heading tabular-nums ${color}`}>{value.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground/80 text-right">{value}</span>
    </div>
  );
}

// ── Utilities ───────────────────────────────────────────────

function formatTimestamp(ts: string): string {
  const parts = ts.split(" ");
  if (parts.length === 2) {
    return `${parts[0]}  ${parts[1]}`;
  }
  return ts;
}

function generatePageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | string)[] = [1];
  if (current > 3) pages.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
