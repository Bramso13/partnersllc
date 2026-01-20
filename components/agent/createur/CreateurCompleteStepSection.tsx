"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import type { CreateurStepDetails } from "@/lib/agent-steps";

interface CreateurCompleteStepSectionProps {
  stepInstanceId: string;
  adminDocuments: CreateurStepDetails["admin_documents"];
  isCompleted: boolean;
}

export function CreateurCompleteStepSection({
  stepInstanceId,
  adminDocuments,
  isCompleted,
}: CreateurCompleteStepSectionProps) {
  const [completing, setCompleting] = useState(false);

  // Vérifier si tous les documents requis sont livrés
  const allDocumentsDelivered = adminDocuments.every(
    (doc) => doc.document?.status === "DELIVERED"
  );

  const handleComplete = async () => {
    if (!allDocumentsDelivered) return;

    setCompleting(true);

    try {
      const response = await fetch(`/api/agent/steps/${stepInstanceId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_type: 'CREATEUR',
        }),
      });

      if (!response.ok) {
        throw new Error('Completion failed');
      }

      // Redirect to steps list
      window.location.href = '/agent/steps';
    } catch (error) {
      console.error('Completion error:', error);
      alert('Erreur lors de la complétion de l&apos;étape');
    } finally {
      setCompleting(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="border border-[#363636] rounded-xl bg-[#191A1D] p-6">
        <div className="flex items-center gap-3 text-green-400">
          <CheckCircle className="w-6 h-6" />
          <h3 className="text-lg font-semibold">Étape Complétée</h3>
        </div>
        <p className="text-brand-text-secondary text-sm mt-2">
          Tous les documents ont été créés et livrés au client. Cette étape est terminée.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[#363636] rounded-xl bg-[#191A1D] p-6">
      <h3 className="text-lg font-semibold text-brand-text-primary mb-4">
        Complétion de l&apos;Étape
      </h3>

      {/* Vérifications */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3">
          {allDocumentsDelivered ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <span className={`text-sm ${allDocumentsDelivered ? 'text-green-400' : 'text-red-400'}`}>
            Tous les documents requis sont créés et livrés au client
          </span>
        </div>

        {!allDocumentsDelivered && (
          <div className="ml-8 text-sm text-brand-text-secondary">
            Documents manquants ou non livrés :
            <ul className="list-disc list-inside mt-1">
              {adminDocuments
                .filter((doc) => !doc.document || doc.document.status !== "DELIVERED")
                .map((doc) => (
                  <li key={doc.document_type.id}>{doc.document_type.label}</li>
                ))}
            </ul>
          </div>
        )}
      </div>

      {/* Bouton de complétion */}
      <button
        onClick={handleComplete}
        disabled={!allDocumentsDelivered || completing}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          allDocumentsDelivered && !completing
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-[#363636] text-brand-text-secondary cursor-not-allowed'
        }`}
      >
        {completing ? (
          'Complétion en cours...'
        ) : allDocumentsDelivered ? (
          'Marquer comme complété'
        ) : (
          'Complétion impossible - Documents manquants'
        )}
      </button>

      {!allDocumentsDelivered && (
        <p className="text-brand-text-secondary text-xs text-center mt-2">
          Tous les documents doivent être uploadés et livrés avant de pouvoir compléter l&apos;étape.
        </p>
      )}
    </div>
  );
}