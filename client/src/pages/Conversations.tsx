// ============================================================
// Conversations — Platform-wide conversation table
// Design: Full-width data table with comprehensive filters,
// sorting, search, and row-click to detail page.
// Palette: qiko-navy base, qiko-indigo accents, semantic colors
// ============================================================

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MessageSquare,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Globe,
  Phone,
  Download,
  Filter,
  X,
  DollarSign,
  Target,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
} from "lucide-react";
import { useLocation } from "wouter";
import { platformConversations, platformWorkers, customers, type PlatformConversation } from "@/lib/data";

// ── Style Maps ──────────────────────────────────────────────

const statusStyles: Record<string, string> = {
  Active: "bg-qiko-success/15 text-qiko-success border-qiko-success/20",
  Completed: "bg-qiko-indigo/15 text-qiko-indigo border-qiko-indigo/20",
  Escalated: "bg-qiko-warning/15 text-qiko-warning border-qiko-warning/20",
  Dropped: "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/20",
};

const statusIcons: Record<string, React.ReactNode> = {
  Active: <Zap className="size-3" />,
  Completed: <CheckCircle2 className="size-3" />,
  Escalated: <AlertTriangle className="size-3" />,
  Dropped: <XCircle className="size-3" />,
};

const conversionStyles: Record<string, string> = {
  Converted: "bg-qiko-success/15 text-qiko-success border-qiko-success/20",
  Qualified: "bg-qiko-indigo/15 text-qiko-indigo border-qiko-indigo/20",
  Nurturing: "bg-qiko-cyan/15 text-qiko-cyan border-qiko-cyan/20",
  Lost: "bg-qiko-error/15 text-qiko-error border-qiko-error/20",
  None: "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/15",
};

// ── Sort types ──────────────────────────────────────────────

type SortKey = "id" | "customerName" | "workerName" | "userName" | "channel" | "status" | "conversionStatus" | "revenueOutcome" | "timestamp" | "duration";
type SortDir = "asc" | "desc";

function parseDuration(d: string): number {
  const parts = d.match(/(\d+)m\s*(\d+)s/);
  if (!parts) return 0;
  return parseInt(parts[1]) * 60 + parseInt(parts[2]);
}

