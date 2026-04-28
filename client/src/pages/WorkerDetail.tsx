// ============================================================
// Worker Detail — Performance dashboard + drilldown layer
// Accessible from Workers fleet page and Customer Detail page
// Design: Dark Lattice / Qiko Navy + Indigo + Cyan palette
// ============================================================

import { useState, useMemo } from "react";
import { useParams, Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Bot, MessageSquare, Target, DollarSign, Clock,
  Users, TrendingUp, Search, Globe, Phone,
  ChevronRight, AlertTriangle, CheckCircle2, Info,
  XCircle, Activity, BarChart3,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  platformWorkers, platformConversations, activityLogs, customers,
  type PlatformWorker, type PlatformConversation, type ActivityLog,
} from "@/lib/data";

// ── Animations ──────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

// ── Style Maps ──────────────────────────────────────────────

const statusStyles: Record<string, string> = {
  Live: "bg-qiko-success/15 text-qiko-success border-qiko-success/20",
  Training: "bg-qiko-cyan/15 text-qiko-cyan border-qiko-cyan/20",
  Paused: "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/20",
  Error: "bg-qiko-error/15 text-qiko-error border-qiko-error/20",
};

const typeStyles: Record<string, string> = {
  Sales: "bg-qiko-indigo/10 text-qiko-indigo",
  Support: "bg-qiko-cyan/10 text-qiko-cyan",
  Research: "bg-qiko-warning/10 text-qiko-warning",
  "Financial Analyst": "bg-emerald-400/10 text-emerald-400",
  Onboarding: "bg-violet-400/10 text-violet-400",
  Retention: "bg-rose-400/10 text-rose-400",
};

const convStatusStyles: Record<string, string> = {
  Active: "bg-qiko-cyan/15 text-qiko-cyan border-qiko-cyan/20",
  Completed: "bg-qiko-success/15 text-qiko-success border-qiko-success/20",
  Escalated: "bg-qiko-warning/15 text-qiko-warning border-qiko-warning/20",
  Dropped: "bg-qiko-error/15 text-qiko-error border-qiko-error/20",
};

const severityIcons: Record<string, React.ReactNode> = {
  success: <CheckCircle2 className="size-3.5 text-qiko-success" />,
  info: <Info className="size-3.5 text-qiko-cyan" />,
  warning: <AlertTriangle className="size-3.5 text-qiko-warning" />,
  error: <XCircle className="size-3.5 text-qiko-error" />,
};

const severityBadge: Record<string, string> = {
  success: "bg-qiko-success/15 text-qiko-success border-qiko-success/20",
  info: "bg-qiko-cyan/15 text-qiko-cyan border-qiko-cyan/20",
  warning: "bg-qiko-warning/15 text-qiko-warning border-qiko-warning/20",
  error: "bg-qiko-error/15 text-qiko-error border-qiko-error/20",
};

// ── Helper: Generate worker-specific trend data ─────────────

function generateWorkerTrend(worker: PlatformWorker) {
  const base = Math.max(Math.round(worker.conversationsTotal / 365), 1);
  const convRate = worker.conversionRate / 100;
  const seed = worker.id.charCodeAt(0) + worker.id.charCodeAt(worker.id.length - 1);
  return Array.from({ length: 30 }, (_, i) => {
    const day = new Date(2026, 1, 24 + i);
    const label = day.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const pseudoRandom = Math.abs(Math.sin(seed * (i + 1) * 9301 + 49297) % 1);
    const jitter = 0.7 + pseudoRandom * 0.6;
    const convs = Math.round(base * jitter);
    const leads = Math.round(convs * convRate * (0.8 + pseudoRandom * 0.4));
    return { date: label, conversations: convs, leads };
  });
}

function generateConversionFunnel(worker: PlatformWorker) {
  const total = worker.conversationsTotal;
  const engaged = Math.round(total * 0.72);
  const qualified = Math.round(engaged * 0.45);
  const leads = worker.leadsGenerated;
  const bookings = Math.round(leads * 0.34);
  const payments = Math.round(bookings * 0.62);
  return [
    { stage: "Conversations", count: total, rate: 100 },
    { stage: "Engaged", count: engaged, rate: Math.round((engaged / total) * 100) },
    { stage: "Qualified", count: qualified, rate: Math.round((qualified / total) * 100) },
    { stage: "Leads Captured", count: leads, rate: Math.round((leads / total) * 100) },
    { stage: "Bookings", count: bookings, rate: Math.round((bookings / total) * 100) },
    { stage: "Payments", count: payments, rate: Math.round((payments / total) * 100) },
  ];
}

