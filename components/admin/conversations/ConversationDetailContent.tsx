"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type {
  AdminConversationWithDossier,
  TwilioConversationMessage,
  TwilioConversationParticipant,
  AdminProfileSummary,
} from "@/types/conversations";

const POLLING_INTERVAL = 5000;

interface ConversationDetailContentProps {
  conversation: AdminConversationWithDossier;
  initialMessages: TwilioConversationMessage[];
  participants: TwilioConversationParticipant[];
  adminProfiles: AdminProfileSummary[];
  allAdmins: AdminProfileSummary[];
}

export function ConversationDetailContent({
  conversation,
  initialMessages,
  participants,
  adminProfiles,
  allAdmins,
}: ConversationDetailContentProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] =
    useState<TwilioConversationMessage[]>(initialMessages);
  const [messageBody, setMessageBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showParticipantSelector, setShowParticipantSelector] =
    useState(false);

  const profileMap = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    adminProfiles.forEach((p) => profileMap.current.set(p.id, p.full_name));
  }, [adminProfiles]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll for new messages
  useEffect(() => {
    const pollMessages = async () => {
      try {
        const resp = await fetch(
          `/api/admin/conversations/${conversation.id}`
        );
        if (resp.ok) {
          const data = await resp.json();
          setMessages(data.messages);
        }
      } catch {
        // Silently fail on polling errors
      }
    };

    const interval = setInterval(pollMessages, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [conversation.id]);

  const handleSendMessage = useCallback(async () => {
    if (!messageBody.trim() || isSending) return;
    setIsSending(true);

    const body = messageBody.trim();

    // Optimistic UI
    const optimisticMessage: TwilioConversationMessage = {
      id: `optimistic-${Date.now()}`,
      twilio_conversation_id: conversation.id,
      twilio_message_sid: null,
      sender_type: "admin",
      sender_profile_id: null,
      body,
      dossier_id: conversation.dossier_id,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageBody("");

    try {
      const resp = await fetch(
        `/api/admin/conversations/${conversation.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        }
      );

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error ?? "Échec de l'envoi");
      }

      const data = await resp.json();
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMessage.id ? data.message : m))
      );
    } catch (error) {
      setMessages((prev) =>
        prev.filter((m) => m.id !== optimisticMessage.id)
      );
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'envoi"
      );
    } finally {
      setIsSending(false);
    }
  }, [messageBody, isSending, conversation.id, conversation.dossier_id]);

  const handleAddParticipant = async (profileId: string) => {
    try {
      const resp = await fetch(
        `/api/admin/conversations/${conversation.id}/participants`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile_id: profileId }),
        }
      );

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error ?? "Échec de l'ajout");
      }

      toast.success("Participant ajouté avec succès");
      setShowParticipantSelector(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'ajout"
      );
    }
  };

  const getAdminName = (profileId: string | null): string => {
    if (!profileId) return "Admin";
    return profileMap.current.get(profileId) ?? "Admin";
  };

  const participantProfileIds = new Set(
    participants.map((p) => p.profile_id)
  );
  const availableAdmins = allAdmins.filter(
    (a) => !participantProfileIds.has(a.id)
  );

  const clientName = conversation.dossier?.user?.full_name ?? "Client";
  const productName = conversation.dossier?.product?.name ?? "";

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/conversations/clients"
          className="inline-flex items-center gap-2 text-brand-text-secondary hover:text-brand-text-primary mb-4 transition-colors"
        >
          <i className="fa-solid fa-arrow-left"></i>
          <span>Retour aux conversations</span>
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-text-primary">
              Conversation – {clientName}
              {productName && (
                <span className="text-brand-text-secondary font-normal">
                  {" "}
                  – {productName}
                </span>
              )}
            </h1>
            <p className="text-brand-text-secondary text-sm mt-1">
              {participants.length} participant
              {participants.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() =>
              setShowParticipantSelector(!showParticipantSelector)
            }
            className="px-3 py-1.5 text-sm border border-brand-stroke rounded-lg text-brand-text-secondary hover:text-brand-text-primary hover:border-brand-accent transition-colors"
          >
            <i className="fas fa-user-plus mr-1.5"></i>
            Ajouter un participant
          </button>
        </div>
      </div>

      {/* Participant Selector */}
      {showParticipantSelector && (
        <div className="mb-4 bg-brand-card-bg border border-brand-stroke rounded-lg p-4">
          <h3 className="text-sm font-medium text-brand-text-secondary mb-2">
            Sélectionner un admin
          </h3>
          {availableAdmins.length === 0 ? (
            <p className="text-xs text-brand-text-secondary/70">
              Tous les admins sont déjà participants
            </p>
          ) : (
            <div className="space-y-1">
              {availableAdmins.map((admin) => (
                <button
                  key={admin.id}
                  onClick={() => handleAddParticipant(admin.id)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-brand-surface-light transition-colors"
                >
                  <div className="text-sm text-brand-text-primary font-medium">
                    {admin.full_name}
                  </div>
                  <div className="text-xs text-brand-text-secondary">
                    {admin.email}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Message Thread */}
      <div
        className="bg-brand-card-bg border border-brand-stroke rounded-lg flex flex-col"
        style={{ minHeight: "400px" }}
      >
        <div
          className="flex-1 overflow-y-auto p-4 space-y-3"
          style={{ maxHeight: "500px" }}
        >
          {messages.length === 0 && (
            <div className="text-center text-brand-text-secondary/70 text-sm py-8">
              Aucun message pour le moment. Envoyez le premier message !
            </div>
          )}
          {messages.map((msg) => {
            const isAdmin = msg.sender_type === "admin";
            return (
              <div
                key={msg.id}
                className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] flex flex-col ${
                    isAdmin ? "items-end" : "items-start"
                  }`}
                >
                  <span
                    className={`text-xs text-brand-text-secondary/70 mb-1 ${
                      isAdmin ? "text-right" : "text-left"
                    }`}
                  >
                    {isAdmin ? getAdminName(msg.sender_profile_id) : clientName}
                  </span>
                  <div
                    className={`px-4 py-2.5 rounded-2xl ${
                      isAdmin
                        ? "bg-brand-accent text-white rounded-tr-sm"
                        : "bg-brand-surface-light text-brand-text-primary rounded-tl-sm"
                    }`}
                  >
                    <p className="text-sm">{msg.body}</p>
                  </div>
                  <span className="text-xs text-brand-text-secondary/50 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Send Message Area */}
        <div className="border-t border-brand-stroke p-4">
          <div className="flex gap-2">
            <textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Tapez votre message... (Enter pour envoyer)"
              rows={2}
              className="flex-1 px-3 py-2 bg-brand-surface-light border border-brand-stroke rounded-lg text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:border-brand-accent resize-none"
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageBody.trim() || isSending}
              className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed self-end"
            >
              <i className="fas fa-paper-plane mr-1.5"></i>
              {isSending ? "Envoi..." : "Envoyer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
