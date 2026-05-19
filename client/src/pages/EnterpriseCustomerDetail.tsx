// ============================================================
// Enterprise Customer Detail — Account overview (UI-only mock)
// ============================================================

import { useEffect, useMemo, useState } from "react";
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
  Bot,
  MessageSquare,
  DollarSign,
  Users,
  ChevronRight,
  Link2,
  CreditCard,
} from "lucide-react";
import {
  getEnterpriseById,
  getEnterpriseBySlug,
  getEnterpriseCustomers,
  getTeamMembersForCustomer,
  getWorkersForCustomer,
  getConversationsForCustomer,
  updateEnterpriseCustomer,
  canSendPaymentLink,
  getEnterpriseStatusLabel,
  type EnterpriseCustomer,
} from "@/lib/enterpriseData";
import { PaymentLinkDialog } from "@/components/enterprise/PaymentLinkDialog";
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

const statusColors: Record<string, string> = {
  Active: "bg-qiko-success/15 text-qiko-success border-qiko-success/20",
  "Pending payment": "bg-qiko-warning/15 text-qiko-warning border-qiko-warning/20",
};

const workerStatusColors: Record<string, string> = {
  live: "bg-qiko-success/15 text-qiko-success border-qiko-success/20",
  training: "bg-qiko-cyan/15 text-qiko-cyan border-qiko-cyan/20",
};

const teamStatusColors: Record<string, string> = {
  Active: "bg-qiko-success/15 text-qiko-success border-qiko-success/20",
  Invited: "bg-qiko-cyan/15 text-qiko-cyan border-qiko-cyan/20",
  Inactive: "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/20",
};

const workerTypeColors: Record<string, string> = {
  sales: "bg-violet-500/10 text-violet-400",
  support: "bg-blue-500/10 text-blue-400",
  onboarding: "bg-cyan-500/10 text-cyan-400",
};

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

function formatCurrency(n: number): string {
  return `$${n.toLocaleString()}`;
}

