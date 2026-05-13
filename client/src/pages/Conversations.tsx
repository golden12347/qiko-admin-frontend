// ============================================================
// Conversations — Platform-wide conversation table
// API-backed list with server-side pagination
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  MessageSquare,
  Globe,
  Phone,
  Download,
} from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { adminConversationList, type ConversationListApiResponse } from "@/services/adminConversationsApi";
import { useGlobalDateFilter } from "@/contexts/DateFilterContext";
import {
  ConversationsSearchRowSkeleton,
  ConversationsTableSkeletonRows,
} from "@/components/tabPageSkeletons";

interface ConversationRow {
  id: string;
  customerName: string; // requirement: user_name
  workerName: string;   // requirement: agent_name
  userName: string;
  channel: string;
  startedAt: string;    // requirement: joined_at
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatStartedAt(value: string): string {
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value || "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function extractConversationArray(payload: ConversationListApiResponse): unknown[] {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.conversations)) return payload.conversations;

  const nested = payload?.data as Record<string, unknown> | undefined;
  if (nested) {
    if (Array.isArray(nested.data)) return nested.data;
    if (Array.isArray(nested.items)) return nested.items;
    if (Array.isArray(nested.conversations)) return nested.conversations;
  }
  return [];
}

function normalizeConversation(item: unknown): ConversationRow {
  const row = (item ?? {}) as Record<string, unknown>;
  const members = Array.isArray(row.members) ? (row.members as Record<string, unknown>[]) : [];
  const adminMember = members.find((m) => String(m.role ?? "").toLowerCase() === "admin");
  const nonAdminMember = members.find((m) => String(m.role ?? "").toLowerCase() !== "admin");

  // Requirement: role=admin -> Worker uses agent_name
  const workerName = String(
    adminMember?.agent_name ??
    row.agent_name ??
    row.worker_name ??
    row.workerName ??
    "—"
  );

  // Keep Customer column based on user_name
  const customerName = String(
    nonAdminMember?.user_name ??
    adminMember?.user_name ??
    row.user_name ??
    row.customer_name ??
    row.customerName ??
    row.created_by_user_name ??
    "—"
  );

  // Requirement: non-admin member -> User / Visitor uses agent_name
  const userName = String(
    nonAdminMember?.agent_name ??
    row.user_name ??
    row.userName ??
    row.visitor_name ??
    "—"
  );

  const rawId = String(row.id ?? row.conversation_id ?? slugify(`${workerName}-${customerName}`));

  return {
    id: rawId,
    workerName,
    customerName,
    userName,
    channel: String(row.channel ?? "Web"),
    startedAt: String(
      adminMember?.joined_at ??
      nonAdminMember?.joined_at ??
      row.joined_at ??
      row.started_at ??
      row.conversation_created_at ??
      row.created_at ??
      row.timestamp ??
      "—"
    ),
  };
}

function readSearchQueryParam(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("search") ?? "";
}

export default function Conversations() {
  const [, navigate] = useLocation();
  const rawSearch = useSearch();
  const searchFromUrl = useMemo(() => new URLSearchParams(rawSearch || "").get("search") ?? "", [rawSearch]);

  const initialSearch = readSearchQueryParam();
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [committedSearch, setCommittedSearch] = useState(initialSearch);
  const skipPageResetOnMount = useRef(true);

  const { filter } = useGlobalDateFilter();
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<ConversationRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminConversationList(page, filter, committedSearch);
      const items = extractConversationArray(data).map((item) => normalizeConversation(item));
      setRows(items);

      const nested = data?.data as Record<string, unknown> | undefined;
      const total = toNumber(
        data?.meta?.total ??
        data?.total ??
        (nested?.total as unknown) ??
        items.length,
        items.length
      );
      const pages = toNumber(
        data?.meta?.last_page ??
        data?.last_page ??
        (nested?.last_page as unknown),
        1
      );
      setTotalItems(total);
      setTotalPages(Math.max(1, pages));
    } catch {
      toast.error("Failed to fetch conversations list.");
      setRows([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [filter, page, committedSearch]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

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
    const next = qs ? `/conversations?${qs}` : "/conversations";
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

  const filtered = rows;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
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

        <div className="flex items-center gap-2 mt-3">
          {isLoading ? (
            <ConversationsSearchRowSkeleton />
          ) : (
            <>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, customer, worker..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="h-8 pl-8 text-xs bg-secondary/30 border-border/30"
                />
              </div>
              {searchInput.trim() && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSearchInput("");
                    setCommittedSearch("");
                  }}
                >
                  Clear search
                </Button>
              )}
              <span className="text-xs text-muted-foreground ml-auto tabular-nums">
                {filtered.length} on this page · {totalItems} total
              </span>
            </>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="min-w-[1100px]">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-secondary/40 border-b border-border/30">
                <th className="text-left font-medium text-muted-foreground px-4 py-2.5 w-[100px]">Conv ID</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2.5">Customer</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2.5">Worker</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2.5">User / Visitor</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2.5 w-[90px]">Channel</th>
                <th className="text-left font-medium text-muted-foreground px-3 py-2.5 w-[180px]">Started At</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <ConversationsTableSkeletonRows />}
              {!isLoading && filtered.map((conv) => (
                <tr
                  key={conv.id}
                  className="border-b border-border/15 hover:bg-secondary/20 cursor-pointer transition-colors group"
                  onClick={() => navigate(`/conversation-detail?conversationId=${encodeURIComponent(conv.id)}`)}
                >
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-[11px] text-muted-foreground group-hover:text-qiko-indigo transition-colors">
                      #{conv.id}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-medium">{conv.customerName}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-foreground/80">{conv.workerName}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-foreground/90">{conv.userName}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {conv.channel.toLowerCase() === "web" ? (
                        <Globe className="size-3 text-qiko-indigo" />
                      ) : (
                        <Phone className="size-3 text-qiko-cyan" />
                      )}
                      <span className="text-foreground/70">{conv.channel}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="tabular-nums text-foreground/80">{formatStartedAt(conv.startedAt)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <MessageSquare className="size-10 opacity-20 mb-3" />
              <p className="text-sm font-medium">No conversations found</p>
              <p className="text-xs mt-1">Try adjusting your search</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="shrink-0 px-6 py-3 border-t border-border/30 flex items-center justify-end gap-2 text-xs text-muted-foreground">
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

