"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  telephone: string | null;
  role: string;
};

export default function ParametresPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("profil");
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    dossier: true,
    fiscaux: true,
    newsletter: false,
    hub: true,
  });
  const [preferences, setPreferences] = useState({
    langue: "fr",
    fuseauHoraire: "Europe/Paris",
    modeSombre: true,
    sauvegardeAuto: true,
  });
  const [confidentialite, setConfidentialite] = useState({
    profilPublic: true,
    analyseCookies: true,
  });

  // États pour le formulaire de profil
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("fr");
  const [bio, setBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // États pour le changement de mot de passe
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // États pour le modal d'ajout de mode de paiement
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardType, setCardType] = useState("visa");
  const [savedCardLast4, setSavedCardLast4] = useState<string | null>(null);
  const [savedCardBrand, setSavedCardBrand] = useState<string | null>(null);
  const [addingPayment, setAddingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // États pour le téléchargement des données
  const [downloadingData, setDownloadingData] = useState(false);
  const [dataDownloadError, setDataDownloadError] = useState<string | null>(null);
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

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      setProfile(data);

      // Initialiser les champs du formulaire
      const fullName = data.full_name || "";
      const nameParts = fullName.split(" ");
      setFirstName(nameParts[0] || "");
      setLastName(nameParts.slice(1).join(" ") || "");
      setEmail(data.email || "");
      setPhone(data.telephone || "");

      // Récupérer les métadonnées utilisateur (country, bio) - téléphone maintenant dans profiles
      if (user?.user_metadata) {
        setCountry(user.user_metadata.country || "fr");
        setBio(user.user_metadata.bio || "");
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

  const userName = profile?.full_name || profile?.email?.split("@")[0] || "Utilisateur";

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    setSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(false);

    // Validation : tous les champs sauf bio et photo de profil sont obligatoires
    const fullName = `${firstName} ${lastName}`.trim();
    
    if (!firstName.trim()) {
      setProfileError("Le prénom est obligatoire");
      setSavingProfile(false);
      return;
    }

    if (!lastName.trim()) {
      setProfileError("Le nom est obligatoire");
      setSavingProfile(false);
      return;
    }

    if (!phone.trim()) {
      setProfileError("Le téléphone est obligatoire");
      setSavingProfile(false);
      return;
    }

    if (!country) {
      setProfileError("Le pays est obligatoire");
      setSavingProfile(false);
      return;
    }

    try {
      // Mettre à jour le profil dans la table profiles (full_name et telephone)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          telephone: phone.trim(),
        })
        .eq("id", profile.id);

      if (profileError) {
        throw profileError;
      }

      // Mettre à jour les métadonnées utilisateur (country, bio) - téléphone maintenant dans profiles
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error: metadataError } = await supabase.auth.updateUser({
          data: {
            country: country,
            bio: bio,
          },
        });

        if (metadataError) {
          throw metadataError;
        }
      }

      // Mettre à jour le profil local
      setProfile({
        ...profile,
        full_name: fullName,
        telephone: phone.trim(),
      });

      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error saving profile:", error);
      setProfileError(error.message || "Une erreur est survenue lors de la sauvegarde");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!newPassword || !confirmNewPassword) {
      setPasswordError("Merci de remplir tous les champs de mot de passe.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    setChangingPassword(true);

    try {
      // Supabase ne vérifie pas le mot de passe actuel côté client, mais on garde le champ pour l'UX.
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error changing password:", error);
      setPasswordError(error.message || "Une erreur est survenue lors du changement de mot de passe");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleOpenPaymentModal = () => {
    setIsPaymentModalOpen(true);
    setPaymentError(null);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setCardNumber("");
    setCardName("");
    setCardExpiry("");
    setCardCvv("");
    setCardType("visa");
    setPaymentError(null);
  };

  const handleAddPaymentMethod = async () => {
    setPaymentError(null);

    if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
      setPaymentError("Tous les champs sont requis");
      return;
    }

    // Validation basique du numéro de carte (16 chiffres)
    const cleanedCardNumber = cardNumber.replace(/\s/g, "");
    if (cleanedCardNumber.length < 13 || cleanedCardNumber.length > 19) {
      setPaymentError("Le numéro de carte n'est pas valide");
      return;
    }

    // Validation de la date d'expiration (MM/YY)
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      setPaymentError("La date d'expiration doit être au format MM/YY");
      return;
    }

    // Validation du CVV (3 ou 4 chiffres)
    if (!/^\d{3,4}$/.test(cardCvv)) {
      setPaymentError("Le CVV doit contenir 3 ou 4 chiffres");
      return;
    }

    setAddingPayment(true);

    try {
      // Ici, tu devrais normalement utiliser un service de paiement comme Stripe
      // Pour l'instant, on simule juste l'ajout localement et on affiche la carte dans l'UI.
      await new Promise((resolve) => setTimeout(resolve, 800));

      const last4 = cleanedCardNumber.slice(-4);
      setSavedCardLast4(last4);
      setSavedCardBrand(cardType);

      handleClosePaymentModal();
    } catch (error: any) {
      console.error("Error adding payment method:", error);
      setPaymentError(error.message || "Une erreur est survenue lors de l'ajout du mode de paiement");
    } finally {
      setAddingPayment(false);
    }
  };

  const handleDownloadData = async () => {
    if (!profile) return;

    setDownloadingData(true);
    setDataDownloadError(null);

    try {
      // Récupérer toutes les données de l'utilisateur
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Utilisateur non trouvé");
      }

      // Récupérer le profil complet
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Préparer les données à exporter
      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at,
          lastSignInAt: user.last_sign_in_at,
          userMetadata: user.user_metadata,
        },
        profile: profileData,
        preferences: {
          notifications,
          preferences,
          confidentialite,
        },
        paymentMethod: savedCardLast4
          ? {
              brand: savedCardBrand,
              last4: savedCardLast4,
            }
          : null,
      };

      // Créer un fichier JSON téléchargeable
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `mes-donnees-partners-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Error downloading data:", error);
      setDataDownloadError(error.message || "Une erreur est survenue lors du téléchargement des données");
    } finally {
      setDownloadingData(false);
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
            <Logo variant="sidebar" />
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
            <Logo variant="sidebar" />
          </div>

          {/* MENU Section */}
          <div className="mb-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              MENU
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
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span>Tableau de bord</span>
              </Link>
              <Link
                href="/dossier-llc"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <span>Mon dossier LLC</span>
              </Link>
              <Link
                href="/documents"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Documents</span>
              </Link>
              <Link
                href="/mon-entreprise"
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
                <span>Mon Entreprise</span>
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
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
                <span>PARTNERS Hub</span>
              </Link>
              <Link
                href="/formation"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <span>Formation</span>
              </Link>
            </nav>
          </div>

          {/* SUPPORT Section */}
          <div className="mb-6 border-t border-neutral-800 pt-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              SUPPORT
            </p>
            <nav className="space-y-1">
              <Link
                href="/support"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span>Support</span>
              </Link>
              <Link
                href="/parametres"
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

          {/* Boostez votre LLC Card */}
          <div className="mt-auto rounded-lg border border-neutral-800 bg-neutral-950 p-4">
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900">
                <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="mb-2 text-center text-sm font-bold text-white">Boostez votre LLC</h3>
            <p className="mb-4 text-center text-xs text-neutral-400">Découvrez nos services additionnels.</p>
            <button className="w-full rounded-lg bg-green-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600">
              Explorer
            </button>
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

            {/* Search Bar - Centered */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Q Rechercher..."
                className="mx-auto block w-full max-w-md rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs lg:px-4 lg:py-2.5 lg:text-sm text-white placeholder:text-neutral-500 focus:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            {/* Right Side - Notifications and Profile */}
            <div className="flex items-center gap-3 lg:gap-6">
              <button className="text-neutral-400 transition-colors hover:text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600"></div>
                <div className="hidden sm:block">
                  <p className="text-xs lg:text-sm font-medium">{userName}</p>
                  <p className="text-[10px] lg:text-xs text-neutral-400">Client Premium</p>
                </div>
                <button className="text-neutral-400 transition-colors hover:text-white">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-900 p-4 lg:p-8">
          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold">Paramètres</h1>
            <p className="mt-2 text-sm lg:text-base text-neutral-400">
              Gérez vos préférences et informations de compte.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            {/* Left Column - Settings Navigation */}
            <div className="lg:col-span-3">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveSection("profil")}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                    activeSection === "profil"
                      ? "bg-green-500/20 text-green-400"
                      : "text-neutral-400 hover:bg-neutral-800/50 hover:text-white"
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="font-medium">Profil</span>
                </button>
                <button
                  onClick={() => setActiveSection("securite")}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                    activeSection === "securite"
                      ? "bg-green-500/20 text-green-400"
                      : "text-neutral-400 hover:bg-neutral-800/50 hover:text-white"
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <span>Sécurité</span>
                </button>
                <button
                  onClick={() => setActiveSection("notifications")}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                    activeSection === "notifications"
                      ? "bg-green-500/20 text-green-400"
                      : "text-neutral-400 hover:bg-neutral-800/50 hover:text-white"
                  }`}
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
                </button>
                <button
                  onClick={() => setActiveSection("facturation")}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                    activeSection === "facturation"
                      ? "bg-green-500/20 text-green-400"
                      : "text-neutral-400 hover:bg-neutral-800/50 hover:text-white"
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"
                    />
                  </svg>
                  <span>Facturation</span>
                </button>
                <button
                  onClick={() => setActiveSection("preferences")}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                    activeSection === "preferences"
                      ? "bg-green-500/20 text-green-400"
                      : "text-neutral-400 hover:bg-neutral-800/50 hover:text-white"
                  }`}
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
                  <span>Préférences</span>
                </button>
                <button
                  onClick={() => setActiveSection("confidentialite")}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                    activeSection === "confidentialite"
                      ? "bg-green-500/20 text-green-400"
                      : "text-neutral-400 hover:bg-neutral-800/50 hover:text-white"
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <span>Confidentialité</span>
                </button>
              </nav>
            </div>

            {/* Right Column - Profile Form */}
            <div className="lg:col-span-9">
              {activeSection === "profil" && (
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                  <h2 className="mb-6 text-xl font-semibold">Informations du profil</h2>

                  {/* Messages d'erreur et de succès */}
                  {profileError && (
                    <div className="mb-6 rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-3 text-sm text-red-400">
                      {profileError}
                    </div>
                  )}
                  {profileSuccess && (
                    <div className="mb-6 rounded-lg bg-green-500/20 border border-green-500/50 px-4 py-3 text-sm text-green-400">
                      Profil mis à jour avec succès !
                    </div>
                  )}

                  {/* Profile Picture Section */}
                  <div className="mb-8 flex items-center gap-6">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-green-400 to-green-600"></div>
                    <div className="flex gap-3">
                      <button className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Changer la photo
                      </button>
                      <button className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Supprimer
                      </button>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-neutral-300">
                          Prénom <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                          placeholder="Prénom"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-neutral-300">
                          Nom <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                          placeholder="Nom"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-300">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-neutral-500 cursor-not-allowed"
                        title="L'email ne peut pas être modifié"
                      />
                      <p className="mt-1 text-xs text-neutral-500">L&apos;email ne peut pas être modifié</p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-300">
                        Téléphone <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        placeholder="+33 6 12 34 56 78"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-300">
                        Pays de résidence <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        required
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      >
                        <option value="fr">France</option>
                        <option value="us">États-Unis</option>
                        <option value="ca">Canada</option>
                        <option value="uk">Royaume-Uni</option>
                        <option value="be">Belgique</option>
                        <option value="ch">Suisse</option>
                        <option value="de">Allemagne</option>
                        <option value="es">Espagne</option>
                        <option value="it">Italie</option>
                        <option value="nl">Pays-Bas</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-300">Bio</label>
                      <textarea
                        rows={4}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Parlez-nous de vous..."
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      ></textarea>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-8 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        // Réinitialiser les champs
                        const fullName = profile?.full_name || "";
                        const nameParts = fullName.split(" ");
                        setFirstName(nameParts[0] || "");
                        setLastName(nameParts.slice(1).join(" ") || "");
                        setEmail(profile?.email || "");
                        setPhone(profile?.telephone || "");
                        setCountry("fr");
                        setBio("");
                        setProfileError(null);
                        setProfileSuccess(false);
                      }}
                      className="rounded-lg border border-neutral-800 bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="rounded-lg bg-green-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {savingProfile ? "Enregistrement..." : "Enregistrer"}
                    </button>
                  </div>
                </div>
              )}

              {activeSection === "securite" && (
                <div className="space-y-6">
                  {/* Sécurité du compte */}
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                    <h2 className="mb-6 text-xl font-semibold">Sécurité du compte</h2>
                    <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                          <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-white">Authentification à deux facteurs</p>
                          <p className="text-sm text-neutral-400">Activée</p>
                        </div>
                      </div>
                      <button className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800">
                        Gérer
                      </button>
                    </div>
                  </div>

                  {/* Changer le mot de passe */}
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                    <h2 className="mb-6 text-xl font-semibold">Changer le mot de passe</h2>
                    {passwordError && (
                      <div className="mb-4 rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-3 text-xs text-red-300">
                        {passwordError}
                      </div>
                    )}
                    {passwordSuccess && (
                      <div className="mb-4 rounded-lg bg-green-500/20 border border-green-500/50 px-4 py-3 text-xs text-green-300">
                        Mot de passe mis à jour avec succès.
                      </div>
                    )}
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-neutral-300">
                          Mot de passe actuel
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                          placeholder="Entrez votre mot de passe actuel"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-neutral-300">
                          Nouveau mot de passe
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                          placeholder="Entrez votre nouveau mot de passe"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-neutral-300">
                          Confirmer le nouveau mot de passe
                        </label>
                        <input
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                          placeholder="Confirmez votre nouveau mot de passe"
                        />
                      </div>
                      <button
                        onClick={handleChangePassword}
                        disabled={changingPassword}
                        className="w-full rounded-lg bg-green-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {changingPassword ? "Mise à jour..." : "Mettre à jour le mot de passe"}
                      </button>
                    </div>
                  </div>

                  {/* Sessions actives */}
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                    <h2 className="mb-6 text-xl font-semibold">Sessions actives</h2>
                    <div className="space-y-4">
                      {/* Session 1 */}
                      <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                            <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-white">MacBook Pro - Paris, France</p>
                            <p className="text-sm text-neutral-400">Session actuelle • Dernière activité: maintenant</p>
                          </div>
                        </div>
                      </div>

                      {/* Session 2 */}
                      <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800">
                            <svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-white">iPhone 14 - Paris, France</p>
                            <p className="text-sm text-neutral-400">Dernière activité: il y a 2 heures</p>
                          </div>
                        </div>
                        <button className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600">
                          Déconnecter
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "notifications" && (
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                  <h2 className="mb-6 text-xl font-semibold">Préférences de notifications</h2>
                  <div className="space-y-4">
                    {/* Notifications par email */}
                    <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                      <div>
                        <p className="font-medium text-white">Notifications par email</p>
                        <p className="text-sm text-neutral-400">Recevoir les mises à jour par email</p>
                      </div>
                      <button
                        onClick={() => toggleNotification("email")}
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                          notifications.email ? "bg-green-500" : "bg-neutral-700"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                            notifications.email ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Notifications push */}
                    <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                      <div>
                        <p className="font-medium text-white">Notifications push</p>
                        <p className="text-sm text-neutral-400">Recevoir des notifications sur vos appareils</p>
                      </div>
                      <button
                        onClick={() => toggleNotification("push")}
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                          notifications.push ? "bg-green-500" : "bg-neutral-700"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                            notifications.push ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Mises à jour du dossier */}
                    <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                      <div>
                        <p className="font-medium text-white">Mises à jour du dossier</p>
                        <p className="text-sm text-neutral-400">Notifications sur l&apos;avancement de votre LLC</p>
                      </div>
                      <button
                        onClick={() => toggleNotification("dossier")}
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                          notifications.dossier ? "bg-green-500" : "bg-neutral-700"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                            notifications.dossier ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Rappels fiscaux */}
                    <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                      <div>
                        <p className="font-medium text-white">Rappels fiscaux</p>
                        <p className="text-sm text-neutral-400">Alertes pour les échéances importantes</p>
                      </div>
                      <button
                        onClick={() => toggleNotification("fiscaux")}
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                          notifications.fiscaux ? "bg-green-500" : "bg-neutral-700"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                            notifications.fiscaux ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Newsletter PARTNERS */}
                    <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                      <div>
                        <p className="font-medium text-white">Newsletter PARTNERS</p>
                        <p className="text-sm text-neutral-400">Conseils et actualités mensuelles</p>
                      </div>
                      <button
                        onClick={() => toggleNotification("newsletter")}
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                          notifications.newsletter ? "bg-green-500" : "bg-neutral-700"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                            notifications.newsletter ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Activité du Hub */}
                    <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                      <div>
                        <p className="font-medium text-white">Activité du Hub</p>
                        <p className="text-sm text-neutral-400">Notifications de la communauté</p>
                      </div>
                      <button
                        onClick={() => toggleNotification("hub")}
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                          notifications.hub ? "bg-green-500" : "bg-neutral-700"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                            notifications.hub ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "facturation" && (
                <div className="space-y-6">
                  {/* Plan Premium */}
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Plan Premium</h3>
                        <p className="mt-1 text-sm text-neutral-400">Actif depuis le 15 janvier 2025</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">$299</p>
                        <p className="text-sm text-neutral-400">/an</p>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-center">
                      <button className="rounded-lg bg-green-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600">
                        Mettre à niveau
                      </button>
                    </div>
                  </div>

                  {/* Méthode de paiement */}
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="mb-4 text-lg font-semibold text-white">Méthode de paiement</h3>
                        {savedCardLast4 ? (
                          <p className="text-sm text-neutral-400">
                            Carte {savedCardBrand?.toUpperCase()} se terminant par **** {savedCardLast4}
                          </p>
                        ) : (
                          <p className="text-sm text-neutral-400">Aucune carte enregistrée</p>
                        )}
                      </div>
                      <button
                        onClick={handleOpenPaymentModal}
                        className="text-sm font-medium text-green-400 transition-colors hover:text-green-300"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>

                  {/* Historique de facturation */}
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Historique de facturation</h3>
                      <button className="text-sm font-medium text-green-400 transition-colors hover:text-green-300">
                        Voir tout
                      </button>
                    </div>
                    <div className="space-y-4">
                      {/* Facture 1 */}
                      <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                        <div>
                          <p className="font-medium text-white">Abonnement Premium</p>
                          <p className="text-sm text-neutral-400">15 janvier 2025</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-white">$299.00</p>
                          <button className="text-neutral-400 transition-colors hover:text-white">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Facture 2 */}
                      <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                        <div>
                          <p className="font-medium text-white">Création LLC Delaware</p>
                          <p className="text-sm text-neutral-400">20 décembre 2024</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-white">$499.00</p>
                          <button className="text-neutral-400 transition-colors hover:text-white">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "preferences" && (
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                  <h2 className="mb-6 text-xl font-semibold">Préférences générales</h2>
                  <div className="space-y-6">
                    {/* Langue */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-300">Langue</label>
                      <div className="relative">
                        <select
                          value={preferences.langue}
                          onChange={(e) => setPreferences({ ...preferences, langue: e.target.value })}
                          className="w-full appearance-none rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 pr-10 text-sm text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        >
                          <option value="fr">Français</option>
                          <option value="en">English</option>
                          <option value="es">Español</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Fuseau horaire */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-neutral-300">Fuseau horaire</label>
                      <div className="relative">
                        <select
                          value={preferences.fuseauHoraire}
                          onChange={(e) => setPreferences({ ...preferences, fuseauHoraire: e.target.value })}
                          className="w-full appearance-none rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 pr-10 text-sm text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                        >
                          <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                          <option value="America/New_York">America/New_York (GMT-5)</option>
                          <option value="America/Los_Angeles">America/Los_Angeles (GMT-8)</option>
                          <option value="Europe/London">Europe/London (GMT+0)</option>
                          <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Mode sombre */}
                    <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                      <div>
                        <p className="font-medium text-white">Mode sombre</p>
                        <p className="text-sm text-neutral-400">Thème sombre activé par défaut</p>
                      </div>
                      <button
                        onClick={() => setPreferences({ ...preferences, modeSombre: !preferences.modeSombre })}
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                          preferences.modeSombre ? "bg-green-500" : "bg-neutral-700"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                            preferences.modeSombre ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Sauvegarde automatique */}
                    <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                      <div>
                        <p className="font-medium text-white">Sauvegarde automatique</p>
                        <p className="text-sm text-neutral-400">Enregistrer automatiquement vos modifications</p>
                      </div>
                      <button
                        onClick={() => setPreferences({ ...preferences, sauvegardeAuto: !preferences.sauvegardeAuto })}
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                          preferences.sauvegardeAuto ? "bg-green-500" : "bg-neutral-700"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                            preferences.sauvegardeAuto ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "confidentialite" && (
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                  <h2 className="mb-6 text-xl font-semibold">Confidentialité et données</h2>
                  <div className="space-y-6">
                    {/* Profil public */}
                    <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                      <div>
                        <p className="font-medium text-white">Profil public</p>
                        <p className="text-sm text-neutral-400">Visible dans le PARTNERS Hub</p>
                      </div>
                      <button
                        onClick={() => setConfidentialite({ ...confidentialite, profilPublic: !confidentialite.profilPublic })}
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                          confidentialite.profilPublic ? "bg-green-500" : "bg-neutral-700"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                            confidentialite.profilPublic ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Analyse et cookies */}
                    <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                      <div>
                        <p className="font-medium text-white">Analyse et cookies</p>
                        <p className="text-sm text-neutral-400">Améliorer votre expérience</p>
                      </div>
                      <button
                        onClick={() => setConfidentialite({ ...confidentialite, analyseCookies: !confidentialite.analyseCookies })}
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                          confidentialite.analyseCookies ? "bg-green-500" : "bg-neutral-700"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                            confidentialite.analyseCookies ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Télécharger mes données */}
                    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                      <p className="mb-1 font-medium text-white">Télécharger mes données</p>
                      <p className="mb-4 text-sm text-neutral-400">Obtenez une copie de toutes vos données personnelles</p>
                      {dataDownloadError && (
                        <div className="mb-4 rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-3 text-sm text-red-400">
                          {dataDownloadError}
                        </div>
                      )}
                      <button
                        onClick={handleDownloadData}
                        disabled={downloadingData}
                        className="flex items-center gap-2 rounded-lg border border-white bg-green-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        {downloadingData ? "Téléchargement..." : "Demander mes données"}
                      </button>
                    </div>

                    {/* Zone de danger */}
                    <div className="rounded-lg border border-red-800 bg-red-950 p-4">
                      <p className="mb-1 font-medium text-white">Zone de danger</p>
                      <p className="mb-4 text-sm text-neutral-400">Actions irréversibles concernant votre compte</p>
                      <button className="flex items-center gap-2 rounded-lg border border-white bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Supprimer mon compte
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal Ajouter un mode de paiement */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-950 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Ajouter un mode de paiement</h2>
              <button
                onClick={handleClosePaymentModal}
                className="text-neutral-400 transition-colors hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {paymentError && (
              <div className="mb-4 rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-3 text-sm text-red-400">
                {paymentError}
              </div>
            )}

            <div className="space-y-4">
              {/* Type de carte */}
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">Type de carte</label>
                <select
                  value={cardType}
                  onChange={(e) => setCardType(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="visa">Visa</option>
                  <option value="mastercard">Mastercard</option>
                  <option value="amex">American Express</option>
                  <option value="discover">Discover</option>
                </select>
              </div>

              {/* Numéro de carte */}
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">Numéro de carte</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => {
                    // Formatage automatique avec espaces tous les 4 chiffres
                    const value = e.target.value.replace(/\s/g, "").replace(/\D/g, "");
                    const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
                    setCardNumber(formatted);
                  }}
                  maxLength={19}
                  placeholder="1234 5678 9012 3456"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>

              {/* Nom sur la carte */}
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-300">Nom sur la carte</label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="JEAN DUPONT"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>

              {/* Date d'expiration et CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-300">Date d&apos;expiration</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => {
                      // Formatage automatique MM/YY
                      let value = e.target.value.replace(/\D/g, "");
                      if (value.length >= 2) {
                        value = value.slice(0, 2) + "/" + value.slice(2, 4);
                      }
                      setCardExpiry(value);
                    }}
                    maxLength={5}
                    placeholder="MM/YY"
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-300">CVV</label>
                  <input
                    type="text"
                    value={cardCvv}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setCardCvv(value);
                    }}
                    maxLength={4}
                    placeholder="123"
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Boutons */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleClosePaymentModal}
                className="rounded-lg border border-neutral-800 bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
              >
                Annuler
              </button>
              <button
                onClick={handleAddPaymentMethod}
                disabled={addingPayment}
                className="rounded-lg bg-green-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {addingPayment ? "Ajout..." : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

