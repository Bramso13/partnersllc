"use client";

import { useState } from "react";
import { useHubMarketplace } from "@/lib/contexts/hub/marketplace/HubMarketplaceContext";
import { X } from "lucide-react";
import { toast } from "sonner";
import type { MarketplacePriceType } from "@/types/hub-marketplace";

const CATEGORIES = ["Juridique", "Finance", "Tech", "Marketing", "Formation", "Immobilier", "Conseil", "Autre"];

interface Props {
  onClose: () => void;
}

export function CreateListingModal({ onClose }: Props) {
  const { createListing, isSubmitting } = useHubMarketplace();

  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory]       = useState("");
  const [priceType, setPriceType]     = useState<MarketplacePriceType>("quote");
  const [priceAmount, setPriceAmount] = useState("");
  const [tagsInput, setTagsInput]     = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !category) {
      toast.error("Remplissez tous les champs obligatoires");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await createListing({
        title: title.trim(),
        description: description.trim(),
        category,
        price_type: priceType,
        price_amount: priceType === "fixed" && priceAmount ? parseFloat(priceAmount) : null,
        tags,
      });
      toast.success("Offre publiée !");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: "#0E0F11", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-lg" style={{ letterSpacing: "-0.02em" }}>
            Publier une offre
          </h2>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Titre */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Titre *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. Audit juridique express"
              maxLength={100}
              className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/15"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre service en détail…"
              rows={4}
              maxLength={2000}
              className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/15 resize-none"
            />
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Catégorie *</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={
                    category === cat
                      ? { background: "rgba(0,240,255,0.1)", color: "#00F0FF", border: "1px solid rgba(0,240,255,0.2)" }
                      : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.06)" }
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Prix */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Tarif</label>
            <div className="flex gap-2 mb-3">
              {(["quote", "fixed", "free"] as MarketplacePriceType[]).map((pt) => (
                <button
                  key={pt}
                  type="button"
                  onClick={() => setPriceType(pt)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                  style={
                    priceType === pt
                      ? { background: "rgba(80,185,137,0.12)", color: "#50B989", border: "1px solid rgba(80,185,137,0.2)" }
                      : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.06)" }
                  }
                >
                  {{ quote: "Sur devis", fixed: "Prix fixe", free: "Gratuit" }[pt]}
                </button>
              ))}
            </div>
            {priceType === "fixed" && (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">€</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={priceAmount}
                  onChange={(e) => setPriceAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/15"
                />
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">
              Tags <span className="text-white/25">(séparés par des virgules)</span>
            </label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Ex. contrat, droit commercial, startup"
              className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/15"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-white/[0.07] text-white/50 text-sm hover:text-white/80 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-[#0A0B0D] disabled:opacity-40 transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #50B989, #3da875)" }}
            >
              {isSubmitting ? "Publication…" : "Publier l'offre"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
