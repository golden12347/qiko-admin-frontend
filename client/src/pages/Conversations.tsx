// ============================================================
// Conversations — Platform-wide conversation table
// Design: Full-width data table with comprehensive filters,
// sorting, search, and row-click to detail page.
// Palette: qiko-navy base, qiko-indigo accents, semantic colors
// ============================================================

import { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";
import { useLocation } from "wouter";
import { platformConversations, type PlatformConversation } from "@/lib/data";
import { isDateInGlobalRange, useGlobalDateFilter } from "@/contexts/DateFilterContext";

// ── Style Maps ──────────────────────────────────────────────

// ── Sort types ──────────────────────────────────────────────

type SortKey = "id" | "customerName" | "workerName" | "userName" | "channel" | "status" | "conversionStatus" | "revenueOutcome" | "timestamp" | "duration";
type SortDir = "asc" | "desc";
const ROWS_PER_PAGE = 10;

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
  const { filter } = useGlobalDateFilter();
  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [workerFilter, setWorkerFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const dateScopedConversations = useMemo(
    () => platformConversations.filter((c) => isDateInGlobalRange(c.timestamp, filter)),
    [filter]
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (customerFilter.trim()) count++;
    if (workerFilter.trim()) count++;
    if (channelFilter !== "all") count++;
    return count;
  }, [customerFilter, workerFilter, channelFilter]);

  const filtered = useMemo(() => {
    const result = dateScopedConversations.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.userName.toLowerCase().includes(q) ||
        c.workerName.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.userId.toLowerCase().includes(q);
      const customerQ = customerFilter.trim().toLowerCase();
      const workerQ = workerFilter.trim().toLowerCase();
      const matchCustomer = !customerQ || c.customerName.toLowerCase().includes(customerQ);
      const matchWorker = !workerQ || c.workerName.toLowerCase().includes(workerQ);
      const matchChannel = channelFilter === "all" || c.channel === channelFilter;
      return matchSearch && matchCustomer && matchWorker && matchChannel;
    });
    return sortConversations(result, sortKey, sortDir);
  }, [search, customerFilter, workerFilter, channelFilter, sortKey, sortDir, dateScopedConversations]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return filtered.slice(start, start + ROWS_PER_PAGE);
  }, [filtered, page]);

  const stats = useMemo(() => {
    const total = dateScopedConversations.length;
    return { total };
  }, [dateScopedConversations]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function clearFilters() {
    setCustomerFilter("");
    setWorkerFilter("");
    setChannelFilter("all");
    setSearch("");
  }

  useEffect(() => {
    setPage(1);
  }, [
    search,
    customerFilter,
    workerFilter,
    channelFilter,
    sortKey,
    sortDir,
    filter,
  ]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

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
            <Input
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              placeholder="Search customer..."
              className="w-[180px] h-8 text-xs bg-secondary/30 border-border/30"
            />
            <Input
              value={workerFilter}
              onChange={(e) => setWorkerFilter(e.target.value)}
              placeholder="Search worker..."
              className="w-[180px] h-8 text-xs bg-secondary/30 border-border/30"
            />
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
                <th className="text-left font-medium text-muted-foreground px-3 py-2.5 w-[140px]">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => handleSort("timestamp")}>
                    Started At <SortIcon col="timestamp" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((conv, i) => (
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
                    <span className="text-foreground/90">{conv.userName}</span>
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
                </tr>
              ))}
            </tbody>
          </table>

          {/* Empty state */}
          {paginated.length === 0 && (
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

      <div className="shrink-0 px-6 py-3 border-t border-border/30 flex items-center justify-end gap-2 text-xs text-muted-foreground">
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
      </div>
    </div>
  );
}
