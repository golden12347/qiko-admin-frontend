// ============================================================
// Customer Detail — Full account overview for a single customer
// Top summary, KPI cards, workers table, revenue summary,
// activity timeline, and audit history
// Design: Dark Lattice — analytical, Stripe-inspired
// ============================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Mail,
  Bot,
  MessageSquare,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import {
  customers,
  platformWorkers,
  platformConversations,
} from "@/lib/data";
import { adminCustomerDetails, type CustomerDetailsData } from "@/services/adminCustomerDetailsApi";
import { adminCustomerIsStudio } from "@/services/adminCustomerIsStudioApi";
import { useGlobalDateFilter } from "@/contexts/DateFilterContext";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomerDetailPageSkeleton } from "@/components/tabPageSkeletons";

/* ── animation ─────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.05, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

/* ── badge colors ──────────────────────────────────────────── */
const statusColors: Record<string, string> = {
  Active: "bg-qiko-success/15 text-qiko-success border-qiko-success/20",
  "Non-active": "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/20",
};

const planColors: Record<string, string> = {
  Basic: "bg-muted-foreground/10 text-muted-foreground",
  Premium: "bg-qiko-cyan/10 text-qiko-cyan",
  Enterprise: "bg-qiko-warning/10 text-qiko-warning",
  "No plan": "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/20",
};

const workerStatusColors: Record<string, string> = {
  live: "bg-qiko-success/15 text-qiko-success border-qiko-success/20",
  training: "bg-qiko-cyan/15 text-qiko-cyan border-qiko-cyan/20",
};

const normalizeWorkerStatus = (status: string) => (status === "live" ? "live" : "training");

function formatWorkerStatusDisplay(status: string): string {
  const s = normalizeWorkerStatus(status);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const normalizeCustomerStatus = (status: string) => {
  const normalized = status.trim().toLowerCase();
  return normalized === "active" ? "Active" : "Non-active";
};
const normalizeCustomerPlan = (plan: string) => {
  const normalized = plan.trim().toLowerCase();
  if (!normalized || normalized === "null") return "No plan";
  if (normalized === "enterprise") return "Enterprise";
  if (normalized === "business" || normalized === "growth" || normalized === "premium") return "Premium";
  return "Basic";
};

const workerTypeColors: Record<string, string> = {
  Sales: "bg-violet-500/10 text-violet-400",
  Support: "bg-blue-500/10 text-blue-400",
  Research: "bg-emerald-500/10 text-emerald-400",
  "Financial Analyst": "bg-amber-500/10 text-amber-400",
  Onboarding: "bg-cyan-500/10 text-cyan-400",
  Retention: "bg-rose-500/10 text-rose-400",
};

function formatWorkerTypeLabel(value: string): string {
  const s = value.replace(/_/g, " ").trim();
  if (!s) return "—";
  return s
    .split(/\s+/)
    .map((word) => (word.length === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
    .join(" ");
}

function parseIsStudio(value: unknown): boolean {
  if (value === true || value === 1 || value === "1") return true;
  if (value === false || value === 0 || value === "0") return false;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "true" || v === "yes" || v === "on") return true;
    if (v === "false" || v === "no" || v === "off" || v === "") return false;
  }
  return Boolean(value);
}

function mergeUserIsStudio(prev: CustomerDetailsData | null, checked: boolean): CustomerDetailsData | null {
  if (!prev) return prev;
  const u = prev.user;
  if (Array.isArray(u)) {
    if (u.length === 0) return { ...prev, user: [{ is_studio: checked }] };
    const next = u.map((item, i) =>
      i === 0 ? { ...item, is_studio: checked } : item
    );
    return { ...prev, user: next };
  }
  if (u && typeof u === "object") {
    return { ...prev, user: { ...u, is_studio: checked } };
  }
  return { ...prev, user: { is_studio: checked } };
}

/* ── helpers ───────────────────────────────────────────────── */
function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr || "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function normalizeWorkerStatusLabel(status: string): "live" | "training" {
  const normalized = status.trim().toLowerCase();
  if (normalized === "ready" || normalized === "live") return "live";
  return "training";
}

