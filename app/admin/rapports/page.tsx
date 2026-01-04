"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useData } from "@/context/DataContext";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
};

type Report = {
  id: string;
  title: string;
  category: "Financiers" | "Clients" | "Opérations" | "Marketing" | "Conformité";
  date: string;
};

export default function RapportsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("Tous");
  const [sortBy, setSortBy] = useState("Plus récent");
  const data = useData();
  const [revenuePeriod, setRevenuePeriod] = useState("12 derniers mois");
  const [conversionPeriod, setConversionPeriod] = useState("30 derniers jours");
  const [unreadCount, setUnreadCount] = useState(0);
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

  // Données de démonstration pour les rapports
  const reports: Report[] = [
    { id: "1", title: "Rapport Mensuel", category: "Financiers", date: "15 Déc 2023" },
    { id: "2", title: "Acquisition Clients", category: "Clients", date: "14 Déc 2023" },
    { id: "3", title: "LLC Créées", category: "Opérations", date: "13 Déc 2023" },
    { id: "4", title: "Performance Marketing", category: "Marketing", date: "12 Déc 2023" },
    { id: "5", title: "Audit Conformité", category: "Conformité", date: "10 Déc 2023" },
    { id: "6", title: "Temps de Traitement", category: "Opérations", date: "08 Déc 2023" },
    { id: "7", title: "Satisfaction Client", category: "Clients", date: "06 Déc 2023" },
    { id: "8", title: "Prévisions Trimestrielles", category: "Financiers", date: "05 Déc 2023" },
    { id: "9", title: "Analyse Concurrentielle", category: "Marketing", date: "03 Déc 2023" },
  ];

  const reportFilters = ["Tous", "Financiers", "Clients", "Opérations", "Marketing", "Conformité"];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Financiers":
        return "bg-green-500/20 text-green-400";
      case "Clients":
        return "bg-green-500/20 text-green-400";
      case "Opérations":
        return "bg-yellow-500/20 text-yellow-400";
      case "Marketing":
        return "bg-orange-500/20 text-orange-400";
      case "Conformité":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-neutral-500/20 text-neutral-400";
    }
  };

  // Données pour le graphique d'évolution des revenus (12 mois)
  const revenueData = [
    { month: "Jan", value: 180000 },
    { month: "Fév", value: 195000 },
    { month: "Mar", value: 210000 },
    { month: "Avr", value: 205000 },
    { month: "Mai", value: 220000 },
    { month: "Juin", value: 235000 },
    { month: "Juil", value: 240000 },
    { month: "Août", value: 230000 },
    { month: "Sep", value: 245000 },
    { month: "Oct", value: 250000 },
    { month: "Nov", value: 242000 },
    { month: "Déc", value: 247580 },
  ];

  const maxRevenue = 500000;
  const chartHeight = 200;
  const chartWidth = 600;

  // Données pour le pie chart (Répartition par État)
  const stateData = [
    { label: "Delaware", value: 35, color: "bg-green-500" },
    { label: "Wyoming", value: 28, color: "bg-green-400" },
    { label: "Florida", value: 9, color: "bg-red-500" },
    { label: "Texas", value: 8, color: "bg-orange-500" },
    { label: "Autres", value: 20, color: "bg-neutral-500" },
  ];

  // Données pour le funnel (Taux de Conversion)
  const conversionData = [
    { stage: "Visiteurs", value: 10420, percentage: 100, color: "bg-green-500" },
    { stage: "Enregistrés", value: 5840, percentage: 56, color: "bg-green-400" },
    { stage: "Dossiers créés", value: 3020, percentage: 29, color: "bg-yellow-500" },
    { stage: "Propositions", value: 1930, percentage: 18, color: "bg-orange-500" },
    { stage: "LLC Créées", value: 1840, percentage: 17, color: "bg-red-500" },
  ];

  // Données pour le bar chart (Performance par Offre)
  const offerData = [
    { offer: "Standard", value: 867, color: "bg-green-500" },
    { offer: "Premium", value: 1245, color: "bg-green-600" },
    { offer: "Business", value: 980, color: "bg-yellow-500" },
    { offer: "Enterprise", value: 234, color: "bg-red-500" },
  ];

  const maxOfferValue = 1500;

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
        className={`fixed inset-y-0 left-0 z-50 w-[280px] border-r border-neutral-800 bg-neutral-950 transition-transform duration-300 lg:static lg:z-auto lg:flex lg:w-[280px] lg:shrink-0 lg:flex-col ${
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
              <Link
                href="/admin/gestion-clients"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>Gestion Clients</span>
              </Link>
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
              <button className="flex w-full items-center gap-3 rounded-lg bg-neutral-800 px-3 py-2.5 text-left text-white transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span className="font-medium">Rapports</span>
              </button>
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
            {/* Hamburger Menu Button - Mobile Only */}
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
                  className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500"
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
                  placeholder="Rechercher un rapport..."
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 pl-10 pr-4 py-2 text-xs lg:py-2.5 lg:text-sm text-white placeholder:text-neutral-500 focus:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 lg:gap-4">
              {/* User Profile */}
              <div className="hidden sm:flex items-center gap-2 lg:gap-3">
                <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600"></div>
                <div>
                  <p className="text-xs lg:text-sm font-medium">{userName}</p>
                  <p className="text-[10px] lg:text-xs text-neutral-400">Administrateur</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-900 p-4 lg:p-8">
          {/* Header */}
          <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Rapports & Analyses</h1>
              <p className="mt-2 text-sm lg:text-base text-neutral-400">Analyses détaillées et rapports d&apos;activité</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:gap-3">
              <button className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 lg:px-4 lg:py-2.5 text-xs lg:text-sm font-medium text-white transition-colors hover:bg-neutral-800">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                Filtre
              </button>
              <button className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 lg:px-4 lg:py-2.5 text-xs lg:text-sm font-medium text-white transition-colors hover:bg-neutral-800">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Exporter
              </button>
              <button className="flex items-center gap-2 rounded-lg bg-green-500 px-3 py-2 lg:px-4 lg:py-2.5 text-xs lg:text-sm font-medium text-white transition-colors hover:bg-green-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="hidden sm:inline">+ Nouveau Rapport</span>
                <span className="sm:hidden">+</span>
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="mb-6 lg:mb-8 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
            {/* Revenue Total */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-neutral-400">Revenue Total</span>
                <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">$487,234</span>
                <div className="flex items-center gap-1 text-sm text-green-400">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                  +10.8%
                </div>
              </div>
              <p className="mt-2 text-xs text-neutral-400">Ce mois</p>
            </div>

            {/* Nouveaux Clients */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-neutral-400">Nouveaux Clients</span>
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
                <span className="text-3xl font-bold">247</span>
                <div className="flex items-center gap-1 text-sm text-green-400">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                  +8.3%
                </div>
              </div>
              <p className="mt-2 text-xs text-neutral-400">Ce mois</p>
            </div>

            {/* LLC Créées */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-neutral-400">LLC Créées</span>
                <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">189</span>
                <div className="flex items-center gap-1 text-sm text-green-400">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                  +5.3%
                </div>
              </div>
              <p className="mt-2 text-xs text-neutral-400">Ce mois</p>
            </div>

            {/* Temps Moyen */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-neutral-400">Temps Moyen</span>
                <svg className="h-5 w-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">12.4j</span>
                <div className="flex items-center gap-1 text-sm text-red-400">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                  -3.7%
                </div>
              </div>
              <p className="mt-2 text-xs text-neutral-400">Traitement</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="mb-6 lg:mb-8 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            {/* Évolution des Revenus */}
            <div className="col-span-1 lg:col-span-6 rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h2 className="text-lg lg:text-xl font-semibold">Évolution des Revenus</h2>
                <select
                  value={revenuePeriod}
                  onChange={(e) => setRevenuePeriod(e.target.value)}
                  className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
                >
                  <option>12 derniers mois</option>
                  <option>6 derniers mois</option>
                  <option>3 derniers mois</option>
                </select>
              </div>

              {/* Chart */}
              <div className="relative">
                <svg width={chartWidth} height={chartHeight} className="w-full">
                  {/* Grid lines */}
                  {[100, 200, 300, 400, 500].map((val) => (
                    <line
                      key={val}
                      x1="0"
                      y1={chartHeight - (val / maxRevenue) * chartHeight}
                      x2={chartWidth}
                      y2={chartHeight - (val / maxRevenue) * chartHeight}
                      stroke="#262626"
                      strokeWidth={1}
                    />
                  ))}

                  {/* Y-axis labels */}
                  {[100, 200, 300, 400, 500].map((val) => (
                    <text
                      key={val}
                      x={-10}
                      y={chartHeight - (val / maxRevenue) * chartHeight + 4}
                      textAnchor="end"
                      className="fill-neutral-400 text-xs"
                    >
                      {val}K
                    </text>
                  ))}

                  {/* X-axis labels */}
                  {revenueData.map((item, index) => {
                    const x = (index / (revenueData.length - 1)) * chartWidth;
                    return (
                      <text
                        key={index}
                        x={x}
                        y={chartHeight + 20}
                        textAnchor="middle"
                        className="fill-neutral-400 text-xs"
                      >
                        {item.month}
                      </text>
                    );
                  })}

                  {/* Area under line */}
                  <defs>
                    <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points={`0,${chartHeight} ${revenueData
                      .map(
                        (item, index) =>
                          `${(index / (revenueData.length - 1)) * chartWidth},${
                            chartHeight - (item.value / maxRevenue) * chartHeight
                          }`
                      )
                      .join(" ")} ${chartWidth},${chartHeight}`}
                    fill="url(#revenueGradient)"
                  />

                  {/* Revenue line */}
                  <polyline
                    points={revenueData
                      .map(
                        (item, index) =>
                          `${(index / (revenueData.length - 1)) * chartWidth},${
                            chartHeight - (item.value / maxRevenue) * chartHeight
                          }`
                      )
                      .join(" ")}
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Points */}
                  {revenueData.map((item, index) => {
                    const x = (index / (revenueData.length - 1)) * chartWidth;
                    const y = chartHeight - (item.value / maxRevenue) * chartHeight;
                    return (
                      <circle key={index} cx={x} cy={y} r={4} fill="#22c55e" />
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Répartition par État */}
            <div className="col-span-1 lg:col-span-6 rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <h2 className="mb-4 lg:mb-6 text-lg lg:text-xl font-semibold">Répartition par État</h2>

              {/* Pie chart */}
              <div className="mb-6">
                <div className="relative mx-auto h-48 w-48">
                  <svg viewBox="0 0 100 100" className="h-full w-full">
                    {/* Pie slices */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="20"
                      strokeDasharray={`${35 * 2.513} 251.3`}
                      transform="rotate(-90 50 50)"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#4ade80"
                      strokeWidth="20"
                      strokeDasharray={`${28 * 2.513} 251.3`}
                      strokeDashoffset={-87.96}
                      transform="rotate(-90 50 50)"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="20"
                      strokeDasharray={`${9 * 2.513} 251.3`}
                      strokeDashoffset={-158.33}
                      transform="rotate(-90 50 50)"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="20"
                      strokeDasharray={`${8 * 2.513} 251.3`}
                      strokeDashoffset={-180.94}
                      transform="rotate(-90 50 50)"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#737373"
                      strokeWidth="20"
                      strokeDasharray={`${20 * 2.513} 251.3`}
                      strokeDashoffset={-201.04}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-3">
                {stateData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${item.color}`}></div>
                      <span className="text-sm text-neutral-400">{item.label}</span>
                    </div>
                    <span className="text-sm font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Taux de Conversion */}
            <div className="col-span-1 lg:col-span-6 rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h2 className="text-lg lg:text-xl font-semibold">Taux de Conversion</h2>
                <select
                  value={conversionPeriod}
                  onChange={(e) => setConversionPeriod(e.target.value)}
                  className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
                >
                  <option>30 derniers jours</option>
                  <option>7 derniers jours</option>
                  <option>90 derniers jours</option>
                </select>
              </div>

              {/* Funnel Chart */}
              <div className="space-y-3">
                {conversionData.map((item, index) => {
                  const width = (item.percentage / 100) * 100;
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-400">{item.stage}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.value.toLocaleString()}</span>
                          <span className="text-neutral-500">{item.percentage}%</span>
                        </div>
                      </div>
                      <div className="h-8 w-full overflow-hidden rounded-lg bg-neutral-800">
                        <div
                          className={`h-full ${item.color}`}
                          style={{ width: `${width}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Performance par Offre */}
            <div className="col-span-1 lg:col-span-6 rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <h2 className="mb-4 lg:mb-6 text-lg lg:text-xl font-semibold">Performance par Offre</h2>

              {/* Bar Chart */}
              <div className="space-y-4">
                {offerData.map((item, index) => {
                  const barWidth = (item.value / maxOfferValue) * 100;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-400">{item.offer}</span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                      <div className="h-6 w-full overflow-hidden rounded-lg bg-neutral-800">
                        <div
                          className={`h-full ${item.color}`}
                          style={{ width: `${barWidth}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reports Section */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
            <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 lg:gap-4">
                <h2 className="text-base lg:text-lg font-semibold">Rapports Disponibles</h2>
                <div className="flex flex-wrap gap-2">
                  {reportFilters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSelectedFilter(filter)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        selectedFilter === filter
                          ? "bg-white text-black"
                          : "bg-neutral-950 text-neutral-400 hover:bg-neutral-900"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              <button className="text-sm text-green-400 hover:text-green-300">Voir tout</button>
            </div>

            <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-base lg:text-lg font-semibold">Rapports Récents</h2>
              <div className="flex items-center gap-2 lg:gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs lg:text-sm text-neutral-400">Trier par:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1.5 lg:px-3 lg:py-2 text-xs lg:text-sm text-white focus:border-green-500 focus:outline-none"
                  >
                    <option>Plus récent</option>
                    <option>Plus ancien</option>
                    <option>Par catégorie</option>
                    <option>Par date</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 lg:p-6 hover:bg-neutral-900/80"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-800">
                      <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getCategoryColor(report.category)}`}>
                      {report.category}
                    </span>
                  </div>
                  <h3 className="mb-2 text-base font-semibold">{report.title}</h3>
                  <p className="mb-4 text-xs text-neutral-400">{report.date}</p>
                  <button className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800">
                    Télécharger
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between border-t border-neutral-800 pt-6">
              <p className="text-sm text-neutral-400">
                Affichage de 1 à 9 sur 87 rapports
              </p>
              <div className="flex items-center gap-2">
                <button className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-800">
                  &lt;
                </button>
                <button className="rounded-lg bg-green-500 px-3 py-2 text-sm font-medium text-white">
                  1
                </button>
                <button className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-800">
                  2
                </button>
                <button className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-800">
                  3
                </button>
                <span className="px-2 text-sm text-neutral-400">...</span>
                <button className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-800">
                  10
                </button>
                <button className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-800">
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

