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
  role: string;
};

export default function SupportPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);
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

  const handleOpenTicket = () => {
    setTicketError(null);
    setIsTicketOpen(true);
  };

  const handleCloseTicket = () => {
    if (creatingTicket) return;
    setIsTicketOpen(false);
  };

  const handleTicketSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTicketError(null);
    setCreatingTicket(true);

    // Ici on pourra connecter Supabase pour enregistrer le ticket.
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsTicketOpen(false);
    } catch (error) {
      setTicketError("Une erreur est survenue lors de la création du ticket.");
    } finally {
      setCreatingTicket(false);
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
                className="flex items-center gap-3 rounded-lg bg-green-500/20 px-3 py-2.5 text-green-400 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span className="font-medium">Support</span>
              </Link>
              <Link
                href="/parametres"
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

            {/* Right Side - Profile and Button */}
            <div className="flex items-center gap-3 lg:gap-6">
              <div className="hidden sm:flex items-center gap-2 lg:gap-3">
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
              <button
                onClick={handleOpenTicket}
                className="rounded-lg bg-green-500 px-3 py-2 lg:px-4 lg:py-2.5 text-xs lg:text-sm font-medium text-white transition-colors hover:bg-green-600"
              >
                <span className="hidden sm:inline">+ Ouvrir un ticket</span>
                <span className="sm:hidden">+ Ticket</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-900 p-4 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-8">
              <div className="mb-6 lg:mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold">Support & Assistance</h1>
                <p className="mt-2 text-sm lg:text-base text-neutral-400">
                  Trouvez les réponses à vos questions ou contactez notre équipe.
                </p>
              </div>

              {/* FAQ Section */}
              <div className="mb-6 lg:mb-8">
                <h2 className="mb-4 text-lg lg:text-xl font-semibold">Questions Fréquentes (FAQ)</h2>
                <div className="space-y-2">
                  {[
                    "Comment obtenir mon numéro EIN?",
                    "Quelles sont mes obligations fiscales annuelles?",
                    "Comment ouvrir un compte bancaire professionnel US?",
                    "Puis-je modifier les informations de ma LLC?",
                  ].map((question, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-neutral-800 bg-neutral-950"
                    >
                      <button
                        onClick={() => setOpenFaq(openFaq === index ? null : index)}
                        className="flex w-full items-center justify-between p-4 text-left"
                      >
                        <span className="font-medium text-white">{question}</span>
                        <svg
                          className={`h-5 w-5 text-neutral-400 transition-transform ${
                            openFaq === index ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {openFaq === index && (
                        <div className="border-t border-neutral-800 p-4 text-sm text-neutral-400">
                          Réponse à la question...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Historique Section */}
              <div>
                <div className="rounded-xl border border-neutral-800 bg-neutral-950">
                  <div className="border-b border-neutral-800 p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg lg:text-xl font-semibold">Historique de vos demandes</h2>
                      <a href="#" className="text-sm text-green-400 hover:text-green-300">
                        Voir tout
                      </a>
                    </div>
                  </div>
                  <div className="overflow-x-auto p-4 lg:p-6">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-neutral-800">
                          <th className="pb-4 pt-2 pl-6 pr-6 text-left text-xs font-semibold uppercase text-neutral-400">
                            TICKET ID
                          </th>
                          <th className="pb-4 pt-2 pl-6 pr-6 text-left text-xs font-semibold uppercase text-neutral-400">
                            SUJET
                          </th>
                          <th className="pb-4 pt-2 pl-6 pr-6 text-left text-xs font-semibold uppercase text-neutral-400">
                            DATE
                          </th>
                          <th className="pb-4 pt-2 pl-6 pr-6 text-left text-xs font-semibold uppercase text-neutral-400">
                            STATUT
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800">
                        <tr>
                          <td className="py-5 pl-6 pr-6 text-sm font-medium">#72415</td>
                          <td className="py-5 pl-6 pr-6 text-sm text-neutral-300">
                            Question sur le rapport annuel
                          </td>
                          <td className="py-5 pl-6 pr-6 text-sm text-neutral-400">14 Déc 2025</td>
                          <td className="py-5 pl-6 pr-6">
                            <span className="rounded-full bg-purple-500/20 px-2 py-1 text-xs font-medium text-purple-400">
                              RÉSOLU
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-5 pl-6 pr-6 text-sm font-medium">#72598</td>
                          <td className="py-5 pl-6 pr-6 text-sm text-neutral-300">Aide pour la facturation</td>
                          <td className="py-5 pl-6 pr-6 text-sm text-neutral-400">20 Nov 2025</td>
                          <td className="py-5 pl-6 pr-6">
                            <span className="rounded-full bg-purple-500/20 px-2 py-1 text-xs font-medium text-purple-400">
                              RÉSOLU
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-5 pl-6 pr-6 text-sm font-medium">#72881</td>
                          <td className="py-5 pl-6 pr-6 text-sm text-neutral-300">
                            Demande de Certificat de Good Standing
                          </td>
                          <td className="py-5 pl-6 pr-6 text-sm text-neutral-400">15 Nov 2025</td>
                          <td className="py-5 pl-6 pr-6">
                            <span className="rounded-full bg-purple-500/20 px-2 py-1 text-xs font-medium text-purple-400">
                              RÉSOLU
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Advisor */}
            <div className="lg:col-span-4">
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
                <h2 className="mb-4 text-lg lg:text-xl font-semibold">Votre Conseiller Dédié</h2>
                <div className="mb-4 flex flex-col items-center text-center">
                  <div className="mb-4 h-20 w-20 rounded-full bg-gradient-to-br from-green-400 to-green-600"></div>
                  <h3 className="text-lg font-semibold">Sophie Lemaire</h3>
                  <p className="mt-1 text-sm text-neutral-400">Spécialiste LLC Non-résident</p>
                </div>
                <p className="mb-6 text-center text-sm italic text-neutral-400">
                  &quot;Je suis là pour vous accompagner à chaque étape. N&apos;hésitez pas à me
                  contacter pour toute question.&quot;
                </p>
                <div className="space-y-3">
                  <button className="w-full rounded-lg bg-green-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      <span>Envoyer un message</span>
                    </div>
                  </button>
                  <button className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>Planifier un appel</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Ouvrir un ticket */}
      {isTicketOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Ouvrir un ticket</h2>
                <p className="mt-1 text-xs text-neutral-400">
                  Décrivez votre problème pour que notre équipe puisse vous aider au plus vite.
                </p>
              </div>
              <button
                onClick={handleCloseTicket}
                className="text-neutral-500 hover:text-neutral-300"
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

            {ticketError && (
              <div className="mb-3 rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {ticketError}
              </div>
            )}

            <form onSubmit={handleTicketSubmit} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-xs font-medium text-neutral-300">Objet</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Ex : Question sur mon rapport annuel"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-medium text-neutral-300">Type de demande</label>
                <select
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  defaultValue="support"
                >
                  <option value="support">Support général</option>
                  <option value="facturation">Facturation</option>
                  <option value="juridique">Question juridique</option>
                  <option value="llc">Mon dossier LLC</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-medium text-neutral-300">Description</label>
                <textarea
                  required
                  rows={4}
                  className="w-full resize-none rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Expliquez votre situation, les étapes déjà réalisées et les éventuels messages d’erreur..."
                />
                <p className="mt-1 text-[11px] text-neutral-500">
                  Ne partagez pas de données bancaires complètes ou de mots de passe dans ce formulaire.
                </p>
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseTicket}
                  disabled={creatingTicket}
                  className="rounded-lg border border-neutral-700 px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 disabled:opacity-60"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket}
                  className="rounded-lg bg-green-500 px-4 py-2 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-60"
                >
                  {creatingTicket ? "Création du ticket..." : "Créer le ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}