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

export default function ParametresPage() {
  const router = useRouter();
  const { user, getUser, signOut } = useAuth();
  const { profile, fetchProfile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [accountForm, setAccountForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Notifications
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    newEvents: true,
    privateMessages: true,
    groupActivity: false,
    weeklyNewsletter: true,
  });

  // Privacy
  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showOnlineStatus: true,
    showEmail: false,
    appearInSearch: true,
    whoCanContact: "all",
    whoCanSeeConnections: "all",
  });

  // Language & Region
  const [language, setLanguage] = useState({
    interfaceLanguage: "fr",
    timezone: "Europe/Paris",
    dateFormat: "DD/MM/YYYY",
  });

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

      if (profileData.role === "admin") {
        router.push("/admin");
        return;
      }

      // Remplir le formulaire avec les données du profil
      const fullName = profileData.full_name || "";
      const nameParts = fullName.split(" ");
      
      // Récupérer le téléphone depuis le profil (si disponible)
      const phone = (profileData as any).telephone || "";
      
      // Récupérer la bio depuis partners_hub_profiles (si disponible)
      let bio = "";
      if (currentUser && isMounted) {
        const { data: partnersHubProfile } = await supabase
          .from("partners_hub_profiles")
          .select("about_you")
          .eq("user_id", currentUser.id)
          .maybeSingle();
        bio = partnersHubProfile?.about_you || "";
      }
      
      if (isMounted) {
        setAccountForm({
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          email: profileData.email || "",
          phone: phone,
          bio: bio,
        });
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

  const handleAccountSave = async () => {
    if (!user) return;

    setSaving(true);
    setSaveMessage(null);

    try {
      const fullName = `${accountForm.firstName.trim()} ${accountForm.lastName.trim()}`.trim();

      // Mettre à jour la table profiles
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          email: accountForm.email.trim(),
          telephone: accountForm.phone.trim() || null,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Mettre à jour la bio dans partners_hub_profiles si elle existe
      const { data: existingProfile } = await supabase
        .from("partners_hub_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existingProfile) {
        const { error: hubError } = await supabase
          .from("partners_hub_profiles")
          .update({
            about_you: accountForm.bio.trim() || null,
          })
          .eq("user_id", user.id);

        if (hubError) throw hubError;
      } else if (accountForm.bio.trim()) {
        // Créer une entrée si elle n'existe pas et qu'il y a une bio
        const { error: hubError } = await supabase
          .from("partners_hub_profiles")
          .insert({
            user_id: user.id,
            about_you: accountForm.bio.trim(),
          });

        if (hubError) throw hubError;
      }

      // Rafraîchir le profil
      await fetchProfile(user.id);

      setSaveMessage({ type: "success", text: "Paramètres enregistrés avec succès" });
      
      // Effacer le message après 3 secondes
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      console.error("Error saving account settings:", error);
      const errorMessage = error?.message || error?.code || "Une erreur inconnue s'est produite";
      setSaveMessage({ type: "error", text: `Erreur lors de l'enregistrement: ${errorMessage}` });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user) return;

    // Validation
    if (!securityForm.currentPassword || !securityForm.newPassword || !securityForm.confirmPassword) {
      setPasswordMessage({ type: "error", text: "Veuillez remplir tous les champs" });
      setTimeout(() => setPasswordMessage(null), 3000);
      return;
    }

    if (securityForm.newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Le nouveau mot de passe doit contenir au moins 6 caractères" });
      setTimeout(() => setPasswordMessage(null), 3000);
      return;
    }

    if (securityForm.newPassword !== securityForm.confirmPassword) {
      setPasswordMessage({ type: "error", text: "Les nouveaux mots de passe ne correspondent pas" });
      setTimeout(() => setPasswordMessage(null), 3000);
      return;
    }

    setChangingPassword(true);
    setPasswordMessage(null);

    try {
      // Vérifier le mot de passe actuel en essayant de se reconnecter
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email || "",
        password: securityForm.currentPassword,
      });

      if (signInError) {
        throw new Error("Le mot de passe actuel est incorrect");
      }

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: securityForm.newPassword,
      });

      if (updateError) throw updateError;

      // Réinitialiser le formulaire
      setSecurityForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setPasswordMessage({ type: "success", text: "Mot de passe modifié avec succès" });
      setTimeout(() => setPasswordMessage(null), 3000);
    } catch (error: any) {
      console.error("Error changing password:", error);
      const errorMessage = error?.message || error?.code || "Une erreur s'est produite lors du changement de mot de passe";
      setPasswordMessage({ type: "error", text: errorMessage });
    } finally {
      setChangingPassword(false);
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
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Carte des Membres</span>
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
                className="flex items-center gap-3 rounded-lg bg-green-500/20 px-3 py-2.5 text-green-400 transition-colors"
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
                <span className="font-medium">Paramètres</span>
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
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Logo variant="header" brand="partnershub" />
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                  <span className="text-sm font-medium">{userName.charAt(0).toUpperCase()}</span>
                </div>
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-neutral-900"></div>
              </div>
            </div>
          </div>
        </header>

        {/* Settings Content */}
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Column (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Page Title */}
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">Paramètres</h1>
                <p className="mt-2 text-sm lg:text-base text-neutral-400">
                  Gérez vos préférences et paramètres de compte
                </p>
              </div>

              {/* Compte Section */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                <h2 className="text-xl font-semibold mb-1">Compte</h2>
                <p className="text-sm text-neutral-400 mb-6">Gérez vos informations personnelles</p>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium">Prénom</label>
                      <input
                        type="text"
                        value={accountForm.firstName}
                        onChange={(e) => setAccountForm({ ...accountForm, firstName: e.target.value })}
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        placeholder="Jean"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Nom</label>
                      <input
                        type="text"
                        value={accountForm.lastName}
                        onChange={(e) => setAccountForm({ ...accountForm, lastName: e.target.value })}
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        placeholder="Dupont"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Email</label>
                    <input
                      type="email"
                      value={accountForm.email}
                      onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="jean.dupont@email.com"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Téléphone</label>
                    <input
                      type="tel"
                      value={accountForm.phone}
                      onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Bio</label>
                    <textarea
                      value={accountForm.bio}
                      onChange={(e) => setAccountForm({ ...accountForm, bio: e.target.value })}
                      rows={4}
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="Entrepreneur passionné par l'innovation technologique et le développement de solutions Saas."
                    />
                  </div>

                  {saveMessage && (
                    <div className={`rounded-lg p-3 text-sm ${
                      saveMessage.type === "success" 
                        ? "bg-green-500/20 text-green-400 border border-green-500/50" 
                        : "bg-red-500/20 text-red-400 border border-red-500/50"
                    }`}>
                      {saveMessage.text}
                    </div>
                  )}
                  
                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={async () => {
                        // Recharger les données originales depuis la base de données
                        if (user) {
                          try {
                            const profileData = await fetchProfile(user.id);
                            if (profileData) {
                              const fullName = profileData.full_name || "";
                              const nameParts = fullName.split(" ");
                              const phone = (profileData as any).telephone || "";
                              
                              // Recharger la bio depuis partners_hub_profiles
                              const { data: partnersHubProfile } = await supabase
                                .from("partners_hub_profiles")
                                .select("about_you")
                                .eq("user_id", user.id)
                                .maybeSingle();
                              const bio = partnersHubProfile?.about_you || "";
                              
                              setAccountForm({
                                firstName: nameParts[0] || "",
                                lastName: nameParts.slice(1).join(" ") || "",
                                email: profileData.email || "",
                                phone: phone,
                                bio: bio,
                              });
                            }
                            setSaveMessage(null);
                          } catch (error) {
                            console.error("Error reloading profile:", error);
                          }
                        }
                      }}
                      className="rounded-lg border border-neutral-700 bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleAccountSave}
                      disabled={saving}
                      className="rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {saving ? "Enregistrement..." : "Enregistrer"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sécurité Section */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                <h2 className="text-xl font-semibold mb-1">Sécurité</h2>
                <p className="text-sm text-neutral-400 mb-6">Protégez votre compte</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Mot de passe actuel</label>
                    <input
                      type="password"
                      value={securityForm.currentPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="********"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Nouveau mot de passe</label>
                    <input
                      type="password"
                      value={securityForm.newPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="********"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Confirmer le mot de passe</label>
                    <input
                      type="password"
                      value={securityForm.confirmPassword}
                      onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white placeholder-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="********"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-sm font-medium">Authentification à deux facteurs</p>
                      <p className="text-xs text-neutral-400">Ajouter une couche de sécurité supplémentaire</p>
                    </div>
                    <button
                      onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        twoFactorEnabled ? "bg-green-500" : "bg-neutral-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          twoFactorEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {passwordMessage && (
                    <div className={`mt-4 rounded-lg p-3 text-sm ${
                      passwordMessage.type === "success" 
                        ? "bg-green-500/20 text-green-400 border border-green-500/50" 
                        : "bg-red-500/20 text-red-400 border border-red-500/50"
                    }`}>
                      {passwordMessage.text}
                    </div>
                  )}

                  <div className="pt-4">
                    <button
                      onClick={handlePasswordChange}
                      disabled={changingPassword}
                      className="rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {changingPassword ? "Modification..." : "Modifier le mot de passe"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Notifications Section */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                <h2 className="text-xl font-semibold mb-1">Notifications</h2>
                <p className="text-sm text-neutral-400 mb-6">Choisissez comment vous souhaitez être informé</p>
                
                <div className="space-y-4">
                  {[
                    { key: "email", label: "Notifications par email", desc: "Recevez des emails pour les mises à jour importantes" },
                    { key: "push", label: "Notifications push", desc: "Recevez des notifications sur votre navigateur" },
                    { key: "newEvents", label: "Nouveaux événements", desc: "Soyez alerté des nouveaux événements disponibles" },
                    { key: "privateMessages", label: "Messages privés", desc: "Recevez une notification pour chaque nouveau message" },
                    { key: "groupActivity", label: "Activité des groupes", desc: "Notifications pour les groupes que vous avez rejoints" },
                    { key: "weeklyNewsletter", label: "Newsletter hebdomadaire", desc: "Recevez des activités de la semaine" },
                  ].map((notif) => (
                    <div key={notif.key} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{notif.label}</p>
                        <p className="text-xs text-neutral-400">{notif.desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifications({ ...notifications, [notif.key]: !notifications[notif.key as keyof typeof notifications] })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notifications[notif.key as keyof typeof notifications] ? "bg-green-500" : "bg-neutral-700"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            notifications[notif.key as keyof typeof notifications] ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confidentialité Section */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                <h2 className="text-xl font-semibold mb-1">Confidentialité</h2>
                <p className="text-sm text-neutral-400 mb-6">Contrôlez qui peut voir vos informations</p>
                
                <div className="space-y-4">
                  {[
                    { key: "publicProfile", label: "Profil public", desc: "Votre profil est visible par tous les membres" },
                    { key: "showOnlineStatus", label: "Afficher mon statut en ligne", desc: "Les autres membres peuvent voir si vous êtes en ligne" },
                    { key: "showEmail", label: "Afficher mon email", desc: "Votre email est visible sur votre profil public" },
                    { key: "appearInSearch", label: "Apparaître dans les recherches", desc: "Les membres peuvent vous trouver via la recherche" },
                  ].map((priv) => (
                    <div key={priv.key} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{priv.label}</p>
                        <p className="text-xs text-neutral-400">{priv.desc}</p>
                      </div>
                      <button
                        onClick={() => setPrivacy({ ...privacy, [priv.key]: !privacy[priv.key as keyof typeof privacy] })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          privacy[priv.key as keyof typeof privacy] ? "bg-green-500" : "bg-neutral-700"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            privacy[priv.key as keyof typeof privacy] ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}

                  <div>
                    <label className="mb-2 block text-sm font-medium">Qui peut vous contacter ?</label>
                    <select
                      value={privacy.whoCanContact}
                      onChange={(e) => setPrivacy({ ...privacy, whoCanContact: e.target.value })}
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                      <option value="all">Tous les membres</option>
                      <option value="connections">Mes connexions uniquement</option>
                      <option value="none">Personne</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Qui peut voir vos connexions ?</label>
                    <select
                      value={privacy.whoCanSeeConnections}
                      onChange={(e) => setPrivacy({ ...privacy, whoCanSeeConnections: e.target.value })}
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                      <option value="all">Tous les membres</option>
                      <option value="connections">Mes connexions uniquement</option>
                      <option value="none">Personne</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Langue & Région Section */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                <h2 className="text-xl font-semibold mb-1">Langue & Région</h2>
                <p className="text-sm text-neutral-400 mb-6">Personnalisez votre expérience</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Langue de l&apos;interface</label>
                    <select
                      value={language.interfaceLanguage}
                      onChange={(e) => setLanguage({ ...language, interfaceLanguage: e.target.value })}
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Fuseau horaire</label>
                    <select
                      value={language.timezone}
                      onChange={(e) => setLanguage({ ...language, timezone: e.target.value })}
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                      <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                      <option value="America/New_York">America/New_York (GMT-5)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Format de date</label>
                    <select
                      value={language.dateFormat}
                      onChange={(e) => setLanguage({ ...language, dateFormat: e.target.value })}
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Premium Card */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">Premium</h3>
                </div>
                <p className="text-sm text-neutral-400 mb-1">Membre depuis Jan 2023</p>
                <p className="text-sm text-neutral-400 mb-4">Profitez de tous les avantages Premium</p>
                <button className="w-full rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90">
                  Gérer l&apos;abonnement
                </button>
              </div>

              {/* Comptes connectés */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                <h3 className="text-lg font-semibold mb-4">Comptes connectés</h3>
                <div className="space-y-4">
                  {/* LinkedIn */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium">LinkedIn</p>
                        <p className="text-xs text-green-400">Connecté</p>
                      </div>
                    </div>
                    <button className="rounded-lg border border-red-500/50 bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/30 transition-colors">
                      Déconnecter
                    </button>
                  </div>

                  {/* Twitter */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                        <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Twitter</p>
                        <p className="text-xs text-green-400">Connecté</p>
                      </div>
                    </div>
                    <button className="rounded-lg border border-red-500/50 bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/30 transition-colors">
                      Déconnecter
                    </button>
                  </div>

                  {/* Facebook */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                        <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Facebook</p>
                        <p className="text-xs text-neutral-400">Non connecté</p>
                      </div>
                    </div>
                    <button className="rounded-lg border border-green-500/50 bg-green-500/20 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/30 transition-colors">
                      Connecter
                    </button>
                  </div>
                </div>
              </div>

              {/* Stockage */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                <h3 className="text-lg font-semibold mb-4">Stockage</h3>
                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-neutral-400">Utilisé 3.2 GB / 10 GB</span>
                    <span className="font-medium">32%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-600"
                      style={{ width: "32%" }}
                    ></div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Documents</span>
                    <span className="font-medium">1.8 GB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Images</span>
                    <span className="font-medium">1.1 GB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Vidéos</span>
                    <span className="font-medium">0.3 GB</span>
                  </div>
                </div>
              </div>

              {/* Zone dangereuse */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                <h3 className="text-lg font-semibold mb-4 text-red-400">Zone dangereuse</h3>
                <div className="space-y-3">
                  <button className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors">
                    Désactiver mon compte
                  </button>
                  <button className="w-full rounded-lg border border-red-500/50 bg-red-500/20 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/30 transition-colors">
                    Supprimer mon compte
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

