// ============================================================
// Workers — Platform-wide worker fleet oversight
// API-backed workers table with server-side pagination
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Bot,
  Zap,
  Globe,
  Phone,
  Download,
  PieChart as PieChartIcon,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import {
  adminWorkerList,
  type WorkerIndustryStat,
  type WorkerListApiResponse,
} from "@/services/adminWorkersApi";
import { useGlobalDateFilter } from "@/contexts/DateFilterContext";
import {
  WorkersSearchRowSkeleton,
  WorkersStatsSkeleton,
  WorkersTableSkeletonBody,
  WorkersTypeChartSkeleton,
} from "@/components/tabPageSkeletons";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const statusStyles: Record<string, string> = {
  live: "bg-qiko-success/15 text-qiko-success border-qiko-success/20",
  training: "bg-qiko-cyan/15 text-qiko-cyan border-qiko-cyan/20",
  paused: "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/20",
  error: "bg-qiko-error/15 text-qiko-error border-qiko-error/20",
};

const typeStyles: Record<string, string> = {
  sales: "bg-qiko-indigo/10 text-qiko-indigo",
  support: "bg-qiko-cyan/10 text-qiko-cyan",
  research: "bg-qiko-warning/10 text-qiko-warning",
  onboarding: "bg-violet-400/10 text-violet-400",
  retention: "bg-rose-400/10 text-rose-400",
};

/** Donut segment colors (blue → purple → pink → orange, like reference chart). */
const WORKER_TYPE_CHART_COLORS = [
  "#312e81",
  "#4338ca",
  "#6366f1",
  "#818cf8",
  "#a78bfa",
  "#c084fc",
  "#e879f9",
  "#f472b6",
  "#fb7185",
  "#fb923c",
  "#f97316",
];

function WorkerTypeChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; payload?: WorkerTypeChartSlice }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const name = String(item.payload?.name ?? item.name ?? "");
  const value = Number(item.value ?? 0);
  return (
    <div
      className="rounded-lg border border-qiko-indigo/20 px-3 py-2 text-xs shadow-lg"
      style={{ background: "rgba(15,20,35,0.96)", color: "#e2e8f0" }}
    >
      <span className="text-foreground/90">
        {name}: <span className="font-medium text-foreground">{value}</span>
        {value === 1 ? " worker" : " workers"}
        {item.payload?.percent ? (
          <span className="block mt-1 text-muted-foreground tabular-nums">{item.payload.percent} of chart</span>
        ) : null}
      </span>
    </div>
  );
}

interface WorkerTypeChartSlice {
  name: string;
  value: number;
  percent: string;
  fill: string;
}

type WorkerChannel = "web" | "voice";

interface WorkerRow {
  id: string;
  agentName: string;
  customerName: string;
  type: string;
  status: string;
  channels: WorkerChannel[];
  conversationsTotal: number;
  createdAt: string;
  lastActive: string;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractWorkerArray(payload: WorkerListApiResponse): unknown[] {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.workers)) return payload.workers;

  const nested = payload?.data as Record<string, unknown> | undefined;
  if (nested) {
    if (Array.isArray(nested.data)) return nested.data;
    if (Array.isArray(nested.items)) return nested.items;
    if (Array.isArray(nested.workers)) return nested.workers;
  }
  return [];
}

function normalizeStatus(status: unknown): string {
  if (typeof status !== "string" || status.trim().length === 0) return "null";
  return status.toLowerCase() === "ready" ? "live" : status.toLowerCase();
}

function normalizeChannels(vapiCredsAdded: unknown): WorkerChannel[] {
  const hasVoice = toNumber(vapiCredsAdded, 0) !== 0;
  return hasVoice ? ["web", "voice"] : ["web"];
}

