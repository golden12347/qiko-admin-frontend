// ============================================================
// DashboardLayout — Qiko Super Admin Panel
// Platform operations sidebar + top bar + main content
// ============================================================

import { Link, useLocation } from "wouter";
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
  LayoutDashboard,
  Users,
  Bot,
  MessageSquare,
  DollarSign,
  ChevronRight,
  CalendarRange,
  LogOut,
} from "lucide-react";
import { useGlobalDateFilter } from "@/contexts/DateFilterContext";
import { useAuth } from "@/contexts/AuthContext";

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
  const { filter, setPreset, setCustomStartDate, setCustomEndDate, clearFilter } = useGlobalDateFilter();
  const { currentUser, logout } = useAuth();

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
