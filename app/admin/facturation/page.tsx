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

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: "Payée" | "EN ATTENTE" | "EN RETARD" | "BROUILLON";
  clientName: string;
  companyName: string;
  date: string;
  amount: string;
  paymentDate?: string;
  dueDate?: string;
  delay?: string;
  draftStatus?: string;
  actionButtons: string[];
};

export default function FacturationPage() {
  const router = useRouter();
  const data = useData();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("Tous");
  const [sortBy, setSortBy] = useState("Plus récent");
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

  // Données de démonstration pour les factures
  const invoices: Invoice[] = [
    {
      id: "1",
      invoiceNumber: "#INV-2025-1247",
      status: "Payée",
      clientName: "Marc Leblanc",
      companyName: "Innovatech Solutions LLC",
      date: "15 Déc. 2023",
      amount: "$2,499.00",
      paymentDate: "16 Déc. 2023",
      actionButtons: ["Standard", "Drip"],
    },
    {
      id: "2",
      invoiceNumber: "#INV-2025-1246",
      status: "EN ATTENTE",
      clientName: "Chloé Dubois",
      companyName: "CréaHub Digital LLC",
      date: "12 Déc. 2023",
      amount: "$1,799.00",
      dueDate: "22 Déc. 2023",
      actionButtons: ["Standard", "Rappel envoyé"],
    },
    {
      id: "3",
      invoiceNumber: "#INV-2025-1243",
      status: "EN RETARD",
      clientName: "Lucas Moreau",
      companyName: "Quantum Leap LLC",
      date: "08 Déc. 2023",
      amount: "$2,999.00",
      delay: "3 jours",
      actionButtons: ["Standard", "Actions rapides"],
    },
    {
      id: "4",
      invoiceNumber: "#INV-2025-1240",
      status: "BROUILLON",
      clientName: "Sophie Martin",
      companyName: "Élégance Consulting LLC",
      date: "01 Déc. 2023",
      amount: "$1,299.00",
      draftStatus: "Non envoyée",
      actionButtons: ["Standard"],
    },
    {
      id: "5",
      invoiceNumber: "#INV-2025-1238",
      status: "Payée",
      clientName: "Thomas Bernard",
      companyName: "TechVision Global LLC",
      date: "28 Nov. 2023",
      amount: "$3,499.00",
      paymentDate: "27 Nov. 2023",
      actionButtons: ["Paypal"],
    },
  ];

  const filters = ["Tous", "Payées", "En attente", "En retard", "Brouillons", "Ce mois", "Premium"];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Payée":
        return (
          <span className="inline-flex rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
            Payée
          </span>
        );
      case "EN ATTENTE":
        return (
          <span className="inline-flex rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-medium text-yellow-400">
            EN ATTENTE
          </span>
        );
      case "EN RETARD":
        return (
          <span className="inline-flex rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-400">
            EN RETARD
          </span>
        );
      case "BROUILLON":
        return (
          <span className="inline-flex rounded-full bg-neutral-500/20 px-3 py-1 text-xs font-medium text-neutral-400">
            BROUILLON
          </span>
        );
      default:
        return null;
    }
  };

  // Données pour le graphique de revenus (12 derniers mois)
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

  const maxRevenue = 250000;
  const chartHeight = 200;
  const chartWidth = 600;

  // Données pour le pie chart (Statut des Paiements)
  const paymentStatusData = [
    { label: "Payées", value: 62.3, color: "bg-green-500" },
    { label: "Brouillons", value: 20.0, color: "bg-neutral-500" },
    { label: "En attente", value: 10.0, color: "bg-yellow-500" },
    { label: "En retard", value: 7.7, color: "bg-red-500" },
  ];

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
              <button className="flex w-full items-center gap-3 rounded-lg bg-green-500/20 px-3 py-2.5 text-left text-green-400 transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                <span className="font-medium">Facturation</span>
              </button>
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
                  placeholder="Rechercher une facture, un client..."
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 pl-8 lg:pl-10 pr-3 lg:pr-4 py-2 lg:py-2.5 text-xs lg:text-sm text-white placeholder:text-neutral-500 focus:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 lg:gap-4">
              {/* Notifications */}
              <button className="text-neutral-400 hover:text-white">
                <svg className="h-4 w-4 lg:h-5 lg:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>

              {/* User Profile */}
              <div className="hidden sm:flex items-center gap-2 lg:gap-3">
                <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600"></div>
                <div className="hidden lg:block">
                  <p className="text-xs lg:text-sm font-medium">{userName}</p>
                  <p className="text-[10px] lg:text-xs text-neutral-400">Administrateur</p>
                </div>
              </div>

              {/* Action Buttons */}
              <button className="hidden sm:flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 lg:px-4 py-2 lg:py-2.5 text-xs lg:text-sm font-medium text-white transition-colors hover:bg-neutral-800">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <span className="hidden lg:inline">Filtres</span>
              </button>
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
                <span className="hidden sm:inline">+ Nouvelle Facture</span>
                <span className="sm:hidden">+ Facture</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-900 p-4 lg:p-8">
          {/* Header */}
          <div className="mb-4 lg:mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold">Facturation</h1>
            <p className="mt-2 text-sm lg:text-base text-neutral-400">Gérer les factures, paiements et revenus</p>
          </div>

          {/* Summary Statistics Cards */}
          <div className="mb-4 lg:mb-8 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
            {/* Revenues Totales */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-3 lg:mb-4 flex items-center justify-between">
                <span className="text-xs lg:text-sm text-neutral-400">Revenues Totales</span>
                <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl lg:text-3xl font-bold">$247,580</span>
                <div className="flex items-center gap-1 text-xs lg:text-sm text-green-400">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                  +12%
                </div>
              </div>
              <p className="mt-2 text-xs text-neutral-400">Ce mois</p>
            </div>

            {/* Factures Emises */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-3 lg:mb-4 flex items-center justify-between">
                <span className="text-xs lg:text-sm text-neutral-400">Factures Emises</span>
                <svg className="h-5 w-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl lg:text-3xl font-bold">1,247</span>
              </div>
              <p className="mt-2 text-[10px] lg:text-xs text-neutral-400">Toutes les factures</p>
            </div>

            {/* Paiements Dus */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-3 lg:mb-4 flex items-center justify-between">
                <span className="text-xs lg:text-sm text-neutral-400">Paiements Dus</span>
                <svg className="h-5 w-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl lg:text-3xl font-bold">$42,890</span>
              </div>
              <p className="mt-2 text-[10px] lg:text-xs text-neutral-400">30 factures</p>
            </div>

            {/* Impayés */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-3 lg:mb-4 flex items-center justify-between">
                <span className="text-xs lg:text-sm text-neutral-400">Impayés</span>
                <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl lg:text-3xl font-bold">$8,450</span>
              </div>
              <p className="mt-2 text-[10px] lg:text-xs text-neutral-400">12 factures</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="mb-4 lg:mb-8 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            {/* Évolution des Revenus */}
            <div className="lg:col-span-8 rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h2 className="text-lg lg:text-xl font-semibold">Évolution des Revenus</h2>
                <span className="text-xs lg:text-sm text-neutral-400">12 derniers mois</span>
              </div>

              {/* Chart */}
              <div className="relative">
                <svg width={chartWidth} height={chartHeight} className="w-full">
                  {/* Grid lines */}
                  {[0, 50, 100, 150, 200, 250].map((val) => (
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
                  {[0, 50, 100, 150, 200, 250].map((val) => (
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

            {/* Statut des Paiements */}
            <div className="lg:col-span-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <h2 className="mb-4 lg:mb-6 text-lg lg:text-xl font-semibold">Statut des Paiements</h2>

              {/* Simple pie chart representation */}
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
                      strokeDasharray={`${62.3 * 2.513} 251.3`}
                      transform="rotate(-90 50 50)"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#737373"
                      strokeWidth="20"
                      strokeDasharray={`${20.0 * 2.513} 251.3`}
                      strokeDashoffset={-157.3}
                      transform="rotate(-90 50 50)"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="20"
                      strokeDasharray={`${10.0 * 2.513} 251.3`}
                      strokeDashoffset={-207.3}
                      transform="rotate(-90 50 50)"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="20"
                      strokeDasharray={`${7.7 * 2.513} 251.3`}
                      strokeDashoffset={-232.3}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2 lg:space-y-3">
                {paymentStatusData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${item.color}`}></div>
                      <span className="text-xs lg:text-sm text-neutral-400">{item.label}</span>
                    </div>
                    <span className="text-xs lg:text-sm font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="mb-4 lg:mb-6">
            <div className="mb-3 lg:mb-4 flex items-center justify-between">
              <h2 className="text-base lg:text-lg font-semibold">Filtres rapides</h2>
              <button className="text-xs lg:text-sm text-neutral-400 hover:text-white">Réinitialisation</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`rounded-lg px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm font-medium transition-colors ${
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

          {/* Invoices List */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
            <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-base lg:text-lg font-semibold">Liste des Factures</h2>
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
                    <option>Par montant</option>
                    <option>Par statut</option>
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

            {/* Invoices Cards */}
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 lg:p-6 hover:bg-neutral-900/80"
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex-1 w-full">
                      <div className="mb-3 lg:mb-4 flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2 lg:gap-3">
                            <h3 className="text-base lg:text-lg font-semibold">{invoice.invoiceNumber}</h3>
                            {getStatusBadge(invoice.status)}
                          </div>
                          <p className="text-xs lg:text-sm font-medium">{invoice.clientName}</p>
                          <p className="text-xs lg:text-sm text-neutral-400">{invoice.companyName}</p>
                          <div className="mt-2 text-[10px] lg:text-xs text-neutral-500">
                            <span>{invoice.date}</span>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-lg lg:text-xl font-bold">{invoice.amount}</p>
                          {invoice.paymentDate && (
                            <p className="mt-1 text-[10px] lg:text-xs text-neutral-400">
                              Date de paiement: {invoice.paymentDate}
                            </p>
                          )}
                          {invoice.dueDate && (
                            <p className="mt-1 text-[10px] lg:text-xs text-neutral-400">
                              Échéance: {invoice.dueDate}
                            </p>
                          )}
                          {invoice.delay && (
                            <p className="mt-1 text-[10px] lg:text-xs text-red-400">Retard: {invoice.delay}</p>
                          )}
                          {invoice.draftStatus && (
                            <p className="mt-1 text-[10px] lg:text-xs text-neutral-400">
                              Statut: {invoice.draftStatus}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {invoice.actionButtons.map((button, index) => (
                          <button
                            key={index}
                            className="rounded-lg border border-neutral-800 bg-neutral-950 px-2 lg:px-3 py-1 lg:py-1.5 text-[10px] lg:text-xs font-medium text-neutral-400 hover:bg-neutral-800"
                          >
                            {button}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between border-t border-neutral-800 pt-6">
              <p className="text-sm text-neutral-400">
                Affichage de 1 à 5 sur 1,247 factures
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
                  250
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

