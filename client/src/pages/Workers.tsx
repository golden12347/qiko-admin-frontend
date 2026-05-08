// ============================================================
// Workers — Platform-wide worker fleet oversight
// API-backed workers table with server-side pagination
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
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
  Bot,
  Zap,
  Globe,
  Phone,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { adminWorkerList, type WorkerListApiResponse } from "@/services/adminWorkersApi";
import { useGlobalDateFilter } from "@/contexts/DateFilterContext";

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
  "financial analyst": "bg-emerald-400/10 text-emerald-400",
  onboarding: "bg-violet-400/10 text-violet-400",
  retention: "bg-rose-400/10 text-rose-400",
};

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
  return typeStyles[type.toLowerCase()] ?? "bg-muted/20 text-muted-foreground";
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

export default function Workers() {
  const { filter } = useGlobalDateFilter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [workersApi, setWorkersApi] = useState<WorkerRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalWorkers, setTotalWorkers] = useState(0);
  const [totalLive, setTotalLive] = useState(0);
  const [totalTraining, setTotalTraining] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchWorkers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminWorkerList(page, filter);
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
    } catch {
      toast.error("Failed to fetch workers list.");
      setWorkersApi([]);
      setTotalWorkers(0);
      setTotalLive(0);
      setTotalTraining(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return workersApi.filter((w) =>
      w.agentName.toLowerCase().includes(q) ||
      w.customerName.toLowerCase().includes(q)
    );
  }, [search, workersApi]);

  const stats = useMemo(() => ({
    total: totalWorkers,
    live: totalLive,
    training: totalTraining,
  }), [totalLive, totalTraining, totalWorkers]);

  useEffect(() => {
    setPage(1);
  }, [search]);

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
      w.type,
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

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search workers or customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50 border-border/50"
          />
        </div>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} on this page · {totalWorkers} total
        </span>
      </div>

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
                      {w.type}
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

              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Loading workers...
                  </TableCell>
                </TableRow>
              )}

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

