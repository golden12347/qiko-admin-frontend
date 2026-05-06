/*
 * ConversationDetail.tsx — Qiko Super Admin Panel
 * Design: Dark Lattice — structured dark-mode with indigo/cyan accents
 * Layout: Two-column split — transcript left, summary/metadata right
 * Sections: Conversation Info, Conversion Outcome, Actions Taken, Visitor Metadata
 */
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { platformConversations, customers, platformWorkers } from "@/lib/data";
import { adminConversationDetails } from "@/services/adminConversationDetailsApi";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bot,
  Building2,
  Calendar,
  Globe,
  MessageSquare,
  Phone,
  Star,
  Tag,
  User,
  ArrowUpRight,
  Shield,
} from "lucide-react";
import { useParams, useLocation } from "wouter";

// Mock transcript data per conversation
type TranscriptMessage = {
  role: "user" | "worker" | "system";
  text: string;
  time: string;
  confidence?: number;
  sources?: string[];
};

const transcripts: Record<string, TranscriptMessage[]> = {
  "conv-001": [
    { role: "user", text: "Hi, I'm looking for an enterprise solution for our sales team. We have about 200 reps.", time: "9:42 AM" },
    { role: "worker", text: "Welcome! I'd be happy to help you find the right plan for your team. With 200 sales reps, our Enterprise plan would be the best fit. It includes unlimited workers, priority support, and custom integrations. Can I walk you through the key features?", time: "9:42 AM", confidence: 0.96, sources: ["Enterprise Plan Guide", "Pricing Matrix"] },
    { role: "user", text: "Yes please. What kind of integrations do you support?", time: "9:43 AM" },
    { role: "worker", text: "We integrate with all major CRMs including Salesforce, HubSpot, and Pipedrive. We also support Calendly for booking, Stripe for payments, and VAPI for voice channels. For enterprise clients, we offer custom API integrations as well.", time: "9:43 AM", confidence: 0.98, sources: ["Integration Docs", "Enterprise Features"] },
    { role: "user", text: "That sounds great. We use Salesforce and Calendly. What's the pricing?", time: "9:44 AM" },
    { role: "worker", text: "For 200 reps on the Enterprise plan, we can offer a custom package. The base Enterprise plan starts at $1,999/month with volume discounts available. I'd recommend scheduling a demo with our enterprise team to discuss your specific needs and get a tailored quote. Would you like me to book that for you?", time: "9:44 AM", confidence: 0.94, sources: ["Pricing Matrix", "Enterprise Playbook"] },
    { role: "user", text: "Yes, let's schedule a demo. I'm free next Tuesday afternoon.", time: "9:45 AM" },
    { role: "worker", text: "I've scheduled a demo for Tuesday, March 28th at 2:00 PM EST. You'll receive a calendar invite at sarah@company.com shortly. In the meantime, I can send you our enterprise case studies. Is there anything else I can help with?", time: "9:45 AM", confidence: 0.97, sources: ["Calendly Integration"] },
    { role: "system", text: "Lead captured: sarah@company.com | Booking confirmed: Mar 28, 2:00 PM EST", time: "9:45 AM" },
    { role: "user", text: "That's perfect. Can you also send me the ROI calculator?", time: "9:46 AM" },
    { role: "worker", text: "Absolutely! I've sent the ROI calculator link to your email. Based on similar companies with 200 reps, our clients typically see a 3.2x return within the first 6 months. The demo will cover your specific use case in detail.", time: "9:46 AM", confidence: 0.92, sources: ["ROI Calculator", "Case Studies DB"] },
    { role: "user", text: "Excellent, thank you so much!", time: "9:46 AM" },
    { role: "worker", text: "You're welcome, Sarah! Looking forward to the demo on Tuesday. If you have any questions before then, feel free to reach out anytime. Have a great day!", time: "9:46 AM", confidence: 0.99 },
    { role: "system", text: "Conversation completed | Satisfaction: 5/5 | Payment link sent: $2,400/yr", time: "9:46 AM" },
  ],
  "conv-002": [
    { role: "user", text: "I've been charged twice for my subscription this month. I need this resolved immediately.", time: "9:38 AM" },
    { role: "worker", text: "I'm sorry to hear about the double charge. Let me look into your account right away. Can you confirm the email address associated with your account?", time: "9:38 AM", confidence: 0.91, sources: ["Billing FAQ"] },
    { role: "user", text: "It's james@acmecorp.com. This is unacceptable — I've been a customer for over a year.", time: "9:39 AM" },
    { role: "worker", text: "I completely understand your frustration, James. I can see your account and I'm checking the billing records now. It appears there was a system processing error on March 23rd that caused a duplicate charge of $499.", time: "9:39 AM", confidence: 0.87, sources: ["Billing System"] },
    { role: "user", text: "I want a full refund for the duplicate charge AND some kind of credit for the inconvenience.", time: "9:40 AM" },
    { role: "worker", text: "I understand. Unfortunately, I'm not authorized to process refunds or apply account credits directly. Let me escalate this to our billing team who can resolve this for you right away. They'll be able to process the refund and discuss compensation.", time: "9:40 AM", confidence: 0.62, sources: ["Escalation Policy"] },
    { role: "system", text: "Conversation escalated to human agent — Reason: billing dispute, refund authorization required", time: "9:41 AM" },
    { role: "user", text: "Fine, but I expect this to be resolved today.", time: "9:41 AM" },
    { role: "worker", text: "Absolutely. I've flagged this as urgent and our billing team lead has been notified. You should hear back within 2 hours. I've also documented the full issue so you won't need to repeat anything. Is there anything else I can help with in the meantime?", time: "9:42 AM", confidence: 0.88, sources: ["Escalation Policy", "SLA Guidelines"] },
  ],
  "conv-004": [
    { role: "user", text: "I need to understand your insurance industry solutions. We're evaluating AI platforms.", time: "9:35 AM" },
    { role: "worker", text: "Great to hear you're exploring AI solutions for insurance! We specialize in helping insurance companies automate customer interactions, from policy inquiries to claims processing. What specific areas are you looking to improve?", time: "9:35 AM", confidence: 0.95, sources: ["Insurance Vertical Guide"] },
    { role: "user", text: "Primarily claims intake and policy renewals. We handle about 50,000 policies.", time: "9:36 AM" },
    { role: "worker", text: "With that volume, our Enterprise plan with voice integration would be ideal. Our insurance clients typically automate 70% of claims intake and see a 40% improvement in renewal rates. Would you like to see a live demo tailored to insurance workflows?", time: "9:36 AM", confidence: 0.97, sources: ["Insurance Case Study", "Enterprise Features"] },
    { role: "user", text: "Yes, and I'd also like to understand your compliance capabilities.", time: "9:37 AM" },
    { role: "worker", text: "Absolutely. We're SOC 2 Type II certified and HIPAA compliant. For insurance, we also support state-specific regulatory requirements. Our workers can be configured with compliance guardrails to ensure every interaction meets your regulatory standards. Let me book a specialized demo for you.", time: "9:37 AM", confidence: 0.93, sources: ["Compliance Docs", "Insurance Regulatory Guide"] },
    { role: "system", text: "Lead captured: michael@insuretech.com | Demo booked: Mar 28, 2:00 PM", time: "9:38 AM" },
    { role: "user", text: "Perfect. Can you also include pricing for voice channels?", time: "9:38 AM" },
    { role: "worker", text: "Of course! Voice channels are included in our Enterprise plan at no extra cost. For 50,000 policies, I'd estimate your monthly investment at around $4,800 with a projected ROI of 5.2x in the first year. I'll include detailed pricing in the demo materials.", time: "9:39 AM", confidence: 0.94, sources: ["Pricing Matrix", "Voice Channel Docs"] },
    { role: "system", text: "Payment link sent: $4,800/mo Enterprise + Voice | Subscription confirmed", time: "9:40 AM" },
  ],
};

