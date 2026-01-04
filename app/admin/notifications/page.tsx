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

type Notification = {
  id: string;
  icon: "warning" | "check" | "document" | "calendar" | "person" | "gear" | "circle" | "chat";
  tag: string;
  tagColor: "red" | "green" | "blue" | "yellow" | "teal" | "gray" | "green-circle";
  title: string;
  description: string;
  actions: string[];
  timestamp: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const data = useData();
  const [selectedFilter, setSelectedFilter] = useState("Toutes");
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

  // Données de démonstration pour les notifications
  const notifications: Notification[] = [
    {
      id: "1",
      icon: "warning",
      tag: "Urgent",
      tagColor: "red",
      title: "Paiement en retard",
      description: "La facture INV-2023-1243 de Lucas Moreau est en retard de 5 jours. Montant: $2,999.00.",
      actions: ["Relancer la facture", "Voir la facture"],
      timestamp: "il y a 5 min",
    },
    {
      id: "2",
      icon: "check",
      tag: "Paiement",
      tagColor: "green",
      title: "Nouveau paiement reçu",
      description: "Marc Leblanc a effectué un paiement de $2,499.00 pour la facture INV-2023-1247 via Stripe.",
      actions: ["Voir le paiement", "Envoyer reçu"],
      timestamp: "il y a 12 min",
    },
    {
      id: "3",
      icon: "document",
      tag: "Document",
      tagColor: "blue",
      title: "Nouveau document téléchargé",
      description: 'Chloé Dubois a téléchargé "Operating Agreement - CréaHub Digital LLC.pdf" dans son dossier.',
      actions: ["Consulter le document", "Voir le dossier"],
      timestamp: "il y a 28 min",
    },
    {
      id: "4",
      icon: "calendar",
      tag: "Rappel",
      tagColor: "yellow",
      title: "Rappel: Échéance fiscale",
      description: "La déclaration fiscale annuelle pour TechVision Global LLC doit être soumise dans 7 jours.",
      actions: ["Programmer rappel", "Voir détails"],
      timestamp: "il y a 1h",
    },
    {
      id: "5",
      icon: "person",
      tag: "Client",
      tagColor: "teal",
      title: "Nouveau client inscrit",
      description: "Sophie Martin vient de s'inscrire et a commencé le processus de création LLC pour Élégance Consulting.",
      actions: ["Voir le profil", "Envoyer message"],
      timestamp: "il y a 2h",
    },
    {
      id: "6",
      icon: "gear",
      tag: "Système",
      tagColor: "gray",
      title: "Mise à jour système",
      description: "Une maintenance système est prévue le 23 décembre de 2h à 4h du matin. Les services seront temporairement indisponibles.",
      actions: ["En savoir plus"],
      timestamp: "il y a 3h",
    },
    {
      id: "7",
      icon: "circle",
      tag: "Succès",
      tagColor: "green-circle",
      title: "LLC créée avec succès",
      description: 'La LLC "Quantum Leap LLC" a été officiellement enregistrée dans le Delaware. Tous les documents sont disponibles.',
      actions: ["Télécharger documents", "Notifier le client"],
      timestamp: "il y a 4h",
    },
    {
      id: "8",
      icon: "chat",
      tag: "Support",
      tagColor: "blue",
      title: "Nouveau message support",
      description: "Thomas Bernard a ouvert un ticket support concernant son Kbis. Priorité: Moyenne.",
      actions: ["Répondre", "Voir le ticket"],
      timestamp: "il y a 4h",
    },
  ];

  const filters = ["Toutes", "Non lues", "Urgentes", "Système", "Clients", "Paiements", "Documents"];

  const getTagBadge = (tag: string, color: string) => {
    const colorClasses = {
      red: "bg-red-500/20 text-red-400",
      green: "bg-green-500/20 text-green-400",
      blue: "bg-green-500/20 text-green-400", // Changed from blue to green
      yellow: "bg-yellow-500/20 text-yellow-400",
      teal: "bg-teal-500/20 text-teal-400",
      gray: "bg-neutral-500/20 text-neutral-400",
      "green-circle": "bg-green-500/20 text-green-400",
    };

    return (
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${colorClasses[color as keyof typeof colorClasses]}`}>
        {tag}
      </span>
    );
  };

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case "warning":
        return (
          <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case "check":
        return (
          <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "document":
        return (
          <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
      case "calendar":
        return (
          <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        );
      case "person":
        return (
          <svg className="h-5 w-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        );
      case "gear":
        return (
          <svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        );
      case "circle":
        return (
          <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "chat":
        return (
          <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  // Données pour le graphique d'activité (7 derniers jours)
  const activityData = [
    { day: "Lun", value: 35 },
    { day: "Mar", value: 42 },
    { day: "Mer", value: 38 },
    { day: "Jeu", value: 65 },
    { day: "Ven", value: 52 },
    { day: "Sam", value: 28 },
    { day: "Dim", value: 20 },
  ];

  const maxActivity = 80;
  const chartHeight = 200;
  const chartWidth = 600;

  // Données pour le pie chart (Types de Notifications)
  const notificationTypesData = [
    { label: "Paiements", value: 28.0, color: "bg-green-500" },
    { label: "Système", value: 23.3, color: "bg-green-400" }, // Changed from light blue to green
    { label: "Clients", value: 20.0, color: "bg-green-600" }, // Changed from dark blue to green
    { label: "Rappels", value: 16.1, color: "bg-yellow-500" },
    { label: "Support", value: 12.6, color: "bg-red-500" },
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
              <button className="flex w-full items-center gap-3 rounded-lg bg-white px-3 py-2.5 text-left text-black transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="font-medium">Notifications</span>
              </button>
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
                  placeholder="Rechercher une notification..."
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

              {/* Action Buttons */}
              <button className="hidden md:flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 lg:px-4 lg:py-2.5 text-xs lg:text-sm font-medium text-white transition-colors hover:bg-neutral-800">
                Tout marquer comme lu
              </button>
              <button className="hidden lg:flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800">
                Paramètres
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
                <span className="hidden sm:inline">+ Nouvelle Notification</span>
                <span className="sm:hidden">+</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-900 p-4 lg:p-8">
          {/* Header */}
          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold">Notifications</h1>
            <p className="mt-2 text-sm lg:text-base text-neutral-400">Centre de notifications et alertes système</p>
          </div>

          {/* Summary Statistics Cards */}
          <div className="mb-6 lg:mb-8 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
            {/* Total Notifications */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-neutral-400">Total Notifications</span>
                <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">1,847</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
                  Total
                </span>
                <span className="text-xs text-neutral-400">Toutes périodes</span>
              </div>
            </div>

            {/* Non Lues */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-neutral-400">Non Lues</span>
                <svg className="h-5 w-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">127</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-medium text-yellow-400">
                  Non lues
                </span>
                <span className="text-xs text-neutral-400">À traiter</span>
              </div>
            </div>

            {/* Urgentes */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-neutral-400">Urgentes</span>
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
                <span className="text-3xl font-bold">23</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-400">
                  Urgent
                </span>
                <span className="text-xs text-neutral-400">À traiter</span>
              </div>
            </div>

            {/* Aujourd'hui */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-neutral-400">Aujourd&apos;hui</span>
                <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">47</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
                  Aujourd&apos;hui
                </span>
                <span className="text-xs text-neutral-400">Derniers 24h</span>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="mb-6 lg:mb-8 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            {/* Activité des Notifications */}
            <div className="col-span-1 lg:col-span-8 rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-4 lg:mb-6 flex items-center justify-between">
                <h2 className="text-lg lg:text-xl font-semibold">Activité des Notifications</h2>
                <span className="text-xs lg:text-sm text-neutral-400">7 derniers jours</span>
              </div>

              {/* Chart */}
              <div className="relative">
                <svg width={chartWidth} height={chartHeight} className="w-full">
                  {/* Grid lines */}
                  {[0, 20, 40, 60, 80].map((val) => (
                    <line
                      key={val}
                      x1="0"
                      y1={chartHeight - (val / maxActivity) * chartHeight}
                      x2={chartWidth}
                      y2={chartHeight - (val / maxActivity) * chartHeight}
                      stroke="#262626"
                      strokeWidth={1}
                    />
                  ))}

                  {/* Y-axis labels */}
                  {[0, 20, 40, 60, 80].map((val) => (
                    <text
                      key={val}
                      x={-10}
                      y={chartHeight - (val / maxActivity) * chartHeight + 4}
                      textAnchor="end"
                      className="fill-neutral-400 text-xs"
                    >
                      {val}
                    </text>
                  ))}

                  {/* X-axis labels */}
                  {activityData.map((item, index) => {
                    const x = (index / (activityData.length - 1)) * chartWidth;
                    return (
                      <text
                        key={index}
                        x={x}
                        y={chartHeight + 20}
                        textAnchor="middle"
                        className="fill-neutral-400 text-xs"
                      >
                        {item.day}
                      </text>
                    );
                  })}

                  {/* Activity line */}
                  <polyline
                    points={activityData
                      .map(
                        (item, index) =>
                          `${(index / (activityData.length - 1)) * chartWidth},${
                            chartHeight - (item.value / maxActivity) * chartHeight
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
                  {activityData.map((item, index) => {
                    const x = (index / (activityData.length - 1)) * chartWidth;
                    const y = chartHeight - (item.value / maxActivity) * chartHeight;
                    return (
                      <circle key={index} cx={x} cy={y} r={4} fill="#22c55e" />
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Types de Notifications */}
            <div className="col-span-1 lg:col-span-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <h2 className="mb-4 lg:mb-6 text-lg lg:text-xl font-semibold">Types de Notifications</h2>

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
                      strokeDasharray={`${28.0 * 2.513} 251.3`}
                      transform="rotate(-90 50 50)"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#4ade80"
                      strokeWidth="20"
                      strokeDasharray={`${23.3 * 2.513} 251.3`}
                      strokeDashoffset={-70.4}
                      transform="rotate(-90 50 50)"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#16a34a"
                      strokeWidth="20"
                      strokeDasharray={`${20.0 * 2.513} 251.3`}
                      strokeDashoffset={-129.0}
                      transform="rotate(-90 50 50)"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="20"
                      strokeDasharray={`${16.1 * 2.513} 251.3`}
                      strokeDashoffset={-179.3}
                      transform="rotate(-90 50 50)"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="20"
                      strokeDasharray={`${12.6 * 2.513} 251.3`}
                      strokeDashoffset={-219.6}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-3">
                {notificationTypesData.map((item, index) => (
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
          </div>

          {/* Quick Filters */}
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
                      ? "bg-white text-black"
                      : "bg-neutral-950 text-neutral-400 hover:bg-neutral-900"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
            <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-base lg:text-lg font-semibold">Notifications Récentes</h2>
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
                    <option>Par type</option>
                    <option>Par priorité</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notifications Cards */}
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 lg:p-6 hover:bg-neutral-900/80"
                >
                  <div className="flex flex-col sm:flex-row items-start gap-3 lg:gap-4">
                    {/* Icon */}
                    <div className="mt-1">{getIcon(notification.icon)}</div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2 lg:gap-3">
                        <h3 className="text-sm lg:text-base font-semibold">{notification.title}</h3>
                        {getTagBadge(notification.tag, notification.tagColor)}
                      </div>
                      <p className="mb-3 lg:mb-4 text-xs lg:text-sm text-neutral-400">{notification.description}</p>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {notification.actions.map((action, index) => (
                          <button
                            key={index}
                            className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="text-[10px] lg:text-xs text-neutral-500 self-start sm:self-auto">{notification.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-4 lg:mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-800 pt-4 lg:pt-6">
              <p className="text-xs lg:text-sm text-neutral-400">
                Affichage de 1 à 8 sur 1,847 notifications
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
                  231
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

