"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationIcon,
  getNotificationIconColor,
  getNotificationUrl,
  type Notification,
  type NotificationFilter,
} from "@/lib/notifications/in-app";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface NotificationsPageContentProps {
  initialNotifications: Notification[];
  userId: string;
}

export function NotificationsPageContent({
  initialNotifications,
  userId,
}: NotificationsPageContentProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(
    initialNotifications
  );
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const pageSize = 50;

  // Load notifications when filter or page changes
  useEffect(() => {
    loadNotifications();
  }, [filter, page, userId]);

  // Set up realtime subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("notifications-page")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          // Reload notifications when new one arrives
          await loadNotifications();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          // Reload when notification is updated
          await loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  async function loadNotifications() {
    setIsLoading(true);
    try {
      const result = await getNotifications(page, pageSize, filter);
      setNotifications(result.notifications);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleNotificationClick(notification: Notification) {
    // Mark as read
    if (!notification.read_at) {
      await markNotificationAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
    }

    // Navigate
    const url = getNotificationUrl(notification);
    router.push(url);
  }

  async function handleMarkAllAsRead() {
    const success = await markAllNotificationsAsRead();
    if (success) {
      await loadNotifications();
    }
  }

  function formatTimestamp(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) {
        return "À l'instant";
      }

      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: fr,
      });
    } catch {
      return dateString;
    }
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const filters: { key: NotificationFilter; label: string }[] = [
    { key: "all", label: "Toutes" },
    { key: "unread", label: "Non lues" },
    { key: "document", label: "Documents" },
    { key: "payment", label: "Paiements" },
    { key: "message", label: "Messages" },
  ];

  return (
    <div className="bg-[#191A1D] rounded-lg border border-[#363636]">
      {/* Header with filters */}
      <div className="p-4 border-b border-[#363636]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#F9F9F9]">
            {total} notification{total > 1 ? "s" : ""}
          </h2>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-blue-500 hover:text-blue-400 transition-colors"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setFilter(f.key);
                setPage(1);
              }}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                ${
                  filter === f.key
                    ? "bg-blue-500 text-white"
                    : "bg-[#2D3033] text-[#B7B7B7] hover:bg-[#363636]"
                }
              `}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-[#363636]">
        {isLoading ? (
          <div className="p-8 text-center text-[#B7B7B7]">
            <i className="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
            <p>Chargement...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-[#B7B7B7]">
            <i className="fa-solid fa-bell-slash text-4xl mb-4 opacity-50"></i>
            <p className="font-medium text-lg mb-2">Aucune notification</p>
            <p className="text-sm">
              {filter === "all"
                ? "Vous n'avez pas encore de notifications"
                : "Aucune notification ne correspond à ce filtre"}
            </p>
          </div>
        ) : (
          notifications.map((notification) => {
            const isUnread = !notification.read_at;
            const icon = getNotificationIcon(notification.template_code);
            const iconColor = getNotificationIconColor(notification.template_code);

            return (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`
                  w-full p-4 text-left hover:bg-[#2D3033] transition-colors
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
                  ${isUnread ? "bg-[#2D3033]/50" : ""}
                `}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full bg-[#191A1D] flex items-center justify-center ${iconColor}`}
                  >
                    <i className={`fa-solid ${icon} text-lg`}></i>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p
                          className={`text-base ${
                            isUnread
                              ? "font-semibold text-[#F9F9F9]"
                              : "font-normal text-[#B7B7B7]"
                          }`}
                        >
                          {notification.title}
                        </p>
                        <p className="text-sm text-[#B7B7B7] mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-[#6B7280] mt-2">
                          {formatTimestamp(notification.created_at)}
                        </p>
                      </div>

                      {/* Unread indicator */}
                      {isUnread && (
                        <div className="flex-shrink-0 w-3 h-3 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-[#363636] flex items-center justify-between">
          <p className="text-sm text-[#B7B7B7]">
            Page {page} sur {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="px-4 py-2 bg-[#2D3033] text-[#F9F9F9] rounded-lg hover:bg-[#363636] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Précédent
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
              className="px-4 py-2 bg-[#2D3033] text-[#F9F9F9] rounded-lg hover:bg-[#363636] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
