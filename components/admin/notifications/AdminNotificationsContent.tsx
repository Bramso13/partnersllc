"use client";

import { useState, useEffect, useCallback } from "react";
import { NotificationDetailsModal } from "./NotificationDetailsModal";

interface ProviderResponse {
  retry_count?: number;
  error_message?: string;
  error?: string;
  error_code?: string;
  error_response?: string;
  message_status?: string;
  sent_at?: string;
  last_attempt_at?: string;
  accepted?: string[];
  rejected?: string[];
}

interface NotificationDelivery {
  id: string;
  channel: "EMAIL" | "WHATSAPP";
  status: "PENDING" | "SENT" | "FAILED";
  recipient: string;
  provider_response: ProviderResponse | null;
  sent_at: string | null;
  failed_at: string | null;
  created_at: string;
}

interface NotificationPayload {
  step_name?: string;
  step_code?: string;
  dossier_id?: string;
  next_step_name?: string;
  document_type?: string;
  rejection_reason?: string;
  [key: string]: string | undefined;
}

interface NotificationWithDeliveries {
  id: string;
  title: string;
  message: string;
  template_code: string | null;
  created_at: string;
  user_id: string;
  dossier_id: string | null;
  payload: NotificationPayload | null;
  action_url: string | null;
  profiles: {
    full_name: string | null;
    phone: string | null;
  } | null;
  notification_deliveries: NotificationDelivery[];
}

type FilterStatus = "all" | "failed" | "sent";
type FilterChannel = "all" | "EMAIL" | "WHATSAPP";

