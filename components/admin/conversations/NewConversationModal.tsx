"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import type { DossierForNewConversation } from "@/types/conversations";

interface NewConversationModalProps {
  dossiers: DossierForNewConversation[];
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

export function NewConversationModal({
  dossiers,
  onClose,
  onConversationCreated,
}: NewConversationModalProps) {
  const [search, setSearch] = useState("");
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);

  const filteredDossiers = useMemo(() => {
    if (!search) return dossiers;
    const term = search.toLowerCase();
    return dossiers.filter(
      (d) =>
        d.clientName.toLowerCase().includes(term) ||
        d.productName.toLowerCase().includes(term) ||
        d.id.toLowerCase().includes(term)
    );
  }, [dossiers, search]);

  const handleCreate = async () => {
    if (!selectedDossierId) return;
    setIsCreating(true);
    try {
      // Check if conversation already exists for this dossier
      const checkResp = await fetch(
        `/api/admin/conversations?type=client&dossier_id=${selectedDossierId}`
      );
      if (checkResp.ok) {
        const checkData = await checkResp.json();
        if (checkData.conversations && checkData.conversations.length > 0) {
          onConversationCreated(checkData.conversations[0].id);
          return;
        }
      }

      // Create new conversation
      const createResp = await fetch("/api/admin/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "client",
          dossier_id: selectedDossierId,
        }),
      });

      if (!createResp.ok) {
        const errorData = await createResp.json();
        throw new Error(errorData.error ?? "Échec de la création");
      }

      const createData = await createResp.json();
      onConversationCreated(createData.conversation.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la création"
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-brand-card-bg rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-brand-stroke">
          <h2 className="text-lg font-semibold text-brand-text-primary">
            Nouvelle conversation
          </h2>
          <button
            onClick={onClose}
            className="text-brand-text-secondary hover:text-brand-text-primary transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-2">
              Rechercher un dossier
            </label>
            <input
              type="text"
              placeholder="Client, produit ou référence..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-brand-surface-light border border-brand-stroke rounded-lg text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:border-brand-accent"
            />
          </div>

          {/* Dossier List */}
          <div className="max-h-60 overflow-y-auto space-y-1">
            {filteredDossiers.length === 0 ? (
              <p className="text-center text-brand-text-secondary/70 text-sm py-4">
                Aucun dossier trouvé
              </p>
            ) : (
              filteredDossiers.map((dossier) => (
                <button
                  key={dossier.id}
                  onClick={() => setSelectedDossierId(dossier.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                    selectedDossierId === dossier.id
                      ? "bg-brand-accent/10 border border-brand-accent"
                      : "hover:bg-brand-surface-light border border-transparent"
                  }`}
                >
                  <div className="text-sm font-medium text-brand-text-primary">
                    {dossier.clientName}
                  </div>
                  <div className="text-xs text-brand-text-secondary">
                    {dossier.productName}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-brand-stroke">
          <button
            onClick={onClose}
            className="px-4 py-2 text-brand-text-secondary hover:text-brand-text-primary transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleCreate}
            disabled={!selectedDossierId || isCreating}
            className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? "Création..." : "Ouvrir conversation"}
          </button>
        </div>
      </div>
    </div>
  );
}