function formatWorkerTypeLabel(value: string): string {
  const s = value.replace(/_/g, " ").trim();
  if (!s) return "—";
  return s
    .split(/\s+/)
    .map((word) => (word.length === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
    .join(" ");
}

function formatWorkerStatusDisplay(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function EnterpriseCustomerDetail() {
  const params = useParams<{ slug: string }>();
  const [location] = useLocation();

  const selectedUserId = useMemo(() => {
    const queryString = typeof window !== "undefined" ? window.location.search : "";
    const userId = new URLSearchParams(queryString).get("userId");
    return userId && userId.length > 0 ? userId : null;
  }, [location]);

  const initialCustomer = useMemo(() => {
    const all = getEnterpriseCustomers();
    if (selectedUserId) return getEnterpriseById(all, selectedUserId);
    if (params.slug) return getEnterpriseBySlug(all, params.slug);
    return undefined;
  }, [selectedUserId, params.slug]);

  const [customer, setCustomer] = useState<EnterpriseCustomer | undefined>(initialCustomer);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  useEffect(() => {
    setCustomer(initialCustomer);
  }, [initialCustomer]);

  const resolvedCustomer = customer ?? initialCustomer;
  const customerId = resolvedCustomer?.id ?? "";

  const teamMembers = useMemo(
    () => (customerId ? getTeamMembersForCustomer(customerId) : []),
    [customerId]
  );

  const workers = useMemo(
    () => (customerId ? getWorkersForCustomer(customerId) : []),
    [customerId]
  );

  const conversations = useMemo(
    () => (customerId ? getConversationsForCustomer(customerId) : []),
    [customerId]
  );

  const paymentLinkAllowed = resolvedCustomer ? canSendPaymentLink(resolvedCustomer) : false;

  const handlePaymentConfirm = (amount: number) => {
    if (!resolvedCustomer || !canSendPaymentLink(resolvedCustomer)) return;
    const today = new Date().toISOString().slice(0, 10);
    const patch = {
      subscriptionAmount: amount,
      lastPaymentLinkSent: today,
    };
    updateEnterpriseCustomer(resolvedCustomer.id, patch);
    setCustomer((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  if (!resolvedCustomer) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[60vh] gap-4">
        <Building2 className="size-12 text-muted-foreground/30" />
        <p className="text-muted-foreground">Enterprise customer not found.</p>
        <Link href="/enterprise">
          <Button variant="outline" size="sm">
            <ArrowLeft className="size-4 mr-2" /> Back to Enterprise
          </Button>
        </Link>
      </div>
    );
  }

  const displayName = resolvedCustomer.name;
  const displayWorkersCount = workers.length > 0 ? workers.length : resolvedCustomer.workersCount;
  const displayConversations =
    resolvedCustomer.conversationsTotal > 0
      ? resolvedCustomer.conversationsTotal
      : conversations.length;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1240px] mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/enterprise" className="hover:text-foreground transition-colors">
            Enterprise
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{displayName}</span>
        </div>
        <div className="flex items-center gap-2">
          {paymentLinkAllowed ? (
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => setPaymentDialogOpen(true)}
            >
              <Link2 className="size-3.5" />
              Create Payment Link
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground max-w-[220px] text-right">
              {resolvedCustomer.status === "Active"
                ? "Customer is subscribed — payment link already used"
                : "Payment link already sent"}
            </span>
          )}
          <Link href="/enterprise">
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <ArrowLeft className="size-3.5 mr-1.5" />
              Back
            </Button>
          </Link>
        </div>
      </div>

      <motion.div
        className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.div variants={fadeUp} custom={0}>
          <Card className="bg-card border-border/50 h-full shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-qiko-warning/12 text-qiko-warning font-bold text-xl ring-1 ring-qiko-warning/20">
                  {displayName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold font-heading tracking-tight">{displayName}</h1>
                    <Badge variant="outline" className={`text-xs ${statusColors[resolvedCustomer.status]}`}>
                      {getEnterpriseStatusLabel(resolvedCustomer)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs border-0 bg-qiko-warning/10 text-qiko-warning">
                      Enterprise
                    </Badge>
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    <InfoItem icon={<Mail className="size-3.5" />} label="Contact" value={resolvedCustomer.email} />
                    <InfoItem
                      icon={<Calendar className="size-3.5" />}
                      label="Joined"
                      value={formatDate(resolvedCustomer.joinedDate)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} custom={1}>
          <Card className="bg-card border-border/50 h-full shadow-sm">
            <CardContent className="p-5">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                Account Summary
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <StatBox
                  icon={<DollarSign className="size-4" />}
                  label="Revenue"
                  value={formatCurrency(resolvedCustomer.revenue)}
                  color="text-qiko-success"
                />
                <StatBox
                  icon={<Bot className="size-4" />}
                  label="Workers"
                  value={displayWorkersCount}
                  color="text-qiko-indigo"
                />
                <StatBox
                  icon={<MessageSquare className="size-4" />}
                  label="Conversations"
                  value={fmt(displayConversations)}
                  color="text-qiko-cyan"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="py-3 border-b border-border/50">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="size-4 text-qiko-indigo" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Monthly amount</p>
                <p className="font-medium tabular-nums">
                  {resolvedCustomer.subscriptionAmount != null
                    ? `${formatCurrency(resolvedCustomer.subscriptionAmount)}/mo`
                    : "Not set"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge variant="outline" className={`text-[10px] ${statusColors[resolvedCustomer.status]}`}>
                  {getEnterpriseStatusLabel(resolvedCustomer)}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Next payment date</p>
                <p className="font-medium">
                  {resolvedCustomer.nextPaymentDate
                    ? formatDate(resolvedCustomer.nextPaymentDate)
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Last payment link sent</p>
                <p className="font-medium">
                  {resolvedCustomer.lastPaymentLinkSent
                    ? formatDate(resolvedCustomer.lastPaymentLinkSent)
                    : "Not sent"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }}>
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="py-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="size-4 text-qiko-indigo" />
                Team Members ({teamMembers.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {teamMembers.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40 hover:bg-transparent bg-secondary/10">
                      <TableHead className="text-xs font-medium text-muted-foreground">Name</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground">Email</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground">Role</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground">Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.map((m) => (
                      <TableRow key={m.id} className="border-border/30">
                        <TableCell className="text-sm font-medium">{m.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{m.email}</TableCell>
                        <TableCell className="text-sm">{m.role}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${teamStatusColors[m.status]}`}>
                            {m.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(m.joinedDate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No team members yet.
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}>
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="py-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bot className="size-4 text-qiko-indigo" />
                Workers ({workers.length})
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] border-0 bg-qiko-success/10 text-qiko-success">
                {workers.filter((w) => w.status === "live").length} Live
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
                      <TableHead className="text-xs font-medium text-muted-foreground text-right">
                        Conversations
                      </TableHead>
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workers.map((w) => (
                      <TableRow key={w.id} className="border-border/30">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-qiko-indigo/10 text-qiko-indigo text-[10px] font-bold">
                              {w.name.charAt(0)}
                            </div>
                            <span className="text-sm font-medium">{w.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] border-0 ${workerTypeColors[w.type] || ""}`}
                          >
                            {formatWorkerTypeLabel(w.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${workerStatusColors[w.status]}`}
                          >
                            {formatWorkerStatusDisplay(w.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">
                          {fmt(w.conversationsTotal)}
                        </TableCell>
                        <TableCell className="w-8">
                          <ChevronRight className="size-4 text-muted-foreground/30" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">No workers found.</div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.25 }}>
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="py-3 border-b border-border/50">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="size-4 text-muted-foreground" />
              Recent Conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {conversations.length > 0 ? (
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
                      <TableRow key={conv.id} className="border-border/30">
                        <TableCell className="text-sm">{conv.userName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{conv.workerName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px] border-0">
                            {conv.channel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(conv.timestamp)}
                        </TableCell>
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

      {paymentLinkAllowed && (
        <PaymentLinkDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          customerName={resolvedCustomer.name}
          customerEmail={resolvedCustomer.email}
          onConfirm={handlePaymentConfirm}
        />
      )}
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm min-w-0">
      <span className="text-muted-foreground/60">{icon}</span>
      <span className="text-muted-foreground text-xs">{label}:</span>
      <span className="font-medium text-xs truncate min-w-0">{value}</span>
    </div>
  );
}

function StatBox({
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
    <div className="rounded-lg bg-secondary/30 p-3 text-center">
      <div className={`flex items-center justify-center gap-1.5 mb-1 ${color} opacity-60`}>{icon}</div>
      <p className={`text-base font-bold font-heading tabular-nums ${color}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
