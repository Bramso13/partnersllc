"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { HubMemberSearchResult } from "@/lib/hub/types";

const API_SUGGESTIONS = "/api/hub/suggestions";
const WIDGET_DISPLAY_COUNT = 5;
const MEMBERS_BASE = "/dashboard/hub/members";

interface ConnectionSuggestionsProps {
  /** Nombre de cartes à afficher (widget: 3–5, page dédiée: 10). Par défaut 5. */
  limit?: number;
  /** Afficher le bouton "Voir plus" (vers page suggestions). Par défaut true en mode widget. */
  showViewMore?: boolean;
  /** Titre du bloc. */
  title?: string;
}

export function ConnectionSuggestions({
  limit = WIDGET_DISPLAY_COUNT,
  showViewMore = true,
  title = "Membres que vous pourriez connaître",
}: ConnectionSuggestionsProps) {
  const [results, setResults] = useState<HubMemberSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(API_SUGGESTIONS)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 401 ? "Non autorisé" : "Erreur chargement");
        return res.json();
      })
      .then((data: { results: HubMemberSearchResult[] }) => {
        if (!cancelled) setResults(data.results ?? []);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "Erreur");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const displayList = results.slice(0, limit);
  const hasMore = results.length > limit;

  if (loading) {
    return (
      <section className="rounded-lg border border-brand-dark-border bg-brand-dark-surface p-4">
        <h2 className="text-sm font-semibold text-brand-text-primary mb-3">{title}</h2>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-brand-dark-bg/60 animate-pulse"
              data-testid="suggestion-skeleton"
            />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-lg border border-brand-dark-border bg-brand-dark-surface p-4">
        <h2 className="text-sm font-semibold text-brand-text-primary mb-3">{title}</h2>
        <p className="text-sm text-brand-text-secondary">{error}</p>
      </section>
    );
  }

  if (displayList.length === 0) {
    return (
      <section className="rounded-lg border border-brand-dark-border bg-brand-dark-surface p-4">
        <h2 className="text-sm font-semibold text-brand-text-primary mb-3">{title}</h2>
        <p className="text-sm text-brand-text-secondary">
          Aucune suggestion pour le moment. Complétez votre pays et métier dans votre profil.
        </p>
      </section>
    );
  }

  return (
    <section
      className="rounded-lg border border-brand-dark-border bg-brand-dark-surface p-4"
      data-testid="connection-suggestions"
    >
      {title ? (
        <h2 className="text-sm font-semibold text-brand-text-primary mb-3">{title}</h2>
      ) : null}
      <ul className="space-y-2">
        {displayList.map((member) => (
          <li key={member.user_id}>
            <Link
              href={`${MEMBERS_BASE}/${member.user_id}`}
              className="flex items-center gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-brand-dark-bg/60 focus:bg-brand-dark-bg/60"
              data-testid={`suggestion-card-${member.user_id}`}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-accent/20 flex items-center justify-center overflow-hidden">
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-brand-accent text-sm font-medium">
                    {(member.display_name ?? "?")[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-brand-text-primary truncate">
                  {member.display_name ?? "Membre"}
                </p>
                <p className="text-xs text-brand-text-secondary truncate">
                  {[member.profession, member.country].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {showViewMore && (hasMore || results.length > 0) && (
        <div className="mt-3 pt-3 border-t border-brand-dark-border">
          <Link
            href="/dashboard/hub/suggestions"
            className="text-sm text-brand-accent hover:underline"
            data-testid="suggestions-view-more"
          >
            Voir plus
          </Link>
        </div>
      )}
    </section>
  );
}
