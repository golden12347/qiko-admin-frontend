/*
 * ConversationDetail.tsx — Qiko Super Admin Panel
 * Design: Dark Lattice — structured dark-mode with indigo/cyan accents
 * Layout: Two-column split — transcript left, summary/metadata right
 * Sections: Conversation Info, Conversion Outcome, Actions Taken, Visitor Metadata
 */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { platformConversations, customers, platformWorkers } from "@/lib/data";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  Building2,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  ExternalLink,
  Flag,
  Globe,
  Laptop,
  Link2,
  MapPin,
  MessageSquare,
  Monitor,
  Phone,
  Star,
  Tag,
  Target,
  TrendingUp,
  User,
  UserCheck,
  AlertTriangle,
  XCircle,
  Megaphone,
  ArrowUpRight,
  Shield,
  Hash,
} from "lucide-react";
import { useParams, useLocation } from "wouter";

// Mock transcript data per conversation
const transcripts: Record<string, { role: "user" | "worker" | "system"; text: string; time: string; confidence?: number; sources?: string[] }[]> = {
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
  const msgs: { role: "user" | "worker" | "system"; text: string; time: string; confidence?: number; sources?: string[] }[] = [
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

const statusColor: Record<string, string> = {
  Active: "bg-qiko-cyan/10 text-qiko-cyan border-qiko-cyan/20",
  Completed: "bg-qiko-success/10 text-qiko-success border-qiko-success/20",
  Escalated: "bg-qiko-warning/10 text-qiko-warning border-qiko-warning/20",
  Dropped: "bg-qiko-error/10 text-qiko-error border-qiko-error/20",
};

const conversionColor: Record<string, string> = {
  Converted: "bg-qiko-success/10 text-qiko-success border-qiko-success/20",
  Qualified: "bg-qiko-indigo/10 text-qiko-indigo border-qiko-indigo/20",
  Nurturing: "bg-qiko-cyan/10 text-qiko-cyan border-qiko-cyan/20",
  Lost: "bg-qiko-error/10 text-qiko-error border-qiko-error/20",
  None: "bg-muted/30 text-muted-foreground border-border/20",
};

export default function ConversationDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const c = platformConversations.find(x => x.id === id);

  if (!c) {
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

  const customer = customers.find(x => x.id === c.customerId);
  const worker = platformWorkers.find(x => x.id === c.workerId);
  const transcript = transcripts[c.id] || getDefaultTranscript(c.id);

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center gap-3 mb-1">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground" onClick={() => navigate("/conversations")}>
            <ArrowLeft className="size-3.5 mr-1" /> Conversations
          </Button>
          <span className="text-muted-foreground/30">/</span>
          <span className="text-sm font-heading text-foreground">{c.id.toUpperCase()}</span>
        </div>

        <div className="flex items-start justify-between mt-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-heading font-bold tracking-tight">{c.userName}</h1>
              <Badge variant="outline" className={`text-[10px] px-2 py-0 ${statusColor[c.status]}`}>{c.status}</Badge>
              <Badge variant="outline" className={`text-[10px] px-2 py-0 ${conversionColor[c.conversionStatus]}`}>{c.conversionStatus}</Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Hash className="size-3" />{c.id.toUpperCase()}</span>
              <span className="flex items-center gap-1"><Calendar className="size-3" />{c.timestamp}</span>
              <span className="flex items-center gap-1"><Clock className="size-3" />{c.duration}</span>
              <span className="flex items-center gap-1"><MessageSquare className="size-3" />{c.messagesCount} messages</span>
              <span className="flex items-center gap-1">{c.channel === "Voice" ? <Phone className="size-3" /> : <Globe className="size-3" />}{c.channel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {c.satisfaction && (
              <div className="flex items-center gap-1 text-xs bg-qiko-warning/10 text-qiko-warning border border-qiko-warning/20 px-2 py-1 rounded-md">
                <Star className="size-3 fill-current" />
                {c.satisfaction}/5
              </div>
            )}
            <Button variant="outline" size="sm" className="h-7 text-xs bg-transparent">
              <Flag className="size-3 mr-1" /> Flag
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs bg-transparent">
              <ExternalLink className="size-3 mr-1" /> Export
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Two-column layout */}
      <div className="grid grid-cols-[1fr_380px] gap-4" style={{ height: "calc(100vh - 200px)" }}>
        {/* Left: Transcript */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card className="bg-card/30 border-border/15 h-full flex flex-col">
            <CardHeader className="p-4 pb-3 border-b border-border/10 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-heading flex items-center gap-2">
                  <MessageSquare className="size-4 text-qiko-indigo" />
                  Conversation Transcript
                </CardTitle>
                <span className="text-[10px] text-muted-foreground/50 tabular-nums">{transcript.length} messages</span>
              </div>
            </CardHeader>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
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
                        <div className={`max-w-[80%] space-y-1 ${msg.role === "worker" ? "" : "text-right"}`}>
                          <div className={`rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${
                            msg.role === "worker"
                              ? "bg-card/60 border border-border/15 text-foreground"
                              : "bg-qiko-indigo/10 border border-qiko-indigo/15 text-foreground"
                          }`}>
                            {msg.text}
                          </div>
                          <div className={`flex items-center gap-2 text-[10px] text-muted-foreground/40 ${msg.role === "worker" ? "" : "justify-end"}`}>
                            <span>{msg.time}</span>
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
          <ScrollArea className="h-full">
            <div className="space-y-3">
              {/* Conversation Info */}
              <Card className="bg-card/30 border-border/15">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-xs font-heading flex items-center gap-1.5">
                    <MessageSquare className="size-3 text-qiko-indigo" />
                    Conversation Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Building2 className="size-3" />Customer</span>
                      <button onClick={() => navigate(`/customers/${customer?.slug || ""}`)} className="text-[11px] text-qiko-indigo hover:underline flex items-center gap-1">
                        {c.customerName} <ArrowUpRight className="size-2.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Bot className="size-3" />Worker</span>
                      <button onClick={() => navigate(`/workers/${c.workerId}`)} className="text-[11px] text-qiko-indigo hover:underline flex items-center gap-1">
                        {c.workerName} <ArrowUpRight className="size-2.5" />
                      </button>
                    </div>
                    {worker && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Tag className="size-3" />Worker Type</span>
                        <span className="text-[11px]">{worker.type}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">{c.channel === "Voice" ? <Phone className="size-3" /> : <Globe className="size-3" />}Channel</span>
                      <span className="text-[11px]">{c.channel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Clock className="size-3" />Duration</span>
                      <span className="text-[11px] tabular-nums">{c.duration}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Calendar className="size-3" />Started</span>
                      <span className="text-[11px] tabular-nums">{c.timestamp}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1.5"><MessageSquare className="size-3" />Messages</span>
                      <span className="text-[11px] tabular-nums">{c.messagesCount}</span>
                    </div>
                    {c.satisfaction && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Star className="size-3" />Satisfaction</span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`size-3 ${i < c.satisfaction! ? "text-qiko-warning fill-qiko-warning" : "text-muted-foreground/20"}`} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Conversion Outcome */}
              <Card className="bg-card/30 border-border/15">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-xs font-heading flex items-center gap-1.5">
                    <TrendingUp className="size-3 text-qiko-success" />
                    Conversion Outcome
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="space-y-3">
                    {/* Status indicators */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className={`rounded-md p-2.5 text-center ${c.leadCaptured ? "bg-qiko-success/8 border border-qiko-success/15" : "bg-muted/10 border border-border/10"}`}>
                        <Target className={`size-4 mx-auto mb-1 ${c.leadCaptured ? "text-qiko-success" : "text-muted-foreground/30"}`} />
                        <p className={`text-[10px] font-medium ${c.leadCaptured ? "text-qiko-success" : "text-muted-foreground/40"}`}>Lead Captured</p>
                        <p className={`text-[10px] mt-0.5 ${c.leadCaptured ? "text-qiko-success/70" : "text-muted-foreground/20"}`}>{c.leadCaptured ? "Yes" : "No"}</p>
                      </div>
                      <div className={`rounded-md p-2.5 text-center ${c.bookingMade ? "bg-qiko-indigo/8 border border-qiko-indigo/15" : "bg-muted/10 border border-border/10"}`}>
                        <CalendarCheck className={`size-4 mx-auto mb-1 ${c.bookingMade ? "text-qiko-indigo" : "text-muted-foreground/30"}`} />
                        <p className={`text-[10px] font-medium ${c.bookingMade ? "text-qiko-indigo" : "text-muted-foreground/40"}`}>Booking Made</p>
                        <p className={`text-[10px] mt-0.5 ${c.bookingMade ? "text-qiko-indigo/70" : "text-muted-foreground/20"}`}>{c.bookingMade ? "Yes" : "No"}</p>
                      </div>
                      <div className={`rounded-md p-2.5 text-center ${c.paidSubscription ? "bg-qiko-success/8 border border-qiko-success/15" : "bg-muted/10 border border-border/10"}`}>
                        <CreditCard className={`size-4 mx-auto mb-1 ${c.paidSubscription ? "text-qiko-success" : "text-muted-foreground/30"}`} />
                        <p className={`text-[10px] font-medium ${c.paidSubscription ? "text-qiko-success" : "text-muted-foreground/40"}`}>Paid Subscription</p>
                        <p className={`text-[10px] mt-0.5 ${c.paidSubscription ? "text-qiko-success/70" : "text-muted-foreground/20"}`}>{c.paidSubscription ? "Yes" : "No"}</p>
                      </div>
                      <div className={`rounded-md p-2.5 text-center ${c.conversionStatus === "Converted" ? "bg-qiko-success/8 border border-qiko-success/15" : "bg-muted/10 border border-border/10"}`}>
                        <CheckCircle2 className={`size-4 mx-auto mb-1 ${c.conversionStatus === "Converted" ? "text-qiko-success" : "text-muted-foreground/30"}`} />
                        <p className={`text-[10px] font-medium ${c.conversionStatus === "Converted" ? "text-qiko-success" : "text-muted-foreground/40"}`}>Converted</p>
                        <p className={`text-[10px] mt-0.5 ${c.conversionStatus === "Converted" ? "text-qiko-success/70" : "text-muted-foreground/20"}`}>{c.conversionStatus}</p>
                      </div>
                    </div>

                    {/* Revenue */}
                    <Separator className="bg-border/10" />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1.5"><DollarSign className="size-3" />Revenue Generated</span>
                        <span className={`text-sm font-heading font-bold tabular-nums ${c.revenueOutcome > 0 ? "text-qiko-success" : "text-muted-foreground/40"}`}>
                          ${c.revenueOutcome.toLocaleString()}
                        </span>
                      </div>
                      {c.paidSubscription && c.subscriptionValue > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5"><CreditCard className="size-3" />Subscription Value</span>
                          <span className="text-sm font-heading font-bold tabular-nums text-qiko-indigo">
                            ${c.subscriptionValue.toLocaleString()}/yr
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions Taken */}
              <Card className="bg-card/30 border-border/15">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-xs font-heading flex items-center gap-1.5">
                    <CheckCircle2 className="size-3 text-qiko-cyan" />
                    Actions Taken
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="space-y-1.5">
                    {c.leadCaptured && (
                      <div className="flex items-center gap-2.5 text-xs px-2.5 py-2 rounded-md bg-qiko-success/5 border border-qiko-success/10">
                        <div className="size-5 rounded-full bg-qiko-success/10 flex items-center justify-center shrink-0">
                          <Target className="size-2.5 text-qiko-success" />
                        </div>
                        <div>
                          <p className="font-medium text-qiko-success">Lead Submitted</p>
                          <p className="text-[10px] text-muted-foreground/50 mt-0.5">Contact information captured from {c.userName}</p>
                        </div>
                      </div>
                    )}
                    {c.bookingMade && (
                      <div className="flex items-center gap-2.5 text-xs px-2.5 py-2 rounded-md bg-qiko-indigo/5 border border-qiko-indigo/10">
                        <div className="size-5 rounded-full bg-qiko-indigo/10 flex items-center justify-center shrink-0">
                          <CalendarCheck className="size-2.5 text-qiko-indigo" />
                        </div>
                        <div>
                          <p className="font-medium text-qiko-indigo">Call Booked</p>
                          <p className="text-[10px] text-muted-foreground/50 mt-0.5">Demo/meeting scheduled via Calendly</p>
                        </div>
                      </div>
                    )}
                    {c.paidSubscription && (
                      <div className="flex items-center gap-2.5 text-xs px-2.5 py-2 rounded-md bg-qiko-success/5 border border-qiko-success/10">
                        <div className="size-5 rounded-full bg-qiko-success/10 flex items-center justify-center shrink-0">
                          <CreditCard className="size-2.5 text-qiko-success" />
                        </div>
                        <div>
                          <p className="font-medium text-qiko-success">Paid Subscription</p>
                          <p className="text-[10px] text-muted-foreground/50 mt-0.5">${c.subscriptionValue.toLocaleString()}/yr subscription activated</p>
                        </div>
                      </div>
                    )}
                    {c.revenueOutcome > 0 && !c.paidSubscription && (
                      <div className="flex items-center gap-2.5 text-xs px-2.5 py-2 rounded-md bg-qiko-success/5 border border-qiko-success/10">
                        <div className="size-5 rounded-full bg-qiko-success/10 flex items-center justify-center shrink-0">
                          <DollarSign className="size-2.5 text-qiko-success" />
                        </div>
                        <div>
                          <p className="font-medium text-qiko-success">Payment Received</p>
                          <p className="text-[10px] text-muted-foreground/50 mt-0.5">${c.revenueOutcome.toLocaleString()} one-time payment</p>
                        </div>
                      </div>
                    )}
                    {c.status === "Escalated" && (
                      <div className="flex items-center gap-2.5 text-xs px-2.5 py-2 rounded-md bg-qiko-warning/5 border border-qiko-warning/10">
                        <div className="size-5 rounded-full bg-qiko-warning/10 flex items-center justify-center shrink-0">
                          <AlertTriangle className="size-2.5 text-qiko-warning" />
                        </div>
                        <div>
                          <p className="font-medium text-qiko-warning">Escalated to Human</p>
                          <p className="text-[10px] text-muted-foreground/50 mt-0.5">Transferred to human agent for resolution</p>
                        </div>
                      </div>
                    )}
                    {c.status === "Dropped" && (
                      <div className="flex items-center gap-2.5 text-xs px-2.5 py-2 rounded-md bg-qiko-error/5 border border-qiko-error/10">
                        <div className="size-5 rounded-full bg-qiko-error/10 flex items-center justify-center shrink-0">
                          <XCircle className="size-2.5 text-qiko-error" />
                        </div>
                        <div>
                          <p className="font-medium text-qiko-error">Conversation Dropped</p>
                          <p className="text-[10px] text-muted-foreground/50 mt-0.5">User abandoned the conversation</p>
                        </div>
                      </div>
                    )}
                    {!c.leadCaptured && !c.bookingMade && !c.paidSubscription && c.revenueOutcome === 0 && c.status !== "Escalated" && c.status !== "Dropped" && (
                      <p className="text-[11px] text-muted-foreground/40 py-2 text-center">No actions recorded for this conversation</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Visitor Metadata */}
              <Card className="bg-card/30 border-border/15">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-xs font-heading flex items-center gap-1.5">
                    <User className="size-3 text-qiko-cyan" />
                    Visitor Metadata
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1.5"><UserCheck className="size-3" />Visitor</span>
                      <span className="text-[11px]">{c.userName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Hash className="size-3" />User ID</span>
                      <span className="text-[11px] tabular-nums font-mono text-muted-foreground/60">{c.userId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Laptop className="size-3" />Device</span>
                      <span className="text-[11px]">{c.device}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1.5"><MapPin className="size-3" />Location</span>
                      <span className="text-[11px]">{c.location}</span>
                    </div>

                    <Separator className="bg-border/10" />

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Globe className="size-3" />Source</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-qiko-indigo/5 border-qiko-indigo/15 text-qiko-indigo">{c.source}</Badge>
                    </div>
                    {c.campaign && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Megaphone className="size-3" />Campaign</span>
                        <span className="text-[11px] font-mono text-qiko-cyan">{c.campaign}</span>
                      </div>
                    )}
                    {c.referrer && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Link2 className="size-3" />Referrer</span>
                        <span className="text-[11px] text-muted-foreground/60 truncate max-w-[180px]">{c.referrer}</span>
                      </div>
                    )}
                    {!c.campaign && !c.referrer && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Megaphone className="size-3" />Campaign</span>
                          <span className="text-[11px] text-muted-foreground/30">None</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5"><Link2 className="size-3" />Referrer</span>
                          <span className="text-[11px] text-muted-foreground/30">Direct</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Customer Account Summary */}
              {customer && (
                <Card className="bg-card/30 border-border/15">
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-xs font-heading flex items-center gap-1.5">
                      <Building2 className="size-3 text-muted-foreground" />
                      Customer Account
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">Plan</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{customer.plan}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">Status</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                          customer.status === "Active" ? "bg-qiko-success/10 text-qiko-success border-qiko-success/20" :
                          customer.status === "Trial" ? "bg-qiko-cyan/10 text-qiko-cyan border-qiko-cyan/20" :
                          "bg-qiko-error/10 text-qiko-error border-qiko-error/20"
                        }`}>{customer.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">Industry</span>
                        <span className="text-[11px]">{customer.industry}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">MRR</span>
                        <span className="text-[11px] font-heading font-bold tabular-nums">${customer.mrr.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">Workers</span>
                        <span className="text-[11px] tabular-nums">{customer.workersCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">Total Conversations</span>
                        <span className="text-[11px] tabular-nums">{customer.conversationsTotal.toLocaleString()}</span>
                      </div>
                      <Button variant="outline" size="sm" className="w-full h-7 text-[11px] bg-transparent mt-1" onClick={() => navigate(`/customers/${customer.slug}`)}>
                        View Full Account <ArrowUpRight className="size-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </motion.div>
      </div>
    </div>
  );
}
