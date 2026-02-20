"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Search,
  X,
  Filter,
  Users,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import type { HubMemberSearchResult } from "@/lib/hub/types";

const MapWithMembers = dynamic(() => import("./MapWithMembers"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#0A0B0D]">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-10 h-10 rounded-full animate-spin border-2 border-transparent"
          style={{
            borderTopColor: "#00F0FF",
            borderRightColor: "rgba(0,240,255,0.2)",
          }}
        />
        <p className="text-white/30 text-sm">Chargement de la carte…</p>
      </div>
    </div>
  ),
});

const PROFESSIONS = [
  "Avocat",
  "Consultant",
  "Développeur",
  "Entrepreneur",
  "Comptable",
  "Architecte",
  "Designer",
  "Ingénieur",
  "Formateur",
  "Coach",
];

interface SelectedMember extends HubMemberSearchResult {
  lat?: number;
  lng?: number;
}

export function HubReseauClient() {
  const [members, setMembers] = useState<HubMemberSearchResult[]>([]);
  const [filtered, setFiltered] = useState<HubMemberSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedProfession, setSelectedProfession] = useState<string | null>(
    null
  );
  const [selectedMember, setSelectedMember] = useState<SelectedMember | null>(
    null
  );
  const [panelOpen, setPanelOpen] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchMembers = useCallback(
    async (q = "", profession?: string | null) => {
      try {
        const params = new URLSearchParams();
        if (q.trim()) params.set("q", q.trim());
        if (profession) params.set("profession", profession);
        const res = await fetch(`/api/hub/search?${params}`);
        if (!res.ok) return;
        const data = await res.json();
        // API returns { results: [...], total, page, limit }
        const items = (data.results ?? []) as Array<Record<string, unknown>>;
        // Normalize: API uses `id` field (= user_id), HubMemberSearchResult expects `user_id`
        return items.map((item) => ({
          ...item,
          user_id: (item.user_id ?? item.id) as string,
        })) as HubMemberSearchResult[];
      } catch {
        return [];
      }
    },
    []
  );

  useEffect(() => {
    fetchMembers().then((data) => {
      if (data) {
        setMembers(data);
        setFiltered(data);
      }
      setLoading(false);
    });
  }, [fetchMembers]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const data = await fetchMembers(query, selectedProfession);
      if (data) setFiltered(data);
    }, 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selectedProfession, fetchMembers]);

  const countryCount =
    filtered && Array.isArray(filtered) && filtered.length > 0
      ? new Set(filtered.map((m) => m.country).filter(Boolean)).size
      : 0;

  return (
    <div className="relative flex h-[calc(100vh-0px)] md:h-screen overflow-hidden bg-[#0A0B0D]">
      {/* ── Side Panel ── */}
      <div
        className={`
          relative z-20 flex flex-col bg-[#07080A]/95 backdrop-blur-sm
          border-r border-white/[0.05]
          transition-all duration-300 ease-in-out
          ${panelOpen ? "w-[300px] md:w-[320px]" : "w-0 overflow-hidden"}
        `}
      >
        {/* Panel header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.05]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white font-semibold text-base">
                Réseau mondial
              </h2>
              <p className="text-white/35 text-xs mt-0.5">
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={10} className="animate-spin" /> Chargement…
                  </span>
                ) : (
                  `${filtered.length} membre${filtered.length !== 1 ? "s" : ""} · ${countryCount} pays`
                )}
              </p>
            </div>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`p-2 rounded-xl transition-colors ${
                filterOpen || selectedProfession
                  ? "bg-[#00F0FF]/10 text-[#00F0FF]"
                  : "text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
              }`}
            >
              <Filter size={15} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Rechercher un membre…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#00F0FF]/30 focus:bg-white/[0.06] transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filters */}
          {filterOpen && (
            <div className="mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25 mb-2">
                Métier
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PROFESSIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() =>
                      setSelectedProfession(selectedProfession === p ? null : p)
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      selectedProfession === p
                        ? "bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/25"
                        : "bg-white/[0.04] text-white/40 border border-white/[0.05] hover:text-white/70"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Member list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col gap-3 p-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-white/[0.03] animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-white/25 text-sm gap-2">
              <Users size={24} className="opacity-40" />
              <span>Aucun membre trouvé</span>
            </div>
          ) : (
            <div className="p-3 space-y-1">
              {filtered &&
                filtered.length > 0 &&
                filtered.map((member) => (
                  <button
                    key={member.user_id}
                    onClick={() => setSelectedMember(member)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-150 group ${
                      selectedMember?.user_id === member.user_id
                        ? "bg-[#00F0FF]/[0.07] border border-[#00F0FF]/10"
                        : "hover:bg-white/[0.03] border border-transparent"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white/60"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(0,240,255,0.12), rgba(80,185,137,0.12))",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      {member.display_name
                        ? member.display_name.slice(0, 2).toUpperCase()
                        : "??"}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {member.display_name ?? "Membre"}
                      </p>
                      <p className="text-white/35 text-xs truncate flex items-center gap-1 mt-0.5">
                        {member.profession && <span>{member.profession}</span>}
                        {member.profession &&
                          (member.city || member.country) && (
                            <span className="text-white/20">·</span>
                          )}
                        {(member.city || member.country) && (
                          <span className="flex items-center gap-0.5">
                            <MapPin size={9} className="opacity-60" />
                            {member.city ?? member.country}
                          </span>
                        )}
                      </p>
                    </div>
                    <ChevronRight
                      size={14}
                      className="text-white/15 group-hover:text-white/40 flex-shrink-0 transition-colors"
                    />
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Panel toggle ── */}
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-30 hidden md:flex items-center justify-center w-6 h-12 rounded-r-xl bg-[#07080A] border border-l-0 border-white/[0.07] text-white/30 hover:text-white/70 transition-all"
        style={{
          left: panelOpen ? "calc(320px - 0px)" : "0px",
          transition: "left 0.3s ease",
        }}
      >
        {panelOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* ── Map ── */}
      <div className="flex-1 relative">
        <MapWithMembers
          members={filtered}
          selectedMember={selectedMember}
          onSelectMember={setSelectedMember}
        />

        {/* Selected member card (floating) */}
        {selectedMember && (
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[320px] max-w-[90vw] rounded-2xl p-5 animate-slide-up"
            style={{
              background: "rgba(10,11,13,0.96)",
              border: "1px solid rgba(0,240,255,0.12)",
              backdropFilter: "blur(16px)",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(0,240,255,0.06)",
            }}
          >
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors"
            >
              <X size={15} />
            </button>
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white/60"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0,240,255,0.15), rgba(80,185,137,0.12))",
                  border: "1px solid rgba(0,240,255,0.15)",
                  boxShadow: "0 0 16px rgba(0,240,255,0.08)",
                }}
              >
                {selectedMember.display_name
                  ? selectedMember.display_name.slice(0, 2).toUpperCase()
                  : "??"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-base">
                  {selectedMember.display_name ?? "Membre"}
                </p>
                {selectedMember.profession && (
                  <p className="text-[#00F0FF]/70 text-sm mt-0.5">
                    {selectedMember.profession}
                  </p>
                )}
                {(selectedMember.city || selectedMember.country) && (
                  <p className="text-white/35 text-xs mt-1 flex items-center gap-1">
                    <MapPin size={10} />
                    {[selectedMember.city, selectedMember.country]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
                {selectedMember.bio_snippet && (
                  <p className="text-white/45 text-xs mt-2 leading-relaxed line-clamp-2">
                    {selectedMember.bio_snippet}
                  </p>
                )}
              </div>
            </div>
            <a
              href={`/hub/members/${selectedMember.user_id}`}
              className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-[#0A0B0D] transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #00F0FF, #00C8D4)",
              }}
            >
              Voir le profil
              <ChevronRight size={14} />
            </a>
          </div>
        )}

        {/* Stats badge */}
        {!loading && (
          <div
            className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
            style={{
              background: "rgba(10,11,13,0.85)",
              border: "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{
                background: "#50B989",
                boxShadow: "0 0 6px rgba(80,185,137,0.8)",
              }}
            />
            <span className="text-white/60">
              {members.length} membre{members.length !== 1 ? "s" : ""} ·{" "}
              {members && members.length > 0
                ? new Set(members.map((m) => m.country).filter(Boolean)).size
                : 0}{" "}
              pays
            </span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translate(-50%, 16px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-slide-up {
          animation: slide-up 0.25s ease forwards;
        }
      `}</style>
    </div>
  );
}
