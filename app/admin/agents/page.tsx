"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { useData } from "@/context/DataContext";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
};

type Agent = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  created_at: string;
  updated_at: string;
};

export default function AgentsPage() {
  const router = useRouter();
  const { user, getUser, signOut } = useAuth();
  const { profile, fetchProfile } = useProfile();
  const data = useData();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Formulaire
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
  });

  const handleLogout = async () => {
    await signOut();
  };

  const fetchAgents = useCallback(async () => {
    const { data: agentsData, error } = await data.getAllAgents();

    if (error) {
      console.error("Error fetching agents:", error);
      setError("Erreur lors du chargement des agents");
    } else {
      setAgents(agentsData || []);
    }
  }, [data]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const currentUser = await getUser();

      if (!currentUser) {
        if (isMounted) router.push("/login");
        return;
      }

      const profileData = await fetchProfile(currentUser.id);

      if (!profileData) {
        if (isMounted) router.push("/login");
        return;
      }

      // Vérifier si l'utilisateur est admin
      if (profileData.role !== "admin") {
        if (isMounted) router.push("/dashboard");
        return;
      }

      // Charger les agents
      await fetchAgents();

      // Charger le nombre de messages non lus
      const { data: unreadMessagesCount } = await data.getUnreadMessagesCount(profileData.id);
      setUnreadCount(unreadMessagesCount || 0);

      if (isMounted) setLoading(false);
    }

    loadData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      if (editingAgent) {
        // Mise à jour
        const { error: updateError } = await data.updateAgent(editingAgent.id, formData);

        if (updateError) {
          setError(updateError.message || "Erreur lors de la mise à jour");
          return;
        }
        setSuccess("Agent mis à jour avec succès");
      } else {
        // Création
        const { error: insertError } = await data.createAgent(formData);

        if (insertError) {
          setError(insertError.message || "Erreur lors de la création");
          return;
        }
        setSuccess("Agent créé avec succès");
      }

      // Réinitialiser le formulaire
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        country: "",
      });
      setIsFormOpen(false);
      setEditingAgent(null);
      fetchAgents();
    } catch (err) {
      setError("Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setFormData({
      first_name: agent.first_name,
      last_name: agent.last_name,
      email: agent.email,
      phone: agent.phone,
      address: agent.address,
      city: agent.city,
      country: agent.country,
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet agent ?")) {
      return;
    }

    const { error } = await data.deleteAgent(id);

    if (error) {
      setError(error.message || "Erreur lors de la suppression");
    } else {
      setSuccess("Agent supprimé avec succès");
      fetchAgents();
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingAgent(null);
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      country: "",
    });
    setError(null);
    setSuccess(null);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-900">
        <p className="text-neutral-500">Chargement...</p>
      </div>
    );
  }

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
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
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
                className="flex w-full items-center gap-3 rounded-lg bg-green-500/20 px-3 py-2.5 text-left text-green-400 transition-colors"
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
                href="/admin/rapports"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Rapports</span>
              </Link>
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

          {/* Logout */}
          <div className="mt-auto">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-red-400 transition-colors hover:bg-red-500/10"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-neutral-900 p-4 lg:p-8 lg:ml-0">
        <div className="mb-4 lg:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 lg:gap-0">
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
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Gestion des Agents</h1>
              <p className="mt-2 text-sm lg:text-base text-neutral-400">Créez et gérez les agents/conseillers</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsFormOpen(true);
              setEditingAgent(null);
              setFormData({
                first_name: "",
                last_name: "",
                email: "",
                phone: "",
                address: "",
                city: "",
                country: "",
              });
            }}
            className="w-full sm:w-auto rounded-lg bg-green-500 px-4 lg:px-6 py-2 lg:py-2.5 text-xs lg:text-sm font-medium text-white transition-colors hover:bg-green-600"
          >
            + Nouvel Agent
          </button>
        </div>

        {/* Messages d'erreur/succès */}
        {error && (
          <div className="mb-4 lg:mb-6 rounded-lg border border-red-500/50 bg-red-500/10 px-3 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 lg:mb-6 rounded-lg border border-green-500/50 bg-green-500/10 px-3 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm text-green-300">
            {success}
          </div>
        )}

        {/* Formulaire */}
        {isFormOpen && (
          <div className="mb-4 lg:mb-8 rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
            <h2 className="mb-4 lg:mb-6 text-lg lg:text-xl font-semibold">
              {editingAgent ? "Modifier l'agent" : "Nouvel agent"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                <div>
                  <label className="mb-1.5 lg:mb-2 block text-xs lg:text-sm font-medium text-neutral-300">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 lg:px-4 py-2 lg:py-2.5 text-xs lg:text-sm text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Prénom"
                  />
                </div>
                <div>
                  <label className="mb-1.5 lg:mb-2 block text-xs lg:text-sm font-medium text-neutral-300">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 lg:px-4 py-2 lg:py-2.5 text-xs lg:text-sm text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Nom"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                <div>
                  <label className="mb-1.5 lg:mb-2 block text-xs lg:text-sm font-medium text-neutral-300">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 lg:px-4 py-2 lg:py-2.5 text-xs lg:text-sm text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="mb-1.5 lg:mb-2 block text-xs lg:text-sm font-medium text-neutral-300">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 lg:px-4 py-2 lg:py-2.5 text-xs lg:text-sm text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 lg:mb-2 block text-xs lg:text-sm font-medium text-neutral-300">
                  Adresse *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 lg:px-4 py-2 lg:py-2.5 text-xs lg:text-sm text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="123 Rue Example"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                <div>
                  <label className="mb-1.5 lg:mb-2 block text-xs lg:text-sm font-medium text-neutral-300">
                    Ville *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 lg:px-4 py-2 lg:py-2.5 text-xs lg:text-sm text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Paris"
                  />
                </div>
                <div>
                  <label className="mb-1.5 lg:mb-2 block text-xs lg:text-sm font-medium text-neutral-300">
                    Pays *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 lg:px-4 py-2 lg:py-2.5 text-xs lg:text-sm text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="France"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-3 lg:pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto rounded-lg bg-green-500 px-4 lg:px-6 py-2 lg:py-2.5 text-xs lg:text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50"
                >
                  {submitting
                    ? "Enregistrement..."
                    : editingAgent
                    ? "Mettre à jour"
                    : "Créer"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full sm:w-auto rounded-lg border border-neutral-700 px-4 lg:px-6 py-2 lg:py-2.5 text-xs lg:text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste des agents */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-950">
          <div className="border-b border-neutral-800 p-4 lg:p-6">
            <h2 className="text-lg lg:text-xl font-semibold">Liste des Agents</h2>
            <p className="mt-1 text-xs lg:text-sm text-neutral-400">
              {agents.length} agent{agents.length > 1 ? "s" : ""} enregistré{agents.length > 1 ? "s" : ""}
            </p>
          </div>

          {agents.length === 0 ? (
            <div className="p-8 lg:p-12 text-center">
              <p className="text-sm lg:text-base text-neutral-400">Aucun agent enregistré</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-neutral-800 bg-neutral-900/50">
                  <tr>
                    <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-[10px] lg:text-sm font-semibold text-neutral-300">
                      Nom complet
                    </th>
                    <th className="hidden md:table-cell px-3 lg:px-6 py-3 lg:py-4 text-left text-[10px] lg:text-sm font-semibold text-neutral-300">
                      Email
                    </th>
                    <th className="hidden lg:table-cell px-3 lg:px-6 py-3 lg:py-4 text-left text-[10px] lg:text-sm font-semibold text-neutral-300">
                      Téléphone
                    </th>
                    <th className="hidden xl:table-cell px-3 lg:px-6 py-3 lg:py-4 text-left text-[10px] lg:text-sm font-semibold text-neutral-300">
                      Adresse
                    </th>
                    <th className="hidden md:table-cell px-3 lg:px-6 py-3 lg:py-4 text-left text-[10px] lg:text-sm font-semibold text-neutral-300">
                      Ville / Pays
                    </th>
                    <th className="px-3 lg:px-6 py-3 lg:py-4 text-right text-[10px] lg:text-sm font-semibold text-neutral-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr
                      key={agent.id}
                      className="border-b border-neutral-800 transition-colors hover:bg-neutral-900/30"
                    >
                      <td className="px-3 lg:px-6 py-3 lg:py-4">
                        <div className="text-xs lg:text-sm font-medium">
                          {agent.first_name} {agent.last_name}
                        </div>
                        <div className="mt-1 text-[10px] lg:text-xs text-neutral-400 md:hidden">
                          {agent.email}
                        </div>
                        <div className="mt-1 text-[10px] lg:text-xs text-neutral-400 md:hidden">
                          {agent.city}, {agent.country}
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-3 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-neutral-400">{agent.email}</td>
                      <td className="hidden lg:table-cell px-3 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-neutral-400">{agent.phone}</td>
                      <td className="hidden xl:table-cell px-3 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-neutral-400">{agent.address}</td>
                      <td className="hidden md:table-cell px-3 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-neutral-400">
                        {agent.city}, {agent.country}
                      </td>
                      <td className="px-3 lg:px-6 py-3 lg:py-4">
                        <div className="flex justify-end gap-1.5 lg:gap-2">
                          <button
                            onClick={() => handleEdit(agent)}
                            className="rounded-lg border border-neutral-700 px-2 lg:px-3 py-1 lg:py-1.5 text-[10px] lg:text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-800"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(agent.id)}
                            className="rounded-lg border border-red-500/50 px-2 lg:px-3 py-1 lg:py-1.5 text-[10px] lg:text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

