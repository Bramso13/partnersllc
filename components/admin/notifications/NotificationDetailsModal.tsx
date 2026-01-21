"use client";

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

interface NotificationDetailsModalProps {
  notification: NotificationWithDeliveries;
  onClose: () => void;
}

export function NotificationDetailsModal({
  notification,
  onClose,
}: NotificationDetailsModalProps) {
  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
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
        return <i className="fa-solid fa-envelope text-blue-400 mr-2"></i>;
      case "WHATSAPP":
        return <i className="fa-brands fa-whatsapp text-green-400 mr-2"></i>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-[#232428] rounded-lg border border-[#2D2E32] shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D2E32]">
            <h2 className="text-xl font-semibold text-[#F9F9F9]">
              Détails de la notification
            </h2>
            <button
              onClick={onClose}
              className="text-[#B7B7B7] hover:text-[#F9F9F9] transition-colors"
            >
              <i className="fa-solid fa-times text-xl"></i>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
            {/* Basic Info */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-[#B7B7B7] uppercase tracking-wider mb-3">
                Informations générales
              </h3>
              <div className="bg-[#191A1D] rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs text-[#B7B7B7]">ID</dt>
                    <dd className="text-sm text-[#F9F9F9] font-mono">
                      {notification.id}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#B7B7B7]">Créé le</dt>
                    <dd className="text-sm text-[#F9F9F9]">
                      {formatDate(notification.created_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#B7B7B7]">Client</dt>
                    <dd className="text-sm text-[#F9F9F9]">
                      {notification.profiles?.full_name || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#B7B7B7]">Téléphone</dt>
                    <dd className="text-sm text-[#F9F9F9]">
                      {notification.profiles?.phone || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#B7B7B7]">Type</dt>
                    <dd className="text-sm text-[#F9F9F9]">
                      {notification.template_code || "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#B7B7B7]">Dossier</dt>
                    <dd className="text-sm">
                      {notification.dossier_id ? (
                        <a
                          href={`/admin/dossiers/${notification.dossier_id}`}
                          className="text-blue-400 hover:text-blue-300 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {notification.dossier_id.slice(0, 8)}...
                        </a>
                      ) : (
                        <span className="text-[#B7B7B7]">-</span>
                      )}
                    </dd>
                  </div>
                </div>
                <div>
                  <dt className="text-xs text-[#B7B7B7]">Titre</dt>
                  <dd className="text-sm text-[#F9F9F9]">{notification.title}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#B7B7B7]">Message</dt>
                  <dd className="text-sm text-[#F9F9F9]">{notification.message}</dd>
                </div>
                {notification.action_url && (
                  <div>
                    <dt className="text-xs text-[#B7B7B7]">URL d&apos;action</dt>
                    <dd className="text-sm text-blue-400">{notification.action_url}</dd>
                  </div>
                )}
              </div>
            </div>

            {/* Payload */}
            {notification.payload && Object.keys(notification.payload).length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-[#B7B7B7] uppercase tracking-wider mb-3">
                  Payload
                </h3>
                <div className="bg-[#191A1D] rounded-lg p-4">
                  <pre className="text-xs text-[#F9F9F9] overflow-x-auto whitespace-pre-wrap font-mono">
                    {JSON.stringify(notification.payload, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Deliveries */}
            <div>
              <h3 className="text-sm font-medium text-[#B7B7B7] uppercase tracking-wider mb-3">
                Tentatives d&apos;envoi ({notification.notification_deliveries?.length || 0})
              </h3>
              {notification.notification_deliveries?.length > 0 ? (
                <div className="space-y-4">
                  {notification.notification_deliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className="bg-[#191A1D] rounded-lg p-4 border border-[#2D2E32]"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          {getChannelIcon(delivery.channel)}
                          <span className="text-sm font-medium text-[#F9F9F9]">
                            {delivery.channel}
                          </span>
                        </div>
                        {getStatusBadge(delivery.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <dt className="text-xs text-[#B7B7B7]">Destinataire</dt>
                          <dd className="text-[#F9F9F9]">{delivery.recipient}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-[#B7B7B7]">Créé le</dt>
                          <dd className="text-[#F9F9F9]">
                            {formatDate(delivery.created_at)}
                          </dd>
                        </div>
                        {delivery.sent_at && (
                          <div>
                            <dt className="text-xs text-[#B7B7B7]">Envoyé le</dt>
                            <dd className="text-green-400">
                              {formatDate(delivery.sent_at)}
                            </dd>
                          </div>
                        )}
                        {delivery.failed_at && (
                          <div>
                            <dt className="text-xs text-[#B7B7B7]">Échoué le</dt>
                            <dd className="text-red-400">
                              {formatDate(delivery.failed_at)}
                            </dd>
                          </div>
                        )}
                        {(delivery.provider_response?.retry_count ?? 0) > 0 && (
                          <div>
                            <dt className="text-xs text-[#B7B7B7]">Tentatives</dt>
                            <dd className="text-[#F9F9F9]">
                              {delivery.provider_response?.retry_count}
                            </dd>
                          </div>
                        )}
                      </div>

                      {/* Provider Response */}
                      {delivery.provider_response && (
                        <div className="mt-3 pt-3 border-t border-[#2D2E32]">
                          <dt className="text-xs text-[#B7B7B7] mb-2">
                            Réponse du fournisseur
                          </dt>
                          <pre className="text-xs text-[#F9F9F9] bg-[#232428] rounded p-2 overflow-x-auto whitespace-pre-wrap font-mono">
                            {JSON.stringify(delivery.provider_response, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#191A1D] rounded-lg p-4 text-center text-[#B7B7B7]">
                  Aucune tentative d&apos;envoi enregistrée
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end px-6 py-4 border-t border-[#2D2E32]">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#191A1D] border border-[#2D2E32] rounded-md text-[#F9F9F9] hover:bg-[#2D2E32] transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
