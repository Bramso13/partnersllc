"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ContactButton } from "@/components/ui/ContactButton";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
};

export default function MonProfilPage() {
  const router = useRouter();
  const { user, getUser, signOut } = useAuth();
  const { profile, fetchProfile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const userName =
    profile?.full_name || profile?.email?.split("@")[0] || "Utilisateur";

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
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
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
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span>Dashboard</span>
              </Link>
              <Link
                href="/partners-hub/evenements"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Carte des Membres</span>
              </Link>
              <Link
                href="/partners-hub/marketplace"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
                className="flex items-center gap-3 rounded-lg bg-green-500/20 px-3 py-2.5 text-green-400 transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="font-medium">Mon Profil</span>
              </Link>
              <Link
                href="/partners-hub/parametres"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-neutral-900">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden text-neutral-400 hover:text-white"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <Logo brand="partnershub" />
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg
                    className="h-5 w-5 text-neutral-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Rechercher membres, événements, services..."
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 pl-10 pr-4 py-2 text-sm text-white placeholder-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-neutral-400">Membre Premium</p>
              </div>
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-neutral-900"></div>
              </div>
            </div>
          </div>
        </header>

        {/* Profile Content */}
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Column (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Profile Banner */}
              <div className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-r from-green-500 via-green-600 to-green-700">
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60"></div>
                <button className="absolute top-4 right-4 rounded-lg bg-black/50 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white hover:bg-black/70 transition-colors">
                  Modifier la couverture
                </button>

                {/* Profile Picture */}
                <div className="absolute -bottom-16 left-8">
                  <div className="relative">
                    <div className="h-32 w-32 rounded-full border-4 border-neutral-900 bg-neutral-800 flex items-center justify-center">
                      <span className="text-4xl font-bold text-green-400">
                        {userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="mt-20">
                <h1 className="text-2xl font-bold">
                  Entrepreneur Tech + CEO @ TechStartup
                </h1>

                {/* Status Badges */}
                <div className="mt-4 flex flex-wrap gap-3">
                  <span className="rounded-full bg-green-500/20 px-4 py-1.5 text-sm font-medium text-green-400 border border-green-500/50">
                    MEMBRE PREMIUM
                  </span>
                  <span className="rounded-full bg-green-500/20 px-4 py-1.5 text-sm font-medium text-green-400 border border-green-500/50">
                    EN LIGNE
                  </span>
                </div>

                {/* Statistics */}
                <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                        <svg
                          className="h-5 w-5 text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">342</p>
                        <p className="text-xs text-neutral-400">Connexions</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                        <svg
                          className="h-5 w-5 text-purple-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">12</p>
                        <p className="text-xs text-neutral-400">
                          Groupes Rejoints
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                        <svg
                          className="h-5 w-5 text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">28</p>
                        <p className="text-xs text-neutral-400">
                          Événements Participés
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20">
                        <svg
                          className="h-5 w-5 text-orange-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">4.9</p>
                        <p className="text-xs text-neutral-400">Note Moyenne</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* À propos */}
                <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">À propos</h2>
                    <button className="text-neutral-400 hover:text-white">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  </div>
                  <p className="text-neutral-300 leading-relaxed">
                    Entrepreneur passionné par l&apos;innovation technologique
                    et le développement de solutions SaaS. Fondateur de
                    plusieurs startups dans le domaine de l&apos;IA et de
                    l&apos;automatisation. Mentor actif dans la communauté
                    PARTNERS LLC, où je partage mon expérience en création
                    d&apos;entreprise et en levée de fonds.
                  </p>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 text-sm">
                      <svg
                        className="h-5 w-5 text-neutral-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <span className="text-neutral-400">Entreprise:</span>
                      <span className="text-white">TechStartup Inc.</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <svg
                        className="h-5 w-5 text-neutral-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
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
                      <span className="text-neutral-400">Localisation:</span>
                      <span className="text-white">San Francisco, CA</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <svg
                        className="h-5 w-5 text-neutral-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-neutral-400">Membre depuis:</span>
                      <span className="text-white">Janvier 2023</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <svg
                        className="h-5 w-5 text-neutral-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                        />
                      </svg>
                      <span className="text-neutral-400">Site web:</span>
                      <a
                        href="#"
                        className="text-green-400 hover:text-green-300"
                      >
                        techstartup.com
                      </a>
                    </div>
                  </div>
                </div>

                {/* Expertises */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                  <h2 className="text-xl font-semibold mb-4">Expertises</h2>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Intelligence Artificielle",
                      "SaaS Development",
                      "Levée de Fonds",
                      "Marketing Digital",
                      "Growth Hacking",
                      "Product Management",
                      "Blockchain",
                      "UI/UX Design",
                    ].map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-green-500/20 px-4 py-2 text-sm font-medium text-green-400 border border-green-500/50"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Expérience */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Expérience</h2>
                    <button className="flex items-center gap-2 rounded-lg bg-green-500/20 px-3 py-1.5 text-sm font-medium text-green-400 border border-green-500/50 hover:bg-green-500/30 transition-colors">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Ajouter
                    </button>
                  </div>
                  <div className="space-y-6">
                    {/* Expérience 1 */}
                    <div className="border-l-2 border-green-500 pl-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">
                            CEO & Founder
                          </h3>
                          <p className="text-green-400 font-medium">
                            TechStartup Inc.
                          </p>
                          <p className="text-sm text-neutral-400 mt-1">
                            Juin 2020 - Présent • 4 ans
                          </p>
                        </div>
                      </div>
                      <p className="text-neutral-300 mt-2 text-sm">
                        Direction stratégique et développement d&apos;une
                        plateforme SaaS d&apos;automatisation marketing. Levée
                        de fonds en série A.
                      </p>
                    </div>

                    {/* Expérience 2 */}
                    <div className="border-l-2 border-green-500 pl-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">CTO</h3>
                          <p className="text-green-400 font-medium">
                            InnovatLab
                          </p>
                          <p className="text-sm text-neutral-400 mt-1">
                            Mai 2017 - Déc 2019 • 2 ans 7 mois
                          </p>
                        </div>
                      </div>
                      <p className="text-neutral-300 mt-2 text-sm">
                        Direction technique et gestion d&apos;une équipe de 15
                        développeurs. Mise en place d&apos;une architecture
                        microservices.
                      </p>
                    </div>

                    {/* Expérience 3 */}
                    <div className="border-l-2 border-green-500 pl-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">
                            Lead Developer
                          </h3>
                          <p className="text-green-400 font-medium">
                            Digital Agency Pro
                          </p>
                          <p className="text-sm text-neutral-400 mt-1">
                            Juin 2015 - Fév 2017 • 1 an 8 mois
                          </p>
                        </div>
                      </div>
                      <p className="text-neutral-300 mt-2 text-sm">
                        Développement full-stack et gestion de projets clients
                        pour des applications web et mobiles.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Activité Récente */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Activité Récente
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800">
                        <svg
                          className="h-5 w-5 text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-neutral-300">
                          A commenté dans{" "}
                          <span className="text-green-400 font-medium">
                            Entrepreneurs Tech
                          </span>
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">2 jours</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800">
                        <svg
                          className="h-5 w-5 text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-neutral-300">
                          A rejoint le groupe{" "}
                          <span className="text-green-400 font-medium">
                            Marketing Digital
                          </span>
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">3 jours</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800">
                        <svg
                          className="h-5 w-5 text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-neutral-300">
                          A participé à l&apos;événement{" "}
                          <span className="text-green-400 font-medium">
                            Webinar: IA & Business
                          </span>
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">5 jours</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800">
                        <svg
                          className="h-5 w-5 text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-neutral-300">
                          S&apos;est connecté avec{" "}
                          <span className="text-green-400 font-medium">
                            Marie Dubois
                          </span>
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">9 jours</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Sidebar (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                {/* Contact */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                  <h2 className="text-xl font-semibold mb-4">Contact</h2>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <svg
                        className="h-5 w-5 text-neutral-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-neutral-400">Email:</span>
                      <span className="text-white">
                        {profile?.email || "jean.dupont@gmail.com"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <svg
                        className="h-5 w-5 text-neutral-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <span className="text-neutral-400">Téléphone:</span>
                      <span className="text-white">+1 (555) 123-4567</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <svg
                        className="h-5 w-5 text-neutral-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      <span className="text-neutral-400">LinkedIn:</span>
                      <span className="text-green-400">jean-dupont</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <svg
                        className="h-5 w-5 text-neutral-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      <span className="text-neutral-400">Twitter:</span>
                      <span className="text-green-400">@jeandupont</span>
                    </div>
                  </div>
                </div>

                {/* Connexions */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Connexions</h2>
                    <a
                      href="#"
                      className="text-sm text-green-400 hover:text-green-300"
                    >
                      Voir tout
                    </a>
                  </div>
                  <div className="space-y-4">
                    {[
                      { name: "Marie Dubois", role: "Designer UI/UX" },
                      {
                        name: "Alexandra Petit",
                        role: "Développeur Full Stack",
                      },
                      { name: "Thomas Leroy", role: "Investisseur" },
                      { name: "Léa Rousseau", role: "Marketing Manager" },
                      { name: "Pierre Martin", role: "CTO @ StartupCo" },
                    ].map((connection, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-neutral-800 flex items-center justify-center">
                          <span className="text-sm font-medium text-green-400">
                            {connection.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {connection.name}
                          </p>
                          <p className="text-xs text-neutral-400 truncate">
                            {connection.role}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Badges & Récompenses */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Badges & Récompenses
                  </h2>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: "Premium", icon: "👑" },
                      { name: "Top Contributeur", icon: "⭐" },
                      { name: "Expert", icon: "🏆" },
                      { name: "Mentor", icon: "❤️" },
                      { name: "Actif", icon: "⚙️" },
                      { name: "Innovateur", icon: "🚀" },
                    ].map((badge, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center gap-2 p-3 rounded-lg bg-neutral-900 border border-neutral-800"
                      >
                        <div className="text-2xl">{badge.icon}</div>
                        <p className="text-xs text-center text-neutral-400">
                          {badge.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
