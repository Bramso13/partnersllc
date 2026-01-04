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

export default function ParametresPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Général");

  // Form states
  const [companyName, setCompanyName] = useState("PARTNERS LLC");
  const [primaryEmail, setPrimaryEmail] = useState("contact@partners-llc.com");
  const [phone, setPhone] = useState("+1 (555) 123-4567");
  const [street, setStreet] = useState("123 Business Avenue");
  const [city, setCity] = useState("Wilmington");
  const [state, setState] = useState("Delaware");
  const [postalCode, setPostalCode] = useState("19801");
  const [language, setLanguage] = useState("Français");
  const [timezone, setTimezone] = useState("UTC-05:00 (EST)");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");

  // Notification toggles
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(true);

  // Security toggles
  const [twoFA, setTwoFA] = useState(true);
  const [autoLogout, setAutoLogout] = useState(true);

  // API Integrations
  const [stripe, setStripe] = useState(true);
  const [slack, setSlack] = useState(true);
  const [googleDrive, setGoogleDrive] = useState(true);
  const [mailchimp, setMailchimp] = useState(true);
  const [aws, setAws] = useState(true);
  const [hubspot, setHubspot] = useState(true);

  // Backup
  const data = useData();
  const [autoBackup, setAutoBackup] = useState(true);
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

  const tabs = ["Général", "Sécurité", "Notifications", "Intégrations", "Système"];

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
              <button className="flex w-full items-center gap-3 rounded-lg bg-white px-3 py-2.5 text-left text-black transition-colors">
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
                <span className="font-medium">Paramètres</span>
              </button>
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
                  placeholder="Rechercher dans les paramètres..."
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
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Réinitialiser
              </button>
              <button className="flex items-center gap-2 rounded-lg bg-green-500 px-3 py-2 lg:px-4 lg:py-2.5 text-xs lg:text-sm font-medium text-white transition-colors hover:bg-green-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                Enregistrer
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-900 p-4 lg:p-8">
          {/* Header */}
          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold">Paramètres</h1>
            <p className="mt-2 text-sm lg:text-base text-neutral-400">Configuration et préférences de la plateforme</p>
          </div>

          {/* Tabs */}
          <div className="mb-6 lg:mb-8 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-green-500 text-white"
                    : "bg-neutral-950 text-neutral-400 hover:bg-neutral-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "Général" && (
            <div className="space-y-6">
              {/* Informations de l'entreprise */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
                <div className="mb-4 lg:mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="mb-2 text-lg lg:text-xl font-semibold">Informations de l&apos;entreprise</h2>
                    <p className="text-xs lg:text-sm text-neutral-400">
                      Détails et coordonnées de PARTNERS LLC.
                    </p>
                  </div>
                  <svg className="h-6 w-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-400">
                      Nom de l&apos;entreprise
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-400">
                      Email principal
                    </label>
                    <input
                      type="email"
                      value={primaryEmail}
                      onChange={(e) => setPrimaryEmail(e.target.value)}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-400">Téléphone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white focus:border-green-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Adresse */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
                <div className="mb-4 lg:mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="mb-2 text-lg lg:text-xl font-semibold">Adresse</h2>
                    <p className="text-xs lg:text-sm text-neutral-400">Localisation du siège social</p>
                  </div>
                  <svg className="h-6 w-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                  <div className="col-span-2">
                    <label className="mb-2 block text-sm font-medium text-neutral-400">Rue</label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-400">Ville</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-400">État</label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white focus:border-green-500 focus:outline-none"
                    >
                      <option>Delaware</option>
                      <option>Wyoming</option>
                      <option>Nevada</option>
                      <option>Florida</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-400">Code postal</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white focus:border-green-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Préférences d'affichage */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
                <div className="mb-4 lg:mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="mb-2 text-lg lg:text-xl font-semibold">Préférences d&apos;affichage</h2>
                    <p className="text-xs lg:text-sm text-neutral-400">Personnaliser l&apos;apparence de l&apos;interface</p>
                  </div>
                  <svg className="h-6 w-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-400">Langue</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white focus:border-green-500 focus:outline-none"
                    >
                      <option>Français</option>
                      <option>English</option>
                      <option>Español</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-400">Fuseau horaire</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white focus:border-green-500 focus:outline-none"
                    >
                      <option>UTC-05:00 (EST)</option>
                      <option>UTC-08:00 (PST)</option>
                      <option>UTC+01:00 (CET)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-400">Format de date</label>
                    <select
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value)}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white focus:border-green-500 focus:outline-none"
                    >
                      <option>DD/MM/YYYY</option>
                      <option>MM/DD/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Paramètres de notification */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
                <div className="mb-4 lg:mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="mb-2 text-lg lg:text-xl font-semibold">Paramètres de notification</h2>
                    <p className="text-xs lg:text-sm text-neutral-400">Gérer les alertes et les notifications</p>
                  </div>
                  <svg className="h-6 w-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Notifications email</span>
                    <button
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        emailNotifications ? "bg-green-500" : "bg-neutral-700"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                          emailNotifications ? "translate-x-5" : "translate-x-0"
                        }`}
                      ></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Notifications push</span>
                    <button
                      onClick={() => setPushNotifications(!pushNotifications)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        pushNotifications ? "bg-green-500" : "bg-neutral-700"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                          pushNotifications ? "translate-x-5" : "translate-x-0"
                        }`}
                      ></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Notifications SMS</span>
                    <button
                      onClick={() => setSmsNotifications(!smsNotifications)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        smsNotifications ? "bg-green-500" : "bg-neutral-700"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                          smsNotifications ? "translate-x-5" : "translate-x-0"
                        }`}
                      ></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Résumé hebdomadaire</span>
                    <button
                      onClick={() => setWeeklySummary(!weeklySummary)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        weeklySummary ? "bg-green-500" : "bg-neutral-700"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                          weeklySummary ? "translate-x-5" : "translate-x-0"
                        }`}
                      ></span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sécurité */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
                <div className="mb-4 lg:mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="mb-2 text-lg lg:text-xl font-semibold">Sécurité</h2>
                    <p className="text-xs lg:text-sm text-neutral-400">Protection et authentification</p>
                  </div>
                  <svg className="h-6 w-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Authentification 2FA</span>
                    <button
                      onClick={() => setTwoFA(!twoFA)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        twoFA ? "bg-green-500" : "bg-neutral-700"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                          twoFA ? "translate-x-5" : "translate-x-0"
                        }`}
                      ></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Déconnexion automatique</span>
                    <button
                      onClick={() => setAutoLogout(!autoLogout)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        autoLogout ? "bg-green-500" : "bg-neutral-700"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                          autoLogout ? "translate-x-5" : "translate-x-0"
                        }`}
                      ></span>
                    </button>
                  </div>
                  <button className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                    Changer le mot de passe
                  </button>
                </div>
              </div>

              {/* Sessions actives */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
                <div className="mb-4 lg:mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="mb-2 text-lg lg:text-xl font-semibold">Sessions actives</h2>
                    <p className="text-xs lg:text-sm text-neutral-400">Appareils connectés</p>
                  </div>
                  <svg className="h-6 w-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                    <div>
                      <p className="font-medium">MacBook Pro</p>
                      <p className="text-xs lg:text-sm text-neutral-400">Ordinateur à New York, US</p>
                    </div>
                    <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
                      Actif
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                    <div>
                      <p className="font-medium">iPhone 13 Pro</p>
                      <p className="text-xs lg:text-sm text-neutral-400">Cellulaire à Paris, FR</p>
                    </div>
                    <button className="rounded-lg border border-red-500/50 bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/30">
                      Déconnecter
                    </button>
                  </div>
                </div>
              </div>

              {/* Intégrations API */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
                <div className="mb-4 lg:mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="mb-2 text-lg lg:text-xl font-semibold">Intégrations API</h2>
                    <p className="text-xs lg:text-sm text-neutral-400">Services tiers connectés</p>
                  </div>
                  <svg className="h-6 w-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                    />
                  </svg>
                </div>
                <div className="space-y-4">
                  {[
                    { name: "Stripe", enabled: stripe, setter: setStripe },
                    { name: "Slack", enabled: slack, setter: setSlack },
                    { name: "Google Drive", enabled: googleDrive, setter: setGoogleDrive },
                    { name: "Mailchimp", enabled: mailchimp, setter: setMailchimp },
                    { name: "AWS", enabled: aws, setter: setAws },
                    { name: "HubSpot", enabled: hubspot, setter: setHubspot },
                  ].map((service) => (
                    <div key={service.name} className="flex items-center justify-between">
                      <span className="text-sm text-neutral-400">{service.name}</span>
                      <button
                        onClick={() => service.setter(!service.enabled)}
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                          service.enabled ? "bg-green-500" : "bg-neutral-700"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                            service.enabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        ></span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sauvegarde & Export */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
                <div className="mb-4 lg:mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="mb-2 text-lg lg:text-xl font-semibold">Sauvegarde & Export</h2>
                    <p className="text-xs lg:text-sm text-neutral-400">Gestion des données</p>
                  </div>
                  <svg className="h-6 w-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                    />
                  </svg>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Sauvegarde automatique</span>
                    <button
                      onClick={() => setAutoBackup(!autoBackup)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        autoBackup ? "bg-green-500" : "bg-neutral-700"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                          autoBackup ? "translate-x-5" : "translate-x-0"
                        }`}
                      ></span>
                    </button>
                  </div>
                  <button className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Exporter toutes les données
                  </button>
                  <p className="text-sm text-neutral-400">
                    Dernière sauvegarde: 12 Déc 2023 à 02:30 AM
                  </p>
                </div>
              </div>

              {/* Support & Aide */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
                <div className="mb-4 lg:mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="mb-2 text-lg lg:text-xl font-semibold">Support & Aide</h2>
                    <p className="text-xs lg:text-sm text-neutral-400">Assistance technique</p>
                  </div>
                  <svg className="h-6 w-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="space-y-4">
                  <button className="flex w-full items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-left transition-colors hover:bg-neutral-800">
                    <span className="text-sm font-medium">Documentation</span>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                  <button className="flex w-full items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-left transition-colors hover:bg-neutral-800">
                    <span className="text-sm font-medium">Chat en direct</span>
                    <span className="text-xs text-neutral-500">Indisponible</span>
                  </button>
                  <button className="flex w-full items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-left transition-colors hover:bg-neutral-800">
                    <span className="text-sm font-medium">Contacter le support</span>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Informations système */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
                <div className="mb-4 lg:mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="mb-2 text-lg lg:text-xl font-semibold">Informations système</h2>
                  </div>
                  <svg className="h-6 w-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                    />
                  </svg>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                    <p className="mb-1 text-xs text-neutral-400">Version</p>
                    <p className="text-lg font-semibold">v2.4.1</p>
                  </div>
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                    <p className="mb-1 text-xs text-neutral-400">Uptime</p>
                    <p className="text-lg font-semibold">99.96%</p>
                  </div>
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                    <p className="mb-1 text-xs text-neutral-400">Usage total</p>
                    <p className="text-lg font-semibold">847 GB</p>
                  </div>
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                    <p className="mb-1 text-xs text-neutral-400">Dernière mise à jour</p>
                    <p className="text-lg font-semibold">12 Déc 2023</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other tabs content can be added here */}
          {activeTab !== "Général" && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
              <p className="text-neutral-400">Contenu de l&apos;onglet {activeTab} à venir...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