export function AdminNotificationsContent() {
  const [notifications, setNotifications] = useState<NotificationWithDeliveries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterChannel, setFilterChannel] = useState<FilterChannel>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [failedCount, setFailedCount] = useState(0);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<NotificationWithDeliveries | null>(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "25",
      });

      if (filterStatus !== "all") {
        params.set("status", filterStatus);
      }
      if (filterChannel !== "all") {
        params.set("channel", filterChannel);
      }

      const response = await fetch(`/api/admin/notifications?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setTotalPages(data.pagination.totalPages);
        setFailedCount(data.failedCount);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterStatus, filterChannel]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRetry = async (notificationId: string) => {
    setRetryingId(notificationId);
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}/retry`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        // Refresh the list
        await fetchNotifications();
      } else {
        console.error("Retry failed:", data.message);
      }
    } catch (error) {
      console.error("Error retrying notification:", error);
    } finally {
      setRetryingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SENT":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-400 border border-green-700">
            <i className="fa-solid fa-check mr-1"></i> Envoyé
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/50 text-red-400 border border-red-700">
            <i className="fa-solid fa-times mr-1"></i> Échec
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/50 text-yellow-400 border border-yellow-700">
            <i className="fa-solid fa-clock mr-1"></i> En attente
          </span>
        );
      default:
        return null;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "EMAIL":
        return <i className="fa-solid fa-envelope text-blue-400"></i>;
      case "WHATSAPP":
        return <i className="fa-brands fa-whatsapp text-green-400"></i>;
      default:
        return null;
    }
  };

  const getErrorMessage = (delivery: NotificationDelivery) => {
    if (!delivery.provider_response) return null;
    return (
      delivery.provider_response.error_message ||
      delivery.provider_response.error ||
      null
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-[#191A1D] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#F9F9F9] mb-2">
                Gestion des Notifications
              </h1>
              <p className="text-[#B7B7B7]">
                Suivi et gestion des notifications envoyées aux clients
              </p>
            </div>
            {failedCount > 0 && (
              <div className="flex items-center gap-2 bg-red-900/30 border border-red-700 rounded-lg px-4 py-2">
                <i className="fa-solid fa-exclamation-triangle text-red-400"></i>
                <span className="text-red-400 font-medium">
                  {failedCount} notification{failedCount > 1 ? "s" : ""} en échec
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#232428] rounded-lg p-4 mb-6 border border-[#2D2E32]">
          <div className="flex flex-wrap gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm text-[#B7B7B7] mb-1">Statut</label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value as FilterStatus);
                  setCurrentPage(1);
                }}
                className="bg-[#191A1D] border border-[#2D2E32] rounded-md px-3 py-2 text-[#F9F9F9] focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous</option>
                <option value="failed">Échecs uniquement</option>
                <option value="sent">Envoyés uniquement</option>
              </select>
            </div>

            {/* Channel Filter */}
            <div>
              <label className="block text-sm text-[#B7B7B7] mb-1">Canal</label>
              <select
                value={filterChannel}
                onChange={(e) => {
                  setFilterChannel(e.target.value as FilterChannel);
                  setCurrentPage(1);
                }}
                className="bg-[#191A1D] border border-[#2D2E32] rounded-md px-3 py-2 text-[#F9F9F9] focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les canaux</option>
                <option value="EMAIL">Email</option>
                <option value="WHATSAPP">WhatsApp</option>
              </select>
            </div>

            {/* Refresh Button */}
            <div className="flex items-end">
              <button
                onClick={fetchNotifications}
                disabled={isLoading}
                className="flex items-center gap-2 bg-[#191A1D] border border-[#2D2E32] rounded-md px-4 py-2 text-[#F9F9F9] hover:bg-[#2D2E32] transition-colors disabled:opacity-50"
              >
                <i className={`fa-solid fa-refresh ${isLoading ? "animate-spin" : ""}`}></i>
                Actualiser
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#232428] rounded-lg border border-[#2D2E32] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#191A1D]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#B7B7B7] uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#B7B7B7] uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#B7B7B7] uppercase tracking-wider">
                    Dossier
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#B7B7B7] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#B7B7B7] uppercase tracking-wider">
                    Canal
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#B7B7B7] uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#B7B7B7] uppercase tracking-wider">
                    Erreur
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-[#B7B7B7] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D2E32]">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-[#B7B7B7]">
                      <i className="fa-solid fa-spinner animate-spin mr-2"></i>
                      Chargement...
                    </td>
                  </tr>
                ) : notifications.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-[#B7B7B7]">
                      Aucune notification trouvée
                    </td>
                  </tr>
                ) : (
                  notifications.flatMap((notification) =>
                    notification.notification_deliveries?.length > 0
                      ? notification.notification_deliveries.map((delivery, idx) => (
                          <tr
                            key={`${notification.id}-${delivery.id}`}
                            className="hover:bg-[#2D2E32]/50 transition-colors"
                          >
                            <td className="px-6 py-4 text-sm text-[#F9F9F9]">
                              {formatDate(notification.created_at)}
                            </td>
                            <td className="px-6 py-4 text-sm text-[#F9F9F9]">
                              {notification.profiles?.full_name || "-"}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {notification.dossier_id ? (
                                <a
                                  href={`/admin/dossiers/${notification.dossier_id}`}
                                  className="text-blue-400 hover:text-blue-300 hover:underline"
                                >
                                  {notification.dossier_id.slice(0, 8)}...
                                </a>
                              ) : (
                                <span className="text-[#B7B7B7]">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-[#F9F9F9]">
                              {notification.template_code || notification.title}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {getChannelIcon(delivery.channel)}
                                <span className="text-sm text-[#F9F9F9]">
                                  {delivery.channel}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {getStatusBadge(delivery.status)}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {delivery.status === "FAILED" ? (
                                <span
                                  className="text-red-400 cursor-help"
                                  title={getErrorMessage(delivery) || "Erreur inconnue"}
                                >
                                  {getErrorMessage(delivery)?.slice(0, 50) || "Erreur inconnue"}
                                  {(getErrorMessage(delivery)?.length || 0) > 50 && "..."}
                                </span>
                              ) : (
                                <span className="text-[#B7B7B7]">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {idx === 0 && (
                                  <button
                                    onClick={() => setSelectedNotification(notification)}
                                    className="text-[#B7B7B7] hover:text-[#F9F9F9] transition-colors"
                                    title="Voir détails"
                                  >
                                    <i className="fa-solid fa-eye"></i>
                                  </button>
                                )}
                                {delivery.status === "FAILED" && (
                                  <button
                                    onClick={() => handleRetry(notification.id)}
                                    disabled={retryingId === notification.id}
                                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                                    title="Réessayer"
                                  >
                                    {retryingId === notification.id ? (
                                      <i className="fa-solid fa-spinner animate-spin"></i>
                                    ) : (
                                      <i className="fa-solid fa-redo"></i>
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      : [
                          <tr
                            key={notification.id}
                            className="hover:bg-[#2D2E32]/50 transition-colors"
                          >
                            <td className="px-6 py-4 text-sm text-[#F9F9F9]">
                              {formatDate(notification.created_at)}
                            </td>
                            <td className="px-6 py-4 text-sm text-[#F9F9F9]">
                              {notification.profiles?.full_name || "-"}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {notification.dossier_id ? (
                                <a
                                  href={`/admin/dossiers/${notification.dossier_id}`}
                                  className="text-blue-400 hover:text-blue-300 hover:underline"
                                >
                                  {notification.dossier_id.slice(0, 8)}...
                                </a>
                              ) : (
                                <span className="text-[#B7B7B7]">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-[#F9F9F9]">
                              {notification.template_code || notification.title}
                            </td>
                            <td className="px-6 py-4 text-sm text-[#B7B7B7]">-</td>
                            <td className="px-6 py-4 text-sm text-[#B7B7B7]">-</td>
                            <td className="px-6 py-4 text-sm text-[#B7B7B7]">-</td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => setSelectedNotification(notification)}
                                className="text-[#B7B7B7] hover:text-[#F9F9F9] transition-colors"
                                title="Voir détails"
                              >
                                <i className="fa-solid fa-eye"></i>
                              </button>
                            </td>
                          </tr>,
                        ]
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#2D2E32]">
              <div className="text-sm text-[#B7B7B7]">
                Page {currentPage} sur {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-[#191A1D] border border-[#2D2E32] rounded text-[#F9F9F9] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2D2E32] transition-colors"
                >
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-[#191A1D] border border-[#2D2E32] rounded text-[#F9F9F9] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2D2E32] transition-colors"
                >
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {selectedNotification && (
        <NotificationDetailsModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
        />
      )}
    </div>
  );
}
