"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { ContactButton } from "@/components/ui/ContactButton";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
};

export default function MonEntreprisePage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      setProfile(data);
      setLoading(false);
    }

    fetchProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-900">
        <p className="text-neutral-500">Chargement...</p>
      </div>
    );
  }

  const userName = profile?.full_name || profile?.email?.split("@")[0] || "Utilisateur";

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-neutral-900 text-white">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] border-r border-neutral-800 bg-neutral-950 transition-transform duration-300 lg:static lg:z-auto ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-full flex-col p-4 lg:p-6">
          {/* Mobile Close Button */}
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <Logo variant="sidebar" />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-neutral-400 hover:text-white"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Logo - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block">
            <Logo variant="sidebar" />
          </div>

          {/* MENU Section */}
          <div className="mb-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              MENU
            </p>
            <nav className="space-y-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span>Tableau de bord</span>
              </Link>
              <Link
                href="/dossier-llc"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <span>Mon dossier LLC</span>
              </Link>
              <Link
                href="/documents"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Documents</span>
              </Link>
              <Link
                href="/mon-entreprise"
                className="flex items-center gap-3 rounded-lg bg-green-500/20 px-3 py-2.5 text-green-400 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span className="font-medium">Mon Entreprise</span>
              </Link>
              <Link
                href="/partners-hub"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
                <span>PARTNERS Hub</span>
              </Link>
              <Link
                href="/formation"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <span>Formation</span>
              </Link>
            </nav>
          </div>

          {/* SUPPORT Section */}
          <div className="mb-6 border-t border-neutral-800 pt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              SUPPORT
            </p>
            <nav className="space-y-1">
              <Link
                href="/support"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span>Support</span>
              </Link>
              <Link
                href="/parametres"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Paramètres</span>
              </Link>
            </nav>
          </div>

          {/* Help Section */}
          <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <p className="mb-1 text-sm font-semibold">Besoin d&apos;aide ?</p>
            <p className="mb-4 text-xs leading-relaxed text-neutral-400">
              Contactez votre conseiller dédié pour toute question.
            </p>
            <ContactButton />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden lg:ml-0">
        {/* Top Bar */}
        <header className="border-b border-neutral-800 bg-neutral-950 px-4 py-3 lg:px-8 lg:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="text-neutral-400 hover:text-white lg:hidden"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Search Bar - Centered */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Q Rechercher..."
                className="mx-auto block w-full max-w-md rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs lg:px-4 lg:py-2.5 lg:text-sm text-white placeholder:text-neutral-500 focus:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            {/* Right Side - Company Selector, Notifications and Profile */}
            <div className="flex items-center gap-3 lg:gap-6">
              <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2">
                <span className="text-sm font-medium">INNOVATECH LLC</span>
                <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              <button className="text-neutral-400 transition-colors hover:text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600"></div>
                <div>
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-neutral-400">Client Premium</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-md border border-neutral-700 px-3 py-1 text-xs font-medium text-neutral-300 transition-colors hover:border-red-500 hover:bg-red-500/10 hover:text-red-400"
                >
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-900 p-4 lg:p-8">
          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold">Mon Entreprise</h1>
            <p className="mt-2 text-sm lg:text-base text-neutral-400">
              Gérez la conformité, la facturation et les services de votre LLC.
            </p>
          </div>

          <div className="space-y-6">
            {/* Top Section - Statut + Aperçu */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
              {/* Statut de conformité */}
              <div className="lg:col-span-8 rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
                <h2 className="mb-4 lg:mb-6 text-lg lg:text-xl font-semibold">Statut de conformité</h2>
                <div className="space-y-6">
                  {/* Rapport Annual */}
                  <div className="flex items-start justify-between border-b border-neutral-800 pb-6 last:border-0 last:pb-0">
                    <div className="flex-1">
                      <h3 className="font-semibold">Rapport Annual</h3>
                      <p className="mt-1 text-sm text-neutral-400">
                        Prochaine échéance : 1er Avril 2026
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-neutral-500">À jour</span>
                        <span className="text-xs text-neutral-500">•</span>
                        <span className="text-xs text-neutral-500">Déposé le 25 Mars 2025</span>
                      </div>
                    </div>
                    <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
                      Conforme
                    </span>
                  </div>

                  {/* Agent Enregistré */}
                  <div className="flex items-start justify-between border-b border-neutral-800 pb-6 last:border-0 last:pb-0">
                    <div className="flex-1">
                      <h3 className="font-semibold">Agent Enregistré</h3>
                      <p className="mt-1 text-sm text-neutral-400">
                        Renouvellement : 15 Décembre 2025
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">Dans 180 jours</p>
                    </div>
                    <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-medium text-orange-400">
                      À renouveler
                    </span>
                  </div>

                  {/* Déclaration Fiscale */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">Déclaration Fiscale (Form 5472)</h3>
                      <p className="mt-1 text-sm text-neutral-400">Échéance : 15 Avril 2026</p>
                      <p className="mt-1 text-xs text-neutral-500">Préparation requise</p>
                    </div>
                    <span className="rounded-full bg-neutral-700/50 px-3 py-1 text-xs font-medium text-neutral-400">
                      En attente
                    </span>
                  </div>
                </div>
              </div>

              {/* Aperçu Financier */}
              <div className="lg:col-span-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
                <h2 className="mb-4 lg:mb-6 text-lg lg:text-xl font-semibold">Aperçu Financier</h2>
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-neutral-400">Revenus (30)</p>
                    <p className="mt-2 text-2xl font-bold">$12,450.00</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400">Dépenses (30)</p>
                    <p className="mt-2 text-2xl font-bold">$3,120.50</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-400">Solde actuel</p>
                    <p className="mt-2 text-2xl font-bold text-blue-500">$28,730.15</p>
                  </div>
                </div>
                <button className="mt-6 rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600">
                  + Créer une facture
                </button>
              </div>
            </div>

            {/* Facturation récente - Pleine largeur */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-4 lg:mb-6 flex items-center justify-between">
                <h2 className="text-lg lg:text-xl font-semibold">Facturation récente</h2>
                <a href="#" className="text-sm text-blue-400 hover:text-blue-300">
                  Voir tout
                </a>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      <th className="pb-3 text-left text-xs font-semibold uppercase text-neutral-400">
                        N° FACTURE
                      </th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase text-neutral-400">
                        CLIENT
                      </th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase text-neutral-400">
                        DATE
                      </th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase text-neutral-400">
                        MONTANT
                      </th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase text-neutral-400">
                        STATUT
                      </th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase text-neutral-400">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    <tr>
                      <td className="py-4 text-sm font-medium">#BW-4145</td>
                      <td className="py-4 text-sm text-neutral-300">Tech Solutions Inc.</td>
                      <td className="py-4 text-sm text-neutral-400">12 Déc 2025</td>
                      <td className="py-4 text-sm font-medium">$2,500.00</td>
                      <td className="py-4">
                        <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-400">
                          PAYÉE
                        </span>
                      </td>
                      <td className="py-4">
                        <button className="text-neutral-400 hover:text-white">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 text-sm font-medium">#BW-4144</td>
                      <td className="py-4 text-sm text-neutral-300">Creative Minds Agency</td>
                      <td className="py-4 text-sm text-neutral-400">05 Déc 2025</td>
                      <td className="py-4 text-sm font-medium">$1,200.00</td>
                      <td className="py-4">
                        <span className="rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-medium text-yellow-400">
                          EN ATTENTE
                        </span>
                      </td>
                      <td className="py-4">
                        <button className="text-neutral-400 hover:text-white">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 text-sm font-medium">#BW-4143</td>
                      <td className="py-4 text-sm text-neutral-300">Global Exports LLC</td>
                      <td className="py-4 text-sm text-neutral-400">15 Nov 2025</td>
                      <td className="py-4 text-sm font-medium">$8,750.00</td>
                      <td className="py-4">
                        <span className="rounded-full bg-red-500/20 px-2 py-1 text-xs font-medium text-red-400">
                          EN RETARD
                        </span>
                      </td>
                      <td className="py-4">
                        <button className="text-neutral-400 hover:text-white">
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Section - Services & Documents Officiels */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
              <h2 className="mb-6 text-xl font-semibold">Services & Documents Officiels</h2>
              <div className="grid grid-cols-4 gap-4">
                  {/* Certificat de Good Standing */}
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                      <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="mb-2 font-semibold">Certificat de Good Standing</h3>
                    <p className="mb-3 text-xs text-neutral-400">
                      Prouver la bonne conformité de votre entreprise.
                    </p>
                    <a href="#" className="text-sm text-blue-400 hover:text-blue-300">
                      Commander
                    </a>
                  </div>

                  {/* Modification d'Adresse */}
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                      <svg className="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="mb-2 font-semibold">Modification d&apos;Adresse</h3>
                    <p className="mb-3 text-xs text-neutral-400">
                      Mettez à jour l&apos;adresse officielle de votre LLC.
                    </p>
                    <a href="#" className="text-sm text-blue-400 hover:text-blue-300">
                      Demander
                    </a>
                  </div>

                  {/* Ouverture de Compte Bancaire */}
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/20">
                      <svg className="h-6 w-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <h3 className="mb-2 font-semibold">Ouverture de Compte Bancaire</h3>
                    <p className="mb-3 text-xs text-neutral-400">
                      Assistance pour ouvrir votre compte professionnel US.
                    </p>
                    <a href="#" className="text-sm text-blue-400 hover:text-blue-300">
                      Commencer
                    </a>
                  </div>

                  {/* Obtenir un EIN */}
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                      <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="mb-2 font-semibold">Obtenir un EIN</h3>
                    <p className="mb-3 text-xs text-neutral-400">
                      Demandez votre numéro d&apos;identification fiscale fédéral.
                    </p>
                    <a href="#" className="text-sm text-blue-400 hover:text-blue-300">
                      Obtenir
                    </a>
                  </div>
                </div>
              </div>
          </div>
        </main>
      </div>
    </div>
  );
}

