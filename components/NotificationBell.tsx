"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { requestNotificationPermission } from "@/lib/notifications/browser";
import {
  getUnreadNotificationCount,
  getRecentNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationIcon,
  getNotificationIconColor,
  getNotificationUrl,
  type Notification,
} from "@/lib/notifications/in-app";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export function NotificationBell() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load initial data
  useEffect(() => {
    loadNotifications();
    // Request browser notification permission (for future push notifications)
    requestNotificationPermission();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  // Set up realtime subscription
  useEffect(() => {
    async function setupSubscription() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          // Add new notification to list
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev.slice(0, 9)]);
          setUnreadCount((prev) => prev + 1);

          // Reload to get fresh data
          await loadNotifications();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          // Reload when notification is updated (e.g., marked as read)
          await loadNotifications();
        }
      )
      .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    setupSubscription();
  }, []);

  async function loadNotifications() {
    try {
      setIsLoading(true);
      const [count, recent] = await Promise.all([
        getUnreadNotificationCount(),
        getRecentNotifications(10),
      ]);
      setUnreadCount(count);
      setNotifications(recent);
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
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
    }

    // Navigate
    const url = getNotificationUrl(notification);
    setIsOpen(false);
    router.push(url);
  }

  async function handleMarkAllAsRead() {
    const success = await markAllNotificationsAsRead();
    if (success) {
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#B7B7B7] hover:text-[#F9F9F9] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <i className="fa-solid fa-bell text-xl"></i>
        {unreadCount > 0 && (
          <span
            className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#191A1D] animate-pulse"
            aria-label={`${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`}
          />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-96 bg-[#2D3033] rounded-lg shadow-xl border border-[#363636] z-50 max-h-[600px] flex flex-col"
          role="menu"
          aria-label="Menu des notifications"
        >
          {/* Header */}
          <div className="p-4 border-b border-[#363636] flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#F9F9F9]">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-500 hover:text-blue-400 transition-colors"
                role="menuitem"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="p-8 text-center text-[#B7B7B7]">
                <i className="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
                <p>Chargement...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-[#B7B7B7]">
                <i className="fa-solid fa-bell-slash text-3xl mb-3 opacity-50"></i>
                <p className="font-medium">Aucune notification</p>
                <p className="text-sm mt-1">Vous serez notifié des mises à jour importantes</p>
              </div>
            ) : (
              <div className="divide-y divide-[#363636]">
                {notifications.map((notification) => {
                  const isUnread = !notification.read_at;
                  const icon = getNotificationIcon(notification.template_code);
                  const iconColor = getNotificationIconColor(
                    notification.template_code
                  );

                  return (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`
                        w-full p-4 text-left hover:bg-[#363636] transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
                        ${isUnread ? "bg-[#363636]/50 animate-slide-in" : ""}
                      `}
                      role="menuitem"
                      style={{
                        animation: isUnread && !notification.read_at ? 'slideIn 0.3s ease-out' : undefined
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full bg-[#191A1D] flex items-center justify-center ${iconColor}`}
                        >
                          <i className={`fa-solid ${icon}`}></i>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm ${
                              isUnread
                                ? "font-semibold text-[#F9F9F9]"
                                : "font-normal text-[#B7B7B7]"
                            }`}
                          >
                            {notification.title}
                          </p>
                          <p className="text-xs text-[#B7B7B7] mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-[#6B7280] mt-2">
                            {formatTimestamp(notification.created_at)}
                          </p>
                        </div>

                        {/* Unread indicator */}
                        {isUnread && (
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-[#363636]">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/dashboard/notifications");
                }}
                className="w-full text-center text-sm text-blue-500 hover:text-blue-400 transition-colors"
                role="menuitem"
              >
                Voir toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