/* ── component ─────────────────────────────────────────────── */
export default function CustomerDetail() {
  const params = useParams<{ slug: string }>();
  const [location, navigate] = useLocation();
  const { filter } = useGlobalDateFilter();

  const customer = useMemo(
    () => customers.find((c) => c.slug === params.slug),
    [params.slug]
  );
  const fallbackCustomerName = useMemo(
    () =>
      params.slug
        .split("-")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
    [params.slug]
  );
  const [customerDetails, setCustomerDetails] = useState<CustomerDetailsData | null>(null);
  const [studioSaving, setStudioSaving] = useState(false);
  const selectedUserId = useMemo(() => {
    const queryString = typeof window !== "undefined" ? window.location.search : "";
    const userId = new URLSearchParams(queryString).get("userId");
    return userId && userId.length > 0 ? userId : null;
  }, [location]);

  const customerIdForApi = useMemo(() => {
    const id = selectedUserId ?? customer?.id;
    return id != null && String(id).length > 0 ? String(id) : null;
  }, [selectedUserId, customer?.id]);

  const [detailLoading, setDetailLoading] = useState(() => customerIdForApi != null);

  const workers = useMemo(
    () => (customer ? platformWorkers.filter((w) => w.customerId === customer.id) : []),
    [customer]
  );

  const conversations = useMemo(
    () => (customer ? platformConversations.filter((c) => c.customerId === customer.id) : []),
    [customer]
  );

  useEffect(() => {
    if (customerIdForApi == null) {
      setDetailLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setDetailLoading(true);
      try {
        const response = await adminCustomerDetails(customerIdForApi, filter);
        if (!cancelled) setCustomerDetails(response?.data ?? null);
      } catch {
        if (!cancelled) {
          setCustomerDetails(null);
          toast.error("Failed to fetch customer details.");
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customerIdForApi, filter]);

  const userDetails = useMemo(() => {
    const userValue = customerDetails?.user as unknown;
    if (Array.isArray(userValue)) {
      return (userValue[0] ?? null) as Record<string, unknown> | null;
    }
    if (userValue && typeof userValue === "object") {
      return userValue as Record<string, unknown>;
    }
    return null;
  }, [customerDetails?.user]);

  const displayCustomerName = String(userDetails?.user_name ?? "—");
  const displayContact = String(userDetails?.email ?? "—");
  const displayJoined = String(userDetails?.created_at ?? "");

  const detailWorkers = useMemo(
    () =>
      Array.isArray(customerDetails?.agents)
        ? customerDetails.agents.map((agent) => ({
            id: String(agent?.id ?? crypto.randomUUID()),
            name: String(agent?.name ?? "—"),
            type: String(agent?.industry ?? "—"),
            status: normalizeWorkerStatusLabel(String(agent?.status ?? "")),
            conversationsTotal: Number(agent?.conversations_count ?? 0),
            lastActive: "—",
          }))
        : [],
    [customerDetails?.agents]
  );

  const detailConversations = useMemo(
    () =>
      Array.isArray(customerDetails?.recent_conversations)
        ? customerDetails.recent_conversations.map((conv) => ({
            id: String(conv?.conversation_id ?? crypto.randomUUID()),
            userName: String(conv?.user_name ?? "—"),
            workerName: String(conv?.agent_name ?? "—"),
            channel: "Web",
            timestamp: String(conv?.conversation_time ?? "—"),
          }))
        : [],
    [customerDetails?.recent_conversations]
  );

  const displayStatus = normalizeCustomerStatus(String(userDetails?.stripe_status ?? ""));
  const displayPlan = normalizeCustomerPlan(String(userDetails?.subscription_plan_name ?? ""));
  const isStudio = parseIsStudio(userDetails?.is_studio);

  const studioUserId = useMemo(() => {
    if (selectedUserId) return selectedUserId;
    if (customer?.id) return String(customer.id);
    const id = userDetails?.id;
    if (id != null && String(id).length > 0) return String(id);
    return null;
  }, [selectedUserId, customer?.id, userDetails?.id]);

  const handleStudioChange = useCallback(
    async (checked: boolean) => {
      if (!studioUserId) {
        toast.error("Customer id missing; cannot update studio.");
        return;
      }
      const previous = parseIsStudio(userDetails?.is_studio);
      setStudioSaving(true);
      setCustomerDetails((prev) => mergeUserIsStudio(prev, checked));
      try {
        await adminCustomerIsStudio(studioUserId, { is_studio: checked });
      } catch (err: unknown) {
        setCustomerDetails((prev) => mergeUserIsStudio(prev, previous));
        const ax = err as { response?: { data?: { message?: string } } };
        const message = ax?.response?.data?.message;
        toast.error(typeof message === "string" ? message : "Failed to update studio.");
      } finally {
        setStudioSaving(false);
      }
    },
    [studioUserId, userDetails?.is_studio]
  );

  if (!customer && !selectedUserId && !customerDetails) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[60vh] gap-4">
        <Building2 className="size-12 text-muted-foreground/30" />
        <p className="text-muted-foreground">Customer not found.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/customers")}>
          <ArrowLeft className="size-4 mr-2" /> Back to Customers
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1240px] mx-auto">
      {/* ── Breadcrumb + Back ───────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/customers" className="hover:text-foreground transition-colors">
            Customers
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">
            {detailLoading ? (
              <Skeleton className="h-4 w-40 inline-block align-middle rounded-md" />
            ) : (
              displayCustomerName
            )}
          </span>
        </div>
        <Link href="/customers">
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <ArrowLeft className="size-3.5 mr-1.5" />
            Back
          </Button>
        </Link>
      </div>

      {detailLoading ? (
        <CustomerDetailPageSkeleton />
      ) : (
        <>
      {/* ── Top Account Header ──────────────────────────────── */}
      <motion.div
        className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        {/* Left: Identity */}
        <motion.div variants={fadeUp} custom={0} className="flex-1">
          <Card className="bg-card border-border/50 h-full shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-qiko-indigo/12 text-qiko-indigo font-bold text-xl ring-1 ring-qiko-indigo/20">
                  {displayCustomerName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                    <div className="flex items-center gap-3 flex-wrap min-w-0">
                      <h1 className="text-2xl font-bold font-heading tracking-tight">{displayCustomerName}</h1>
                      <Badge variant="outline" className={`text-xs ${statusColors[displayStatus]}`}>
                        {displayStatus}
                      </Badge>
                      <Badge
                        variant={displayPlan === "No plan" ? "outline" : "secondary"}
                        className={`text-xs ${displayPlan === "No plan" ? "" : "border-0"} ${planColors[displayPlan]}`}
                      >
                        {displayPlan}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Label
                        htmlFor="customer-studio-toggle"
                        className="text-sm text-muted-foreground cursor-pointer whitespace-nowrap"
                      >
                        Enable Studio
                      </Label>
                      <Switch
                        id="customer-studio-toggle"
                        checked={isStudio}
                        onCheckedChange={handleStudioChange}
                        disabled={studioSaving}
                        aria-label="Enable Studio"
                        className="shrink-0"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-2 [&>*]:min-w-0">
                    <InfoItem icon={<Mail className="size-3.5" />} label="Contact" value={displayContact} fullValue />
                    <InfoItem icon={<Calendar className="size-3.5" />} label="Joined" value={formatDate(displayJoined)} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right: Account Stats */}
        <motion.div variants={fadeUp} custom={1}>
          <Card className="bg-card border-border/50 h-full shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Account Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                <StatBox icon={<Bot className="size-4" />} label="Workers" value={customer?.workersCount ?? detailWorkers.length} color="text-qiko-indigo" />
                <StatBox icon={<MessageSquare className="size-4" />} label="Conversations" value={fmt(customer?.conversationsTotal ?? detailConversations.length)} color="text-qiko-cyan" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* ── Workers Table ───────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }}>
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="py-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bot className="size-4 text-qiko-indigo" />
                Workers ({detailWorkers.length})
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] border-0 bg-qiko-success/10 text-qiko-success">
                {detailWorkers.filter((w) => w.status === "live").length} Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {detailWorkers.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent bg-secondary/10">
                    <TableHead className="text-xs font-medium text-muted-foreground">Worker Name</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Type</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground text-right">Conversations</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailWorkers.map((w) => (
                    <TableRow
                      key={w.id}
                      className="border-border/30"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-qiko-indigo/10 text-qiko-indigo text-[10px] font-bold">
                            {w.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium">{w.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-[10px] border-0 ${workerTypeColors[w.type] || ""}`}>
                          {formatWorkerTypeLabel(w.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${workerStatusColors[normalizeWorkerStatus(w.status)]}`}
                        >
                          {formatWorkerStatusDisplay(w.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{fmt(w.conversationsTotal)}</TableCell>
                      <TableCell className="w-8">
                        <ChevronRight className="size-4 text-muted-foreground/30" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No workers found for this customer.
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Recent Conversations ─────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.35 }}>
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="py-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="size-4 text-muted-foreground" />
                Recent Conversations
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate("/conversations")}>
                View All <ExternalLink className="size-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {detailConversations.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow className="border-border/40 hover:bg-transparent bg-secondary/10">
                    <TableHead className="text-xs font-medium text-muted-foreground">User</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Worker</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Channel</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailConversations.slice(0, 5).map((conv) => (
                    <TableRow key={conv.id} className="border-border/30 hover:bg-secondary/20 transition-colors">
                      <TableCell className="text-sm">{conv.userName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{conv.workerName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] border-0">{conv.channel}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(conv.timestamp)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No recent conversations found.
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
        </>
      )}
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────── */

function InfoItem({
  icon,
  label,
  value,
  fullValue = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  fullValue?: boolean;
}) {
  if (fullValue) {
    return (
      <div className="flex max-w-full min-w-0 items-center gap-1.5 overflow-x-auto text-sm [scrollbar-width:thin]">
        <span className="text-muted-foreground/60 shrink-0">{icon}</span>
        <span className="text-muted-foreground text-xs shrink-0 whitespace-nowrap">{label}:</span>
        <span className="font-medium text-xs whitespace-nowrap shrink-0">{value}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-sm min-w-0">
      <span className="text-muted-foreground/60">{icon}</span>
      <span className="text-muted-foreground text-xs">{label}:</span>
      <span className="font-medium text-xs truncate min-w-0">{value}</span>
    </div>
  );
}

function StatBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-lg bg-secondary/30 p-3 text-center">
      <div className={`flex items-center justify-center gap-1.5 mb-1 ${color} opacity-60`}>
        {icon}
      </div>
      <p className={`text-base font-bold font-heading tabular-nums ${color}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
