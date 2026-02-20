"use client";

import { useEffect, useState } from "react";
import { useHubMarketplace } from "@/lib/contexts/hub/marketplace/HubMarketplaceContext";
import { Search, Plus, Star, Tag, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { CreateListingModal } from "./CreateListingModal";
import type { MarketplaceListing } from "@/types/hub-marketplace";

const CATEGORIES = [
  { value: "", label: "Tous" },
  { value: "Juridique", label: "Juridique" },
  { value: "Finance", label: "Finance" },
  { value: "Tech", label: "Tech" },
  { value: "Marketing", label: "Marketing" },
  { value: "Formation", label: "Formation" },
  { value: "Immobilier", label: "Immobilier" },
  { value: "Conseil", label: "Conseil" },
  { value: "Autre", label: "Autre" },
];

const PRICE_LABELS: Record<string, string> = {
  fixed: "",
  quote: "Sur devis",
  free: "Gratuit",
};

const CATEGORY_COLORS: Record<string, string> = {
  Juridique: "#A78BFA",
  Finance: "#F59E0B",
  Tech: "#00F0FF",
  Marketing: "#50B989",
  Formation: "#FB923C",
  Immobilier: "#38BDF8",
  Conseil: "#F472B6",
  Autre: "#94A3B8",
};

function ListingCard({ listing, onInquire }: { listing: MarketplaceListing; onInquire: (l: MarketplaceListing) => void }) {
  const color = CATEGORY_COLORS[listing.category] ?? "#94A3B8";

  return (
    <div
      className="group flex flex-col rounded-2xl p-5 transition-all duration-200 hover:border-white/10 hover:scale-[1.01]"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span
          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
          style={{ background: `${color}18`, color }}
        >
          {listing.category}
        </span>
        {listing.price_type !== "quote" && (
          <span className="text-[11px] text-white/40">
            {listing.price_type === "free"
              ? "Gratuit"
              : listing.price_amount
              ? `${listing.price_amount.toLocaleString("fr-FR")} €`
              : ""}
          </span>
        )}
        {listing.price_type === "quote" && (
          <span className="text-[11px] text-white/35">Sur devis</span>
        )}
      </div>

      <h3 className="text-white font-semibold text-sm leading-snug mb-2">
        {listing.title}
      </h3>
      <p className="text-white/40 text-xs leading-relaxed flex-1 line-clamp-3">
        {listing.description}
      </p>

      {listing.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {listing.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-white/35"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <Tag size={8} />
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.05]">
        <div>
          <p className="text-white/70 text-xs font-medium">
            {listing.seller_display_name ?? "Membre"}
          </p>
          {listing.seller_profession && (
            <p className="text-white/30 text-[11px] mt-0.5">{listing.seller_profession}</p>
          )}
        </div>
        <button
          onClick={() => onInquire(listing)}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 hover:scale-[1.02]"
          style={{ background: `${color}18`, color, border: `1px solid ${color}25` }}
        >
          Contacter
        </button>
      </div>
    </div>
  );
}

function InquiryModal({ listing, onClose }: { listing: MarketplaceListing; onClose: () => void }) {
  const { sendInquiry } = useHubMarketplace();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await sendInquiry(listing.id, message);
      toast.success("Message envoyé ! Retrouvez la conversation dans Messagerie.");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: "#0E0F11", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <h3 className="text-white font-semibold mb-1">Contacter le vendeur</h3>
        <p className="text-white/40 text-xs mb-4">
          Re: <span className="text-white/60">{listing.title}</span>
        </p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Décrivez votre besoin ou posez votre question…"
          rows={4}
          maxLength={500}
          className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/15 resize-none"
        />
        <p className="text-right text-[11px] text-white/25 mt-1">{message.length}/500</p>
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/[0.07] text-white/50 text-sm hover:text-white/80 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[#0A0B0D] disabled:opacity-40 transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #00F0FF, #00C8D4)" }}
          >
            {sending ? "Envoi…" : "Envoyer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MarketplaceGrid() {
  const { listings, total, isLoading, error, fetchListings } = useHubMarketplace();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [inquiryTarget, setInquiryTarget] = useState<MarketplaceListing | null>(null);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    const t = setTimeout(() => fetchListings({ q, category }), 300);
    return () => clearTimeout(t);
  }, [q, category]);

  return (
    <div className="min-h-full bg-[#0A0B0D] p-5 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ letterSpacing: "-0.02em" }}>
            Marketplace
          </h1>
          <p className="text-white/40 text-sm mt-1">
            {isLoading ? "Chargement…" : `${total} offre${total !== 1 ? "s" : ""} disponible${total !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#0A0B0D] transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #50B989, #3da875)" }}
        >
          <Plus size={15} />
          Publier une offre
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
        <input
          type="text"
          placeholder="Rechercher un service…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full bg-white/[0.04] border border-white/[0.06] rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/10 transition-all"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-7 scrollbar-hide">
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setCategory(value === category ? "" : value)}
            className="flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium transition-all"
            style={
              category === value
                ? { background: "rgba(0,240,255,0.1)", color: "#00F0FF", border: "1px solid rgba(0,240,255,0.2)" }
                : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.05)" }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {error && (
        <p className="text-center text-sm text-red-400/70 mb-6">{error}</p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-white/20" />
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/20">
          <Package size={36} />
          <p className="text-sm">Aucune offre pour le moment</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="mt-2 text-xs text-white/40 hover:text-white/70 underline underline-offset-2 transition-colors"
          >
            Soyez le premier à publier
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} onInquire={setInquiryTarget} />
          ))}
        </div>
      )}

      {createOpen && <CreateListingModal onClose={() => setCreateOpen(false)} />}
      {inquiryTarget && <InquiryModal listing={inquiryTarget} onClose={() => setInquiryTarget(null)} />}
    </div>
  );
}
