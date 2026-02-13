"use client";

import { useState } from "react";
import { useApi } from "@/lib/api/useApi";
import { EventType } from "@/lib/events";

type TestResult = {
  processed: number | undefined;
  succeeded: number | undefined;
  failed: number | undefined;
  error?: string;
  details?: any;
};

// Champs "humains" à afficher selon le type d'événement
const humanFieldsConfig: Record<
  EventType,
  Array<{
    key: string;
    label: string;
    type: "text" | "number" | "select";
    options?: string[];
  }>
> = {
  DOSSIER_CREATED: [],
  DOSSIER_STATUS_CHANGED: [
    { key: "old_status", label: "Ancien statut", type: "text" },
    { key: "new_status", label: "Nouveau statut", type: "text" },
    { key: "dossier_type", label: "Type de dossier", type: "text" },
  ],
  STEP_STARTED: [],
  STEP_COMPLETED: [
    { key: "step_name", label: "Nom de l'étape", type: "text" },
    { key: "step_label", label: "Libellé de l'étape", type: "text" },
  ],
  DOCUMENT_UPLOADED: [
    { key: "file_name", label: "Nom du fichier", type: "text" },
    { key: "mime_type", label: "Type MIME", type: "text" },
  ],
  DOCUMENT_REVIEWED: [
    {
      key: "document_type",
      label: "Type de document",
      type: "select",
      options: ["PASSPORT", "DRIVER_LICENSE", "UTILITY_BILL", "OTHER"],
    },
    { key: "reviewer_name", label: "Nom du vérificateur", type: "text" },
    {
      key: "review_status",
      label: "Statut",
      type: "select",
      options: ["APPROVED", "REJECTED"],
    },
  ],
  DOCUMENT_DELIVERED: [
    { key: "document_count", label: "Nombre de documents", type: "number" },
    { key: "step_name", label: "Nom de l'étape", type: "text" },
    { key: "message", label: "Message", type: "text" },
  ],
  PAYMENT_RECEIVED: [
    { key: "amount_paid", label: "Montant payé", type: "number" },
    {
      key: "currency",
      label: "Devise",
      type: "select",
      options: ["EUR", "USD", "GBP"],
    },
  ],
  PAYMENT_FAILED: [{ key: "reason", label: "Raison de l'échec", type: "text" }],
  MESSAGE_SENT: [{ key: "content", label: "Contenu du message", type: "text" }],
  MANUAL_CLIENT_CREATED: [],
  ERROR: [
    { key: "error_type", label: "Type d'erreur", type: "text" },
    { key: "error_message", label: "Message d'erreur", type: "text" },
  ],
};

