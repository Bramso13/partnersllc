"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
};

type Client = {
  id: string;
  name: string;
  email: string;
  company: string;
  registrationDate: string;
  status: "ACTIF" | "ONBOARDING" | "DOCUMENTS REQUIS";
  plan: "Premium" | "Standard";
  clientId: string;
};

export default function GestionClientsPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const data = useData();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("Tous");
  const [sortBy, setSortBy] = useState("Plus récent");
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
  };

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        router.push("/login");
        return;
      }

      // Vérifier si l'utilisateur est admin
      if (profileData.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      setProfile(profileData);

      // Charger le nombre de messages non lus
      const { data: unreadMessagesCount } = await data.getUnreadMessagesCount(user.id);
      setUnreadCount(unreadMessagesCount || 0);
      
      // Récupérer TOUS les utilisateurs sauf l'admin connecté (pas de filtre sur le rôle)
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at, role")
        .neq("id", user.id) // Exclure uniquement l'admin connecté
        .order("created_at", { ascending: false });

      console.log("All profiles:", allProfiles);
      console.log("All profiles error:", allProfilesError);
      console.log("Current user ID:", user.id);
      console.log("Current user role:", profile?.role);

      // Afficher TOUS les utilisateurs (pas de filtre sur le rôle)
      const clientsData = allProfiles || [];
      console.log("Clients to display:", clientsData);
      console.log("Number of clients:", clientsData.length);

      if (allProfilesError) {
        console.error("Error fetching clients:", allProfilesError);
        setClients([]);
      } else if (clientsData && clientsData.length > 0) {
        // Pour chaque client, récupérer son dossier LLC
        const clientsWithDossiers = await Promise.all(
          clientsData.map(async (client: any) => {
            const { data: dossierData } = await supabase
              .from("llc_dossiers")
              .select("id, llc_name, status, created_at")
              .eq("user_id", client.id)
              .maybeSingle();

            // Déterminer le statut basé sur le dossier
            let status: "ACTIF" | "ONBOARDING" | "DOCUMENTS REQUIS" = "ONBOARDING";
            if (dossierData) {
              if (dossierData.status === "accepte") {
                status = "ACTIF";
              } else if (dossierData.status === "refuse" || dossierData.status === "en_cours") {
                status = "DOCUMENTS REQUIS";
              }
            }

            // Format de la date
            const registrationDate = client.created_at
              ? new Date(client.created_at).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "Date inconnue";

            // Nom complet ou email
            const name = client.full_name || client.email?.split("@")[0] || "Client";

            // ID client (premiers caractères de l'ID)
            const clientId = client.id.slice(0, 8).toUpperCase();

            return {
              id: client.id,
              name: name,
              email: client.email || "Email non fourni",
              company: dossierData?.llc_name || "Aucune entreprise",
              registrationDate: registrationDate,
              status: status,
              plan: "Standard" as "Premium" | "Standard", // Par défaut Standard, peut être modifié plus tard
              clientId: clientId,
            };
          })
        );

        setClients(clientsWithDossiers);
      } else {
        setClients([]);
      }

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

  const userName = profile?.full_name || profile?.email?.split("@")[0] || "Admin";

  const filters = ["Tous", "Actifs", "En Onboarding", "Premium", "Inactifs", "Cette semaine", "Localisation"];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIF":
        return (
          <span className="inline-flex rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
            ACTIF
          </span>
        );
      case "ONBOARDING":
        return (
          <span className="inline-flex rounded-full bg-orange-500/20 px-3 py-1 text-xs font-medium text-orange-400">
            ONBOARDING
          </span>
        );
      case "DOCUMENTS REQUIS":
        return (
          <span className="inline-flex rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-400">
            DOCUMENTS REQUIS
          </span>
        );
      default:
        return null;
    }
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
            <Logo variant="admin" />
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
            <Logo variant="admin" />
          </div>

          {/* MENU Section */}
          <div className="mb-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              MENU
            </p>
            <nav className="space-y-1">
              <Link
                href="/admin"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                <span>Vue d&apos;ensemble</span>
              </Link>
              <button className="flex w-full items-center gap-3 rounded-lg bg-green-500/20 px-3 py-2.5 text-left text-green-400 transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="font-medium">Gestion Clients</span>
              </button>
              <Link
                href="/admin/dossiers-llc"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <span>Dossiers LLC</span>
              </Link>
              <Link
                href="/admin/facturation"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                <span>Facturation</span>
              </Link>
              <Link
                href="/admin/agents"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>Agents</span>
              </Link>
              <Link
                href="/admin/messages"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span>Messages</span>
                {unreadCount > 0 && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    !
                  </span>
                )}
              </Link>
            </nav>
          </div>

          {/* OUTILS Section */}
          <div className="mb-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              OUTILS
            </p>
            <nav className="space-y-1">
              <Link
                href="/admin/notifications"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span>Notifications</span>
              </Link>
              <Link
                href="/admin/rapports"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span>Rapports</span>
              </Link>
              <Link
                href="/admin/parametres"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
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

          {/* Footer */}
          <div className="mt-auto text-xs text-neutral-500">
            <p>© 2025 PARTNERS LLC</p>
            <p>Tous droits réservés</p>
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

            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <svg
                  className="absolute left-2 lg:left-3 top-1/2 h-4 w-4 lg:h-5 lg:w-5 -translate-y-1/2 text-neutral-500"
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
                <input
                  type="text"
                  placeholder="Rechercher un client, un dossier..."
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 pl-8 lg:pl-10 pr-3 lg:pr-4 py-2 lg:py-2.5 text-xs lg:text-sm text-white placeholder:text-neutral-500 focus:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 lg:gap-4">
              {/* User Profile */}
              <div className="hidden sm:flex items-center gap-2 lg:gap-3">
                <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600"></div>
                <div className="hidden lg:block">
                  <p className="text-xs lg:text-sm font-medium">{userName}</p>
                  <p className="text-[10px] lg:text-xs text-neutral-400">Administrateur</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="hidden lg:block rounded-md border border-neutral-700 px-3 py-1 text-xs font-medium text-neutral-300 transition-colors hover:border-red-500 hover:bg-red-500/10 hover:text-red-400"
                >
                  Se déconnecter
                </button>
              </div>

              {/* Action Buttons */}
              <button className="hidden sm:flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 lg:px-4 py-2 lg:py-2.5 text-xs lg:text-sm font-medium text-white transition-colors hover:bg-neutral-800">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <span className="hidden lg:inline">Exporter</span>
              </button>
              <button className="flex items-center gap-2 rounded-lg bg-green-500 px-3 lg:px-4 py-2 lg:py-2.5 text-xs lg:text-sm font-medium text-white transition-colors hover:bg-green-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="hidden sm:inline">+ Nouveau Client</span>
                <span className="sm:hidden">+ Client</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-900 p-4 lg:p-8">
          {/* Header */}
          <div className="mb-4 lg:mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold">Gestion Clients</h1>
            <p className="mt-2 text-sm lg:text-base text-neutral-400">Gérer et suivre tous vos clients PARTNERS LLC</p>
          </div>

          {/* Summary Statistics Cards */}
          <div className="mb-4 lg:mb-8 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
            {/* Total Clients */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-3 lg:mb-4 flex items-center justify-between">
                <span className="text-xs lg:text-sm text-neutral-400">Total Clients</span>
                <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl lg:text-3xl font-bold">{clients.length}</span>
                <span className="text-xs lg:text-sm text-green-400">Total</span>
              </div>
            </div>

            {/* Clients Actifs */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-3 lg:mb-4 flex items-center justify-between">
                <span className="text-xs lg:text-sm text-neutral-400">Clients Actifs</span>
                <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl lg:text-3xl font-bold">{clients.filter(c => c.status === "ACTIF").length}</span>
                <span className="text-xs lg:text-sm text-green-400">Actifs</span>
              </div>
            </div>

            {/* En Onboarding */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-3 lg:mb-4 flex items-center justify-between">
                <span className="text-xs lg:text-sm text-neutral-400">En Onboarding</span>
                <svg className="h-5 w-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl lg:text-3xl font-bold">{clients.filter(c => c.status === "ONBOARDING").length}</span>
                <span className="text-xs lg:text-sm text-yellow-400">En attente</span>
              </div>
            </div>

            {/* Clients Premium */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-3 lg:mb-4 flex items-center justify-between">
                <span className="text-xs lg:text-sm text-neutral-400">Clients Premium</span>
                <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl lg:text-3xl font-bold">{clients.filter(c => c.plan === "Premium").length}</span>
                <span className="text-xs lg:text-sm text-green-400">VIP</span>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="mb-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filtres</h2>
              <button className="text-sm text-neutral-400 hover:text-white">Réinitialiser</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    selectedFilter === filter
                      ? "bg-neutral-800 text-white"
                      : "bg-neutral-950 text-neutral-400 hover:bg-neutral-900"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Client List Section */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
            <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-base lg:text-lg font-semibold">Liste des Clients</h2>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <span className="text-xs lg:text-sm text-neutral-400">Trier par:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-lg border border-neutral-800 bg-neutral-900 px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm text-white focus:border-green-500 focus:outline-none"
                  >
                    <option>Plus récent</option>
                    <option>Plus ancien</option>
                    <option>Nom A-Z</option>
                    <option>Nom Z-A</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button className="rounded-lg border border-neutral-800 bg-neutral-900 p-2 text-neutral-400 hover:bg-neutral-800">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>
                  </button>
                  <button className="rounded-lg border border-neutral-800 bg-neutral-900 p-2 text-neutral-400 hover:bg-neutral-800">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className="pb-3 lg:pb-4 px-2 lg:px-3 text-left">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-green-500 focus:ring-green-500"
                      />
                    </th>
                    <th className="pb-3 lg:pb-4 px-2 lg:px-3 text-left text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      CLIENT
                    </th>
                    <th className="pb-3 lg:pb-4 px-2 lg:px-3 text-left text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      EMAIL
                    </th>
                    <th className="hidden md:table-cell pb-3 lg:pb-4 px-2 lg:px-3 text-left text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      ENTREPRISE
                    </th>
                    <th className="hidden lg:table-cell pb-3 lg:pb-4 px-2 lg:px-3 text-left text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      DATE INSCRIPTION
                    </th>
                    <th className="pb-3 lg:pb-4 px-2 lg:px-3 text-left text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      STATUT
                    </th>
                    <th className="hidden md:table-cell pb-3 lg:pb-4 px-2 lg:px-3 text-left text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      PLAN
                    </th>
                    <th className="pb-3 lg:pb-4 px-2 lg:px-3 text-left text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {clients.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <p className="text-neutral-400">Aucun client trouvé dans la base de données.</p>
                        <p className="mt-2 text-sm text-neutral-500">
                          Les clients apparaîtront ici une fois qu'ils se seront inscrits.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    clients.map((client) => (
                    <tr key={client.id} className="hover:bg-neutral-900/50">
                      <td className="py-3 lg:py-4 px-2 lg:px-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-green-500 focus:ring-green-500"
                        />
                      </td>
                      <td className="py-3 lg:py-4 px-2 lg:px-3">
                        <div className="flex items-center gap-2 lg:gap-3">
                          <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600"></div>
                          <div>
                            <p className="text-xs lg:text-sm font-medium">{client.name}</p>
                            <p className="text-[10px] lg:text-xs text-neutral-400">ID: {client.clientId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 lg:py-4 px-2 lg:px-3 text-xs lg:text-sm text-neutral-400">{client.email}</td>
                      <td className="hidden md:table-cell py-3 lg:py-4 px-2 lg:px-3 text-xs lg:text-sm text-neutral-400">{client.company}</td>
                      <td className="hidden lg:table-cell py-3 lg:py-4 px-2 lg:px-3 text-xs lg:text-sm text-neutral-400">{client.registrationDate}</td>
                      <td className="py-3 lg:py-4 px-2 lg:px-3">{getStatusBadge(client.status)}</td>
                      <td className="hidden md:table-cell py-3 lg:py-4 px-2 lg:px-3">
                        <span className="inline-flex rounded-full bg-green-500/20 px-2 lg:px-3 py-1 text-[10px] lg:text-xs font-medium text-green-400">
                          {client.plan}
                        </span>
                      </td>
                      <td className="py-3 lg:py-4 px-2 lg:px-3">
                        <button className="text-neutral-400 hover:text-white">
                          <svg className="h-4 w-4 lg:h-5 lg:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 lg:mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-neutral-800 pt-4 lg:pt-6">
              <p className="text-xs lg:text-sm text-neutral-400">
                {clients.length > 0 
                  ? `Affichage de 1 à ${Math.min(clients.length, 8)} sur ${clients.length} client${clients.length > 1 ? 's' : ''}`
                  : "Aucun client"
                }
              </p>
              <div className="flex items-center gap-1 lg:gap-2">
                <button className="rounded-lg border border-neutral-800 bg-neutral-900 px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm text-neutral-400 hover:bg-neutral-800">
                  &lt;
                </button>
                <button className="rounded-lg bg-green-500 px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm font-medium text-white">
                  1
                </button>
                <button className="hidden sm:block rounded-lg border border-neutral-800 bg-neutral-900 px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm text-neutral-400 hover:bg-neutral-800">
                  2
                </button>
                <button className="hidden lg:block rounded-lg border border-neutral-800 bg-neutral-900 px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm text-neutral-400 hover:bg-neutral-800">
                  3
                </button>
                <span className="hidden lg:block px-2 text-xs lg:text-sm text-neutral-400">...</span>
                <button className="hidden lg:block rounded-lg border border-neutral-800 bg-neutral-900 px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm text-neutral-400 hover:bg-neutral-800">
                  157
                </button>
                <button className="rounded-lg border border-neutral-800 bg-neutral-900 px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm text-neutral-400 hover:bg-neutral-800">
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