// Generate a default transcript for conversations without specific data
function getDefaultTranscript(convId: string) {
  const c = platformConversations.find(x => x.id === convId);
  if (!c) return [];
  const msgs: TranscriptMessage[] = [
    { role: "user", text: `Hi, I have a question about your services.`, time: c.timestamp.split(" ").slice(1).join(" ").replace(" AM", " AM").replace(" PM", " PM") || "9:00 AM" },
    { role: "worker", text: `Hello ${c.userName !== "Anonymous" ? c.userName : "there"}! I'd be happy to help. What would you like to know?`, time: c.timestamp.split(" ").slice(1).join(" ") || "9:00 AM", confidence: 0.94, sources: ["General FAQ"] },
  ];
  if (c.messagesCount > 4) {
    msgs.push({ role: "user", text: "Can you tell me more about pricing and features?", time: "9:02 AM" });
    msgs.push({ role: "worker", text: "Of course! Let me walk you through our plans and how they can help your business.", time: "9:02 AM", confidence: 0.91, sources: ["Pricing Guide"] });
  }
  if (c.leadCaptured) {
    msgs.push({ role: "system", text: `Lead captured: ${c.userName}`, time: "9:05 AM" });
  }
  if (c.bookingMade) {
    msgs.push({ role: "system", text: "Booking confirmed via Calendly", time: "9:06 AM" });
  }
  if (c.status === "Escalated") {
    msgs.push({ role: "system", text: "Conversation escalated to human agent", time: "9:07 AM" });
  }
  if (c.status === "Dropped") {
    msgs.push({ role: "system", text: "User left the conversation", time: "9:03 AM" });
  }
  return msgs;
}

