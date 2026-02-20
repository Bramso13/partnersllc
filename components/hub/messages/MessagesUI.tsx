"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useHubMessages } from "@/lib/contexts/hub/messages/HubMessagesContext";
import { Search, Send, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import type { HubConversation, HubMessage } from "@/types/hub-messages";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return d.toLocaleDateString("fr-FR", { weekday: "short" });
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// ── Conversation item ─────────────────────────────────────────────────────────

function ConversationItem({
  conv,
  isActive,
  currentUserId,
  onClick,
}: {
  conv: HubConversation;
  isActive: boolean;
  currentUserId: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-4 text-left transition-all border-b border-white/[0.03] ${
        isActive ? "bg-[#00F0FF]/[0.04]" : "hover:bg-white/[0.025]"
      }`}
    >
      <div className="relative flex-shrink-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white/60"
          style={{
            background: "linear-gradient(135deg, rgba(0,240,255,0.15), rgba(80,185,137,0.1))",
            border: "1px solid rgba(0,240,255,0.15)",
          }}
        >
          {getInitials(conv.other_display_name)}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-semibold truncate ${conv.unread_count > 0 ? "text-white" : "text-white/70"}`}>
            {conv.other_display_name ?? "Membre"}
          </p>
          {conv.last_message_at && (
            <span className={`text-[11px] flex-shrink-0 ${conv.unread_count > 0 ? "text-white/50" : "text-white/25"}`}>
              {formatTime(conv.last_message_at)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={`text-xs truncate ${conv.unread_count > 0 ? "text-white/50" : "text-white/30"}`}>
            {conv.last_message
              ? (conv.last_message.sender_id === currentUserId ? "Vous : " : "") + conv.last_message.content
              : "Nouvelle conversation"}
          </p>
          {conv.unread_count > 0 && (
            <span
              className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-[#0A0B0D]"
              style={{ background: "#F59E0B" }}
            >
              {conv.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg, isOwn }: { msg: HubMessage; isOwn: boolean }) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[72%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
        style={
          isOwn
            ? { background: "linear-gradient(135deg, #00F0FF, #00C8D4)", color: "#0A0B0D", borderRadius: "18px 18px 4px 18px" }
            : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.8)", borderRadius: "18px 18px 18px 4px" }
        }
      >
        {msg.content}
        <div className={`text-[10px] mt-1.5 ${isOwn ? "text-[#0A0B0D]/50" : "text-white/25"}`}>
          {formatTime(msg.created_at)}
          {isOwn && msg.read_at && " · Lu"}
        </div>
      </div>
    </div>
  );
}

// ── Chat window ───────────────────────────────────────────────────────────────

function ChatWindow({ currentUserId }: { currentUserId: string }) {
  const { messages, conversations, activeConversationId, isLoadingMessages, isSending, sendMessage } = useHubMessages();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput("");
    try {
      await sendMessage(text);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
      setInput(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!activeConversationId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/15">
        <MessageSquare size={40} />
        <p className="text-sm">Sélectionnez une conversation</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div
        className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.05] flex-shrink-0"
        style={{ background: "rgba(7,8,10,0.5)" }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white/60"
          style={{ background: "linear-gradient(135deg, rgba(0,240,255,0.15), rgba(80,185,137,0.1))", border: "1px solid rgba(0,240,255,0.15)" }}
        >
          {getInitials(activeConv?.other_display_name ?? null)}
        </div>
        <div>
          <p className="text-white font-semibold text-sm">{activeConv?.other_display_name ?? "Membre"}</p>
          {activeConv?.other_profession && (
            <p className="text-white/35 text-xs">{activeConv.other_profession}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
        {isLoadingMessages ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin text-white/20" />
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} isOwn={msg.sender_id === currentUserId} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="px-5 py-4 border-t border-white/[0.05] flex-shrink-0"
        style={{ background: "rgba(7,8,10,0.5)" }}
      >
        <div
          className="flex items-end gap-3 rounded-2xl px-4 py-3"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrire un message… (Entrée pour envoyer)"
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none resize-none"
            style={{ maxHeight: "120px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #00F0FF, #00C8D4)" }}
          >
            {isSending
              ? <Loader2 size={13} className="animate-spin text-[#0A0B0D]" />
              : <Send size={13} className="text-[#0A0B0D]" style={{ transform: "rotate(45deg) translate(-1px, 1px)" }} />
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function MessagesUI({ currentUserId }: { currentUserId: string }) {
  const searchParams = useSearchParams();
  const { conversations, activeConversationId, isLoadingConversations, fetchConversations, openConversation, getOrCreateConversation } = useHubMessages();
  const [searchQ, setSearchQ] = useState("");

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Ouvrir automatiquement si ?conv=[id] ou ?with=[userId]
  useEffect(() => {
    const convId = searchParams.get("conv");
    const withId = searchParams.get("with");

    if (convId) {
      openConversation(convId);
    } else if (withId) {
      getOrCreateConversation(withId).then(openConversation).catch(() => {});
    }
  }, [searchParams]);

  const filtered = conversations.filter((c) => {
    if (!searchQ.trim()) return true;
    const name = (c.other_display_name ?? "").toLowerCase();
    return name.includes(searchQ.toLowerCase());
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0B0D]">
      {/* Conversations list */}
      <div className="w-full md:w-[300px] flex-shrink-0 flex flex-col border-r border-white/[0.05] bg-[#07080A]">
        {/* Header */}
        <div className="px-5 py-5 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <MessageSquare size={14} style={{ color: "#F59E0B" }} />
            </div>
            <h1 className="text-white font-bold text-lg" style={{ letterSpacing: "-0.02em" }}>Messages</h1>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
            <input
              type="text"
              placeholder="Chercher…"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-8 pr-3 py-2.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-white/10 transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingConversations ? (
            <div className="flex justify-center py-8">
              <Loader2 size={18} className="animate-spin text-white/20" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/20 gap-2">
              <MessageSquare size={24} />
              <p className="text-xs">Aucune conversation</p>
            </div>
          ) : (
            filtered.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={activeConversationId === conv.id}
                currentUserId={currentUserId}
                onClick={() => openConversation(conv.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="hidden md:flex flex-1 flex-col min-h-0">
        <ChatWindow currentUserId={currentUserId} />
      </div>
    </div>
  );
}
