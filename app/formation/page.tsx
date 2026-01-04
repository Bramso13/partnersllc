"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ContactButton } from "@/components/ui/ContactButton";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
};

export default function FormationPage() {
  const router = useRouter();
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
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">MENU</p>
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
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span>Mon entreprise</span>
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
                className="flex items-center gap-3 rounded-lg bg-green-500/20 px-3 py-2.5 text-green-400 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <span className="font-medium">Formation</span>
              </Link>
            </nav>
          </div>

          {/* SUPPORT Section */}
          <div className="mb-6 border-t border-neutral-800 pt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">SUPPORT</p>
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
                placeholder="Q Rechercher une formation..."
                className="mx-auto block w-full max-w-md rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs lg:px-4 lg:py-2.5 lg:text-sm text-white placeholder:text-neutral-500 focus:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            {/* Right Side - Notifications and Profile */}
            <div className="flex items-center gap-3 lg:gap-6">
              <button className="hidden sm:block text-neutral-400 transition-colors hover:text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>
              <div className="hidden sm:flex items-center gap-2 lg:gap-3">
                <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600"></div>
                <div className="hidden sm:block">
                  <p className="text-xs lg:text-sm font-medium">{userName}</p>
                  <p className="text-[10px] lg:text-xs text-neutral-400">Client Premium</p>
                </div>
                <button className="text-neutral-400 transition-colors hover:text-white">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-900 p-8">
          <div className="space-y-6">
            {/* Header + Progress Bar */}
            <div>
              <h1 className="text-2xl font-bold">Espace Formation</h1>
              <p className="mt-1 text-sm text-neutral-400">
                Développez vos compétences pour réussir aux États-Unis.
              </p>
            </div>

            {/* Top Featured Course + Progress */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
              <div className="flex gap-4">
                <div className="h-28 w-64 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-800">
                  <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                    U.S. Tax Law Cours
                  </div>
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-green-400">
                        Reprendre où vous en étiez
                      </p>
                      <h2 className="mt-1 text-sm font-semibold text-white">
                        Fiscalité US pour les non-résidents
                      </h2>
                      <p className="mt-1 text-xs text-neutral-400">
                        Module 3 • Les formulaires essentiels et les dates clés. Ne manquez aucune échéance
                        importante.
                      </p>
                    </div>
                    <button className="rounded-lg bg-green-500 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-green-600">
                      Continuer la leçon
                    </button>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-[11px] text-neutral-400">
                      <span>Progression</span>
                      <span>65%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
                      <div className="h-full w-[65%] rounded-full bg-green-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Catalogue des formations */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-base lg:text-lg font-semibold">Catalogue des formations</h2>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <button className="rounded-full bg-neutral-800 px-3 py-1 font-medium text-white">
                    Business
                  </button>
                  <button className="rounded-full bg-neutral-900 px-3 py-1 text-neutral-400">
                    Fiscalité
                  </button>
                  <button className="rounded-full bg-neutral-900 px-3 py-1 text-neutral-400">
                    Mindset
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Card 1 */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-950">
                  <div className="h-24 w-full overflow-hidden rounded-t-xl bg-neutral-800">
                    <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                      Business scaling Course
                    </div>
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="text-[10px] font-semibold uppercase text-green-400">Business</p>
                    <h3 className="text-sm font-semibold text-white">
                      Scaler son business de 0 à 1M$
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Les étapes clés pour accélérer votre croissance sans vous épuiser.
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-neutral-500">
                      <span>12 leçons</span>
                      <span>6 modules</span>
                    </div>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-950">
                  <div className="h-24 w-full overflow-hidden rounded-t-xl bg-neutral-800">
                    <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                      Marketing digital pour startups
                    </div>
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="text-[10px] font-semibold uppercase text-green-400">Marketing</p>
                    <h3 className="text-sm font-semibold text-white">Marketing digital pour startups</h3>
                    <p className="text-[11px] text-neutral-400">
                      Construire votre funnel d&apos;acquisition de A à Z.
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-neutral-500">
                      <span>8 leçons</span>
                      <span>4 modules</span>
                    </div>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-950">
                  <div className="h-24 w-full overflow-hidden rounded-t-xl bg-neutral-800">
                    <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                      Mindset et productivité de l&apos;entrepreneur
                    </div>
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="text-[10px] font-semibold uppercase text-green-400">Mindset</p>
                    <h3 className="text-sm font-semibold text-white">
                      Mindset et productivité de l&apos;entrepreneur
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Gérer son énergie et son temps pour des performances durables.
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-neutral-500">
                      <span>10 leçons</span>
                      <span>7 modules</span>
                    </div>
                  </div>
                </div>

                {/* Card 4 */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-950">
                  <div className="h-24 w-full overflow-hidden rounded-t-xl bg-neutral-800">
                    <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                      Bases juridiques pour votre LLC
                    </div>
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="text-[10px] font-semibold uppercase text-green-400">Légal</p>
                    <h3 className="text-sm font-semibold text-white">Bases juridiques pour votre LLC</h3>
                    <p className="text-[11px] text-neutral-400">
                      Comprendre les principaux contrats, la propriété intellectuelle et les règles clés.
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-neutral-500">
                      <span>6 leçons</span>
                      <span>3 modules</span>
                    </div>
                  </div>
                </div>

                {/* Card 5 */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-950">
                  <div className="h-24 w-full overflow-hidden rounded-t-xl bg-neutral-800">
                    <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                      Ouvrir son compte bancaire US
                    </div>
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="text-[10px] font-semibold uppercase text-green-400">Finance</p>
                    <h3 className="text-sm font-semibold text-white">
                      Ouvrir son compte bancaire US
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Étapes et documents nécessaires pour ouvrir un compte à distance.
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-neutral-500">
                      <span>5 leçons</span>
                      <span>3 modules</span>
                    </div>
                  </div>
                </div>

                {/* Card 6 - Mes Succès */}
                <div className="row-span-2 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                  <h2 className="mb-4 text-sm font-semibold text-white">Mes Succès</h2>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Badge 1 - Premier Pas */}
                    <button className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 p-2.5 transition-colors hover:bg-neutral-800">
                      <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <span className="text-[10px] font-medium text-white">Premier Pas</span>
                    </button>

                    {/* Badge 2 - LLC Créée */}
                    <button className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 p-2.5 transition-colors hover:bg-neutral-800">
                      <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="text-[10px] font-medium text-white">LLC Créée</span>
                    </button>

                    {/* Badge 3 - 1er Cours */}
                    <button className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 p-2.5 transition-colors hover:bg-neutral-800">
                      <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 14l9-5-9-5-9 5 9 5z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 14v7"
                        />
                      </svg>
                      <span className="text-[10px] font-medium text-white">1er Cours</span>
                    </button>

                    {/* Badge 4 - Pro du Légal */}
                    <button className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 p-2.5 transition-colors hover:bg-neutral-800">
                      <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 2v4m0 12v4M2 12h4m12 0h4"
                        />
                      </svg>
                      <span className="text-[10px] font-medium text-white">Pro du Légal</span>
                    </button>

                    {/* Badge 5 - Fiscaliste US */}
                    <button className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 p-2.5 transition-colors hover:bg-neutral-800">
                      <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 3v4m8-4v4M3 7h18"
                        />
                      </svg>
                      <span className="text-[10px] font-medium text-white">Fiscaliste US</span>
                    </button>

                    {/* Badge 6 - Grand Mentor */}
                    <button className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 p-2.5 transition-colors hover:bg-neutral-800">
                      <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <span className="text-[10px] font-medium text-white">Grand Mentor</span>
                    </button>
                  </div>
                  <a
                    href="#"
                    className="mt-4 block text-center text-xs font-medium text-green-400 hover:text-green-300"
                  >
                    Voir tous les badges
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


