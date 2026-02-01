"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AdminConversationWithDossier,
  DossierForNewConversation,
} from "@/types/conversations";
import { NewConversationModal } from "./NewConversationModal";

interface ConversationsClientsContentProps {
  initialConversations: AdminConversationWithDossier[];
  dossiers: DossierForNewConversation[];
}

export function ConversationsClientsContent({
  initialConversations,
  dossiers,
}: ConversationsClientsContentProps) {
  const router = useRouter();
  const [showNewConversationModal, setShowNewConversationModal] =
    useState(false);

  return (
    <div className="space-y-6">
      {/* Tabs: Clients / Agents */}
      <div className="flex gap-1 bg-brand-surface-light rounded-lg p-1">
        <button className="flex-1 px-4 py-2 rounded-md text-sm font-medium bg-brand-card-bg text-brand-text-primary">
          Clients
        </button>
        <button
          className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-brand-text-secondary/50 cursor-not-allowed"
          disabled
        >
          Agents
        </button>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <div className="text-brand-text-secondary">
          {initialConversations.length} conversation
          {initialConversations.length !== 1 ? "s" : ""} client
          {initialConversations.length !== 1 ? "s" : ""}
        </div>
        <button
          onClick={() => setShowNewConversationModal(true)}
          className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors font-medium"
        >
          + Nouvelle conversation
        </button>
      </div>

      {/* Conversations List */}
      {initialConversations.length === 0 ? (
        <div className="bg-brand-card-bg rounded-lg p-8 text-center">
          <i className="fas fa-comments text-4xl text-brand-text-secondary mb-4"></i>
          <p className="text-brand-text-secondary">
            Aucune conversation client pour le moment
          </p>
          <p className="text-brand-text-secondary/70 text-sm mt-2">
            Créez une nouvelle conversation pour commencer
          </p>
        </div>
      ) : (
        <div className="bg-brand-card-bg rounded-lg overflow-hidden border border-brand-stroke">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-stroke">
                <th className="text-left px-4 py-3 text-sm font-medium text-brand-text-secondary">
                  Client
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-brand-text-secondary">
                  Dossier / Produit
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-brand-text-secondary">
                  Dernière activité
                </th>
              </tr>
            </thead>
            <tbody>
              {initialConversations.map((conv) => (
                <tr
                  key={conv.id}
                  onClick={() =>
                    router.push(`/admin/conversations/clients/${conv.id}`)
                  }
                  className="border-b border-brand-stroke/50 hover:bg-brand-surface-light cursor-pointer transition-colors last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <span className="text-brand-text-primary font-medium">
                      {conv.dossier?.user?.full_name ?? "Client inconnu"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-brand-text-secondary">
                      {conv.dossier?.product?.name ?? "Produit inconnu"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-brand-text-secondary text-sm">
                      {new Date(conv.updated_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Conversation Modal */}
      {showNewConversationModal && (
        <NewConversationModal
          dossiers={dossiers}
          onClose={() => setShowNewConversationModal(false)}
          onConversationCreated={(conversationId) => {
            setShowNewConversationModal(false);
            router.push(`/admin/conversations/clients/${conversationId}`);
          }}
        />
      )}
    </div>
  );
}