function sortConversations(data: PlatformConversation[], key: SortKey, dir: SortDir): PlatformConversation[] {
  return [...data].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case "revenueOutcome":
        cmp = a.revenueOutcome - b.revenueOutcome;
        break;
      case "duration":
        cmp = parseDuration(a.duration) - parseDuration(b.duration);
        break;
      case "timestamp":
        cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        break;
      default:
        cmp = String(a[key]).localeCompare(String(b[key]));
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

// ── Component ───────────────────────────────────────────────

export default function Conversations() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [workerFilter, setWorkerFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [conversionFilter, setConversionFilter] = useState("all");
  const [revenueFilter, setRevenueFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showFilters, setShowFilters] = useState(false);

  const customerNames = useMemo(() => {
    const names = new Set(platformConversations.map((c) => c.customerName));
    return Array.from(names).sort();
  }, []);

  const workerNames = useMemo(() => {
    const names = new Set(platformConversations.map((c) => c.workerName));
    return Array.from(names).sort();
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (customerFilter !== "all") count++;
    if (workerFilter !== "all") count++;
    if (channelFilter !== "all") count++;
    if (conversionFilter !== "all") count++;
    if (revenueFilter !== "all") count++;
    return count;
  }, [statusFilter, customerFilter, workerFilter, channelFilter, conversionFilter, revenueFilter]);

  const filtered = useMemo(() => {
    const result = platformConversations.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.userName.toLowerCase().includes(q) ||
        c.workerName.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.userId.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      const matchCustomer = customerFilter === "all" || c.customerName === customerFilter;
      const matchWorker = workerFilter === "all" || c.workerName === workerFilter;
      const matchChannel = channelFilter === "all" || c.channel === channelFilter;
      const matchConversion = conversionFilter === "all" || c.conversionStatus === conversionFilter;
      const matchRevenue =
        revenueFilter === "all" ||
        (revenueFilter === "has-revenue" && c.revenueOutcome > 0) ||
        (revenueFilter === "no-revenue" && c.revenueOutcome === 0);
      return matchSearch && matchStatus && matchCustomer && matchWorker && matchChannel && matchConversion && matchRevenue;
    });
    return sortConversations(result, sortKey, sortDir);
  }, [search, statusFilter, customerFilter, workerFilter, channelFilter, conversionFilter, revenueFilter, sortKey, sortDir]);

  const stats = useMemo(() => {
    const total = platformConversations.length;
    const active = platformConversations.filter((c) => c.status === "Active").length;
    const converted = platformConversations.filter((c) => c.conversionStatus === "Converted").length;
    const totalRevenue = platformConversations.reduce((s, c) => s + c.revenueOutcome, 0);
    const escalated = platformConversations.filter((c) => c.status === "Escalated").length;
    return { total, active, converted, totalRevenue, escalated };
  }, []);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function clearFilters() {
    setStatusFilter("all");
    setCustomerFilter("all");
    setWorkerFilter("all");
    setChannelFilter("all");
    setConversionFilter("all");
    setRevenueFilter("all");
    setSearch("");
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="size-3 opacity-30" />;
    return sortDir === "asc" ? <ArrowUp className="size-3 text-qiko-indigo" /> : <ArrowDown className="size-3 text-qiko-indigo" />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-border/30">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold font-heading tracking-tight">Conversations</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              All conversations across the platform
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-border/30">
              <Download className="size-3.5" />
              Export
            </Button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="flex items-center gap-6 mt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Total</span>
            <span className="font-bold tabular-nums">{stats.total.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="size-3.5 text-qiko-success" />
            <span className="text-muted-foreground">Active</span>
            <span className="font-bold text-qiko-success tabular-nums">{stats.active}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Target className="size-3.5 text-qiko-indigo" />
            <span className="text-muted-foreground">Converted</span>
            <span className="font-bold text-qiko-indigo tabular-nums">{stats.converted}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="size-3.5 text-qiko-warning" />
            <span className="text-muted-foreground">Escalated</span>
            <span className="font-bold text-qiko-warning tabular-nums">{stats.escalated}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="size-3.5 text-qiko-success" />
            <span className="text-muted-foreground">Revenue</span>
            <span className="font-bold text-qiko-success tabular-nums">${stats.totalRevenue.toLocaleString()}</span>
          </div>
        </div>

        {/* Search + filter toggle */}
        <div className="flex items-center gap-2 mt-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by ID, customer, worker, or visitor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs bg-secondary/30 border-border/30"
            />
          </div>
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="sm"
            className="h-8 text-xs gap-1.5 border-border/30"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="size-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-0.5 flex items-center justify-center size-4 rounded-full bg-qiko-indigo text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={clearFilters}>
              <X className="size-3" />
              Clear
            </Button>
          )}
          <span className="text-xs text-muted-foreground ml-auto tabular-nums">
            {filtered.length} of {stats.total} conversations
          </span>
        </div>

        {/* Filter row */}
        {showFilters && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs bg-secondary/30 border-border/30">
                <SelectValue placeholder="Customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customerNames.map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={workerFilter} onValueChange={setWorkerFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs bg-secondary/30 border-border/30">
                <SelectValue placeholder="Worker" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workers</SelectItem>
                {workerNames.map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-8 text-xs bg-secondary/30 border-border/30">
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
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-[120px] h-8 text-xs bg-secondary/30 border-border/30">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="Web">Web</SelectItem>
                <SelectItem value="Voice">Voice</SelectItem>
              </SelectContent>
            </Select>
            <Select value={conversionFilter} onValueChange={setConversionFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs bg-secondary/30 border-border/30">
                <SelectValue placeholder="Conversion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conversions</SelectItem>
                <SelectItem value="Converted">Converted</SelectItem>
                <SelectItem value="Qualified">Qualified</SelectItem>
                <SelectItem value="Nurturing">Nurturing</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
                <SelectItem value="None">None</SelectItem>
              </SelectContent>
            </Select>
            <Select value={revenueFilter} onValueChange={setRevenueFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs bg-secondary/30 border-border/30">
                <SelectValue placeholder="Revenue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Revenue</SelectItem>
                <SelectItem value="has-revenue">Has Revenue</SelectItem>
                <SelectItem value="no-revenue">No Revenue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Table */}
      <ScrollArea className="flex-1">
        <div className="min-w-[1200px]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-secondary/40 border-b border-border/30">
                <th className="text-left font-medium text-muted-foreground px-4 py-2.5 w-[100px]">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleSort("id")}>
                    Conv ID <SortIcon col="id" />
                  </button>
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2.5">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleSort("customerName")}>
                    Customer <SortIcon col="customerName" />
                  </button>
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2.5">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleSort("workerName")}>
                    Worker <SortIcon col="workerName" />
                  </button>
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2.5">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleSort("userName")}>
                    User / Visitor <SortIcon col="userName" />
                  </button>
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2.5 w-[80px]">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleSort("channel")}>
                    Channel <SortIcon col="channel" />
                  </button>
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2.5 w-[100px]">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleSort("status")}>
                    Status <SortIcon col="status" />
                  </button>
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2.5 w-[110px]">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleSort("conversionStatus")}>
                    Conversion <SortIcon col="conversionStatus" />
                  </button>
                </th>
                <th className="text-right font-medium text-muted-foreground px-3 py-2.5 w-[100px]">
                  <button className="flex items-center gap-1 justify-end hover:text-foreground transition-colors" onClick={() => handleSort("revenueOutcome")}>
                    Revenue <SortIcon col="revenueOutcome" />
                  </button>
                </th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2.5 w-[140px]">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleSort("timestamp")}>
                    Started At <SortIcon col="timestamp" />
                  </button>
                </th>
                <th className="text-right font-medium text-muted-foreground px-3 py-2.5 w-[80px]">
                  <button className="flex items-center gap-1 justify-end hover:text-foreground transition-colors" onClick={() => handleSort("duration")}>
                    Duration <SortIcon col="duration" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((conv, i) => (
                <tr
                  key={conv.id}
                  className="border-b border-border/15 hover:bg-secondary/20 cursor-pointer transition-colors group"
                  onClick={() => navigate(`/conversations/${conv.id}`)}
                >
                  {/* Conversation ID */}
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-[11px] text-muted-foreground group-hover:text-qiko-indigo transition-colors">
                      {conv.id.toUpperCase().replace("CONV-", "#")}
                    </span>
                  </td>

                  {/* Customer */}
                  <td className="px-3 py-2.5">
                    <span className="font-medium">{conv.customerName}</span>
                  </td>

                  {/* Worker */}
                  <td className="px-3 py-2.5">
                    <span className="text-foreground/80">{conv.workerName}</span>
                  </td>

                  {/* User / Visitor */}
                  <td className="px-3 py-2.5">
                    <div>
                      <span className="text-foreground/90">{conv.userName}</span>
                      <span className="block text-[10px] text-muted-foreground/60 font-mono">{conv.userId}</span>
                    </div>
                  </td>

                  {/* Channel */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {conv.channel === "Web" ? (
                        <Globe className="size-3 text-qiko-indigo" />
                      ) : (
                        <Phone className="size-3 text-qiko-cyan" />
                      )}
                      <span className="text-foreground/70">{conv.channel}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2.5">
                    <Badge variant="outline" className={`text-[10px] gap-1 ${statusStyles[conv.status]}`}>
                      {statusIcons[conv.status]}
                      {conv.status}
                    </Badge>
                  </td>

                  {/* Conversion Status */}
                  <td className="px-3 py-2.5">
                    <Badge variant="outline" className={`text-[10px] ${conversionStyles[conv.conversionStatus]}`}>
                      {conv.conversionStatus}
                    </Badge>
                  </td>

                  {/* Revenue */}
                  <td className="px-3 py-2.5 text-right">
                    {conv.revenueOutcome > 0 ? (
                      <span className="font-medium text-qiko-success tabular-nums">
                        ${conv.revenueOutcome.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>

                  {/* Started At */}
                  <td className="px-3 py-2.5">
                    <div>
                      <span className="tabular-nums text-foreground/80">
                        {conv.timestamp.split(" ").slice(1).join(" ")}
                      </span>
                      <span className="block text-[10px] text-muted-foreground/50 tabular-nums">
                        {conv.timestamp.split(" ")[0]}
                      </span>
                    </div>
                  </td>

                  {/* Duration */}
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Clock className="size-3 text-muted-foreground/40" />
                      <span className="tabular-nums text-foreground/70">{conv.duration}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <MessageSquare className="size-10 opacity-20 mb-3" />
              <p className="text-sm font-medium">No conversations found</p>
              <p className="text-xs mt-1">Try adjusting your search or filters</p>
              <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={clearFilters}>
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
