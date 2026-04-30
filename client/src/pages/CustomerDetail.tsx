// ============================================================
// Customer Detail — Full account overview for a single customer
// Top summary, KPI cards, workers table, revenue summary,
// activity timeline, and audit history
// Design: Dark Lattice — analytical, Stripe-inspired
// ============================================================

import { useMemo } from "react";
import { useParams, useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  Building2,
  Calendar,
  Mail,
  CreditCard,
  Bot,
  MessageSquare,
  Clock,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import {
  customers,
  platformWorkers,
  platformConversations,
} from "@/lib/data";

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
};

const workerStatusColors: Record<string, string> = {
  Live: "bg-qiko-success/15 text-qiko-success border-qiko-success/20",
  Training: "bg-qiko-cyan/15 text-qiko-cyan border-qiko-cyan/20",
};

const normalizeWorkerStatus = (status: string) => (status === "Live" ? "Live" : "Training");
const normalizeCustomerStatus = (status: string) => (status === "Active" ? "Active" : "Non-active");
const normalizeCustomerPlan = (plan: string) => {
  if (plan === "Enterprise") return "Enterprise";
  if (plan === "Business" || plan === "Growth" || plan === "Premium") return "Premium";
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

/* ── helpers ───────────────────────────────────────────────── */
function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ── component ─────────────────────────────────────────────── */
export default function CustomerDetail() {
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();

  const customer = useMemo(
    () => customers.find((c) => c.slug === params.slug),
    [params.slug]
  );

  const workers = useMemo(
    () => (customer ? platformWorkers.filter((w) => w.customerId === customer.id) : []),
    [customer]
  );

  const conversations = useMemo(
    () => (customer ? platformConversations.filter((c) => c.customerId === customer.id) : []),
    [customer]
  );

  const displayStatus = normalizeCustomerStatus(customer?.status || "");
  const displayPlan = normalizeCustomerPlan(customer?.plan || "");

  if (!customer) {
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
          <span className="text-foreground font-medium">{customer.name}</span>
        </div>
        <Link href="/customers">
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <ArrowLeft className="size-3.5 mr-1.5" />
            Back
          </Button>
        </Link>
      </div>

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
                  {customer.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold font-heading tracking-tight">{customer.name}</h1>
                    <Badge variant="outline" className={`text-xs ${statusColors[displayStatus]}`}>
                      {displayStatus}
                    </Badge>
                    <Badge variant="secondary" className={`text-xs border-0 ${planColors[displayPlan]}`}>
                      {displayPlan}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{customer.industry} · {customer.country}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-x-4 gap-y-2 mt-4">
                    <InfoItem icon={<Mail className="size-3.5" />} label="Contact" value={customer.contactEmail} />
                    <InfoItem icon={<Calendar className="size-3.5" />} label="Joined" value={formatDate(customer.joinedDate)} />
                    <InfoItem icon={<Clock className="size-3.5" />} label="Last Active" value={customer.lastActive} />
                    <InfoItem icon={<CreditCard className="size-3.5" />} label="MRR" value={customer.mrr > 0 ? `$${customer.mrr.toLocaleString()}/mo` : "—"} />
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
                <StatBox icon={<Bot className="size-4" />} label="Workers" value={customer.workersCount} color="text-qiko-indigo" />
                <StatBox icon={<MessageSquare className="size-4" />} label="Conversations" value={fmt(customer.conversationsTotal)} color="text-qiko-cyan" />
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
                Workers ({workers.length})
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] border-0 bg-qiko-success/10 text-qiko-success">
                {workers.filter((w) => w.status === "Live").length} Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {workers.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent bg-secondary/10">
                    <TableHead className="text-xs font-medium text-muted-foreground">Worker Name</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Type</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground text-right">Conversations</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground">Last Active</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workers.map((w) => (
                    <TableRow
                      key={w.id}
                      className="border-border/30 cursor-pointer hover:bg-secondary/30 transition-colors group"
                      onClick={() => navigate(`/workers/${w.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-qiko-indigo/10 text-qiko-indigo text-[10px] font-bold">
                            {w.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium group-hover:text-qiko-indigo transition-colors">{w.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-[10px] border-0 ${workerTypeColors[w.type] || ""}`}>
                          {w.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${workerStatusColors[normalizeWorkerStatus(w.status)]}`}
                        >
                          {normalizeWorkerStatus(w.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{fmt(w.conversationsTotal)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{w.lastActive}</TableCell>
                      <TableCell className="w-8">
                        <ChevronRight className="size-4 text-muted-foreground/30 group-hover:text-qiko-indigo transition-colors" />
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
      {conversations.length > 0 && (
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
                  {conversations.slice(0, 5).map((conv) => (
                    <TableRow key={conv.id} className="border-border/30 hover:bg-secondary/20 transition-colors">
                      <TableCell className="text-sm">{conv.userName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{conv.workerName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] border-0">{conv.channel}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{conv.timestamp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────── */

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-muted-foreground/60">{icon}</span>
      <span className="text-muted-foreground text-xs">{label}:</span>
      <span className="font-medium text-xs truncate">{value}</span>
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
