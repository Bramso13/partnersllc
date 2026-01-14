"use client";

import Link from "next/link";
import { AgentStats } from "@/lib/agent-metrics";

interface StatsCardsProps {
  stats: AgentStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Révisions en attente",
      value: stats.pendingReviews,
      icon: "fa-file-circle-question",
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/10",
      link: "/admin/dossiers", // TODO: Create dedicated reviews page
    },
    {
      title: "Dossiers assignés",
      value: stats.assignedDossiers,
      icon: "fa-folder-open",
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
      link: "/admin/dossiers",
    },
    {
      title: "Complétés aujourd'hui",
      value: stats.completedToday,
      icon: "fa-check-circle",
      color: "text-green-400",
      bgColor: "bg-green-400/10",
    },
    {
      title: "Temps moyen de révision",
      value: stats.avgReviewTimeHours
        ? `${stats.avgReviewTimeHours}h`
        : "N/A",
      icon: "fa-clock",
      color: "text-purple-400",
      bgColor: "bg-purple-400/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const content = (
          <div
            className={`${card.bgColor} border border-brand-border rounded-lg p-6 hover:opacity-90 transition-opacity`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.color} text-2xl`}>
                <i className={`fa-solid ${card.icon}`}></i>
              </div>
            </div>
            <div className="text-3xl font-bold text-brand-text-primary mb-1">
              {card.value}
            </div>
            <div className="text-sm text-brand-text-secondary">{card.title}</div>
          </div>
        );

        if (card.link) {
          return (
            <Link key={index} href={card.link}>
              {content}
            </Link>
          );
        }

        return <div key={index}>{content}</div>;
      })}
    </div>
  );
}