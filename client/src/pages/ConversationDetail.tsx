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
import { ConversationDetailPageSkeleton } from "@/components/tabPageSkeletons";
import { adminConversationDetails } from "@/services/adminConversationDetailsApi";
import { useGlobalDateFilter } from "@/contexts/DateFilterContext";
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
  Tag,
  User,
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

function formatWorkerType(value: string | null): string {
  if (!value || value.trim().length === 0) return "—";
  return value.replace(/_/g, " ");
}

export default function ConversationDetail() {
  const { id } = useParams<{ id: string }>();
  const [location, navigate] = useLocation();
  const { filter } = useGlobalDateFilter();
  const [apiTranscript, setApiTranscript] = useState<TranscriptMessage[] | null>(null);
  const [apiWorkerName, setApiWorkerName] = useState<string | null>(null);
  const [apiUserName, setApiUserName] = useState<string | null>(null);
  const [apiWorkerIndustry, setApiWorkerIndustry] = useState<string | null>(null);
  const [apiStartedAt, setApiStartedAt] = useState<string | null>(null);
  const [apiChannel, setApiChannel] = useState<string | null>(null);
  const selectedConversationId = useMemo(() => {
    const queryString = typeof window !== "undefined" ? window.location.search : "";
    const conversationId = new URLSearchParams(queryString).get("conversationId");
    return conversationId && conversationId.length > 0 ? conversationId : null;
  }, [location]);

  const conversationIdForApi = useMemo(() => {
    const raw = selectedConversationId ?? id;
    return raw != null && String(raw).trim().length > 0 ? String(raw).trim() : null;
  }, [selectedConversationId, id]);

  const [detailLoading, setDetailLoading] = useState(() => conversationIdForApi != null);

  useEffect(() => {
    if (conversationIdForApi == null) {
      setDetailLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setDetailLoading(true);
      try {
        const response = await adminConversationDetails(conversationIdForApi, filter);
        if (cancelled) return;
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
        setApiChannel(String(dataObj.channel ?? dataObj.conversation_channel ?? "").trim() || null);

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
        if (!cancelled) {
          setApiTranscript(null);
          setApiWorkerName(null);
          setApiUserName(null);
          setApiWorkerIndustry(null);
          setApiStartedAt(null);
          setApiChannel(null);
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationIdForApi, filter]);

  if (conversationIdForApi == null) {
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

  const transcript = apiTranscript ?? [];
  const messageCount = transcript.length;
  const displayChannel = apiChannel ?? "Web";
  const isVoiceChannel = displayChannel.toLowerCase() === "voice";

  const displayUserName = capitalizeFirstWordFirstLetter(apiUserName ?? "—");

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-[1300px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground" onClick={() => navigate("/conversations")}>
            <ArrowLeft className="size-3.5 mr-1" /> Conversations
          </Button>
        </div>
      </motion.div>

      {detailLoading ? (
        <ConversationDetailPageSkeleton />
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-heading font-bold tracking-tight">{displayUserName}</h1>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><Calendar className="size-3" />{formatTranscriptDateTime(apiStartedAt ?? "—")}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="size-3" />{messageCount} messages</span>
                  <span className="flex items-center gap-1">{isVoiceChannel ? <Phone className="size-3" /> : <Globe className="size-3" />}{displayChannel}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
                {transcript.length === 0 && (
                  <div className="h-full min-h-[320px] flex items-center justify-center text-sm text-muted-foreground">
                    No conversation transcript found.
                  </div>
                )}
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
                      <span className="text-xs text-qiko-indigo">{apiUserName ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Bot className="size-3.5" />Worker</span>
                      <span className="text-xs text-qiko-indigo">{apiWorkerName ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Tag className="size-3.5" />Worker Type</span>
                      <span className="text-xs">{formatWorkerType(apiWorkerIndustry)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">{isVoiceChannel ? <Phone className="size-3.5" /> : <Globe className="size-3.5" />}Channel</span>
                      <span className="text-xs">{displayChannel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Calendar className="size-3.5" />Started</span>
                      <span className="text-xs tabular-nums">{formatTranscriptDateTime(apiStartedAt ?? "—")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5"><MessageSquare className="size-3.5" />Messages</span>
                      <span className="text-xs tabular-nums">{messageCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
          </div>
        </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
