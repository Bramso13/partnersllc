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

type Message = {
  id: string;
  sender_id: string;
  sender_type: "user" | "admin" | "agent" | "conseiller";
  recipient_id: string;
  recipient_type: "user" | "admin" | "agent" | "conseiller";
  subject: string | null;
  content: string;
  is_read: boolean;
  read_at: string | null;
  dossier_id: string | null;
  conversation_id: string | null;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    full_name: string | null;
    email: string | null;
    telephone: string | null;
  };
};

export default function MessagesPage() {
  const router = useRouter();
  const { user, getUser, signOut } = useAuth();
  const { profile, fetchProfile } = useProfile();
  const data = useData();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchProfileAndCheck() {
      const currentUser = await getUser();

      if (!currentUser) {
        router.push("/login");
        return;
      }

      const profileData = await fetchProfile(currentUser.id);

      if (isMounted) {
        if (profileData && profileData.role !== "admin") {
          router.push("/dashboard");
          return;
        }
        setLoading(false);

        // Charger les messages si l'utilisateur est admin
        if (profileData && profileData.role === "admin") {
          loadMessages(profileData.id);
          loadUnreadCount(profileData.id);
        }
      }
    }

    fetchProfileAndCheck();

    return () => {
      isMounted = false;
    };
  }, [router, getUser, fetchProfile]);

  const loadUnreadCount = async (adminId: string) => {
    try {
      const { data: count } = await data.getUnreadMessagesCount(adminId);
      setUnreadCount(count || 0);
    } catch (err) {
      console.error("Error loading unread count:", err);
      setUnreadCount(0);
    }
  };

  const loadMessages = async (adminId: string) => {
    setMessagesLoading(true);
    try {
      const { data: messagesData, error } = await data.getMessagesForAdmin(adminId);
      if (error) {
        console.error("Error fetching messages:", error);
        setMessages([]);
      } else {
        setMessages(messagesData || []);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    const { error } = await data.markMessageAsRead(messageId);
    if (!error) {
      // Mettre à jour le message localement
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, is_read: true, read_at: new Date().toISOString() }
            : msg
        )
      );
      // Mettre à jour le compteur de messages non lus
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Hier";
    } else if (days < 7) {
      return `Il y a ${days} jours`;
    } else {
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
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

  return (
    <div className="flex min-h-screen bg-neutral-900 text-white">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] border-r border-neutral-800 bg-neutral-950 transition-transform duration-300 lg:static lg:z-auto lg:flex lg:w-72 lg:shrink-0 lg:flex-col ${
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
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-green-400 bg-green-500/20 transition-colors hover:bg-green-500/30"
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
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
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

        {/* User Section */}
        <div className="mt-auto border-t border-neutral-800 pt-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-sm font-semibold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-neutral-500">Administrateur</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800"
          >
            Se déconnecter
          </button>
        </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b border-neutral-800 bg-neutral-950 px-4 py-3 lg:px-6 lg:py-4">
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
            <div>
              <h1 className="text-2xl font-bold">Messages</h1>
              <p className="mt-1 text-sm text-neutral-400">
                Gérez les messages envoyés par les clients
              </p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            {messagesLoading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-neutral-500">Chargement des messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-8 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-neutral-600"
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
                <h2 className="mt-4 text-xl font-semibold text-neutral-300">
                  Aucun message
                </h2>
                <p className="mt-2 text-neutral-500">
                  Vous n&apos;avez pas encore reçu de messages de la part des clients.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* En-tête avec statistiques */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {messages.length} message{messages.length > 1 ? "s" : ""}
                    </h2>
                    <p className="text-sm text-neutral-400">
                      {messages.filter((m) => !m.is_read).length} non lu
                      {messages.filter((m) => !m.is_read).length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Liste des messages */}
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-lg border bg-neutral-950 p-5 transition-colors ${
                        message.is_read
                          ? "border-neutral-800"
                          : "border-green-500/50 bg-green-500/5"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-sm font-semibold">
                              {(message.sender?.full_name || message.sender?.email || "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">
                                  {message.sender?.full_name || message.sender?.email || "Expéditeur inconnu"}
                                </h3>
                                {!message.is_read && (
                                  <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
                                    Nouveau
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-neutral-400">
                                {message.sender?.email}
                                {message.sender?.telephone && (
                                  <span className="ml-2">
                                    • {message.sender.telephone}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3">
                            <h4 className="font-medium text-neutral-200">
                              {message.subject || "Sans objet"}
                            </h4>
                            <p className="mt-2 text-sm text-neutral-400 line-clamp-3">
                              {message.content}
                            </p>
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-xs text-neutral-500">
                              {formatDate(message.created_at)}
                            </span>
                            {!message.is_read && (
                              <button
                                onClick={() => handleMarkAsRead(message.id)}
                                className="rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-700"
                              >
                                Marquer comme lu
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