function generateRevenueTrend(worker: PlatformWorker) {
  const monthlyRev = Math.max(Math.round((worker.leadsGenerated * 0.34 * 0.62 * 120) / 12), 100);
  const seed = worker.id.charCodeAt(0);
  return Array.from({ length: 12 }, (_, i) => {
    const month = new Date(2025, 3 + i);
    const label = month.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    const pseudoRandom = Math.abs(Math.sin(seed * (i + 1) * 1234) % 1);
    const growth = 1 + (i * 0.04) + (pseudoRandom * 0.1 - 0.05);
    return { month: label, revenue: Math.round(monthlyRev * growth) };
  });
}

// ── Chat transcript data ────────────────────────────────────

function getTranscript(conv: PlatformConversation) {
  const messages: { role: "user" | "ai"; text: string; time: string; confidence?: number }[] = [
    { role: "user", text: "Hi, I'm looking for information about your services.", time: "0:00" },
    { role: "ai", text: `Hello ${conv.userName !== "Anonymous" ? conv.userName : "there"}! Welcome. I'd be happy to help you learn about our offerings. What specific area are you most interested in?`, time: "0:05", confidence: 94 },
    { role: "user", text: "I need something for my team — we're looking at enterprise options.", time: "0:32" },
    { role: "ai", text: "Great choice! Our enterprise plan includes unlimited workers, priority support, custom integrations, and dedicated account management. Would you like me to walk you through the pricing or schedule a demo?", time: "0:38", confidence: 91 },
    { role: "user", text: "A demo would be great. Can we do it this week?", time: "1:15" },
    { role: "ai", text: "Absolutely! I have availability on Thursday at 2:00 PM or Friday at 10:00 AM. Which works better for you?", time: "1:20", confidence: 96 },
  ];
  if (conv.leadCaptured) {
    messages.push(
      { role: "user", text: `Thursday works. My email is ${conv.userName.toLowerCase().replace(" ", ".")}@company.com`, time: "1:45" },
      { role: "ai", text: "Perfect! I've booked your demo for Thursday at 2:00 PM and sent a confirmation to your email. Is there anything else I can help with?", time: "1:50", confidence: 98 },
    );
  }
  if (conv.status === "Escalated") {
    messages.push(
      { role: "user", text: "Actually, I have a complex question about compliance requirements.", time: "2:10" },
      { role: "ai", text: "That's a great question. For compliance-specific inquiries, let me connect you with our specialist team who can provide detailed guidance. Transferring you now...", time: "2:15", confidence: 52 },
    );
  }
  return messages;
}

// ── Main Component ──────────────────────────────────────────

