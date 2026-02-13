"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useApi } from "@/lib/api/useApi";
import type { NotificationRule } from "@/lib/notifications/types";

type NotificationsContextValue = {
  rules: NotificationRule[];
  isLoading: boolean;
  error: string | null;
  fetchRules: (params?: {
    event_type?: string;
    is_active?: string;
    channel?: string;
  }) => Promise<void>;
  createRule: (data: unknown) => Promise<void>;
  updateRule: (id: string, data: unknown) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  testRule: (id: string, payload?: unknown) => Promise<unknown>;
  toggleRule: (id: string) => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null
);

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const api = useApi();
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(
    async (params?: {
      event_type?: string;
      is_active?: string;
      channel?: string;
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        const search = new URLSearchParams();
        if (params?.event_type) search.append("event_type", params.event_type);
        if (params?.is_active) search.append("is_active", params.is_active);
        if (params?.channel) search.append("channel", params.channel);
        const data = await api.get<{ rules: NotificationRule[] }>(
          `/api/admin/notification-rules?${search.toString()}`
        );
        setRules(data?.rules ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const createRule = useCallback(async (data: unknown) => {
    await api.post("/api/admin/notification-rules", data);
  }, []);

  const updateRule = useCallback(async (id: string, data: unknown) => {
    await api.put(`/api/admin/notification-rules/${id}`, data);
  }, []);

  const deleteRule = useCallback(async (id: string) => {
    await api.delete(`/api/admin/notification-rules/${id}`);
  }, []);

  const testRule = useCallback(async (id: string, payload?: unknown) => {
    return api.post(`/api/admin/notification-rules/${id}/test`, payload ?? {});
  }, []);

  const toggleRule = useCallback(async (id: string) => {
    await api.post(`/api/admin/notification-rules/${id}/toggle`, {});
  }, []);

  const value = useMemo(
    () => ({
      rules,
      isLoading,
      error,
      fetchRules,
      createRule,
      updateRule,
      deleteRule,
      testRule,
      toggleRule,
    }),
    [
      rules,
      isLoading,
      error,
      fetchRules,
      createRule,
      updateRule,
      deleteRule,
      testRule,
      toggleRule,
    ]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within NotificationsProvider"
    );
  return ctx;
}