export default function TestNotificationsPage() {
  const api = useApi();
  const [email, setEmail] = useState<string>("");
  const [selectedEventType, setSelectedEventType] =
    useState<EventType>("DOSSIER_CREATED");
  const [humanFields, setHumanFields] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  // Mettre à jour les champs humains quand le type d'événement change
  const handleEventTypeChange = (newType: EventType) => {
    setSelectedEventType(newType);
    setHumanFields({}); // Réinitialiser les champs
  };

  // Mettre à jour un champ humain
  const updateHumanField = (key: string, value: any) => {
    setHumanFields((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Exécuter le test
  const handleTest = async () => {
    if (!email) {
      setResult({
        processed: 0,
        succeeded: 0,
        failed: 0,
        error: "Veuillez saisir une adresse email",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const data = await api.post<{
        processed: number;
        succeeded: number;
        failed: number;
        error?: string;
      }>("/api/admin/test-notifications", {
        email,
        eventType: selectedEventType,
        humanFields,
      });

      if (data?.error !== undefined) {
        setResult({
          processed: data.processed ?? 0,
          succeeded: data.succeeded ?? 0,
          failed: data.failed ?? 0,
          error: data.error || "Erreur lors de l'exécution du test",
          details: data,
        });
      } else {
        setResult(data);
      }
    } catch (error: any) {
      setResult({
        processed: 0,
        succeeded: 0,
        failed: 0,
        error: error.message || "Erreur inconnue",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fieldsToShow = humanFieldsConfig[selectedEventType];

  return (
    <div className="min-h-screen bg-[#191A1D] p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#F9F9F9] mb-2">
          🧪 Test des Notifications (Mode Simplifié)
        </h1>
        <p className="text-[#A0A0A0] mb-6">
          Testez rapidement les notifications en saisissant uniquement votre
          email et les informations contextuelles
        </p>

        {/* Formulaire simplifié */}
        <div className="bg-[#2D3033] rounded-xl p-6 mb-6 space-y-6">
          {/* Email de destination */}
          <div>
            <label className="block text-[#F9F9F9] font-semibold mb-3">
              📧 Adresse email de destination *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre-email@example.com"
              className="w-full bg-[#1A1C1F] border border-[#3D4043] rounded-lg px-4 py-3 text-[#F9F9F9] focus:outline-none focus:ring-2 focus:ring-[#4A9EFF]"
            />
            <p className="text-[#A0A0A0] text-sm mt-2">
              L'utilisateur sera créé automatiquement si n'existe pas
            </p>
          </div>

          {/* Type d'événement */}
          <div>
            <label className="block text-[#F9F9F9] font-semibold mb-3">
              Type d'événement
            </label>
            <select
              value={selectedEventType}
              onChange={(e) =>
                handleEventTypeChange(e.target.value as EventType)
              }
              className="w-full bg-[#1A1C1F] border border-[#3D4043] rounded-lg px-4 py-3 text-[#F9F9F9] focus:outline-none focus:ring-2 focus:ring-[#4A9EFF]"
            >
              {Object.keys(humanFieldsConfig).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Champs contextuels selon le type d'événement */}
          {fieldsToShow.length > 0 && (
            <div>
              <label className="block text-[#F9F9F9] font-semibold mb-3">
                Informations contextuelles (optionnel)
              </label>
              <div className="space-y-4">
                {fieldsToShow.map((field) => (
                  <div key={field.key}>
                    <label className="block text-[#A0A0A0] text-sm mb-1">
                      {field.label}
                    </label>
                    {field.type === "select" && field.options ? (
                      <select
                        value={humanFields[field.key] || ""}
                        onChange={(e) =>
                          updateHumanField(field.key, e.target.value)
                        }
                        className="w-full bg-[#1A1C1F] border border-[#3D4043] rounded-lg px-4 py-2 text-[#F9F9F9] focus:outline-none focus:ring-2 focus:ring-[#4A9EFF]"
                      >
                        <option value="">-- Sélectionner --</option>
                        {field.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={humanFields[field.key] || ""}
                        onChange={(e) =>
                          updateHumanField(
                            field.key,
                            field.type === "number"
                              ? parseFloat(e.target.value) || 0
                              : e.target.value
                          )
                        }
                        placeholder={`Saisir ${field.label.toLowerCase()}`}
                        className="w-full bg-[#1A1C1F] border border-[#3D4043] rounded-lg px-4 py-2 text-[#F9F9F9] focus:outline-none focus:ring-2 focus:ring-[#4A9EFF]"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {fieldsToShow.length === 0 && (
            <div className="bg-[#1A1C1F] rounded-lg p-4 text-center text-[#A0A0A0] text-sm">
              Aucun champ contextuel requis pour ce type d'événement
            </div>
          )}
        </div>

        {/* Bouton de test */}
        <div className="mb-6">
          <button
            onClick={handleTest}
            disabled={isLoading || !email}
            className="w-full bg-[#4A9EFF] hover:bg-[#3A8EEF] disabled:bg-[#3D4043] disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {isLoading ? "⏳ Exécution en cours..." : "▶️ Exécuter le test"}
          </button>
        </div>

        {/* Résultats */}
        {result && (
          <div className="bg-[#2D3033] rounded-xl p-6">
            <h2 className="text-xl font-bold text-[#F9F9F9] mb-4">Résultats</h2>

            {result.error ? (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-4">
                <p className="text-red-400 font-semibold mb-2">❌ Erreur</p>
                <p className="text-red-300">{result.error}</p>
                {result.details && (
                  <pre className="mt-2 text-xs text-red-200 overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#1A1C1F] rounded-lg p-4">
                    <p className="text-[#A0A0A0] text-sm mb-1">
                      Règles traitées
                    </p>
                    <p className="text-2xl font-bold text-[#F9F9F9]">
                      {result.processed}
                    </p>
                  </div>
                  <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
                    <p className="text-green-400 text-sm mb-1">Succès</p>
                    <p className="text-2xl font-bold text-green-400">
                      {result.succeeded}
                    </p>
                  </div>
                  <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                    <p className="text-red-400 text-sm mb-1">Échecs</p>
                    <p className="text-2xl font-bold text-red-400">
                      {result.failed}
                    </p>
                  </div>
                </div>

                {result.succeeded && result.succeeded > 0 && (
                  <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
                    <p className="text-green-400 font-semibold mb-2">
                      ✅ Notifications créées avec succès
                    </p>
                    <p className="text-green-300 text-sm">
                      {result.succeeded} notification(s) ont été créée(s) et les
                      emails devraient être envoyés à <strong>{email}</strong>
                    </p>
                  </div>
                )}

                {result.details && (
                  <div className="bg-[#1A1C1F] rounded-lg p-4">
                    <p className="text-[#A0A0A0] text-sm mb-2">Détails</p>
                    <pre className="text-xs text-[#F9F9F9] overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
