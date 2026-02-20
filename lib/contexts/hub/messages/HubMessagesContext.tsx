"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { useApi } from "@/lib/api/useApi";
import { createClient } from "@/lib/supabase/client";
import type {
  HubConversation,
  HubMessage,
  ConversationsResponse,
  MessagesResponse,
} from "@/types/hub-messages";

interface HubMessagesContextValue {
  conversations: HubConversation[];
  activeConversationId: string | null;
  messages: HubMessage[];
  totalUnread: number;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  error: string | null;
  fetchConversations: () => Promise<void>;
  openConversation: (conversationId: string) => Promise<void>;
  getOrCreateConversation: (otherUserId: string) => Promise<string>;
  sendMessage: (content: string) => Promise<void>;
}

const HubMessagesContext = createContext<HubMessagesContextValue | null>(null);

export function HubMessagesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const api = useApi();
  const [conversations, setConversations] = useState<HubConversation[]>([]);
  const [activeConversationId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<HubMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConvs] = useState(false);
  const [isLoadingMessages, setIsLoadingMsgs] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const realtimeChannelRef = useRef<
    ReturnType<typeof createClient>["channel"] | null
  >(null);

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unread_count ?? 0), 0),
    [conversations]
  );

  const fetchConversations = useCallback(async () => {
    setIsLoadingConvs(true);
    setError(null);
    try {
      const data = await api.get<ConversationsResponse>(
        "/api/hub/messages/conversations"
      );
      setConversations(data.conversations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsLoadingConvs(false);
    }
  }, []);

  const openConversation = useCallback(async (conversationId: string) => {
    setActiveConvId(conversationId);
    setIsLoadingMsgs(true);
    setError(null);
    try {
      const data = await api.get<MessagesResponse>(
        `/api/hub/messages/conversations/${conversationId}`
      );
      setMessages(data.messages ?? []);
      // Remettre à 0 le compteur non-lu localement
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, unread_count: 0 } : c
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsLoadingMsgs(false);
    }
  }, []);

  const getOrCreateConversation = useCallback(
    async (otherUserId: string): Promise<string> => {
      const data = await api.post<{ conversation: { id: string } }>(
        "/api/hub/messages/conversations",
        { other_user_id: otherUserId }
      );
      const convId = data.conversation.id;
      await fetchConversations();
      return convId;
    },
    [fetchConversations]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!activeConversationId || !content.trim()) return;
      setIsSending(true);
      try {
        const data = await api.post<{ message: HubMessage }>(
          `/api/hub/messages/conversations/${activeConversationId}`,
          { content: content.trim() }
        );
        setMessages((prev) => [...prev, data.message]);
        // Mettre à jour le dernier message dans la liste des conversations
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversationId
              ? {
                  ...c,
                  last_message: {
                    content: data.message.content,
                    sender_id: data.message.sender_id,
                    created_at: data.message.created_at,
                  },
                  last_message_at: data.message.created_at,
                }
              : c
          )
        );
      } finally {
        setIsSending(false);
      }
    },
    [activeConversationId]
  );

  // ── Supabase Realtime : écoute les nouveaux messages ─────────────────────
  useEffect(() => {
    if (!activeConversationId) return;

    const supabase = createClient();

    // Nettoyer l'ancien channel si on change de conversation
    if (realtimeChannelRef.current) {
      supabase.removeChannel(
        realtimeChannelRef.current as unknown as Parameters<
          typeof supabase.removeChannel
        >[0]
      );
    }

    const channel = supabase
      .channel(`hub_messages:${activeConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "hub_messages",
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as HubMessage;
          setMessages((prev) => {
            // Éviter les doublons (le message envoyé par soi est déjà ajouté)
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel as unknown as ReturnType<
      typeof createClient
    >["channel"];

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversationId]);

  const value = useMemo(
    () => ({
      conversations,
      activeConversationId,
      messages,
      totalUnread,
      isLoadingConversations,
      isLoadingMessages,
      isSending,
      error,
      fetchConversations,
      openConversation,
      getOrCreateConversation,
      sendMessage,
    }),
    [
      conversations,
      activeConversationId,
      messages,
      totalUnread,
      isLoadingConversations,
      isLoadingMessages,
      isSending,
      error,
      fetchConversations,
      openConversation,
      getOrCreateConversation,
      sendMessage,
    ]
  );

  return (
    <HubMessagesContext.Provider value={value}>
      {children}
    </HubMessagesContext.Provider>
  );
}

export function useHubMessages() {
  const ctx = useContext(HubMessagesContext);
  if (!ctx)
    throw new Error("useHubMessages must be used within HubMessagesProvider");
  return ctx;
}
