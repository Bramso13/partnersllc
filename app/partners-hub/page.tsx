"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ContactButton } from "@/components/ui/ContactButton";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { PartnersHubSignupModal } from "@/components/PartnersHubSignupModal";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
};

export default function PartnersHubPage() {
  const router = useRouter();
  const { user, getUser, signOut } = useAuth();
  const { profile, fetchProfile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const currentUser = await getUser();

      if (!currentUser) {
        router.push("/login");
        return;
      }

      const profileData = await fetchProfile(currentUser.id);

      if (!profileData || !isMounted) {
        if (!profileData) {
          console.error("Error fetching profile");
        }
        return;
      }

      // Si l'utilisateur est admin, rediriger vers /admin
      if (profileData.role === "admin") {
        router.push("/admin");
        return;
      }

      // Vérifier si le profil Partners Hub est complété
      const { data: partnersHubProfile } = await supabase
        .from("partners_hub_profiles")
        .select("completed")
        .eq("user_id", currentUser.id)
        .single();

      if (!partnersHubProfile?.completed && isMounted) {
        setShowSignupModal(true);
      }

      setLoading(false);
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [router, getUser, fetchProfile]);

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

  const handleSignupComplete = async () => {
    setShowSignupModal(false);
    // Rafraîchir le profil
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <>
      {showSignupModal && user && (
        <PartnersHubSignupModal userId={user.id} onComplete={handleSignupComplete} />
      )}
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
            <Logo variant="sidebar" brand="partnershub" />
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
            <Logo variant="sidebar" brand="partnershub" />
          </div>

          {/* NAVIGATION Section */}
          <div className="mb-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              NAVIGATION
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span>PARTNERS LLC</span>
              </Link>
              <Link
                href="/partners-hub"
                className="flex items-center gap-3 rounded-lg bg-green-500/20 px-3 py-2.5 text-green-400 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="font-medium">Dashboard</span>
              </Link>
              <Link
                href="/partners-hub/evenements"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span>Événements & Lives</span>
              </Link>
              <Link
                href="/partners-hub/carte"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Carte des Membres</span>
              </Link>
              <Link
                href="/partners-hub/marketplace"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <span>Marketplace</span>
              </Link>
              <Link
                href="/partners-hub/expat-community"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>Expat Community</span>
              </Link>
              <Link
                href="/partners-hub/groupes"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>Groupes</span>
              </Link>
            </nav>
          </div>

          {/* COMPTE Section */}
          <div className="mb-6 border-t border-neutral-800 pt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              COMPTE
            </p>
            <nav className="space-y-1">
              <Link
                href="/partners-hub/mon-profil"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>Mon Profil</span>
              </Link>
              <Link
                href="/partners-hub/parametres"
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
          <div className="mt-auto rounded-lg border border-neutral-800 bg-neutral-900 p-4">
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
                placeholder="Rechercher membres, événements, services..."
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
                  <p className="text-[10px] lg:text-xs text-neutral-400">Membre Premium</p>
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
        <main className="flex-1 overflow-y-auto bg-neutral-900 p-4 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6 lg:space-y-8">
            {/* Welcome Banner */}
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Bienvenue sur PARTNERS Hub</h1>
              <p className="mt-2 text-sm lg:text-base text-neutral-400">
                La plateforme exclusive pour connecter, apprendre et grandir ensemble.
              </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {/* Membres actifs */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-lg bg-purple-500/20">
                    <svg className="h-5 w-5 lg:h-6 lg:w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs lg:text-sm text-neutral-400">Membres actifs</p>
                  <p className="mt-1 text-2xl lg:text-3xl font-bold">2,847</p>
                  <p className="mt-2 text-xs text-green-400">+12%</p>
                </div>
              </div>

              {/* Événements en cours */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-lg bg-pink-500/20">
                    <svg className="h-5 w-5 lg:h-6 lg:w-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-400">3 Live</span>
                </div>
                <div className="mt-4">
                  <p className="text-xs lg:text-sm text-neutral-400">Événements en cours</p>
                  <p className="mt-1 text-2xl lg:text-3xl font-bold">24</p>
                </div>
              </div>

              {/* Services actifs */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-lg bg-green-500/20">
                    <svg className="h-5 w-5 lg:h-6 lg:w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs lg:text-sm text-neutral-400">Services actifs</p>
                  <p className="mt-1 text-2xl lg:text-3xl font-bold">156</p>
                  <p className="mt-2 text-xs text-green-400">+8%</p>
                </div>
              </div>

              {/* Groupes Expat */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-lg bg-orange-500/20">
                    <svg className="h-5 w-5 lg:h-6 lg:w-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span className="rounded-full bg-neutral-800 px-2 py-1 text-xs font-medium text-neutral-400">67 pays</span>
                </div>
                <div className="mt-4">
                  <p className="text-xs lg:text-sm text-neutral-400">Groupes Expat</p>
                  <p className="mt-1 text-2xl lg:text-3xl font-bold">89</p>
                </div>
              </div>
            </div>

            {/* Carte Mondiale des Membres */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg lg:text-xl font-semibold">Carte Mondiale des Membres</h2>
                  <p className="mt-1 text-xs lg:text-sm text-neutral-400">
                    Repérez où réside votre réseau d&apos;entrepreneurs.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs lg:text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800">
                    Tous les attributs
                  </button>
                  <button className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs lg:text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800">
                    Filtrer
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 h-64 lg:h-80 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center overflow-hidden">
                  {/* Placeholder for world map */}
                  <div className="text-center text-neutral-500">
                    <svg className="mx-auto h-24 w-24 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">Carte du monde</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg bg-neutral-900 p-3">
                    <p className="text-sm font-medium text-neutral-300">Europe</p>
                    <p className="mt-1 text-lg font-bold">1,234</p>
                  </div>
                  <div className="rounded-lg bg-neutral-900 p-3">
                    <p className="text-sm font-medium text-neutral-300">Amérique du Nord</p>
                    <p className="mt-1 text-lg font-bold">890</p>
                  </div>
                  <div className="rounded-lg bg-neutral-900 p-3">
                    <p className="text-sm font-medium text-neutral-300">Asie</p>
                    <p className="mt-1 text-lg font-bold">543</p>
                  </div>
                  <div className="rounded-lg bg-neutral-900 p-3">
                    <p className="text-sm font-medium text-neutral-300">Autres</p>
                    <p className="mt-1 text-lg font-bold">178</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Événements à venir */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg lg:text-xl font-semibold">Événements à venir</h2>
                <button className="text-xs lg:text-sm font-medium text-green-400 hover:text-green-300 transition-colors">
                  Voir tout
                </button>
              </div>
              <div className="space-y-4">
                {/* Event 1 */}
                <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/20">
                        <span className="text-xs font-bold text-green-400">JAN</span>
                      </div>
                      <p className="mt-1 text-center text-xs font-semibold">28</p>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm lg:text-base font-semibold">Masterclass : Fiscalité US 2020</h3>
                      <p className="mt-1 text-xs lg:text-sm text-neutral-400">Avec John Smith, Expert fiscal.</p>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                        <span>18:00 CET</span>
                        <div className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>12</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span>45</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <button className="rounded-lg bg-green-500 px-4 py-2 text-xs lg:text-sm font-medium text-white transition-colors hover:bg-green-600">
                        S&apos;inscrire
                      </button>
                    </div>
                  </div>
                </div>

                {/* Event 2 */}
                <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/20">
                        <span className="text-xs font-bold text-green-400">FÉV</span>
                      </div>
                      <p className="mt-1 text-center text-xs font-semibold">05</p>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm lg:text-base font-semibold">Marketing Digital pour Startups</h3>
                      <p className="mt-1 text-xs lg:text-sm text-neutral-400">1h30 dédiée avec Marie Dubois.</p>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                        <span>16:00 CET</span>
                        <div className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>8</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span>32</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <button className="rounded-lg bg-green-500 px-4 py-2 text-xs lg:text-sm font-medium text-white transition-colors hover:bg-green-600">
                        S&apos;inscrire
                      </button>
                    </div>
                  </div>
                </div>

                {/* Event 3 */}
                <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/20">
                        <span className="text-xs font-bold text-green-400">MAR</span>
                      </div>
                      <p className="mt-1 text-center text-xs font-semibold">12</p>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm lg:text-base font-semibold">Soirée Networking Paris</h3>
                      <p className="mt-1 text-xs lg:text-sm text-neutral-400">Rencontre physique des membres européens.</p>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                        <span>19:00 CET</span>
                        <div className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>24</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span>78</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <button className="rounded-lg bg-green-500 px-4 py-2 text-xs lg:text-sm font-medium text-white transition-colors hover:bg-green-600">
                        S&apos;inscrire
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Marketplace */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg lg:text-xl font-semibold">Marketplace</h2>
                <button className="text-xs lg:text-sm font-medium text-green-400 hover:text-green-300 transition-colors">
                  Explorer
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Service 1 */}
                <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                  <h3 className="text-sm lg:text-base font-semibold">Design de Logo Premium</h3>
                  <p className="mt-2 text-xs lg:text-sm text-neutral-400">
                    Logo professionnel et identité visuelle complète pour votre startup.
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">À partir de 500€</p>
                      <div className="mt-1 flex items-center gap-1">
                        <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs text-neutral-400">4.8</span>
                      </div>
                    </div>
                    <button className="rounded-lg bg-green-500 px-4 py-2 text-xs lg:text-sm font-medium text-white transition-colors hover:bg-green-600">
                      Voir
                    </button>
                  </div>
                </div>

                {/* Service 2 */}
                <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                  <h3 className="text-sm lg:text-base font-semibold">Conseil Fiscal LLC</h3>
                  <p className="mt-2 text-xs lg:text-sm text-neutral-400">
                    Optimisation fiscale et conformité pour votre LLC.
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">150€/heure</p>
                      <div className="mt-1 flex items-center gap-1">
                        <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs text-neutral-400">5.0</span>
                      </div>
                    </div>
                    <button className="rounded-lg bg-green-500 px-4 py-2 text-xs lg:text-sm font-medium text-white transition-colors hover:bg-green-600">
                      Voir
                    </button>
                  </div>
                </div>

                {/* Service 3 */}
                <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                  <h3 className="text-sm lg:text-base font-semibold">Développement Web</h3>
                  <p className="mt-2 text-xs lg:text-sm text-neutral-400">
                    Site web moderne et responsive pour votre business.
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">À partir de 2000€</p>
                      <div className="mt-1 flex items-center gap-1">
                        <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs text-neutral-400">4.9</span>
                      </div>
                    </div>
                    <button className="rounded-lg bg-green-500 px-4 py-2 text-xs lg:text-sm font-medium text-white transition-colors hover:bg-green-600">
                      Voir
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Groupes Expat */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg lg:text-xl font-semibold">Groupes Expat</h2>
                <button className="text-xs lg:text-sm font-medium text-green-400 hover:text-green-300 transition-colors">
                  Voir tout
                </button>
              </div>
              <div className="space-y-3">
                {/* Groupe 1 */}
                <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:bg-neutral-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                      <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm lg:text-base font-medium">USA - New York</p>
                      <p className="text-xs text-neutral-400">354 membres</p>
                    </div>
                  </div>
                  <svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Groupe 2 */}
                <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:bg-neutral-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                      <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm lg:text-base font-medium">Dubaï - UAE</p>
                      <p className="text-xs text-neutral-400">289 membres</p>
                    </div>
                  </div>
                  <svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Groupe 3 */}
                <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:bg-neutral-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                      <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm lg:text-base font-medium">Portugal - Lisbonne</p>
                      <p className="text-xs text-neutral-400">167 membres</p>
                    </div>
                  </div>
                  <svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Groupe 4 */}
                <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:bg-neutral-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                      <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm lg:text-base font-medium">Thaïlande - Bangkok</p>
                      <p className="text-xs text-neutral-400">123 membres</p>
                    </div>
                  </div>
                  <svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Groupe 5 */}
                <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:bg-neutral-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                      <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm lg:text-base font-medium">Mexique - Mexico</p>
                      <p className="text-xs text-neutral-400">118 membres</p>
                    </div>
                  </div>
                  <svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <button className="mt-4 w-full rounded-lg bg-green-500/20 border border-green-500/50 px-4 py-3 text-sm font-medium text-green-400 transition-colors hover:bg-green-500/30">
                + Créer un groupe
              </button>
            </div>

            {/* Discussions actives */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg lg:text-xl font-semibold">Discussions actives</h2>
              </div>
              <div className="space-y-3">
                {/* Discussion 1 */}
                <div className="flex items-start gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:bg-neutral-800/50 transition-colors">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-neutral-700"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm lg:text-base font-semibold">Support juridique</p>
                        <p className="mt-1 text-xs lg:text-sm text-neutral-400">Besoin d&apos;aide CRM 2023?</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs text-neutral-500">2h</p>
                        <p className="mt-1 text-xs text-neutral-400">12 réponses</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Discussion 2 */}
                <div className="flex items-start gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:bg-neutral-800/50 transition-colors">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-neutral-700"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm lg:text-base font-semibold">Impôt portugal</p>
                        <p className="mt-1 text-xs lg:text-sm text-neutral-400">Négociation fiscale et logement Lisbonne</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs text-neutral-500">3j</p>
                        <p className="mt-1 text-xs text-neutral-400">24 réponses</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Discussion 3 */}
                <div className="flex items-start gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:bg-neutral-800/50 transition-colors">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-neutral-700"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm lg:text-base font-semibold">Zoom</p>
                        <p className="mt-1 text-xs lg:text-sm text-neutral-400">Stratégies pricing 2020</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs text-neutral-500">5j</p>
                        <p className="mt-1 text-xs text-neutral-400">8 réponses</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
    </>
  );
}