function normalizeWorker(item: unknown): WorkerRow {
  const row = (item ?? {}) as Record<string, unknown>;
  const agentName = typeof row.agent_name === "string"
    ? row.agent_name
    : typeof row.name === "string"
      ? row.name
      : "Unknown";

  const totalConversationsFromApi = row.total_conversations;
  const createdAtFromApi = row.created_at;

  return {
    id: String(row.id ?? toSlug(agentName)),
    agentName,
    customerName: String(row.user_name ?? row.customer_name ?? row.customerName ?? "—"),
    type: String(row.industry ?? row.type ?? "—"),
    status: normalizeStatus(row.status),
    channels: normalizeChannels(row.vapi_credentials_added),
    conversationsTotal: toNumber(totalConversationsFromApi ?? row.conversations_total ?? row.conversationsTotal),
    createdAt: String(createdAtFromApi ?? row.createdAt ?? "—"),
    lastActive: String(row.last_active ?? row.lastActive ?? "—"),
  };
}

function statusBadgeClass(status: string): string {
  return statusStyles[status] ?? "bg-muted/20 text-muted-foreground border-border/40";
}

function typeBadgeClass(type: string): string {
  const normalized = type.toLowerCase().replace(/_/g, " ").trim();
  return typeStyles[normalized] ?? "bg-muted/20 text-muted-foreground";
}

