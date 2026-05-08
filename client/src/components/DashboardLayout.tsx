// ============================================================
// DashboardLayout — Qiko Super Admin Panel
// Platform operations sidebar + top bar with search + main content
// Includes global command palette (Cmd+K) for cross-entity search
// ============================================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Users,
  Bot,
  MessageSquare,
  DollarSign,
  ChevronRight,
  Search,
  CalendarRange,
  Building2,
  ArrowRight,
  Hash,
  LogOut,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGlobalDateFilter } from "@/contexts/DateFilterContext";
import { useAuth } from "@/contexts/AuthContext";
import { adminCustomerList, type CustomerListApiResponse } from "@/services/adminCustomersApi";
import { adminWorkerList, type WorkerListApiResponse } from "@/services/adminWorkersApi";
import { adminConversationList, type ConversationListApiResponse } from "@/services/adminConversationsApi";

const mainNavItems = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Workers", href: "/workers", icon: Bot },
  { label: "Conversations", href: "/conversations", icon: MessageSquare },
  { label: "Revenue", href: "/revenue", icon: DollarSign },
  { label: "Admin Users", href: "/admin-users", icon: Users },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [cmdOpen, setCmdOpen] = useState(false);
  const { filter, setPreset, setCustomStartDate, setCustomEndDate, clearFilter } = useGlobalDateFilter();
  const { currentUser, logout } = useAuth();
  const [searchCustomers, setSearchCustomers] = useState<Array<{ id: string; slug: string; name: string; industry: string; plan: string; status: string }>>([]);
  const [searchWorkers, setSearchWorkers] = useState<Array<{ id: string; name: string; customerName: string; type: string; status: string }>>([]);
  const [searchConversations, setSearchConversations] = useState<Array<{ id: string; userName: string; workerName: string; customerName: string; status: string }>>([]);

  const extractArray = useCallback((payload: { data?: unknown; items?: unknown[]; customers?: unknown[]; workers?: unknown[]; conversations?: unknown[] }) => {
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.customers)) return payload.customers;
    if (Array.isArray(payload.workers)) return payload.workers;
    if (Array.isArray(payload.conversations)) return payload.conversations;
    const nested = payload.data as Record<string, unknown> | undefined;
    if (!nested) return [];
    if (Array.isArray(nested.data)) return nested.data;
    if (Array.isArray(nested.items)) return nested.items;
    if (Array.isArray(nested.customers)) return nested.customers;
    if (Array.isArray(nested.workers)) return nested.workers;
    if (Array.isArray(nested.conversations)) return nested.conversations;
    return [];
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [customersRes, workersRes, conversationsRes] = await Promise.all([
          adminCustomerList(1, filter),
          adminWorkerList(1, filter),
          adminConversationList(1, filter),
        ]);

        const normalizedCustomers = extractArray(customersRes as CustomerListApiResponse)
          .map((item) => {
            const row = (item ?? {}) as Record<string, unknown>;
            const name = String(row.user_name ?? row.name ?? "—");
            const slug =
              String(row.slug ?? "").trim() ||
              name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
            return {
              id: String((row.id ?? row.user_id ?? slug) || crypto.randomUUID()),
              slug: slug || "customer",
              name,
              industry: String(row.industry ?? "—"),
              plan: String(row.subscription_plan_name ?? row.plan ?? "No plan"),
              status: String(row.stripe_status ?? row.status ?? "unknown"),
            };
          })
          .slice(0, 12);
        setSearchCustomers(normalizedCustomers);

        const normalizedWorkers = extractArray(workersRes as WorkerListApiResponse)
          .map((item) => {
            const row = (item ?? {}) as Record<string, unknown>;
            return {
              id: String(row.id ?? row.agent_id ?? crypto.randomUUID()),
              name: String(row.agent_name ?? row.name ?? "—"),
              customerName: String(row.user_name ?? row.customer_name ?? "—"),
              type: String(row.industry ?? row.type ?? "—"),
              status: String(row.status ?? "unknown"),
            };
          })
          .slice(0, 12);
        setSearchWorkers(normalizedWorkers);

        const normalizedConversations = extractArray(conversationsRes as ConversationListApiResponse)
          .map((item) => {
            const row = (item ?? {}) as Record<string, unknown>;
            const members = Array.isArray(row.members) ? (row.members as Record<string, unknown>[]) : [];
            const adminMember = members.find((m) => String(m.role ?? "").toLowerCase() === "admin");
            const nonAdminMember = members.find((m) => String(m.role ?? "").toLowerCase() !== "admin");
            return {
              id: String(row.id ?? row.conversation_id ?? crypto.randomUUID()),
              userName: String(nonAdminMember?.agent_name ?? row.user_name ?? "—"),
              workerName: String(adminMember?.agent_name ?? row.agent_name ?? "—"),
              customerName: String(nonAdminMember?.user_name ?? row.customer_name ?? row.user_name ?? "—"),
              status: String(row.status ?? "unknown"),
            };
          })
          .slice(0, 12);
        setSearchConversations(normalizedConversations);
      } catch {
        setSearchCustomers([]);
        setSearchWorkers([]);
        setSearchConversations([]);
      }
    })();
  }, [extractArray, filter]);

  const hasSearchResults = useMemo(
    () => searchCustomers.length > 0 || searchWorkers.length > 0 || searchConversations.length > 0,
    [searchConversations.length, searchCustomers.length, searchWorkers.length]
  );

  // Global Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = useCallback((href: string) => {
    setCmdOpen(false);
    setLocation(href);
  }, [setLocation]);

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <span className="inline-flex h-7 items-center rounded-md bg-qiko-indigo/15 px-2 text-sm font-semibold text-qiko-indigo group-data-[collapsible=icon]:h-6">
              Qiko
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">
              Platform
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavItems.map((item) => {
                  const isActive = item.href === "/"
                    ? location === "/"
                    : location.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                        className="h-9"
                      >
                        <Link href={item.href}>
                          <item.icon className="size-4" />
                          <span className="text-sm">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

        </SidebarContent>

        <SidebarFooter className="p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-qiko-indigo/20 text-xs font-semibold text-qiko-indigo">
                {currentUser?.name?.slice(0, 2).toUpperCase() || "QA"}
              </div>
              <div className="flex-1 group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-medium leading-none">{currentUser?.name || "Qiko Admin"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{currentUser?.role || "Platform Ops"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                await logout();
                setLocation("/login");
              }}
              className="w-full h-8 px-3 rounded-md border border-border/40 bg-secondary/40 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors flex items-center justify-center gap-1.5 group-data-[collapsible=icon]:px-0"
            >
              <LogOut className="size-3.5" />
              <span className="group-data-[collapsible=icon]:hidden">Logout</span>
            </button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {/* Top bar */}
        <header className="flex h-14 items-center gap-3 border-b border-border/50 px-6">
          <SidebarTrigger className="-ml-2" />
          <Separator orientation="vertical" className="h-5" />
          <Breadcrumb location={location} />
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => setCmdOpen(true)}
              className="relative flex items-center gap-2 h-8 w-64 rounded-md border border-border/50 bg-secondary/50 px-3 text-sm text-muted-foreground hover:bg-secondary/70 hover:border-border/70 transition-colors"
            >
              <Search className="size-3.5" />
              <span>Search</span>
              <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-0.5 rounded border border-border/50 bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
            <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-secondary/40 p-1">
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground px-1.5">
                <CalendarRange className="size-3.5" />
                Date
              </span>
              {[
                { id: "today", label: "Today" },
                { id: "7d", label: "7D" },
                { id: "30d", label: "30D" },
                { id: "90d", label: "90D" },
                { id: "12m", label: "12M" },
                { id: "all", label: "All" },
                { id: "custom", label: "Custom" },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setPreset(preset.id as typeof filter.preset)}
                  className={`h-6 px-2 rounded-md text-[11px] transition-colors ${
                    filter.preset === preset.id
                      ? "bg-qiko-indigo text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {filter.preset === "custom" && (
              <>
                <Input
                  type="date"
                  value={filter.customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="h-8 w-[136px] bg-secondary/50 border-border/50 text-xs"
                />
                <Input
                  type="date"
                  value={filter.customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="h-8 w-[136px] bg-secondary/50 border-border/50 text-xs"
                />
                <button
                  type="button"
                  onClick={clearFilter}
                  className="h-8 px-2.5 rounded-md border border-border/50 bg-secondary/50 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors"
                >
                  Reset
                </button>
              </>
            )}
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </SidebarInset>

      {/* ── Command Palette ──────────────────────────────────── */}
      <CommandDialog
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        title="Search"
        description="Search across customers, workers, and conversations"
        showCloseButton={false}
      >
        <CommandInput placeholder="Search customers, workers, conversations..." />
        <CommandList className="max-h-[400px]">
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Pages */}
          <CommandGroup heading="Pages">
            {mainNavItems.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => handleSelect(item.href)}
                className="gap-3"
              >
                <item.icon className="size-4 text-muted-foreground" />
                <span>{item.label}</span>
                <ArrowRight className="size-3 ml-auto text-muted-foreground/50" />
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* Customers */}
          <CommandGroup heading="Customers">
            {searchCustomers.map((c) => (
              <CommandItem
                key={c.id}
                value={`customer ${c.name} ${c.industry} ${c.plan}`}
                onSelect={() => handleSelect(`/customers/${encodeURIComponent(c.slug)}?userId=${encodeURIComponent(c.id)}`)}
                className="gap-3"
              >
                <Building2 className="size-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm">{c.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{c.industry} · {c.plan}</span>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-[10px] px-1.5 py-0 h-4 border-0 ${
                    String(c.status).toLowerCase() === "active" ? "bg-emerald-400/10 text-emerald-400" :
                    String(c.status).toLowerCase() === "trial" ? "bg-blue-400/10 text-blue-400" :
                    String(c.status).toLowerCase() === "churned" ? "bg-rose-400/10 text-rose-400" :
                    "bg-amber-400/10 text-amber-400"
                  }`}
                >
                  {c.status}
                </Badge>
              </CommandItem>
            ))}
            {searchCustomers.length === 0 && (
              <CommandItem disabled className="text-xs text-muted-foreground">
                No customers available
              </CommandItem>
            )}
          </CommandGroup>

          <CommandSeparator />

          {/* Workers */}
          <CommandGroup heading="Workers">
            {searchWorkers.map((w) => (
              <CommandItem
                key={w.id}
                value={`worker ${w.name} ${w.customerName} ${w.type}`}
                onSelect={() => handleSelect("/workers")}
                className="gap-3"
              >
                <Bot className="size-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm">{w.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{w.customerName} · {w.type}</span>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-[10px] px-1.5 py-0 h-4 border-0 ${
                    String(w.status).toLowerCase() === "live" || String(w.status).toLowerCase() === "ready" ? "bg-emerald-400/10 text-emerald-400" :
                    String(w.status).toLowerCase() === "training" ? "bg-blue-400/10 text-blue-400" :
                    String(w.status).toLowerCase() === "paused" ? "bg-amber-400/10 text-amber-400" :
                    "bg-rose-400/10 text-rose-400"
                  }`}
                >
                  {w.status}
                </Badge>
              </CommandItem>
            ))}
            {searchWorkers.length === 0 && (
              <CommandItem disabled className="text-xs text-muted-foreground">
                No workers available
              </CommandItem>
            )}
          </CommandGroup>

          <CommandSeparator />

          {/* Conversations */}
          <CommandGroup heading="Recent Conversations">
            {searchConversations.slice(0, 8).map((conv) => (
              <CommandItem
                key={conv.id}
                value={`conversation ${conv.id} ${conv.userName} ${conv.workerName} ${conv.customerName}`}
                onSelect={() => handleSelect(`/conversation-detail?conversationId=${encodeURIComponent(conv.id)}`)}
                className="gap-3"
              >
                <Hash className="size-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm">{conv.id.toUpperCase()}</span>
                  <span className="text-xs text-muted-foreground ml-2">{conv.userName} · {conv.workerName}</span>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-[10px] px-1.5 py-0 h-4 border-0 ${
                    String(conv.status).toLowerCase() === "completed" ? "bg-emerald-400/10 text-emerald-400" :
                    String(conv.status).toLowerCase() === "active" ? "bg-blue-400/10 text-blue-400" :
                    String(conv.status).toLowerCase() === "escalated" ? "bg-amber-400/10 text-amber-400" :
                    "bg-rose-400/10 text-rose-400"
                  }`}
                >
                  {conv.status}
                </Badge>
              </CommandItem>
            ))}
            {searchConversations.length === 0 && (
              <CommandItem disabled className="text-xs text-muted-foreground">
                No conversations available
              </CommandItem>
            )}
          </CommandGroup>
          {!hasSearchResults && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Info">
                <CommandItem disabled className="text-xs text-muted-foreground">
                  Search data will appear after API responds.
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </SidebarProvider>
  );
}

function Breadcrumb({ location }: { location: string }) {
  const segments = location.split("/").filter(Boolean);

  const labelMap: Record<string, string> = {
    customers: "Customers",
    workers: "Workers",
    conversations: "Conversations",
    revenue: "Revenue",
    activity: "Activity Logs",
  };

  if (segments.length === 0) {
    return (
      <nav className="flex items-center text-sm text-muted-foreground">
        <span className="text-foreground font-medium">Overview</span>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Link href="/" className="hover:text-foreground transition-colors">
        Overview
      </Link>
      {segments.map((segment, index) => (
        <span key={index} className="flex items-center gap-1.5">
          <ChevronRight className="size-3.5" />
          <span className={index === segments.length - 1 ? "text-foreground font-medium" : "hover:text-foreground transition-colors"}>
            {labelMap[segment] || segment.replace(/-/g, " ")}
          </span>
        </span>
      ))}
    </nav>
  );
}