function formatTranscriptDateTime(value: string): string {
  const normalized = value.includes(" ") ? value.replace(" ", "T") : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value || "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function capitalizeFirstWordFirstLetter(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return value;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export default function ConversationDetail() {
  const { id } = useParams<{ id: string }>();
  const [location, navigate] = useLocation();
  const [apiTranscript, setApiTranscript] = useState<TranscriptMessage[] | null>(null);
  const [apiWorkerName, setApiWorkerName] = useState<string | null>(null);
  const [apiUserName, setApiUserName] = useState<string | null>(null);
  const [apiWorkerIndustry, setApiWorkerIndustry] = useState<string | null>(null);
  const [apiStartedAt, setApiStartedAt] = useState<string | null>(null);
  const c = platformConversations.find(x => x.id === id);
  const cForUi = c ?? platformConversations[0];
  const selectedConversationId = useMemo(() => {
    const queryString = typeof window !== "undefined" ? window.location.search : "";
    const conversationId = new URLSearchParams(queryString).get("conversationId");
    return conversationId && conversationId.length > 0 ? conversationId : null;
  }, [location]);

  useEffect(() => {
    const conversationIdForApi = selectedConversationId ?? id;
    if (!conversationIdForApi) return;
    (async () => {
      try {
        const response = await adminConversationDetails(conversationIdForApi);
        const dataObj = (response?.data ?? {}) as Record<string, unknown>;
        const userData = dataObj.user;
        let userNameFromApi: string | null = null;
        if (Array.isArray(userData) && userData.length > 0) {
          const firstUser = userData[0] as Record<string, unknown>;
          userNameFromApi = String(firstUser?.user_name ?? "").trim() || null;
        } else if (userData && typeof userData === "object") {
          const userObj = userData as Record<string, unknown>;
          userNameFromApi = String(userObj?.user_name ?? "").trim() || null;
        }
        setApiUserName(userNameFromApi);

        const members = Array.isArray(dataObj.members)
          ? (dataObj.members as Array<Record<string, unknown>>)
          : [];
        const adminMember = members.find(
          (member) => String(member.role ?? "").toLowerCase() === "admin"
        );
        const memberRoleUser = members.find(
          (member) => String(member.role ?? "").toLowerCase() === "member"
        );
        const workerNameFromMembers = String(adminMember?.agent_name ?? "").trim() || null;
        const workerIndustryFromMembers = String(adminMember?.industry ?? "").trim() || null;
        const startedAtFromMembers = String(memberRoleUser?.joined_at ?? "").trim() || null;
        setApiWorkerName(workerNameFromMembers);
        setApiWorkerIndustry(workerIndustryFromMembers);
        setApiStartedAt(startedAtFromMembers);

        const rawMessages = Array.isArray(response?.data?.messages) ? response.data.messages : [];
        const normalized = rawMessages.map((item) => {
          const row = (item ?? {}) as Record<string, unknown>;
          const senderRoleRaw = String(row.sender_role ?? "").toLowerCase();
          const roleRaw = String(row.role ?? row.sender_role ?? row.sender ?? "").toLowerCase();
          let role: TranscriptMessage["role"];
          if (senderRoleRaw === "admin") {
            role = "worker"; // Left side
          } else if (senderRoleRaw.length > 0) {
            role = "user"; // Right side
          } else if (roleRaw === "system") {
            role = "system";
          } else if (roleRaw === "worker" || roleRaw === "assistant" || roleRaw === "bot") {
            role = "worker";
          } else {
            role = "user";
          }
          return {
            role,
            text: String(row.text ?? row.message ?? row.content ?? "—"),
            time: String(row.time ?? row.created_at ?? row.timestamp ?? "—"),
          };
        });
        setApiTranscript(normalized);
      } catch {
        setApiTranscript(null);
        setApiWorkerName(null);
        setApiUserName(null);
        setApiWorkerIndustry(null);
        setApiStartedAt(null);
      }
    })();
  }, [id, selectedConversationId]);

  if (!cForUi) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <MessageSquare className="size-12 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground">Conversation not found</p>
          <Button variant="outline" size="sm" onClick={() => navigate("/conversations")}>
            <ArrowLeft className="size-3.5 mr-1.5" /> Back to Conversations
          </Button>
        </div>
      </div>
    );
  }

  const customer = customers.find(x => x.id === cForUi.customerId);
  const worker = platformWorkers.find(x => x.id === cForUi.workerId);
  const transcript = apiTranscript && apiTranscript.length > 0 ? apiTranscript : transcripts[cForUi.id] || getDefaultTranscript(cForUi.id);
  const messageCount = apiTranscript !== null ? apiTranscript.length : cForUi.messagesCount;

  const displayUserName = capitalizeFirstWordFirstLetter(apiUserName ?? cForUi.userName);

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-[1300px] mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground" onClick={() => navigate("/conversations")}>
            <ArrowLeft className="size-3.5 mr-1" /> Conversations
          </Button>
        </div>

        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-heading font-bold tracking-tight">{displayUserName}</h1>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><Calendar className="size-3" />{cForUi.timestamp}</span>
              <span className="flex items-center gap-1"><MessageSquare className="size-3" />{messageCount} messages</span>
              <span className="flex items-center gap-1">{cForUi.channel === "Voice" ? <Phone className="size-3" /> : <Globe className="size-3" />}{cForUi.channel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {cForUi.satisfaction && (
              <div className="flex items-center gap-1 text-xs bg-qiko-warning/10 text-qiko-warning border border-qiko-warning/20 px-2 py-1 rounded-md">
                <Star className="size-3 fill-current" />
                {cForUi.satisfaction}/5
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Two-column layout */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
        {/* Left: Transcript */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card className="bg-card border-border/40 min-h-[520px] flex flex-col shadow-sm">
            <CardHeader className="px-5 py-4 border-b border-border/30 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-heading flex items-center gap-2">
                  <MessageSquare className="size-4 text-qiko-indigo" />
                  Conversation Transcript
                </CardTitle>
                <span className="text-[11px] text-muted-foreground tabular-nums">{transcript.length} messages</span>
              </div>
            </CardHeader>
            <ScrollArea className="h-[560px] md:h-[620px]">
              <div className="p-5 space-y-4">
                {transcript.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                  >
                    {msg.role === "system" ? (
                      <div className="flex items-center gap-2 py-2">
                        <Separator className="flex-1 bg-border/10" />
                        <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1 whitespace-nowrap px-2">
                          <Shield className="size-2.5" />
                          {msg.text}
                        </span>
                        <Separator className="flex-1 bg-border/10" />
                      </div>
                    ) : (
                      <div className={`flex gap-3 ${msg.role === "worker" ? "" : "flex-row-reverse"}`}>
                        <div className={`size-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5 ${
                          msg.role === "worker"
                            ? "bg-qiko-indigo/15 text-qiko-indigo border border-qiko-indigo/20"
                            : "bg-qiko-cyan/15 text-qiko-cyan border border-qiko-cyan/20"
                        }`}>
                          {msg.role === "worker" ? <Bot className="size-3.5" /> : <User className="size-3.5" />}
                        </div>
                        <div className={`max-w-[82%] space-y-1 ${msg.role === "worker" ? "" : "text-right"}`}>
                          <div className={`rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${
                            msg.role === "worker"
                              ? "bg-secondary/40 border border-border/30 text-foreground"
                              : "bg-qiko-indigo/10 border border-qiko-indigo/15 text-foreground"
                          }`}>
                            {msg.text}
                          </div>
                          <div className={`flex items-center gap-2 text-[10px] text-muted-foreground/40 ${msg.role === "worker" ? "" : "justify-end"}`}>
                            <span>{formatTranscriptDateTime(msg.time)}</span>
                            {msg.confidence !== undefined && (
                              <span className={`px-1.5 py-0.5 rounded ${
                                msg.confidence >= 0.9 ? "bg-qiko-success/8 text-qiko-success" :
                                msg.confidence >= 0.7 ? "bg-qiko-warning/8 text-qiko-warning" :
                                "bg-qiko-error/8 text-qiko-error"
                              }`}>
                                {(msg.confidence * 100).toFixed(0)}% confidence
                              </span>
                            )}
                            {msg.sources && msg.sources.length > 0 && (
                              <span className="text-muted-foreground/30">
                                Sources: {msg.sources.join(", ")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </motion.div>

        {/* Right: Summary Panel */}
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
          <div className="space-y-3 xl:sticky xl:top-20">
              {/* Conversation Info */}
              <Card className="bg-card border-border/40 shadow-sm">
                <CardHeader className="px-4 py-3 border-b border-border/25">
                  <CardTitle className="text-sm font-heading flex items-center gap-1.5">
                    <MessageSquare className="size-3.5 text-qiko-indigo" />
                    Conversation Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Building2 className="size-3.5" />Customer</span>
                      <button onClick={() => navigate(`/customers/${customer?.slug || ""}`)} className="text-xs text-qiko-indigo hover:underline flex items-center gap-1">
                        {apiUserName ?? cForUi.customerName} <ArrowUpRight className="size-2.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Bot className="size-3.5" />Worker</span>
                      <button onClick={() => navigate(`/workers/${cForUi.workerId}`)} className="text-xs text-qiko-indigo hover:underline flex items-center gap-1">
                        {apiWorkerName ?? cForUi.workerName} <ArrowUpRight className="size-2.5" />
                      </button>
                    </div>
                    {worker && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Tag className="size-3.5" />Worker Type</span>
                        <span className="text-xs">{apiWorkerIndustry ?? worker.type}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">{cForUi.channel === "Voice" ? <Phone className="size-3.5" /> : <Globe className="size-3.5" />}Channel</span>
                      <span className="text-xs">{cForUi.channel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Calendar className="size-3.5" />Started</span>
                      <span className="text-xs tabular-nums">{formatTranscriptDateTime(apiStartedAt ?? cForUi.timestamp)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5"><MessageSquare className="size-3.5" />Messages</span>
                      <span className="text-xs tabular-nums">{messageCount}</span>
                    </div>
                    {cForUi.satisfaction && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Star className="size-3.5" />Satisfaction</span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`size-3 ${i < cForUi.satisfaction! ? "text-qiko-warning fill-qiko-warning" : "text-muted-foreground/20"}`} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