function formatTypeLabel(type: string): string {
  const s = type.replace(/_/g, " ").trim();
  if (!s) return "—";
  return s
    .split(/\s+/)
    .map((word) => (word.length === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
    .join(" ");
}

function formatStatusLabel(status: string): string {
  if (!status || status === "null") return "null";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function escapeCsv(value: string | number): string {
  const stringValue = String(value ?? "");
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function extractIndustries(payload: WorkerListApiResponse): WorkerIndustryStat[] {
  if (Array.isArray(payload?.industries)) return payload.industries;
  const nested = payload?.data as Record<string, unknown> | undefined;
  if (nested && Array.isArray(nested.industries)) {
    return nested.industries as WorkerIndustryStat[];
  }
  return [];
}

function formatIndustryPercent(value: number, total: number): string {
  if (total <= 0) return "0%";
  const pct = (value / total) * 100;
  if (pct > 0 && pct < 1) return "<1%";
  if (Math.abs(pct - Math.round(pct)) < 0.05) return `${Math.round(pct)}%`;
  return `${pct.toFixed(1)}%`;
}

function buildIndustriesChart(items: WorkerIndustryStat[]): WorkerTypeChartSlice[] {
  const slices = items
    .map((row) => {
      const industry = String(row.industry ?? "").trim();
      const name = industry ? formatTypeLabel(industry) : "Unspecified";
      const value = toNumber(row.workers_count);
      return { name, value };
    })
    .filter((slice) => slice.value > 0 || slice.name !== "Unspecified")
    .sort((a, b) => b.value - a.value);

  const totalWorkers = slices.reduce((sum, slice) => sum + slice.value, 0);

  return slices.map((slice, index) => ({
    ...slice,
    percent: formatIndustryPercent(slice.value, totalWorkers),
    fill: WORKER_TYPE_CHART_COLORS[index % WORKER_TYPE_CHART_COLORS.length],
  }));
}

function readSearchQueryParam(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("search") ?? "";
}

export default function Workers() {
  const [, navigate] = useLocation();
  const rawSearch = useSearch();
  const searchFromUrl = useMemo(() => new URLSearchParams(rawSearch || "").get("search") ?? "", [rawSearch]);

  const initialSearch = readSearchQueryParam();
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [committedSearch, setCommittedSearch] = useState(initialSearch);
  const skipPageResetOnMount = useRef(true);

  const { filter } = useGlobalDateFilter();
  const [page, setPage] = useState(1);
  const [workersApi, setWorkersApi] = useState<WorkerRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalWorkers, setTotalWorkers] = useState(0);
  const [totalLive, setTotalLive] = useState(0);
  const [totalTraining, setTotalTraining] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [industriesChart, setIndustriesChart] = useState<WorkerTypeChartSlice[]>([]);

  const fetchWorkers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminWorkerList(page, filter, committedSearch);
      const rows = extractWorkerArray(data).map((item) => normalizeWorker(item));
      setWorkersApi(rows);

      const nested = data?.data as Record<string, unknown> | undefined;
      const total = toNumber(
        data?.meta?.total ??
        data?.total ??
        (nested?.total as unknown) ??
        rows.length,
        rows.length
      );
      const pages = toNumber(
        data?.meta?.last_page ??
        data?.last_page ??
        (nested?.last_page as unknown),
        1
      );
      const live = toNumber(
        data?.total_live ??
        data?.meta?.total_live ??
        (nested?.total_live as unknown),
        rows.filter((w) => w.status === "live").length
      );
      const training = toNumber(
        data?.total_training ??
        data?.meta?.total_training ??
        (nested?.total_training as unknown),
        rows.filter((w) => w.status === "training").length
      );
      setTotalWorkers(total);
      setTotalLive(live);
      setTotalTraining(training);
      setTotalPages(Math.max(1, pages));
      setIndustriesChart(buildIndustriesChart(extractIndustries(data)));
    } catch {
      toast.error("Failed to fetch workers list.");
      setWorkersApi([]);
      setIndustriesChart([]);
      setTotalWorkers(0);
      setTotalLive(0);
      setTotalTraining(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [filter, page, committedSearch]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const prevUrlSearchRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevUrlSearchRef.current === null) {
      prevUrlSearchRef.current = searchFromUrl;
      return;
    }
    if (prevUrlSearchRef.current === searchFromUrl) return;
    prevUrlSearchRef.current = searchFromUrl;
    setSearchInput(searchFromUrl);
    setCommittedSearch(searchFromUrl);
  }, [searchFromUrl]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const next = searchInput.trim();
      setCommittedSearch((prev) => (prev === next ? prev : next));
    }, 400);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.delete("search");
    if (committedSearch) params.set("search", committedSearch);
    const qs = params.toString();
    const next = qs ? `/workers?${qs}` : "/workers";
    const cur = `${window.location.pathname}${window.location.search}`;
    if (cur !== next) {
      navigate(next, { replace: true });
    }
  }, [committedSearch, navigate]);

  useEffect(() => {
    if (skipPageResetOnMount.current) {
      skipPageResetOnMount.current = false;
      return;
    }
    setPage(1);
  }, [committedSearch]);

  const filtered = workersApi;

  const stats = useMemo(() => ({
    total: totalWorkers,
    live: totalLive,
    training: totalTraining,
  }), [totalLive, totalTraining, totalWorkers]);

  const industriesChartTotal = useMemo(
    () => industriesChart.reduce((sum, slice) => sum + slice.value, 0),
    [industriesChart]
  );

  function handleExportCsv() {
    if (filtered.length === 0) {
      toast.error("No data to export.");
      return;
    }

    const headers = [
      "Worker",
      "Customer",
      "Type",
      "Status",
      "Channels",
      "Created At",
      "Total Conversations",
      "Last Active",
    ];

    const rows = filtered.map((w) => [
      w.agentName,
      w.customerName,
      formatTypeLabel(w.type),
      formatStatusLabel(w.status),
      w.channels.join(" | "),
      w.createdAt,
      w.conversationsTotal,
      w.lastActive,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCsv(cell)).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const datePart = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `workers-${datePart}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filtered.length} workers.`);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight">Workers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All AI workers deployed across the platform
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

      {isLoading ? (
        <WorkersStatsSkeleton />
      ) : (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <StatCard icon={<Bot className="size-4" />} label="Total Workers" value={stats.total} color="text-foreground" />
          <StatCard icon={<Zap className="size-4" />} label="Live" value={stats.live} color="text-qiko-success" />
          <StatCard icon={<Bot className="size-4" />} label="Training" value={stats.training} color="text-qiko-cyan" />
        </motion.div>
      )}

      {isLoading ? (
        <WorkersTypeChartSkeleton />
      ) : (
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <Card className="bg-card/80 border-border/40 overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/20">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-qiko-indigo/10">
                    <PieChartIcon className="size-3.5 text-qiko-indigo" />
                  </span>
                  Worker Industries
                </CardTitle>
                {industriesChart.length > 0 && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {industriesChartTotal.toLocaleString()} workers · 100%
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {industriesChart.length > 0 ? (
                <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-10 max-w-3xl mx-auto w-full">
                  <div className="relative h-[min(280px,70vw)] w-[min(280px,70vw)] max-h-[280px] max-w-[280px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={industriesChart}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius="52%"
                          outerRadius="88%"
                          paddingAngle={2}
                          strokeWidth={2}
                          stroke="hsl(var(--background))"
                        >
                          {industriesChart.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<WorkerTypeChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center"
                      aria-hidden
                    >
                      <span className="text-2xl font-bold font-heading tabular-nums text-foreground">
                        {industriesChartTotal.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mt-0.5">
                        Workers
                      </span>
                    </div>
                  </div>

                  <ul className="w-full lg:flex-1 lg:max-w-[300px] flex flex-col gap-0.5 rounded-xl border border-border/30 bg-secondary/15 p-3">
                    {industriesChart.map((item) => (
                      <li
                        key={item.name}
                        className="flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-secondary/40 transition-colors"
                        title={`${item.name}: ${item.value} workers · ${item.percent}`}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-background/80"
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className="flex-1 min-w-0 text-sm text-foreground/90 truncate">
                          {item.name}
                        </span>
                        <span className="text-sm font-semibold tabular-nums text-foreground shrink-0">
                          {item.percent}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
                  No industry data available.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {isLoading ? (
        <WorkersSearchRowSkeleton />
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search workers or customers..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 bg-secondary/50 border-border/50"
            />
          </div>
          {searchInput.trim() && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setSearchInput("");
                setCommittedSearch("");
              }}
            >
              Clear search
            </Button>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {filtered.length} on this page · {totalWorkers} total
          </span>
        </div>
      )}

      <Card className="bg-card/80 border-border/40">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="text-xs font-medium text-muted-foreground">Worker</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Customer</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Type</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Channels</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground text-right">Total Convs</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Created At</TableHead>
                {/* <TableHead className="text-xs font-medium text-muted-foreground">Last Active</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <WorkersTableSkeletonBody />}
              {!isLoading && filtered.map((w) => (
                <TableRow
                  key={w.id}
                  className="border-border/30 hover:bg-secondary/20 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-qiko-indigo/10">
                        <Bot className="size-3.5 text-qiko-indigo" />
                      </div>
                      <span className="text-sm font-medium">{w.agentName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{w.customerName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-[10px] border-0 ${typeBadgeClass(w.type)}`}>
                      {formatTypeLabel(w.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${statusBadgeClass(w.status)}`}>
                      {formatStatusLabel(w.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {w.channels.map((ch) => (
                        <span key={ch} className="flex items-center gap-0.5 text-xs text-muted-foreground">
                          {ch === "web" ? <Globe className="size-3" /> : <Phone className="size-3" />}
                          {ch}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">{w.conversationsTotal.toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatCreatedAt(w.createdAt)}</TableCell>
                  {/* <TableCell className="text-xs text-muted-foreground">{w.lastActive}</TableCell> */}
                </TableRow>
              ))}

              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No workers found for this page.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          disabled={page <= 1 || isLoading}
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
          disabled={page >= totalPages || isLoading}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card className="bg-card/80 border-border/40">
      <CardContent className="p-4 flex items-center gap-3">
        <span className={`${color} opacity-60`}>{icon}</span>
        <div>
          <p className={`text-lg font-bold font-heading tabular-nums ${color}`}>{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

