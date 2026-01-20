"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { CreateurStepDetails } from "@/lib/agent-steps";

interface CreateurDossierDataSectionProps {
  client: CreateurStepDetails["dossier"]["client"];
  product: CreateurStepDetails["dossier"]["product"];
  previousStepsData: CreateurStepDetails["previous_steps_data"];
}

export function CreateurDossierDataSection({
  client,
  product,
  previousStepsData,
}: CreateurDossierDataSectionProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (position: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(position)) {
      newExpanded.delete(position);
    } else {
      newExpanded.add(position);
    }
    setExpandedSteps(newExpanded);
  };

  return (
    <div className="border border-[#363636] rounded-xl bg-[#191A1D] p-6">
      <h3 className="text-lg font-semibold text-brand-text-primary mb-6">
        Données du Dossier
      </h3>

      <div className="space-y-4">
        {/* Informations Client */}
        <div className="border border-[#363636] rounded-lg bg-[#1A1B1E] p-4">
          <h4 className="text-md font-medium text-brand-text-primary mb-3">
            Informations Client
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-brand-text-secondary text-sm">Nom complet:</span>
              <p className="text-brand-text-primary font-medium">{client.full_name}</p>
            </div>
            {client.phone && (
              <div>
                <span className="text-brand-text-secondary text-sm">Téléphone:</span>
                <p className="text-brand-text-primary font-medium">{client.phone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Informations Produit */}
        <div className="border border-[#363636] rounded-lg bg-[#1A1B1E] p-4">
          <h4 className="text-md font-medium text-brand-text-primary mb-3">
            Informations Produit
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-brand-text-secondary text-sm">Nom du produit:</span>
              <p className="text-brand-text-primary font-medium">{product.name}</p>
            </div>
            {product.description && (
              <div>
                <span className="text-brand-text-secondary text-sm">Description:</span>
                <p className="text-brand-text-primary">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Étapes Précédentes */}
        {previousStepsData.length > 0 && (
          <div className="border border-[#363636] rounded-lg bg-[#1A1B1E] p-4">
            <h4 className="text-md font-medium text-brand-text-primary mb-4">
              Étapes Précédentes Complétées
            </h4>
            <div className="space-y-2">
              {previousStepsData.map((prevStep) => (
                <div key={prevStep.step.position} className="border border-[#363636] rounded-md">
                  <button
                    onClick={() => toggleStep(prevStep.step.position)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-[#2A2B2F] transition-colors rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      {expandedSteps.has(prevStep.step.position) ? (
                        <ChevronDown className="w-4 h-4 text-brand-text-secondary" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-brand-text-secondary" />
                      )}
                      <span className="text-brand-text-primary font-medium">
                        Étape {prevStep.step.position}: {prevStep.step.label}
                      </span>
                    </div>
                    <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded">
                      Complétée
                    </span>
                  </button>

                  {expandedSteps.has(prevStep.step.position) && (
                    <div className="px-3 pb-3">
                      <div className="border-t border-[#363636] pt-3 mt-2">
                        {prevStep.fields.length > 0 ? (
                          <div className="space-y-2">
                            {prevStep.fields.map((field, idx) => (
                              <div key={idx} className="flex justify-between items-start">
                                <span className="text-brand-text-secondary text-sm">
                                  {field.label}:
                                </span>
                                <span className="text-brand-text-primary text-sm ml-2">
                                  {field.value || "N/A"}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-brand-text-secondary text-sm italic">
                            Aucune donnée saisie pour cette étape
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}