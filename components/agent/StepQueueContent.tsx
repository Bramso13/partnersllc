"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { AgentStepQueueItem } from "@/lib/agent-steps";
import { StepFilters } from "./StepFilters";
import { StepCard } from "./StepCard";

interface StepQueueContentProps {
  initialSteps: AgentStepQueueItem[];
}

type SortKey = "assigned_at" | "step_type" | "client_name";

export function StepQueueContent({ initialSteps }: StepQueueContentProps) {
  const t = useTranslations("agent.steps");
  const [steps, setSteps] = useState<AgentStepQueueItem[]>(initialSteps);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("assigned_at");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh toutes les 60s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        setIsRefreshing(true);
        const res = await fetch("/api/agent/steps");
        if (res.ok) {
          const json = await res.json();
          setSteps(json.steps || []);
        }
      } catch (e) {
        console.error("Erreur lors du rafraîchissement de la queue", e);
      } finally {
        setIsRefreshing(false);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const filteredSteps = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = [...steps];

    if (q) {
      result = result.filter((item) => {
        const clientName = item.dossier.client.full_name || "";
        const dossierId = item.dossier.id || "";
        return (
          clientName.toLowerCase().includes(q) ||
          dossierId.toLowerCase().includes(q)
        );
      });
    }

    switch (sortBy) {
      case "step_type":
        result.sort((a, b) =>
          a.step.step_type.localeCompare(b.step.step_type)
        );
        break;
      case "client_name":
        result.sort((a, b) =>
          (a.dossier.client.full_name || "").localeCompare(
            b.dossier.client.full_name || ""
          )
        );
        break;
      case "assigned_at":
      default:
        result.sort((a, b) =>
          (a.created_at || "").localeCompare(b.created_at || "")
        );
        break;
    }

    return result;
  }, [steps, search, sortBy]);

  return (
    <div className="space-y-4">
      <StepFilters
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortChange={setSortBy}
        isRefreshing={isRefreshing}
      />

      {filteredSteps.length === 0 ? (
        <div className="border border-dashed border-[#363636] rounded-2xl p-8 text-center text-brand-text-secondary">
          <p>{t("noSteps")}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSteps.map((step) => (
            <StepCard key={step.id} item={step} />
          ))}
        </div>
      )}
    </div>
  );
}

