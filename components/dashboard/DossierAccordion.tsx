"use client";

import { useState } from "react";
import { DossierWithDetails } from "@/lib/dossiers";
import { ProductStep } from "@/lib/workflow";
import { DossierAccordionItem } from "./DossierAccordionItem";

interface AdvisorInfo {
  id: string | null;
  name: string;
  email: string;
  role: string;
}

interface DossierData {
  dossier: DossierWithDetails;
  productSteps: ProductStep[];
  advisor?: AdvisorInfo;
}

interface DossierAccordionProps {
  dossiers: DossierData[];
}

export function DossierAccordion({ dossiers }: DossierAccordionProps) {
  // First dossier is expanded by default
  const [expandedId, setExpandedId] = useState<string | null>(
    dossiers[0]?.dossier.id || null
  );

  const handleToggle = (dossierId: string) => {
    setExpandedId((current) => (current === dossierId ? null : dossierId));
  };

  if (dossiers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {dossiers.map(({ dossier, productSteps, advisor }) => (
        <DossierAccordionItem
          key={dossier.id}
          dossier={dossier}
          productSteps={productSteps}
          advisor={advisor}
          isExpanded={expandedId === dossier.id}
          onToggle={() => handleToggle(dossier.id)}
        />
      ))}
    </div>
  );
}
