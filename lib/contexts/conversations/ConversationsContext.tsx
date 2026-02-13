"use client";

import { createContext, useContext, useCallback, useMemo } from "react";
import { useApi } from "@/lib/api/useApi";

type ConversationsContextValue = {
  fetchConversations: (params?: {
    type?: string;
    dossier_id?: string;
  }) => Promise<unknown[]>;
  getConversation: (id: string) => Promise<unknown>;
  createConversation: (payload: {
    type: "client" | "agent";
    dossier_id?: string;
    agent_profile_id?: string;
  }) => Promise<{ conversation?: { id: string }; error?: string }>;
};

const ConversationsContext = createContext<ConversationsContextValue | null>(
  null
);

export function ConversationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const api = useApi();

  const fetchConversations = useCallback(
    async (params?: { type?: string; dossier_id?: string }) => {
      const sp = new URLSearchParams();
      if (params?.type) sp.set("type", params.type);
      if (params?.dossier_id) sp.set("dossier_id", params.dossier_id);
      const q = sp.toString();
      const path = q
        ? `/api/admin/conversations?${q}`
        : "/api/admin/conversations";
      const data = await api.get<{ conversations?: unknown[] }>(path);
      return data?.conversations ?? [];
    },
    []
  );

  const getConversation = useCallback(async (id: string) => {
    return api.get(`/api/admin/conversations/${id}`);
  }, []);

  const createConversation = useCallback(
    async (payload: {
      type: "client" | "agent";
      dossier_id?: string;
      agent_profile_id?: string;
    }) => {
      const res = await api.post<{
        conversation?: { id: string };
        error?: string;
      }>("/api/admin/conversations", payload);
      return res ?? {};
    },
    []
  );

  const value = useMemo(
    () => ({
      fetchConversations,
      getConversation,
      createConversation,
    }),
    [fetchConversations, getConversation, createConversation]
  );

  return (
    <ConversationsContext.Provider value={value}>
      {children}
    </ConversationsContext.Provider>
  );
}

export function useConversations() {
  const ctx = useContext(ConversationsContext);
  if (!ctx)
    throw new Error(
      "useConversations must be used within ConversationsProvider"
    );
  return ctx;
}
