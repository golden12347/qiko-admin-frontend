// ============================================================
// Workers — Platform-wide worker fleet oversight
// All workers across all tenants with status, performance, filters
// ============================================================

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Search,
  Bot,
  Zap,
  Clock,
  MessageSquare,
  Globe,
  Phone,
} from "lucide-react";
import { useLocation } from "wouter";
import { platformWorkers } from "@/lib/data";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
};

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

export default function Workers() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = useMemo(() => {
    return platformWorkers.filter((w) => {
      const matchSearch =
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.customerName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || w.status === statusFilter;
      const matchType = typeFilter === "all" || w.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [search, statusFilter, typeFilter]);

  const stats = useMemo(() => ({
    total: platformWorkers.length,
    live: platformWorkers.filter((w) => w.status === "Live").length,
    training: platformWorkers.filter((w) => w.status === "Training").length,
    error: platformWorkers.filter((w) => w.status === "Error").length,
    totalConvsToday: platformWorkers.reduce((s, w) => s + w.conversationsToday, 0),
  }), []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading tracking-tight">Workers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All AI workers deployed across the platform
        </p>
      </div>

      {/* Summary */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <StatCard icon={<Bot className="size-4" />} label="Total Workers" value={stats.total} color="text-foreground" />
        <StatCard icon={<Zap className="size-4" />} label="Live" value={stats.live} color="text-qiko-success" />
        <StatCard icon={<Clock className="size-4" />} label="Training" value={stats.training} color="text-qiko-cyan" />
        <StatCard icon={<Bot className="size-4" />} label="Errors" value={stats.error} color="text-qiko-error" />
        <StatCard icon={<MessageSquare className="size-4" />} label="Convs Today" value={stats.totalConvsToday.toLocaleString()} color="text-qiko-indigo" />
      </motion.div>

      {/* Filters */}
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] bg-secondary/50 border-border/50">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Live">Live</SelectItem>
            <SelectItem value="Training">Training</SelectItem>
            <SelectItem value="Paused">Paused</SelectItem>
            <SelectItem value="Error">Error</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px] bg-secondary/50 border-border/50">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Sales">Sales</SelectItem>
            <SelectItem value="Support">Support</SelectItem>
            <SelectItem value="Research">Research</SelectItem>
            <SelectItem value="Financial Analyst">Financial Analyst</SelectItem>
            <SelectItem value="Onboarding">Onboarding</SelectItem>
            <SelectItem value="Retention">Retention</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {platformWorkers.length} workers
        </span>
      </div>

      {/* Table */}
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
                <TableHead className="text-xs font-medium text-muted-foreground text-right">Today</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground text-right">Total Convs</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground text-right">Leads</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground text-right">Conv. Rate</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Resp. Time</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((w) => (
                <TableRow key={w.id} className="border-border/30 hover:bg-secondary/20 transition-colors cursor-pointer" onClick={() => navigate(`/workers/${w.id}`)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-qiko-indigo/10">
                        <Bot className="size-3.5 text-qiko-indigo" />
                      </div>
                      <span className="text-sm font-medium">{w.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{w.customerName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-[10px] border-0 ${typeStyles[w.type] || ""}`}>
                      {w.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${statusStyles[w.status]}`}>
                      {w.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {w.channels.map((ch) => (
                        <span key={ch} className="flex items-center gap-0.5 text-xs text-muted-foreground">
                          {ch === "Web" ? <Globe className="size-3" /> : <Phone className="size-3" />}
                          {ch}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">{w.conversationsToday}</TableCell>
                  <TableCell className="text-right tabular-nums text-sm">{w.conversationsTotal.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums text-sm">{w.leadsGenerated.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums text-sm font-medium">
                    <span className={w.conversionRate >= 10 ? "text-qiko-success" : "text-muted-foreground"}>
                      {w.conversionRate}%
                    </span>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">{w.avgResponseTime}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{w.lastActive}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
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
