"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useApi } from "@/lib/api/useApi";
import { Pagination } from "@/components/dossiers/Pagination";
import { HUB_SEARCH_COUNTRIES, HUB_SEARCH_LANGUAGES } from "./hub-search-constants";
import type { HubSearchResponse, HubSearchResultItem } from "@/app/api/hub/search/route";

const LIMIT = 20;

function buildSearchParams(params: {
  country: string[];
  profession: string[];
  expertise: string[];
  languages: string[];
  q: string;
  page: number;
}): string {
  const sp = new URLSearchParams();
  if (params.country.length) sp.set("country", params.country.join(","));
  if (params.profession.length) sp.set("profession", params.profession.join(","));
  if (params.expertise.length) sp.set("expertise", params.expertise.join(","));
  if (params.languages.length) sp.set("languages", params.languages.join(","));
  if (params.q.trim()) sp.set("q", params.q.trim());
  sp.set("page", String(params.page));
  sp.set("limit", String(LIMIT));
  return sp.toString();
}

function MemberCard({ member }: { member: HubSearchResultItem }) {
  const href = `/hub/members/${member.id}`;
  return (
    <Link
      href={href}
      className="block bg-brand-dark-surface border border-brand-dark-border rounded-xl p-5 hover:border-brand-accent/50 hover:shadow-lg transition-all text-left"
    >
      <div className="flex gap-4">
        <div className="flex-shrink-0 w-14 h-14 rounded-full bg-brand-accent/20 flex items-center justify-center overflow-hidden">
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xl font-semibold text-brand-accent">
              {(member.display_name || "?")[0].toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-brand-text-primary truncate">
            {member.display_name || "Sans nom"}
          </h3>
          {member.profession && (
            <p className="text-sm text-brand-accent mt-0.5">{member.profession}</p>
          )}
          {member.country && (
            <p className="text-xs text-brand-text-secondary mt-1">
              {HUB_SEARCH_COUNTRIES.find((c) => c.code === member.country)?.label ??
                member.country}
            </p>
          )}
          {member.bio_snippet && (
            <p className="text-sm text-brand-text-secondary mt-2 line-clamp-2">
              {member.bio_snippet}
              {member.bio_snippet.length >= 100 ? "…" : ""}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[300px] text-center">
      <div className="mb-4 rounded-full bg-brand-accent/10 p-6">
        <i className="fa-solid fa-users-slash text-4xl text-brand-accent" />
      </div>
      <h2 className="text-xl font-semibold text-brand-text-primary mb-2">
        Aucun membre trouvé
      </h2>
      <p className="text-brand-text-secondary max-w-md">
        Essayez d&apos;autres filtres ou réinitialisez la recherche.
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="bg-brand-dark-surface border border-brand-dark-border rounded-xl p-5 animate-pulse"
        >
          <div className="flex gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-dark-border" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-brand-dark-border rounded w-3/4" />
              <div className="h-3 bg-brand-dark-border rounded w-1/2" />
              <div className="h-3 bg-brand-dark-border rounded w-full" />
              <div className="h-3 bg-brand-dark-border rounded w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function HubSearchPageClient() {
  const api = useApi();
  const [country, setCountry] = useState<string[]>([]);
  const [profession, setProfession] = useState<string>("");
  const [expertise, setExpertise] = useState<string>("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [q, setQ] = useState<string>("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HubSearchResponse | null>(null);

  const runSearch = useCallback(
    async (pageNum: number = 1) => {
      setLoading(true);
      setError(null);
      const professionList = profession
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      const expertiseList = expertise
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);
      const query = buildSearchParams({
        country,
        profession: professionList,
        expertise: expertiseList,
        languages,
        q,
        page: pageNum,
      });
      try {
        const res = await api.get<HubSearchResponse>(`/api/hub/search?${query}`);
        setData(res);
        setPage(pageNum);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de la recherche");
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [api, country, profession, expertise, languages, q]
  );

  const handleSearch = () => runSearch(1);
  const handlePageChange = (newPage: number) => runSearch(newPage);

  const handleReset = () => {
    setCountry([]);
    setProfession("");
    setExpertise("");
    setLanguages([]);
    setQ("");
    setPage(1);
    setData(null);
    setError(null);
  };

  const toggleCountry = (code: string) => {
    setCountry((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };
  const toggleLanguage = (code: string) => {
    setLanguages((prev) =>
      prev.includes(code) ? prev.filter((l) => l !== code) : [...prev, code]
    );
  };

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;
  const showResults = data && !loading;
  const showEmpty = showResults && data.results.length === 0;
  const showGrid = showResults && data.results.length > 0;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar filtres */}
      <aside className="lg:w-72 flex-shrink-0">
        <div className="bg-brand-dark-surface border border-brand-dark-border rounded-xl p-5 space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-brand-text-primary block mb-1">
              Recherche texte (nom, bio)
            </span>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Nom, bio…"
              className="w-full bg-brand-dark-bg border border-brand-dark-border rounded-lg px-3 py-2 text-brand-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>

          <div>
            <span className="text-sm font-medium text-brand-text-primary block mb-2">
              Pays
            </span>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {HUB_SEARCH_COUNTRIES.map(({ code, label }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => toggleCountry(code)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    country.includes(code)
                      ? "bg-brand-accent text-brand-dark-bg"
                      : "bg-brand-dark-bg border border-brand-dark-border text-brand-text-secondary hover:border-brand-accent/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-brand-text-primary block mb-1">
              Métiers (séparés par des virgules)
            </span>
            <input
              type="text"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              placeholder="ex: Avocat, Consultant"
              className="w-full bg-brand-dark-bg border border-brand-dark-border rounded-lg px-3 py-2 text-brand-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-brand-text-primary block mb-1">
              Expertise (séparés par des virgules)
            </span>
            <input
              type="text"
              value={expertise}
              onChange={(e) => setExpertise(e.target.value)}
              placeholder="ex: LLC, Fusion"
              className="w-full bg-brand-dark-bg border border-brand-dark-border rounded-lg px-3 py-2 text-brand-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </label>

          <div>
            <span className="text-sm font-medium text-brand-text-primary block mb-2">
              Langues
            </span>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {HUB_SEARCH_LANGUAGES.map(({ code, label }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => toggleLanguage(code)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    languages.includes(code)
                      ? "bg-brand-accent text-brand-dark-bg"
                      : "bg-brand-dark-bg border border-brand-dark-border text-brand-text-secondary hover:border-brand-accent/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-brand-accent text-brand-dark-bg font-medium rounded-lg hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <i className="fa-solid fa-spinner fa-spin" /> Recherche…
                </span>
              ) : (
                "Rechercher"
              )}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 border border-brand-dark-border text-brand-text-secondary rounded-lg hover:bg-brand-dark-border/50 transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </aside>

      {/* Résultats */}
      <main className="flex-1 min-w-0">
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading && <LoadingSkeleton />}

        {showEmpty && <EmptyState />}

        {showGrid && (
          <>
            <p className="text-brand-text-secondary text-sm mb-4">
              {data!.total === 1
                ? "1 membre trouvé"
                : `${data!.total} membres trouvés`}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data!.results.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}

        {!loading && !data && !error && (
          <p className="text-brand-text-secondary py-8">
            Utilisez les filtres puis cliquez sur &quot;Rechercher&quot; pour afficher les
            résultats.
          </p>
        )}
      </main>
    </div>
  );
}
