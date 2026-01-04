"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { createPortal } from "react-dom";

type PartnersHubProfile = {
  sector?: string;
  company_name?: string;
  country?: string;
  website?: string;
  instagram?: string;
  twitter?: string;
  linkedin_profile?: string;
  linkedin_url?: string;
  facebook_page?: string;
  about_you?: string;
  profile_visible?: boolean;
};

export function PartnersHubSignupModal({ userId, onComplete }: { userId: string; onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [formData, setFormData] = useState<PartnersHubProfile>({
    profile_visible: false,
  });

  // Calculer le pourcentage de complétion
  useEffect(() => {
    let completed = 0;
    const total = step === 1 ? 9 : 11; // 9 champs étape 1 (avec Facebook et À propos), 11 au total
    
    if (step === 1) {
      if (formData.sector) completed++;
      if (formData.company_name) completed++;
      if (formData.country) completed++;
      if (formData.website) completed++;
      if (formData.instagram) completed++;
      if (formData.twitter) completed++;
      if (formData.linkedin_profile) completed++;
      if (formData.facebook_page) completed++;
      if (formData.about_you && formData.about_you.length >= 50) completed++;
    } else {
      if (formData.sector) completed++;
      if (formData.company_name) completed++;
      if (formData.country) completed++;
      if (formData.website) completed++;
      if (formData.instagram) completed++;
      if (formData.twitter) completed++;
      if (formData.linkedin_profile) completed++;
      if (formData.linkedin_url) completed++;
      if (formData.facebook_page) completed++;
      if (formData.about_you && formData.about_you.length >= 50) completed++;
      if (formData.profile_visible) completed++;
    }
    
    setProgress(Math.round((completed / total) * 100));
  }, [formData, step]);

  const handleNext = async () => {
    // Validation étape 1
    if (step === 1) {
      if (!formData.sector || !formData.company_name || !formData.country) {
        alert("Veuillez remplir tous les champs obligatoires");
        return;
      }
      if (!formData.about_you || formData.about_you.length < 50) {
        alert("Le champ 'À propos de vous' doit contenir au moins 50 caractères");
        return;
      }

      // Sauvegarder les données dans la base de données
      setLoading(true);
      try {
        const { error } = await supabase
          .from("partners_hub_profiles")
          .upsert({
            user_id: userId,
            sector: formData.sector,
            company_name: formData.company_name,
            country: formData.country,
            website: formData.website || null,
            instagram: formData.instagram || null,
            twitter: formData.twitter || null,
            linkedin_profile: formData.linkedin_profile || null,
            facebook_page: formData.facebook_page || null,
            about_you: formData.about_you,
            completed: false, // Pas encore complété car il reste l'étape 2
          }, {
            onConflict: 'user_id'
          });

        if (error) throw error;

        setStep(2);
      } catch (error: any) {
        console.error("Error saving Partners Hub profile:", error);
        alert("Erreur lors de la sauvegarde. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async () => {
    // Validation étape 2
    if (!formData.profile_visible) {
      alert("Veuillez accepter que votre profil soit visible");
      return;
    }

    setLoading(true);
    try {
      // Mettre à jour les données dans la table partners_hub_profiles
      const { error } = await supabase
        .from("partners_hub_profiles")
        .update({
          linkedin_url: formData.linkedin_url || null,
          profile_visible: formData.profile_visible,
          completed: true,
        })
        .eq("user_id", userId);

      if (error) throw error;

      onComplete();
    } catch (error: any) {
      console.error("Error saving Partners Hub profile:", error);
      alert("Erreur lors de la sauvegarde. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const sectors = [
    "Technologie",
    "Finance",
    "Consulting",
    "Marketing",
    "E-commerce",
    "Immobilier",
    "Santé",
    "Éducation",
    "Autre",
  ];

  const countries = [
    "France",
    "États-Unis",
    "Canada",
    "Royaume-Uni",
    "Allemagne",
    "Espagne",
    "Portugal",
    "Suisse",
    "Belgique",
    "Autre",
  ];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-xl border border-neutral-800 bg-gradient-to-b from-teal-900/30 via-neutral-950 to-neutral-950 p-6 lg:p-8 my-8 flex flex-col">
        {/* Header */}
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/20">
            <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">Bienvenue sur PARTNERS HUB</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Complétez votre profil pour rejoindre la communauté
            </p>
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-neutral-400">Progression</span>
                <span className="font-medium text-green-400">{progress}% complété</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="space-y-4 flex-1 overflow-y-auto pr-2">
          {step === 1 ? (
            <>
              {/* Secteur d'activité */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Secteur d&apos;activité <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.sector || ""}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="">Sélectionner un secteur</option>
                  {sectors.map((sector) => (
                    <option key={sector} value={sector}>
                      {sector}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nom de la société */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Nom de la société <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.company_name || ""}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Votre société"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>

              {/* Pays de résidence */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Pays de résidence <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.country || ""}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="">Sélectionner un pays</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              {/* Site Internet */}
              <div>
                <label className="mb-2 block text-sm font-medium">Site Internet</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <input
                    type="url"
                    value={formData.website || ""}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://votresite.com"
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-900 pl-10 pr-4 py-3 text-white placeholder-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Réseaux sociaux */}
              <div>
                <label className="mb-2 block text-sm font-medium">Réseaux sociaux</label>
                <div className="space-y-3">
                  {/* Instagram */}
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <svg className="h-5 w-5 text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={formData.instagram || ""}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      placeholder="Nom d'utilisateur Instagram"
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-900 pl-10 pr-4 py-3 text-white placeholder-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>

                  {/* Twitter/X */}
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <svg className="h-5 w-5 text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={formData.twitter || ""}
                      onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                      placeholder="Nom d'utilisateur Twitter/X"
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-900 pl-10 pr-4 py-3 text-white placeholder-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>

                  {/* LinkedIn */}
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <svg className="h-5 w-5 text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={formData.linkedin_profile || ""}
                      onChange={(e) => setFormData({ ...formData, linkedin_profile: e.target.value })}
                      placeholder="Profil Linkedin"
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-900 pl-10 pr-4 py-3 text-white placeholder-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>

                  {/* Facebook */}
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <svg className="h-5 w-5 text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </div>
                    <input
                      type="url"
                      value={formData.facebook_page || ""}
                      onChange={(e) => setFormData({ ...formData, facebook_page: e.target.value })}
                      placeholder="Page Facebook"
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-900 pl-10 pr-4 py-3 text-white placeholder-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* À propos de vous */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  À propos de vous <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.about_you || ""}
                  onChange={(e) => setFormData({ ...formData, about_you: e.target.value })}
                  placeholder="Présentez-vous et décrivez votre activité, vos compétences et ce que vous recherchez dans la communauté..."
                  rows={6}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Minimum 50 caractères ({formData.about_you?.length || 0}/50)
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Profil LinkedIn */}
              <div>
                <label className="mb-2 block text-sm font-medium">Profil LinkedIn</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </div>
                  <input
                    type="url"
                    value={formData.linkedin_url || ""}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    placeholder="https://linkedin.com/in/votre-profil"
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-900 pl-10 pr-4 py-3 text-white placeholder-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Page Facebook */}
              <div>
                <label className="mb-2 block text-sm font-medium">Page Facebook</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <input
                    type="url"
                    value={formData.facebook_page || ""}
                    onChange={(e) => setFormData({ ...formData, facebook_page: e.target.value })}
                    placeholder="https://facebook.com/votre-page"
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-900 pl-10 pr-4 py-3 text-white placeholder-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* À propos de vous */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  À propos de vous <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.about_you || ""}
                  onChange={(e) => setFormData({ ...formData, about_you: e.target.value })}
                  placeholder="Présentez-vous et décrivez votre activité, vos compétences et ce que vous recherchez dans la communauté..."
                  rows={6}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Minimum 50 caractères ({formData.about_you?.length || 0}/50)
                </p>
              </div>

              {/* Checkbox */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="profile-visible"
                  checked={formData.profile_visible || false}
                  onChange={(e) => setFormData({ ...formData, profile_visible: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-green-500 focus:ring-1 focus:ring-green-500"
                />
                <label htmlFor="profile-visible" className="text-sm text-neutral-300">
                  J&apos;accepte que mon profil soit visible par les autres membres et je confirme que les informations fournies sont exactes.{" "}
                  <span className="text-red-400">*</span>
                </label>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-neutral-800 pt-6">
          <p className="text-xs text-neutral-500">
            <span className="text-red-400">*</span> Champs obligatoires
          </p>
          <div className="flex gap-3">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="rounded-lg border border-neutral-700 bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
              >
                Retour
              </button>
            )}
            {step === 1 ? (
              <button
                onClick={handleNext}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    Suivant
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Rejoindre la communauté
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

