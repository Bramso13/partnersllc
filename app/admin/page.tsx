"use client";

import { useEffect, useState } from "react";
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

type AdminTask = {
  id: string;
  admin_id: string;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  completed: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

type RecentDossier = {
  id: string;
  user_id: string;
  client_name: string;
  llc_name: string | null;
  created_at: string;
  status: "en_cours" | "accepte" | "refuse";
};

export default function AdminPage() {
  const router = useRouter();
  const { getUser, signOut } = useAuth();
  const { profile, fetchProfile } = useProfile();
  const data = useData();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"mois" | "annee">("mois");
  const [totalClients, setTotalClients] = useState<number>(0);
  const [dossiersEnCours, setDossiersEnCours] = useState<number>(0);
  const [dossiersTermines, setDossiersTermines] = useState<number>(0);
  const [dossiersTerminesCeMois, setDossiersTerminesCeMois] = useState<number>(0);
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [recentDossiers, setRecentDossiers] = useState<RecentDossier[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
  };

  useEffect(() => {
    async function loadData() {
      const user = await getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const profileData = await fetchProfile(user.id);

      if (!profileData) {
        router.push("/login");
        return;
      }

      // Vérifier si l'utilisateur est admin
      if (profileData.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      // Compter le nombre total de clients (profils) - tous les utilisateurs
      try {
        const { data: allProfiles, error: profilesError } = await data.getAllProfiles();

        if (profilesError) {
          console.error("Error counting clients:", profilesError);
          setTotalClients(0);
        } else {
          setTotalClients(allProfiles?.length ?? 0);
        }
      } catch (err) {
        console.error("Error counting clients:", err);
        setTotalClients(0);
      }

      // Récupérer tous les dossiers pour compter (méthode plus fiable)
      try {
        const { data: allDossiers, error: dossiersError } = await data.getAllDossiers();

        if (dossiersError) {
          console.error("Error fetching dossiers:", dossiersError);
          setDossiersEnCours(0);
          setDossiersTermines(0);
          setDossiersTerminesCeMois(0);
        } else if (allDossiers) {
          // Compter les dossiers en cours
          const enCours = allDossiers.filter((d) => d.status === "en_cours").length;
          setDossiersEnCours(enCours);

          // Compter les dossiers terminés
          const termines = allDossiers.filter((d) => d.status === "accepte").length;
          setDossiersTermines(termines);

          // Compter les dossiers terminés ce mois
          const now = new Date();
          const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const terminesCeMois = allDossiers.filter((d) => {
            if (d.status !== "accepte") return false;
            if (!d.created_at) return false;
            const createdDate = new Date(d.created_at);
            return createdDate >= firstDayOfMonth;
          }).length;
          setDossiersTerminesCeMois(terminesCeMois);
        } else {
          setDossiersEnCours(0);
          setDossiersTermines(0);
          setDossiersTerminesCeMois(0);
        }
      } catch (err) {
        console.error("Error fetching dossiers:", err);
        setDossiersEnCours(0);
        setDossiersTermines(0);
        setDossiersTerminesCeMois(0);
      }

      // Charger les tâches de l'admin
      if (profileData.id) {
        await fetchTasks(profileData.id);
      }

      // Charger tous les dossiers
      await fetchRecentDossiers();

      // Charger le nombre de messages non lus
      const { data: unreadMessagesCount } = await data.getUnreadMessagesCount(profileData.id);
      setUnreadCount(unreadMessagesCount || 0);

      setLoading(false);
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTasks = async (adminId: string) => {
    const { data: tasksData, error } = await data.getTasksByAdminId(adminId);

    if (error) {
      console.error("Error fetching tasks:", error);
    } else {
      setTasks((tasksData as AdminTask[]) || []);
    }
  };

  const fetchRecentDossiers = async () => {
    try {
      const { data: allDossiers, error: dossiersError } = await data.getAllDossiers();

      if (dossiersError) {
        console.error("Error fetching recent dossiers:", dossiersError);
        setRecentDossiers([]);
        return;
      }

      if (!allDossiers || allDossiers.length === 0) {
        setRecentDossiers([]);
        return;
      }

      // Prendre tous les dossiers (déjà triés par created_at DESC dans getAllDossiers)
      // Pour chaque dossier, récupérer le profil du client pour avoir son nom
      const dossiersWithClientNames = await Promise.all(
        allDossiers.map(async (dossier) => {
          const { data: profileData } = await data.getProfileById(dossier.user_id);
          const clientName = profileData?.full_name || 
                           `${dossier.first_name || ""} ${dossier.last_name || ""}`.trim() ||
                           profileData?.email?.split("@")[0] ||
                           "Client inconnu";

          return {
            id: dossier.id,
            user_id: dossier.user_id,
            client_name: clientName,
            llc_name: dossier.llc_name,
            created_at: dossier.created_at,
            status: dossier.status,
          } as RecentDossier;
        })
      );

      setRecentDossiers(dossiersWithClientNames);
    } catch (err) {
      console.error("Error fetching recent dossiers:", err);
      setRecentDossiers([]);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getStatusBadge = (status: "en_cours" | "accepte" | "refuse") => {
    switch (status) {
      case "accepte":
        return {
          text: "TERMINÉ",
          className: "bg-green-500/20 text-green-400",
        };
      case "en_cours":
        return {
          text: "EN COURS",
          className: "bg-orange-500/20 text-orange-400",
        };
      case "refuse":
        return {
          text: "REFUSÉ",
          className: "bg-red-500/20 text-red-400",
        };
      default:
        return {
          text: "EN COURS",
          className: "bg-orange-500/20 text-orange-400",
        };
    }
  };

  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    const { error } = await data.updateTask(taskId, { completed: !currentCompleted });

    if (error) {
      console.error("Error updating task:", error);
    } else {
      // Mettre à jour l'état local
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, completed: !currentCompleted } : task
        )
      );
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !newTaskTitle.trim()) return;

    setIsSubmittingTask(true);
    const { error } = await data.createTask({
      admin_id: profile.id,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || null,
      priority: newTaskPriority,
      completed: false,
    });

    if (error) {
      console.error("Error creating task:", error);
      alert("Erreur lors de la création de la tâche");
    } else {
      // Recharger les tâches
      await fetchTasks(profile.id);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskPriority("medium");
      setIsTaskModalOpen(false);
    }
    setIsSubmittingTask(false);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) return;

    const { error } = await data.deleteTask(taskId);

    if (error) {
      console.error("Error deleting task:", error);
      alert("Erreur lors de la suppression de la tâche");
    } else {
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-pink-500";
      case "medium":
        return "bg-orange-500";
      case "low":
        return "bg-neutral-500";
      default:
        return "bg-neutral-500";
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-900">
        <p className="text-neutral-500">Chargement...</p>
      </div>
    );
  }

  const userName = profile?.full_name || profile?.email?.split("@")[0] || "Admin";

  // Données du graphique (simulation)
  const chartData = [
    { date: "1 Nov", created: 3, completed: 2 },
    { date: "8 Nov", created: 5, completed: 4 },
    { date: "15 Nov", created: 7, completed: 5 },
    { date: "22 Nov", created: 6, completed: 6 },
    { date: "29 Nov", created: 8, completed: 7 },
    { date: "6 Déc", created: 9, completed: 8 },
    { date: "15 Déc", created: 10, completed: 9 },
  ];

  const maxValue = 15;
  const chartHeight = 200;
  const chartWidth = 600;

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
              <button className="flex w-full items-center gap-3 rounded-lg bg-green-500/20 px-3 py-2.5 text-left text-green-400 transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                <span className="font-medium">Vue d&apos;ensemble</span>
              </button>
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
              <input
                type="text"
                placeholder="Rechercher un client, un dossier..."
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs lg:px-4 lg:py-2.5 lg:text-sm text-white placeholder:text-neutral-500 focus:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
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

              {/* New Dossier Button */}
              <button className="rounded-lg bg-green-500 px-3 py-2 lg:px-4 lg:py-2.5 text-xs lg:text-sm font-medium text-white transition-colors hover:bg-green-600">
                <span className="hidden sm:inline">+ Nouveau Dossier</span>
                <span className="sm:hidden">+ Nouveau</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-900 p-4 lg:p-8">
          {/* Header */}
          <div className="mb-4 lg:mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold">Vue d&apos;ensemble</h1>
            <p className="mt-2 text-sm lg:text-base text-neutral-400">Bienvenue sur le tableau de bord administrateur.</p>
          </div>

          {/* Key Metrics Cards */}
          <div className="mb-4 lg:mb-8 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
            {/* Nouveaux Clients */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-neutral-400">Nouveaux Clients</span>
                <svg className="h-5 w-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl lg:text-3xl font-bold">{totalClients}</span>
                <span className="text-xs lg:text-sm text-green-400">Clients</span>
              </div>
            </div>

            {/* Dossiers en Cours */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-3 lg:mb-4 flex items-center justify-between">
                <span className="text-xs lg:text-sm text-neutral-400">Dossiers en Cours</span>
                <svg className="h-5 w-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl lg:text-3xl font-bold">{dossiersEnCours}</span>
                <span className="text-xs lg:text-sm text-orange-400">En cours</span>
              </div>
            </div>

            {/* Dossiers Terminés */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-3 lg:mb-4 flex items-center justify-between">
                <span className="text-xs lg:text-sm text-neutral-400">Dossiers Terminés</span>
                <svg className="h-5 w-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex flex-col sm:flex-row items-baseline gap-1 sm:gap-2">
                <span className="text-2xl lg:text-3xl font-bold">{dossiersTermines}</span>
                {dossiersTerminesCeMois > 0 && (
                  <span className="text-xs lg:text-sm text-green-400">+{dossiersTerminesCeMois} ce mois</span>
                )}
                {dossiersTerminesCeMois === 0 && (
                  <span className="text-xs lg:text-sm text-green-400">Terminés</span>
                )}
              </div>
            </div>

            {/* Revenus */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-3 lg:mb-4 flex items-center justify-between">
                <span className="text-xs lg:text-sm text-neutral-400">Revenus (200)</span>
                <svg className="h-5 w-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl lg:text-3xl font-bold">€25.6K</span>
                <span className="text-xs lg:text-sm text-green-400">+2.5%</span>
              </div>
            </div>
          </div>

          {/* Middle Section */}
          <div className="mb-4 lg:mb-8 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            {/* Activité des Dossiers */}
            <div className="lg:col-span-8 rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h2 className="text-lg lg:text-xl font-semibold">Activité des Dossiers</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTimeframe("mois")}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      timeframe === "mois"
                        ? "bg-green-500 text-white"
                        : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
                    }`}
                  >
                    Mois
                  </button>
                  <button
                    onClick={() => setTimeframe("annee")}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      timeframe === "annee"
                        ? "bg-green-500 text-white"
                        : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
                    }`}
                  >
                    Année
                  </button>
                </div>
              </div>

              {/* Chart */}
              <div className="relative">
                <svg width={chartWidth} height={chartHeight} className="w-full">
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((val) => (
                    <line
                      key={val}
                      x1="0"
                      y1={chartHeight - (val / maxValue) * chartHeight}
                      x2={chartWidth}
                      y2={chartHeight - (val / maxValue) * chartHeight}
                      stroke="#262626"
                      strokeWidth={1}
                    />
                  ))}

                  {/* X-axis labels */}
                  {chartData.map((item, index) => {
                    const x = (index / (chartData.length - 1)) * chartWidth;
                    return (
                      <text
                        key={index}
                        x={x}
                        y={chartHeight + 20}
                        textAnchor="middle"
                        className="fill-neutral-400 text-xs"
                      >
                        {item.date}
                      </text>
                    );
                  })}

                  {/* Y-axis labels */}
                  {[0, 5, 10, 15].map((val) => (
                    <text
                      key={val}
                      x={-10}
                      y={chartHeight - (val / maxValue) * chartHeight + 4}
                      textAnchor="end"
                      className="fill-neutral-400 text-xs"
                    >
                      {val}
                    </text>
                  ))}

                  {/* Dossiers Créés line (teal/green) */}
                  <polyline
                    points={chartData
                      .map(
                        (item, index) =>
                          `${(index / (chartData.length - 1)) * chartWidth},${
                            chartHeight - (item.created / maxValue) * chartHeight
                          }`
                      )
                      .join(" ")}
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Dossiers Terminés line (dashed gray) */}
                  <polyline
                    points={chartData
                      .map(
                        (item, index) =>
                          `${(index / (chartData.length - 1)) * chartWidth},${
                            chartHeight - (item.completed / maxValue) * chartHeight
                          }`
                      )
                      .join(" ")}
                    fill="none"
                    stroke="#737373"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Points for Dossiers Créés */}
                  {chartData.map((item, index) => {
                    const x = (index / (chartData.length - 1)) * chartWidth;
                    const y = chartHeight - (item.created / maxValue) * chartHeight;
                    return (
                      <circle key={`created-${index}`} cx={x} cy={y} r={4} fill="#14b8a6" />
                    );
                  })}

                  {/* Points for Dossiers Terminés */}
                  {chartData.map((item, index) => {
                    const x = (index / (chartData.length - 1)) * chartWidth;
                    const y = chartHeight - (item.completed / maxValue) * chartHeight;
                    return (
                      <circle key={`completed-${index}`} cx={x} cy={y} r={4} fill="#737373" />
                    );
                  })}
                </svg>

                {/* Legend */}
                <div className="mt-4 flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-teal-500"></div>
                    <span className="text-sm text-neutral-400">Dossiers Créés</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-neutral-500"></div>
                    <span className="text-sm text-neutral-400">Dossiers Terminés</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tâches Prioritaires */}
            <div className="lg:col-span-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
              <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h2 className="text-lg lg:text-xl font-semibold">Tâches Prioritaires</h2>
                <button
                  onClick={() => setIsTaskModalOpen(true)}
                  className="rounded-lg bg-green-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-600"
                >
                  + Nouvelle tâche
                </button>
              </div>

              {tasks.length === 0 ? (
                <div className="py-8 text-center text-sm text-neutral-400">
                  Aucune tâche. Cliquez sur "+ Nouvelle tâche" pour en créer une.
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-start gap-3 rounded-lg p-2 transition-colors ${
                        task.completed ? "opacity-60" : "hover:bg-neutral-900/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleTask(task.id, task.completed)}
                        className="mt-1 h-4 w-4 cursor-pointer rounded border-neutral-700 bg-neutral-900 text-green-500 focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            task.completed ? "text-neutral-500 line-through" : ""
                          }`}
                        >
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="mt-1 text-xs text-neutral-400">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${getPriorityColor(task.priority)}`}
                          title={task.priority}
                        ></div>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="rounded p-1 text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                          title="Supprimer"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Modal de création de tâche */}
              {isTaskModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                  <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                    <h3 className="mb-4 text-lg font-semibold">Nouvelle tâche</h3>
                    <form onSubmit={handleCreateTask} className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-neutral-300">
                          Titre *
                        </label>
                        <input
                          type="text"
                          required
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                          placeholder="Ex: Valider documents - J. Dupont"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-neutral-300">
                          Description
                        </label>
                        <textarea
                          value={newTaskDescription}
                          onChange={(e) => setNewTaskDescription(e.target.value)}
                          rows={3}
                          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                          placeholder="Description optionnelle..."
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-neutral-300">
                          Priorité
                        </label>
                        <select
                          value={newTaskPriority}
                          onChange={(e) =>
                            setNewTaskPriority(e.target.value as "low" | "medium" | "high" | "urgent")
                          }
                          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        >
                          <option value="low">Basse</option>
                          <option value="medium">Moyenne</option>
                          <option value="high">Haute</option>
                          <option value="urgent">Urgente</option>
                        </select>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <button
                          type="submit"
                          disabled={isSubmittingTask}
                          className="flex-1 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50"
                        >
                          {isSubmittingTask ? "Création..." : "Créer"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsTaskModalOpen(false);
                            setNewTaskTitle("");
                            setNewTaskDescription("");
                            setNewTaskPriority("medium");
                          }}
                          className="flex-1 rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800"
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dossiers Récents */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
            <div className="mb-4 lg:mb-6 flex items-center justify-between">
              <h2 className="text-lg lg:text-xl font-semibold">Tous les Dossiers</h2>
              <Link
                href="/admin/dossiers-llc"
                className="text-sm text-green-400 hover:text-green-300"
              >
                Voir tout
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className="pb-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      CLIENT
                    </th>
                    <th className="pb-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      ENTREPRISE
                    </th>
                    <th className="pb-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      DATE CRÉATION
                    </th>
                    <th className="pb-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      STATUT
                    </th>
                    <th className="pb-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {recentDossiers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-neutral-400">
                        Aucun dossier récent
                      </td>
                    </tr>
                  ) : (
                    recentDossiers.map((dossier) => {
                      const statusBadge = getStatusBadge(dossier.status);
                      return (
                        <tr key={dossier.id}>
                          <td className="py-4 text-sm font-medium">{dossier.client_name}</td>
                          <td className="py-4 text-sm text-neutral-400">
                            {dossier.llc_name || "Non renseigné"}
                          </td>
                          <td className="py-4 text-sm text-neutral-400">
                            {formatDate(dossier.created_at)}
                          </td>
                          <td className="py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusBadge.className}`}>
                              {statusBadge.text}
                            </span>
                          </td>
                          <td className="py-4">
                            <Link
                              href={`/admin/dossier-llc/${dossier.id}`}
                              className="text-neutral-400 hover:text-white"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                />
                              </svg>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