export default function WorkerDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const worker = platformWorkers.find((w) => w.id === params.id);
  const customer = worker ? customers.find((c) => c.id === worker.customerId) : null;

  if (!worker) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[60vh] gap-4">
        <Bot className="size-12 text-muted-foreground/40" />
        <h2 className="text-lg font-heading font-semibold">Worker not found</h2>
        <p className="text-sm text-muted-foreground">The worker you're looking for doesn't exist or has been removed.</p>
        <Button variant="outline" onClick={() => navigate("/workers")}>
          Back to Workers
        </Button>
      </div>
    );
  }

  // Derived data
  const workerConversations = platformConversations.filter((c) => c.workerId === worker.id || c.workerName === worker.name);
  const workerLogs = activityLogs.filter(
    (l) => l.resource.toLowerCase().includes(worker.name.toLowerCase()) || l.actor === worker.name
  );
  const revenueAttributed = Math.round(worker.leadsGenerated * 0.34 * 0.62 * 120);
  const paidSubsAttributed = Math.max(Math.round(worker.leadsGenerated * 0.021), 1);
  const trendData = useMemo(() => generateWorkerTrend(worker), [worker]);
  const funnelData = useMemo(() => generateConversionFunnel(worker), [worker]);
  const revenueTrend = useMemo(() => generateRevenueTrend(worker), [worker]);

  const kpis = [
    { label: "Total Conversations", value: worker.conversationsTotal.toLocaleString(), icon: <MessageSquare className="size-4" />, color: "text-qiko-indigo", bg: "bg-qiko-indigo/10" },
    { label: "Total Conversions", value: worker.leadsGenerated.toLocaleString(), icon: <Target className="size-4" />, color: "text-qiko-cyan", bg: "bg-qiko-cyan/10" },
    { label: "Conversion Rate", value: `${worker.conversionRate}%`, icon: <TrendingUp className="size-4" />, color: "text-qiko-success", bg: "bg-qiko-success/10" },
    { label: "Paid Subs Attributed", value: paidSubsAttributed.toLocaleString(), icon: <Users className="size-4" />, color: "text-violet-400", bg: "bg-violet-400/10" },
    { label: "Revenue Attributed", value: `$${revenueAttributed.toLocaleString()}`, icon: <DollarSign className="size-4" />, color: "text-qiko-warning", bg: "bg-qiko-warning/10" },
    { label: "Avg Response Time", value: worker.avgResponseTime, icon: <Clock className="size-4" />, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/workers" className="hover:text-foreground transition-colors">Workers</Link>
        <ChevronRight className="size-3.5" />
        {customer && (
          <>
            <Link href={`/customers/${customer.slug}`} className="hover:text-foreground transition-colors">
              {customer.name}
            </Link>
            <ChevronRight className="size-3.5" />
          </>
        )}
        <span className="text-foreground font-medium">{worker.name}</span>
      </nav>

      {/* Top Summary Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <Card className="bg-card/80 border-border/40">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              <div className="flex items-start gap-4 flex-1">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-qiko-indigo/15 shrink-0">
                  <Bot className="size-7 text-qiko-indigo" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold font-heading tracking-tight">{worker.name}</h1>
                    <Badge variant="outline" className={statusStyles[worker.status]}>{worker.status}</Badge>
                    <Badge variant="secondary" className={typeStyles[worker.type]}>{worker.type}</Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <span>Customer:</span>
                    {customer ? (
                      <Link href={`/customers/${customer.slug}`} className="text-qiko-indigo hover:underline">{customer.name}</Link>
                    ) : (
                      <span>{worker.customerName}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Channels</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {worker.channels.map((ch) => (
                      <span key={ch} className="flex items-center gap-1 text-foreground">
                        {ch === "Web" ? <Globe className="size-3.5" /> : <Phone className="size-3.5" />}
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Created</p>
                  <p className="text-foreground mt-0.5">{new Date(worker.createdDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Last Active</p>
                  <p className="text-foreground mt-0.5">{worker.lastActive}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Today's Convs</p>
                  <p className="text-foreground font-semibold tabular-nums mt-0.5">{worker.conversationsToday}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* KPI Cards */}
      <motion.div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" variants={stagger} initial="hidden" animate="visible">
        {kpis.map((kpi) => (
          <motion.div key={kpi.label} variants={fadeUp}>
            <Card className="bg-card/80 border-border/40 h-full">
              <CardContent className="p-4 space-y-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${kpi.bg}`}>
                  <span className={kpi.color}>{kpi.icon}</span>
                </div>
                <p className={`text-xl font-bold font-heading tabular-nums ${kpi.color}`}>{kpi.value}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{kpi.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-secondary/50 border border-border/40 p-1 h-auto">
          <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-qiko-indigo/15 data-[state=active]:text-qiko-indigo">
            <BarChart3 className="size-3.5 mr-1.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="conversations" className="text-xs data-[state=active]:bg-qiko-indigo/15 data-[state=active]:text-qiko-indigo">
            <MessageSquare className="size-3.5 mr-1.5" /> Conversations
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs data-[state=active]:bg-qiko-indigo/15 data-[state=active]:text-qiko-indigo">
            <Target className="size-3.5 mr-1.5" /> Conversion Analytics
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs data-[state=active]:bg-qiko-indigo/15 data-[state=active]:text-qiko-indigo">
            <Activity className="size-3.5 mr-1.5" /> Activity History
          </TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ──────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6">
          <OverviewTab worker={worker} trendData={trendData} workerConversations={workerConversations} workerLogs={workerLogs} />
        </TabsContent>

        {/* ── Conversations Tab ─────────────────────────────── */}
        <TabsContent value="conversations" className="space-y-6">
          <ConversationsTab worker={worker} conversations={workerConversations} allConversations={platformConversations} />
        </TabsContent>

        {/* ── Conversion Analytics Tab ──────────────────────── */}
        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsTab worker={worker} funnelData={funnelData} revenueTrend={revenueTrend} />
        </TabsContent>

        {/* ── Activity History Tab ──────────────────────────── */}
        <TabsContent value="history" className="space-y-6">
          <HistoryTab worker={worker} logs={workerLogs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Overview Tab ────────────────────────────────────────────

function OverviewTab({
  worker,
  trendData,
  workerConversations,
  workerLogs,
}: {
  worker: PlatformWorker;
  trendData: { date: string; conversations: number; leads: number }[];
  workerConversations: PlatformConversation[];
  workerLogs: ActivityLog[];
}) {
  const completedConvs = workerConversations.filter((c) => c.status === "Completed").length;
  const escalatedConvs = workerConversations.filter((c) => c.status === "Escalated").length;
  const satConvs = workerConversations.filter((c) => c.satisfaction !== null);
  const avgSatisfaction = satConvs.length > 0
    ? satConvs.reduce((sum, c) => sum + (c.satisfaction || 0), 0) / satConvs.length
    : 0;

  return (
    <>
      {/* Performance Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="Completed Conversations" value={completedConvs} total={workerConversations.length} color="text-qiko-success" />
        <MiniStat label="Escalated" value={escalatedConvs} total={workerConversations.length} color="text-qiko-warning" />
        <MiniStat label="Avg Satisfaction" value={avgSatisfaction.toFixed(1)} suffix="/5" color="text-qiko-cyan" />
        <MiniStat label="Conversations Today" value={worker.conversationsToday} color="text-qiko-indigo" />
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/80 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversations Trend (30 days)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="wdConvGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8A8FA0" }} tickLine={false} axisLine={false} interval={6} />
                  <YAxis tick={{ fontSize: 10, fill: "#8A8FA0" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#1A2A3A", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "8px", fontSize: "12px" }} labelStyle={{ color: "#8A8FA0" }} />
                  <Area type="monotone" dataKey="conversations" stroke="#6366F1" fill="url(#wdConvGrad)" strokeWidth={2} name="Conversations" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Leads Generated (30 days)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8A8FA0" }} tickLine={false} axisLine={false} interval={6} />
                  <YAxis tick={{ fontSize: 10, fill: "#8A8FA0" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#1A2A3A", border: "1px solid rgba(34,211,238,0.2)", borderRadius: "8px", fontSize: "12px" }} labelStyle={{ color: "#8A8FA0" }} />
                  <Bar dataKey="leads" fill="#22D3EE" radius={[3, 3, 0, 0]} name="Leads" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-card/80 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {workerLogs.length > 0 ? (
            <div className="space-y-3">
              {workerLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="flex items-start gap-3 py-2 border-b border-border/20 last:border-0">
                  <div className="mt-0.5">{severityIcons[log.severity]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{log.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                    {log.timestamp.split(" ").slice(1).join(" ")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Activity className="size-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No recent activity recorded for this worker.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Activity will appear here as the worker handles conversations.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ── Conversations Tab ───────────────────────────────────────

function ConversationsTab({
  worker,
  conversations,
  allConversations,
}: {
  worker: PlatformWorker;
  conversations: PlatformConversation[];
  allConversations: PlatformConversation[];
}) {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedConv, setSelectedConv] = useState<PlatformConversation | null>(null);

  const allWorkerConvs = useMemo(() => {
    return conversations.length > 0 ? conversations : allConversations.filter((c) => c.workerName === worker.name);
  }, [conversations, allConversations, worker.name]);

  const filtered = useMemo(() => {
    return allWorkerConvs.filter((c) => {
      const matchSearch = c.userName.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [allWorkerConvs, search, statusFilter]);

  const transcript = selectedConv ? getTranscript(selectedConv) : [];

  return (
    <>
      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="Total Conversations" value={allWorkerConvs.length} color="text-qiko-indigo" />
        <MiniStat label="Completed" value={allWorkerConvs.filter((c) => c.status === "Completed").length} color="text-qiko-success" />
        <MiniStat label="Escalated" value={allWorkerConvs.filter((c) => c.status === "Escalated").length} color="text-qiko-warning" />
        <MiniStat label="Leads Captured" value={allWorkerConvs.filter((c) => c.leadCaptured).length} color="text-qiko-cyan" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search by user or conversation ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary/50 border-border/50" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] bg-secondary/50 border-border/50">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Escalated">Escalated</SelectItem>
            <SelectItem value="Dropped">Dropped</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} conversations</span>
      </div>

      {/* Split view: list + transcript */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Conversation list */}
        <Card className="bg-card/80 border-border/40 lg:col-span-2">
          <CardContent className="p-0">
            <ScrollArea className="h-[520px]">
              <div className="divide-y divide-border/20">
                {filtered.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`w-full text-left p-4 hover:bg-secondary/30 transition-colors ${selectedConv?.id === conv.id ? "bg-qiko-indigo/8 border-l-2 border-l-qiko-indigo" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium truncate">{conv.userName}</span>
                      <Badge variant="outline" className={`text-[9px] ${convStatusStyles[conv.status]}`}>{conv.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {conv.channel === "Web" ? <Globe className="size-3" /> : <Phone className="size-3" />}
                        {conv.channel}
                      </span>
                      <span>{conv.messagesCount} msgs</span>
                      <span>{conv.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      {conv.leadCaptured && <Badge variant="secondary" className="text-[9px] bg-qiko-success/10 text-qiko-success">Lead</Badge>}
                      {conv.bookingMade && <Badge variant="secondary" className="text-[9px] bg-qiko-indigo/10 text-qiko-indigo">Booking</Badge>}
                      <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">{conv.timestamp}</span>
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground">No conversations match your filters.</div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Transcript detail */}
        <Card className="bg-card/80 border-border/40 lg:col-span-3">
          <CardContent className="p-0">
            {selectedConv ? (
              <div className="flex flex-col h-[520px]">
                <div className="p-4 border-b border-border/30">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-semibold">{selectedConv.userName}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedConv.id} · {selectedConv.channel} · {selectedConv.duration}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedConv.leadCaptured && <Badge variant="secondary" className="text-[9px] bg-qiko-success/10 text-qiko-success">Lead Captured</Badge>}
                      {selectedConv.bookingMade && <Badge variant="secondary" className="text-[9px] bg-qiko-indigo/10 text-qiko-indigo">Booking Made</Badge>}
                      {selectedConv.satisfaction && (
                        <Badge variant="secondary" className="text-[9px] bg-qiko-warning/10 text-qiko-warning">{selectedConv.satisfaction}/5 CSAT</Badge>
                      )}
                      <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 bg-transparent border-qiko-indigo/30 text-qiko-indigo hover:bg-qiko-indigo/10" onClick={() => navigate(`/conversations/${selectedConv.id}`)}>
                        View Full Detail <ChevronRight className="size-3 ml-0.5" />
                      </Button>
                    </div>
                  </div>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {transcript.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "ai" ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[80%] rounded-xl px-4 py-2.5 ${msg.role === "ai" ? "bg-secondary/60 border border-border/30" : "bg-qiko-indigo/15 border border-qiko-indigo/20"}`}>
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-muted-foreground tabular-nums">{msg.time}</span>
                            {msg.confidence !== undefined && (
                              <span className={`text-[10px] ${msg.confidence >= 80 ? "text-qiko-success" : "text-qiko-warning"}`}>
                                {msg.confidence}% confidence
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[520px] text-muted-foreground gap-3">
                <MessageSquare className="size-8 opacity-30" />
                <p className="text-sm">Select a conversation to view the transcript</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// ── Conversion Analytics Tab ────────────────────────────────

function AnalyticsTab({
  worker,
  funnelData,
  revenueTrend,
}: {
  worker: PlatformWorker;
  funnelData: { stage: string; count: number; rate: number }[];
  revenueTrend: { month: string; revenue: number }[];
}) {
  const totalRevenue = revenueTrend.reduce((s, r) => s + r.revenue, 0);
  const paidSubs = Math.max(Math.round(worker.leadsGenerated * 0.021), 1);
  const bookings = Math.round(worker.leadsGenerated * 0.34);

  const FUNNEL_COLORS = ["#6366F1", "#818CF8", "#22D3EE", "#34D399", "#FBBF24", "#F97316"];

  return (
    <>
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="Total Leads" value={worker.leadsGenerated.toLocaleString()} color="text-qiko-cyan" />
        <MiniStat label="Bookings Made" value={bookings.toLocaleString()} color="text-qiko-indigo" />
        <MiniStat label="Paid Subscribers" value={paidSubs} color="text-violet-400" />
        <MiniStat label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} color="text-qiko-warning" />
      </div>

      {/* Conversion Funnel */}
      <Card className="bg-card/80 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnelData.map((step, i) => {
              const widthPct = Math.max((step.count / funnelData[0].count) * 100, 4);
              return (
                <div key={step.stage} className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-32 shrink-0 text-right">{step.stage}</span>
                  <div className="flex-1 relative h-9 bg-secondary/30 rounded-lg overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-lg"
                      style={{ backgroundColor: FUNNEL_COLORS[i] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                    />
                    <div className="relative flex items-center justify-between h-full px-3">
                      <span className="text-xs font-semibold tabular-nums text-white drop-shadow-sm">
                        {step.count >= 1000 ? `${(step.count / 1000).toFixed(1)}K` : step.count}
                      </span>
                      <span className="text-[10px] text-white/80 tabular-nums drop-shadow-sm">
                        {step.rate}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Trend */}
      <Card className="bg-card/80 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Revenue Attributed Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrend} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8A8FA0" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#8A8FA0" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ background: "#1A2A3A", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "8px", fontSize: "12px" }}
                  labelStyle={{ color: "#8A8FA0" }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {revenueTrend.map((_, i) => (
                    <Cell key={i} fill={i === revenueTrend.length - 1 ? "#6366F1" : "#6366F180"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Metrics Summary */}
      <Card className="bg-card/80 border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Conversion Metrics Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Lead to Booking Rate</p>
              <p className="text-lg font-bold font-heading tabular-nums text-qiko-indigo">34%</p>
              <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                <div className="h-full bg-qiko-indigo rounded-full" style={{ width: "34%" }} />
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Booking to Payment Rate</p>
              <p className="text-lg font-bold font-heading tabular-nums text-qiko-cyan">62%</p>
              <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                <div className="h-full bg-qiko-cyan rounded-full" style={{ width: "62%" }} />
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Avg Deal Value</p>
              <p className="text-lg font-bold font-heading tabular-nums text-qiko-warning">$120</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Revenue per Conversation</p>
              <p className="text-lg font-bold font-heading tabular-nums text-qiko-success">
                ${worker.conversationsTotal > 0 ? (Math.round(worker.leadsGenerated * 0.34 * 0.62 * 120) / worker.conversationsTotal).toFixed(2) : "0.00"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// ── Activity History Tab ────────────────────────────────────

function HistoryTab({
  worker,
  logs,
}: {
  worker: PlatformWorker;
  logs: ActivityLog[];
}) {
  const [severityFilter, setSeverityFilter] = useState("all");

  const lifecycleEvents: ActivityLog[] = useMemo(() => [
    {
      id: "lc-001", timestamp: worker.createdDate + " 10:00:00", eventType: "Worker Created", actor: "System", actorType: "System" as const,
      action: "Worker created", resource: worker.name, details: `${worker.type} worker created for ${worker.customerName}`,
      severity: "info" as const, category: "Workers", customerId: worker.customerId, customerName: worker.customerName,
    },
    {
      id: "lc-002", timestamp: new Date(new Date(worker.createdDate).getTime() + 86400000 * 3).toISOString().split("T")[0] + " 14:30:00",
      eventType: "Worker Activated", actor: worker.customerName, actorType: "Customer" as const,
      action: "Training completed", resource: worker.name, details: "Worker training completed, moved to Live status",
      severity: "success" as const, category: "Workers", customerId: worker.customerId, customerName: worker.customerName,
    },
    {
      id: "lc-003", timestamp: new Date(new Date(worker.createdDate).getTime() + 86400000 * 30).toISOString().split("T")[0] + " 09:15:00",
      eventType: "Conversation Spike", actor: "System", actorType: "System" as const,
      action: "Usage spike detected", resource: worker.name, details: "Conversation volume increased 240% — triggered auto-scaling",
      severity: "warning" as const, category: "System", customerId: worker.customerId, customerName: worker.customerName,
    },
    {
      id: "lc-004", timestamp: new Date(new Date(worker.createdDate).getTime() + 86400000 * 60).toISOString().split("T")[0] + " 16:45:00",
      eventType: "Worker Updated", actor: worker.customerName, actorType: "Customer" as const,
      action: "Prompt updated", resource: worker.name, details: "Worker prompt and personality updated by customer admin",
      severity: "info" as const, category: "Workers", customerId: worker.customerId, customerName: worker.customerName,
    },
    {
      id: "lc-005", timestamp: new Date(new Date(worker.createdDate).getTime() + 86400000 * 90).toISOString().split("T")[0] + " 11:20:00",
      eventType: "System Alert", actor: "System", actorType: "System" as const,
      action: "Milestone reached", resource: worker.name, details: "Worker reached 10,000 conversations milestone",
      severity: "success" as const, category: "Workers", customerId: worker.customerId, customerName: worker.customerName,
    },
  ], [worker]);

  const allLogs = useMemo(() => {
    const combined = [...logs, ...lifecycleEvents];
    return combined.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [logs, lifecycleEvents]);

  const filtered = useMemo(() => {
    if (severityFilter === "all") return allLogs;
    return allLogs.filter((l) => l.severity === severityFilter);
  }, [allLogs, severityFilter]);

  const severityCounts = useMemo(() => ({
    success: allLogs.filter((l) => l.severity === "success").length,
    info: allLogs.filter((l) => l.severity === "info").length,
    warning: allLogs.filter((l) => l.severity === "warning").length,
    error: allLogs.filter((l) => l.severity === "error").length,
  }), [allLogs]);

  return (
    <>
      {/* Severity summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="Success Events" value={severityCounts.success} color="text-qiko-success" />
        <MiniStat label="Info Events" value={severityCounts.info} color="text-qiko-cyan" />
        <MiniStat label="Warnings" value={severityCounts.warning} color="text-qiko-warning" />
        <MiniStat label="Errors" value={severityCounts.error} color="text-qiko-error" />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[140px] bg-secondary/50 border-border/50">
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
        <span className="text-xs text-muted-foreground">{filtered.length} events</span>
      </div>

      {/* Timeline */}
      <Card className="bg-card/80 border-border/40">
        <CardContent className="p-0">
          <ScrollArea className="h-[480px]">
            <div className="divide-y divide-border/20">
              {filtered.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-secondary/10 transition-colors">
                  <div className="mt-1 shrink-0">{severityIcons[log.severity]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{log.action}</span>
                      <Badge variant="outline" className={`text-[9px] ${severityBadge[log.severity]}`}>{log.severity}</Badge>
                      <Badge variant="secondary" className="text-[9px]">{log.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                      <span className="tabular-nums">{log.timestamp}</span>
                      <span>by {log.actor}</span>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">No activity events match your filter.</div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}

// ── Shared Mini Stat Card ───────────────────────────────────

function MiniStat({
  label,
  value,
  total,
  suffix,
  color,
}: {
  label: string;
  value: string | number;
  total?: number;
  suffix?: string;
  color: string;
}) {
  return (
    <Card className="bg-card/80 border-border/40">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className={`text-xl font-bold font-heading tabular-nums ${color}`}>{value}</span>
          {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
          {total !== undefined && <span className="text-xs text-muted-foreground ml-1">/ {total}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
