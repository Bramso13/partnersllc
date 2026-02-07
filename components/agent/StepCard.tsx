import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AgentStepQueueItem } from "@/lib/agent-steps";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";

interface StepCardProps {
  item: AgentStepQueueItem;
}

function getStatus(
  item: AgentStepQueueItem,
  t: ReturnType<typeof useTranslations<"agent.steps">>
) {
  if (item.completed_at) {
    return {
      label: t("statusDone"),
      color: "text-green-400",
      bg: "bg-green-500/10",
    };
  }
  if (item.started_at) {
    return {
      label: t("statusInProgress"),
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    };
  }
  return {
    label: t("statusNotStarted"),
    color: "text-gray-300",
    bg: "bg-gray-500/10",
  };
}

export function StepCard({ item }: StepCardProps) {
  const t = useTranslations("agent.steps");
  const status = getStatus(item, t);
  const createdAt = item.created_at
    ? formatDistanceToNow(new Date(item.created_at), {
        addSuffix: true,
        locale: enUS,
      })
    : "";

  const dossierIdShort = item.dossier.id
    ? `${item.dossier.id.slice(0, 8)}...`
    : "";

  return (
    <div className="border border-[#363636] rounded-2xl bg-[#191A1D] p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              item.step.step_type === "CLIENT"
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-sky-500/20 text-sky-300"
            }`}
          >
            {item.step.step_type}
          </span>
          <span className="text-sm font-medium text-brand-text-primary">
            {item.step.label || item.step.code}
          </span>
        </div>
        <span className="text-xs text-brand-text-secondary">{createdAt}</span>
      </div>

      <div className="h-px bg-[#363636]" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-1 text-sm">
          <div className="text-brand-text-primary">
            {t("client")}:{" "}
            <span className="font-medium">
              {item.dossier.client.full_name || "N/A"}
            </span>{" "}
          </div>
          <div className="text-brand-text-secondary">
            {t("product")}:{" "}
            <span className="font-medium">{item.dossier.product.name}</span> •{" "}
            {t("dossier")}:{" "}
            <span className="font-mono text-xs">{dossierIdShort}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}
          >
            {status.label}
          </span>
          <Link
            href={`/agent/steps/${item.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white text-sm font-medium transition-colors"
          >
            {t("process")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

