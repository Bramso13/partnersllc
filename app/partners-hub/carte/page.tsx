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

type Member = {
  id: string;
  name: string;
  title: string;
  city: string;
  country: string;
  profession: string;
  experience: string;
  avatar: string;
  isVerified?: boolean;
  isCertified?: boolean;
  isPremium?: boolean;
};

export default function CarteMembresPage() {
  const router = useRouter();
  const { user, getUser, signOut } = useAuth();
  const { profile, fetchProfile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filtres
  const [filters, setFilters] = useState({
    activite: "",
    region: "",
    pays: "",
    tags: "",
    certifiedOnly: false,
    premiumOnly: false,
  });

  // Tri
  const [sortBy, setSortBy] = useState("recent");

  // Membres (données statiques pour l'instant)
  const [members, setMembers] = useState<Member[]>([
    {
      id: "1",
      name: "Alexandre Petit",
      title: "Expert Fiscal",
      city: "Miami",
      country: "USA",
      profession: "Finance & Consulting",
      experience: "15 ans d'expérience en fiscalité US. Accompagnement LLC et optimisation.",
      avatar: "/api/placeholder/80/80",
      isVerified: true,
    },
    {
      id: "2",
      name: "Sophie Martin",
      title: "CEO",
      city: "Paris",
      country: "France",
      profession: "Technologie",
      experience: "Expert en transformation digitale et innovation technologique",
      avatar: "/api/placeholder/80/80",
      isVerified: true,
    },
    {
      id: "3",
      name: "Maria Dubois",
      title: "Consultant",
      city: "Londres",
      country: "Royaume-Uni",
      profession: "Stratégie & Consulting",
      experience: "Conseillère en stratégie d'entreprise et développement international",
      avatar: "/api/placeholder/80/80",
    },
    {
      id: "4",
      name: "Thomas Bernard",
      title: "CTO",
      city: "San Francisco",
      country: "USA",
      profession: "Technologie",
      experience: "Spécialiste en architecture logicielle et cloud computing",
      avatar: "/api/placeholder/80/80",
      isVerified: true,
    },
    {
      id: "5",
      name: "Emma Laurent",
      title: "Directrice Marketing",
      city: "Montréal",
      country: "Canada",
      profession: "Marketing & Communication",
      experience: "Experte en marketing digital et communication de marque",
      avatar: "/api/placeholder/80/80",
    },
    {
      id: "6",
      name: "Lucas Moreau",
      title: "CEO",
      city: "New York",
      country: "USA",
      profession: "Finance & Investissement",
      experience: "Expert en finance d'entreprise et investissement",
      avatar: "/api/placeholder/80/80",
      isVerified: true,
    },
    {
      id: "7",
      name: "Julie Rousseau",
      title: "Founder",
      city: "Berlin",
      country: "Allemagne",
      profession: "GreenTech",
      experience: "Entrepreneure dans les technologies vertes et durables",
      avatar: "/api/placeholder/80/80",
    },
    {
      id: "8",
      name: "Pierre Durand",
      title: "Managing Director",
      city: "Singapour",
      country: "Singapour",
      profession: "Expansion Internationale",
      experience: "Spécialiste en expansion internationale et partenariats",
      avatar: "/api/placeholder/80/80",
      isVerified: true,
    },
    {
      id: "9",
      name: "Camille Lefebvre",
      title: "VP Innovation",
      city: "Toronto",
      country: "Canada",
      profession: "Innovation & Développement",
      experience: "Leader en innovation et développement de produits",
      avatar: "/api/placeholder/80/80",
    },
  ]);

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

  const userName = profile?.full_name || profile?.email?.split("@")[0] || "Utilisateur";
  const userAvatar = profile?.avatar_url || "/api/placeholder/40/40";

  const handleLogout = async () => {
    await signOut();
  };

  const handleApplyFilters = () => {
    // TODO: Implémenter la logique de filtrage
    console.log("Filtres appliqués:", filters);
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
            <Logo variant="sidebar" brand="partnershub" />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-neutral-400 hover:text-white"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                <span>Dashboard</span>
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
                className="flex items-center gap-3 rounded-lg bg-green-500/20 px-3 py-2.5 text-green-400 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Carte des Membres</span>
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-neutral-900">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-neutral-800 bg-neutral-950 px-4 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden text-neutral-400 hover:text-white"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="relative flex-1 max-w-2xl">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Rechercher membres, services, pays..."
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 pl-10 pr-4 py-2.5 text-white placeholder-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="ml-4 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <img
                  src={userAvatar}
                  alt={userName}
                  className="h-10 w-10 rounded-full border-2 border-neutral-700"
                />
                <span className="hidden text-sm font-medium lg:block">{userName}</span>
                <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6 lg:space-y-8">
            {/* Page Title */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold">Carte Mondiale des Membres</h1>
              <p className="mt-2 text-sm lg:text-base text-neutral-400">
                Explorez notre réseau international d'entrepreneurs et connectez-vous avec des membres du monde entier.
              </p>
            </div>

            {/* Filtres de Recherche */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
              <h2 className="text-xl font-semibold mb-6">Filtres de Recherche</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-300">Activité</label>
                  <select
                    value={filters.activite}
                    onChange={(e) => setFilters({ ...filters, activite: e.target.value })}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value="">Toutes activités</option>
                    <option value="tech">Technologie</option>
                    <option value="finance">Finance</option>
                    <option value="marketing">Marketing</option>
                    <option value="consulting">Consulting</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-300">Région</label>
                  <select
                    value={filters.region}
                    onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value="">Toutes régions</option>
                    <option value="europe">Europe</option>
                    <option value="amerique">Amérique</option>
                    <option value="asie">Asie</option>
                    <option value="afrique">Afrique</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-300">Pays</label>
                  <select
                    value={filters.pays}
                    onChange={(e) => setFilters({ ...filters, pays: e.target.value })}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value="">Tous pays</option>
                    <option value="france">France</option>
                    <option value="usa">États-Unis</option>
                    <option value="uk">Royaume-Uni</option>
                    <option value="canada">Canada</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-300">Tags</label>
                  <select
                    value={filters.tags}
                    onChange={(e) => setFilters({ ...filters, tags: e.target.value })}
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value="">Tous tags</option>
                    <option value="startup">Startup</option>
                    <option value="scaleup">Scale-up</option>
                    <option value="enterprise">Entreprise</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.certifiedOnly}
                    onChange={(e) => setFilters({ ...filters, certifiedOnly: e.target.checked })}
                    className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-green-500 focus:ring-1 focus:ring-green-500"
                  />
                  <span className="text-sm text-neutral-300">Membre certifié uniquement</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.premiumOnly}
                    onChange={(e) => setFilters({ ...filters, premiumOnly: e.target.checked })}
                    className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-green-500 focus:ring-1 focus:ring-green-500"
                  />
                  <span className="text-sm text-neutral-300">Afficher les membres premium</span>
                </label>
                <button
                  onClick={handleApplyFilters}
                  className="ml-auto rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  Appliquer les filtres
                </button>
              </div>
            </div>

            {/* Visualisation Mondiale */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-1">Visualisation Mondiale</h2>
                <p className="text-sm text-neutral-400">Carte mondiale avec des pins par pays</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Carte */}
                <div className="lg:col-span-8">
                  <div className="relative h-[500px] rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800">
                    {/* Placeholder pour la carte - vous pouvez intégrer une vraie carte ici (Google Maps, Mapbox, etc.) */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <svg className="mx-auto h-24 w-24 text-neutral-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-neutral-500">Carte mondiale interactive</p>
                        {/* Points de la carte simulés */}
                        <div className="absolute inset-0">
                          {[...Array(20)].map((_, i) => (
                            <div
                              key={i}
                              className="absolute rounded-full bg-orange-400/80 w-3 h-3 animate-pulse"
                              style={{
                                left: `${Math.random() * 90 + 5}%`,
                                top: `${Math.random() * 90 + 5}%`,
                                boxShadow: "0 0 10px rgba(251, 146, 60, 0.8)",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Contrôles de la carte */}
                  <div className="mt-4 flex items-center gap-2">
                    <button className="rounded-lg border border-neutral-700 bg-neutral-900 p-2 text-neutral-400 hover:text-white transition-colors">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button className="rounded-lg border border-neutral-700 bg-neutral-900 p-2 text-neutral-400 hover:text-white transition-colors">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button className="rounded-lg border border-neutral-700 bg-neutral-900 p-2 text-neutral-400 hover:text-white transition-colors">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                </div>
                {/* Statistiques */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-green-500/20 p-2">
                        <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-400">Total Membres</p>
                        <p className="text-2xl font-bold">1200</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-purple-500/20 p-2">
                        <svg className="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-400">Membres Actifs</p>
                        <p className="text-2xl font-bold">850</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-yellow-500/20 p-2">
                        <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-400">Nouveaux Membres</p>
                        <p className="text-2xl font-bold">150</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-500/20 p-2">
                        <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-400">Membres Premium</p>
                        <p className="text-2xl font-bold">50</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Membres du Réseau */}
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Membres du Réseau</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-400">Trier par</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value="recent">Plus récent</option>
                    <option value="name">Nom</option>
                    <option value="company">Entreprise</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="group relative rounded-xl bg-neutral-950 p-6 transition-all hover:shadow-lg hover:shadow-cyan-500/10"
                  >
                    {/* Badge de vérification */}
                    {member.isVerified && (
                      <div className="absolute top-4 right-4">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Header avec photo et nom */}
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="h-16 w-16 rounded-full border-2 border-neutral-700 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-white leading-tight">{member.name}</h3>
                        <p className="text-sm text-neutral-300 mt-0.5">{member.title}</p>
                      </div>
                    </div>

                    {/* Informations */}
                    <div className="space-y-2 mb-4">
                      {/* Localisation */}
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm text-white">{member.city}, {member.country}</span>
                      </div>

                      {/* Profession */}
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-white">{member.profession}</span>
                      </div>

                      {/* Expérience */}
                      <p className="text-sm text-neutral-300 mt-3 leading-relaxed">{member.experience}</p>
                    </div>

                    {/* Bouton Contacter */}
                    <button className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-2">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Contacter
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <button className="rounded-lg border border-neutral-700 bg-neutral-900 px-8 py-3 text-sm font-medium text-white transition-colors hover:border-green-500 hover:bg-neutral-800">
                  Charger plus de membres
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

