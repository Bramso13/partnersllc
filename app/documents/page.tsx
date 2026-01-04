"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { useData } from "@/context/DataContext";
import { supabase } from "@/lib/supabaseClient";
import { emailTemplates } from "@/lib/email";
import { ContactButton } from "@/components/ui/ContactButton";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
};

type Document = {
  id: string;
  dossier_id: string;
  name: string;
  category: "juridique" | "fiscal" | "bancaire" | "autre";
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  status: "en_attente" | "signe" | "valide" | "archive";
  created_at: string;
};

export default function DocumentsPage() {
  const router = useRouter();
  const { user, getUser, signOut } = useAuth();
  const { profile, fetchProfile } = useProfile();
  const data = useData();
  const [loading, setLoading] = useState(true);
  const [dossierId, setDossierId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");
  const [statusMenuOpenId, setStatusMenuOpenId] = useState<string | null>(null);
  const [documentStatuses, setDocumentStatuses] = useState<Array<{ id: string; code: string; label: string; description: string | null; display_order: number }>>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      const currentUser = await getUser();

      if (!currentUser) {
        router.push("/login");
        return;
      }

      const profileData = await fetchProfile(currentUser.id);

      if (!profileData) {
        console.error("Error fetching profile");
        return;
      }

      // Récupérer le dossier_id de l'utilisateur
      const dossier = await data.getDossierByUserId(currentUser.id);

      if (dossier) {
        setDossierId(dossier.id);

        // Charger les documents du dossier
        const { data: documentsData, error: documentsError } = await data.getDocumentsByDossierId(dossier.id);

        if (documentsError) {
          console.error("Error fetching documents:", documentsError);
        } else {
          setDocuments(documentsData || []);
        }
      }

      // Charger les statuts disponibles
      const { data: statusesData, error: statusesError } = await data.getAllDocumentStatuses();
      if (statusesError) {
        console.error("Error fetching document statuses:", statusesError);
      } else if (statusesData) {
        setDocumentStatuses(statusesData);
      }

      setLoading(false);
    }

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fermer le menu de statut quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusMenuOpenId && !(event.target as Element).closest('.status-menu-container')) {
        setStatusMenuOpenId(null);
      }
    };

    if (statusMenuOpenId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [statusMenuOpenId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-900">
        <p className="text-neutral-500">Chargement...</p>
      </div>
    );
  }

  const userName =
    profile?.full_name || profile?.email?.split("@")[0] || "Utilisateur";

  const handleLogout = async () => {
    await signOut();
  };

  const handleStatusChange = async (documentId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const { error } = await data.updateDocument(documentId, { status: newStatus as Document["status"] });

      if (error) {
        console.error("Error updating document status:", error);
        alert("Erreur lors de la mise à jour du statut. Veuillez réessayer.");
        return;
      }

      // Mettre à jour le document dans la liste locale
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === documentId ? { ...doc, status: newStatus as Document["status"] } : doc
        )
      );

      // Si le document est validé et qu'on a un dossier_id, vérifier si c'est un document de l'étape 4
      if (newStatus === "valide" && dossierId) {
        try {
          // Récupérer l'étape 4
          const { data: step4Info } = await data.getStepByNumber(4);
          
          if (step4Info?.id) {
            const { data: step4Data } = await data.getDossierStep(dossierId, step4Info.id);
            
            if (step4Data?.content && typeof step4Data.content === 'object' && 'documents' in step4Data.content) {
              const step4Documents = Array.isArray(step4Data.content.documents) ? step4Data.content.documents : [];
              
              // Vérifier si tous les documents de l'étape 4 sont validés
              const allDocuments = documents.map(doc => 
                doc.id === documentId ? { ...doc, status: newStatus as Document["status"] } : doc
              );
              
              const step4Docs = allDocuments.filter(doc => step4Documents.includes(doc.id));
              const allValidated = step4Docs.length > 0 && step4Docs.every(doc => doc.status === "valide");
              
              if (allValidated && step4Data.status !== "validated") {
                // Tous les documents sont validés, envoyer un email de félicitations
                try {
                  // Récupérer les informations du dossier pour l'email
                  if (!profile?.id) {
                    console.error("Profile non disponible pour l'envoi de l'email");
                    return;
                  }
                  const dossier = await data.getDossierByUserId(profile.id);
                  if (dossier) {
                    const userName = dossier.first_name && dossier.last_name 
                      ? `${dossier.first_name} ${dossier.last_name}`
                      : dossier.first_name || dossier.last_name || 'Cher client';
                    const llcName = dossier.llc_name || 'votre LLC';
                    const userEmail = dossier.email || profile.email;

                    if (userEmail) {
                      const template = emailTemplates.step4Validated(userName, llcName);
                      
                      // Envoyer l'email via la route API (côté serveur)
                      const emailResponse = await fetch('/api/send-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          to: userEmail,
                          ...template,
                        }),
                      });

                      if (emailResponse.ok) {
                        // Si l'email est envoyé avec succès, mettre l'étape 4 en "validated"
                        const { error: stepError } = await data.upsertDossierStep(dossierId, step4Info.id, "validated", step4Data.content);
                        
                        if (stepError) {
                          console.error("Erreur lors de la validation de l'étape 4:", stepError);
                        }
                      } else {
                        const errorData = await emailResponse.json();
                        console.error("Erreur lors de l'envoi de l'email:", errorData.error);
                        // Mettre quand même l'étape en validated même si l'email échoue
                        const { error: stepError } = await data.upsertDossierStep(dossierId, step4Info.id, "validated", step4Data.content);
                        if (stepError) {
                          console.error("Erreur lors de la validation de l'étape 4:", stepError);
                        }
                      }
                    } else {
                      // Pas d'email, mettre quand même l'étape en validated
                      const { error: stepError } = await data.upsertDossierStep(dossierId, step4Info.id, "validated", step4Data.content);
                      if (stepError) {
                        console.error("Erreur lors de la validation de l'étape 4:", stepError);
                      }
                    }
                  } else {
                    // Pas de dossier, mettre quand même l'étape en validated
                    const { error: stepError } = await data.upsertDossierStep(dossierId, step4Info.id, "validated", step4Data.content);
                    if (stepError) {
                      console.error("Erreur lors de la validation de l'étape 4:", stepError);
                    }
                  }
                } catch (emailError) {
                  console.error("Erreur lors de l'envoi de l'email:", emailError);
                  // Mettre quand même l'étape en validated même si l'email échoue
                  const { error: stepError } = await data.upsertDossierStep(dossierId, step4Info.id, "validated", step4Data.content);
                  if (stepError) {
                    console.error("Erreur lors de la validation de l'étape 4:", stepError);
                  }
                }
              }
            }
          }
        } catch (stepError) {
          console.error("Erreur lors de la vérification de l'étape 4:", stepError);
          // Ne pas bloquer l'action si la vérification échoue
        }
      }

      // Fermer le menu
      setStatusMenuOpenId(null);
    } catch (error) {
      console.error("Error updating document status:", error);
      alert("Erreur lors de la mise à jour du statut. Veuillez réessayer.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleOpenUpload = () => {
    setUploadError(null);
    setIsUploadOpen(true);
  };

  const handleCloseUpload = () => {
    if (uploading) return;
    setIsUploadOpen(false);
  };

  const uploadDocumentToStorage = async (file: File, path: string): Promise<{ url: string | null; error: string | null }> => {
    try {
      const { data: uploadData, error } = await data.uploadToStorage("documents", path, file);

      if (error) {
        console.error("Erreur upload complète:", error);
        console.error("Message d'erreur:", error.message);
        
        // Vérifier différents types d'erreurs
        const errorMessage = error.message?.toLowerCase() || "";
        
        if (errorMessage.includes("bucket not found") || errorMessage.includes("not found")) {
          return {
            url: null,
            error: `Le bucket "documents" n'existe pas. Allez dans Supabase Dashboard → Storage → New bucket → Nom: "documents" → Public: Non → Créer.`,
          };
        }
        
        if (errorMessage.includes("row-level security") || errorMessage.includes("rls") || errorMessage.includes("policy")) {
          return {
            url: null,
            error: `Erreur de permissions. Vérifiez que les politiques RLS du bucket "documents" sont configurées. Allez dans SQL Editor et exécutez le script de configuration des politiques.`,
          };
        }
        
        if (errorMessage.includes("unauthorized")) {
          return {
            url: null,
            error: `Erreur d'authentification. Veuillez vous reconnecter.`,
          };
        }
        
        return { 
          url: null, 
          error: `Erreur: ${error.message || "Erreur inconnue lors de l'upload"}` 
        };
      }

      if (!uploadData) {
        return { url: null, error: "Aucune donnée retournée après l'upload" };
      }

      const publicUrl = data.getPublicUrl("documents", uploadData.path);
      return { url: publicUrl, error: null };
    } catch (err: any) {
      console.error("Erreur lors de l'upload:", err);
      return { url: null, error: err?.message || "Erreur inconnue lors de l'upload" };
    }
  };

  const handleUploadSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploadError(null);
    setUploading(true);

    if (!dossierId) {
      setUploadError("Aucun dossier trouvé. Veuillez d'abord créer un dossier LLC.");
      setUploading(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const fileInput = formData.get("file") as File | null;

    if (!name || !category || !fileInput) {
      setUploadError("Veuillez remplir tous les champs.");
      setUploading(false);
      return;
    }

    // Vérifier la taille du fichier (10 Mo max)
    if (fileInput.size > 10 * 1024 * 1024) {
      setUploadError("La taille du fichier ne doit pas dépasser 10 Mo.");
      setUploading(false);
      return;
    }

    try {
      // Upload du fichier vers Supabase Storage
      const fileExtension = fileInput.name.split(".").pop() || "pdf";
      const filePath = `${dossierId}/${Date.now()}-${fileInput.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      
      const { url: fileUrl, error: uploadError } = await uploadDocumentToStorage(fileInput, filePath);

      if (uploadError || !fileUrl) {
        setUploadError(uploadError || "Erreur lors du téléversement du fichier.");
        setUploading(false);
        return;
      }

      // Enregistrer le document dans la base de données
      const { data: newDocument, error: insertError } = await data.createDocument({
        dossier_id: dossierId,
        name: name,
        category: category as "juridique" | "fiscal" | "bancaire" | "autre",
        file_url: fileUrl,
        file_size: fileInput.size,
        file_type: fileInput.type || fileExtension,
        status: "en_attente",
      });

      if (insertError) {
        setUploadError(insertError.message || "Erreur lors de l'enregistrement du document.");
        setUploading(false);
        return;
      }

      // Ajouter le nouveau document à la liste
      if (newDocument) {
        setDocuments((prev) => [newDocument, ...prev]);
      }

      setIsUploadOpen(false);
      // Réinitialiser le formulaire
      event.currentTarget.reset();
    } catch (error: any) {
      setUploadError(error?.message || "Une erreur est survenue lors du téléversement.");
    } finally {
      setUploading(false);
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
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
                className="flex items-center gap-3 rounded-lg bg-green-500/20 px-3 py-2.5 text-green-400 transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="font-medium">Documents</span>
              </Link>
              <Link
                href="/mon-entreprise"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span>Mon entreprise</span>
              </Link>
              <Link
                href="/partners-hub"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-white"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
          <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <p className="mb-1 text-sm font-semibold">Besoin d&apos;aide ?</p>
            <p className="mb-4 text-xs leading-relaxed text-neutral-400">
              Contactez votre conseiller dédié pour toute question.
            </p>
            <ContactButton dossierId={dossierId} />
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
                placeholder="Q Rechercher dans vos documents..."
                className="mx-auto block w-full max-w-md rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs lg:px-4 lg:py-2.5 lg:text-sm text-white placeholder:text-neutral-500 focus:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>

            {/* Right Side - Notifications and Profile */}
            <div className="flex items-center gap-3 lg:gap-6">
              <button className="text-neutral-400 transition-colors hover:text-white">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
                <button
                  onClick={handleLogout}
                  className="rounded-md border border-neutral-700 px-2 py-1 text-[10px] lg:px-3 lg:py-1 lg:text-xs font-medium text-neutral-300 transition-colors hover:border-red-500 hover:bg-red-500/10 hover:text-red-400"
                >
                  <span className="hidden sm:inline">Se déconnecter</span>
                  <span className="sm:hidden">Déco</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-900 p-8">
          <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold">Vos Documents</h1>
              <p className="mt-2 text-xs lg:text-sm text-neutral-400">
                Gérez et accédez à tous vos documents légaux et administratifs.
              </p>
            </div>
            <button
              onClick={handleOpenUpload}
              className="rounded-lg bg-green-500 px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-green-600 self-start sm:self-auto"
            >
              Téléverser un document
            </button>
          </div>

          {/* Tabs */}
          <div className="mb-4 flex gap-2 text-xs">
            <button
              onClick={() => setSelectedCategory("Tous")}
              className={`rounded-full px-4 py-2 font-medium transition-colors ${
                selectedCategory === "Tous"
                  ? "bg-neutral-800 text-white"
                  : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setSelectedCategory("juridique")}
              className={`rounded-full px-4 py-2 transition-colors ${
                selectedCategory === "juridique"
                  ? "bg-neutral-800 text-white"
                  : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
              }`}
            >
              Juridique
            </button>
            <button
              onClick={() => setSelectedCategory("fiscal")}
              className={`rounded-full px-4 py-2 transition-colors ${
                selectedCategory === "fiscal"
                  ? "bg-neutral-800 text-white"
                  : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
              }`}
            >
              Fiscal
            </button>
            <button
              onClick={() => setSelectedCategory("bancaire")}
              className={`rounded-full px-4 py-2 transition-colors ${
                selectedCategory === "bancaire"
                  ? "bg-neutral-800 text-white"
                  : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
              }`}
            >
              Bancaire
            </button>
            <button
              onClick={() => setSelectedCategory("archive")}
              className={`rounded-full px-4 py-2 transition-colors ${
                selectedCategory === "archive"
                  ? "bg-neutral-800 text-white"
                  : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
              }`}
            >
              Archives
            </button>
          </div>

          {/* Table header */}
          <div className="mb-2 flex items-center rounded-t-lg bg-neutral-950/80 px-4 py-3 text-xs text-neutral-500">
            <div className="w-1/2">NOM DU DOCUMENT</div>
            <div className="w-1/4">DATE D&apos;AJOUT</div>
            <div className="w-1/6">STATUT</div>
            <div className="flex-1 text-right">ACTIONS</div>
          </div>

          {/* Rows */}
          <div className="space-y-1 rounded-b-lg bg-neutral-950/80">
            {documents.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-neutral-400">
                Aucun document pour le moment. Téléversez votre premier document pour commencer.
              </div>
            ) : (
              documents
                .filter((doc) => {
                  if (selectedCategory === "Tous") return true;
                  if (selectedCategory === "archive") return doc.status === "archive";
                  return doc.category === selectedCategory;
                })
                .map((doc) => {
                  const formatFileSize = (bytes: number | null) => {
                    if (!bytes) return "Taille inconnue";
                    if (bytes < 1024) return `${bytes} B`;
                    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                  };

                  const formatDate = (dateString: string) => {
                    const date = new Date(dateString);
                    return date.toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    });
                  };

                  const getStatusLabel = (status: string) => {
                    switch (status) {
                      case "signe":
                        return "Signé";
                      case "valide":
                        return "Validé";
                      case "archive":
                        return "Archivé";
                      default:
                        return "En attente";
                    }
                  };

                  const getStatusColor = (status: string): "green" | "yellow" | "neutral" => {
                    switch (status) {
                      case "signe":
                      case "valide":
                        return "green";
                      case "archive":
                        return "neutral";
                      default:
                        return "yellow";
                    }
                  };

                  const getCategoryColor = (category: string): "red" | "teal" | "green" | "indigo" | "blue" => {
                    switch (category) {
                      case "juridique":
                        return "red";
                      case "fiscal":
                        return "green";
                      case "bancaire":
                        return "indigo";
                      default:
                        return "blue";
                    }
                  };

                  const getCategoryLabel = (category: string) => {
                    switch (category) {
                      case "juridique":
                        return "Juridique";
                      case "fiscal":
                        return "Fiscal";
                      case "bancaire":
                        return "Bancaire";
                      default:
                        return "Autre";
                    }
                  };

                  // Extraire le chemin du fichier depuis l'URL
                  const getFilePathFromUrl = (url: string) => {
                    try {
                      const urlObj = new URL(url);
                      // Extraire le chemin après le bucket name
                      const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/documents\/(.+)/);
                      return pathMatch ? pathMatch[1] : null;
                    } catch {
                      return null;
                    }
                  };

                  const filePath = getFilePathFromUrl(doc.file_url);
                  
                  return (
                    <DocumentRow
                      key={doc.id}
                      color={getCategoryColor(doc.category)}
                      title={doc.name}
                      subtitle={`${getCategoryLabel(doc.category)} • ${formatFileSize(doc.file_size)}`}
                      date={formatDate(doc.created_at)}
                      statusLabel={getStatusLabel(doc.status)}
                      statusColor={getStatusColor(doc.status)}
                      fileUrl={doc.file_url}
                      filePath={filePath}
                      documentId={doc.id}
                      currentStatus={doc.status}
                      statuses={documentStatuses}
                      isMenuOpen={statusMenuOpenId === doc.id}
                      onStatusClick={() => setStatusMenuOpenId(statusMenuOpenId === doc.id ? null : doc.id)}
                      onStatusChange={(newStatus) => handleStatusChange(doc.id, newStatus)}
                      onCloseMenu={() => setStatusMenuOpenId(null)}
                    />
                  );
                })
            )}
          </div>
        </main>
      </div>

      {/* Modal Téléverser un document */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Téléverser un document
                </h2>
                <p className="mt-1 text-xs text-neutral-400">
                  Ajoutez un nouveau document à votre espace PARTNERS.
                </p>
              </div>
              <button
                onClick={handleCloseUpload}
                className="text-neutral-500 hover:text-neutral-300"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {uploadError && (
              <div className="mb-3 rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-xs font-medium text-neutral-300">
                  Nom du document
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Ex : Certificate of Formation"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-medium text-neutral-300">
                  Catégorie
                </label>
                <select
                  name="category"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  defaultValue="juridique"
                >
                  <option value="juridique">Juridique</option>
                  <option value="fiscal">Fiscal</option>
                  <option value="bancaire">Bancaire</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-medium text-neutral-300">
                  Fichier
                </label>
                <input
                  type="file"
                  name="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="w-full text-xs text-neutral-300 file:mr-3 file:rounded-md file:border-0 file:bg-green-500 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-green-600"
                />
                <p className="mt-1 text-[11px] text-neutral-500">
                  Formats acceptés : PDF, PNG, JPG. Taille max 10 Mo.
                </p>
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseUpload}
                  disabled={uploading}
                  className="rounded-lg border border-neutral-700 px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 disabled:opacity-60"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="rounded-lg bg-green-500 px-4 py-2 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-60"
                >
                  {uploading ? "Téléversement..." : "Téléverser"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

type DocumentRowProps = {
  color: "red" | "teal" | "green" | "indigo" | "blue";
  title: string;
  subtitle: string;
  date: string;
  statusLabel: string;
  statusColor: "green" | "yellow" | "neutral";
  fileUrl?: string;
  filePath?: string | null;
  documentId: string;
  currentStatus: string;
  statuses: Array<{ id: string; code: string; label: string; description: string | null; display_order: number }>;
  isMenuOpen: boolean;
  onStatusClick: () => void;
  onStatusChange: (newStatus: string) => void;
  onCloseMenu: () => void;
};

function DocumentRow({
  color,
  title,
  subtitle,
  date,
  statusLabel,
  statusColor,
  fileUrl,
  filePath,
  documentId,
  currentStatus,
  statuses,
  isMenuOpen,
  onStatusClick,
  onStatusChange,
  onCloseMenu,
}: DocumentRowProps) {
  const handleDownload = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!filePath) {
      // Si pas de filePath, essayer avec fileUrl directement
      if (fileUrl) {
        window.open(fileUrl, "_blank");
      }
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(filePath, 60);

      if (error) {
        console.error("Error creating signed URL:", error);
        // Fallback: essayer avec l'URL directe
        if (fileUrl) {
          window.open(fileUrl, "_blank");
        }
        return;
      }

      if (data?.signedUrl) {
        const link = document.createElement("a");
        link.href = data.signedUrl;
        link.download = title;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Error downloading file:", err);
      // Fallback: essayer avec l'URL directe
      if (fileUrl) {
        window.open(fileUrl, "_blank");
      }
    }
  };
  const colorMap: Record<DocumentRowProps["color"], string> = {
    red: "bg-red-500",
    teal: "bg-teal-500",
    green: "bg-green-500",
    indigo: "bg-indigo-500",
    blue: "bg-blue-500",
  };

  const statusBg: Record<DocumentRowProps["statusColor"], string> = {
    green: "bg-green-500/20 text-green-400",
    yellow: "bg-yellow-500/20 text-yellow-300",
    neutral: "bg-neutral-700/60 text-neutral-200",
  };

  return (
    <div className="flex items-center border-t border-neutral-800 px-4 py-3 text-xs">
      <div className="flex w-1/2 items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorMap[color]}`}
        >
          <svg
            className="h-4 w-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div>
          <p className="font-medium text-white">{title}</p>
          <p className="text-[11px] text-neutral-400">{subtitle}</p>
        </div>
      </div>
      <div className="w-1/4 text-neutral-400">{date}</div>
      <div className="relative w-1/6 status-menu-container">
        <button
          onClick={onStatusClick}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition-colors hover:opacity-80 ${statusBg[statusColor]} cursor-pointer`}
          title="Cliquer pour changer le statut"
        >
          {statusLabel}
          <svg
            className="h-3 w-3 text-neutral-500"
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

        {isMenuOpen && (
          <div className="absolute right-0 top-8 z-20 w-56 rounded-lg border border-neutral-800 bg-neutral-950 p-1 shadow-xl">
            {statuses.map((status) => {
              const isSelected = currentStatus === status.code;
              const getStatusDotColor = (code: string) => {
                switch (code) {
                  case "signe":
                  case "valide":
                    return "bg-green-400";
                  case "archive":
                    return "bg-neutral-400";
                  default:
                    return "bg-yellow-400";
                }
              };

              return (
                <button
                  key={status.id}
                  type="button"
                  onClick={() => onStatusChange(status.code)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-xs text-neutral-200 hover:bg-neutral-800"
                >
                  <div className="text-left">
                    <span>{status.label}</span>
                    {status.description && (
                      <p className="mt-0.5 text-[10px] text-neutral-400">{status.description}</p>
                    )}
                  </div>
                  {isSelected && (
                    <span className={`h-2 w-2 rounded-full ${getStatusDotColor(status.code)}`}></span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="flex flex-1 justify-end gap-2 text-neutral-400">
        {filePath && (
          <button
            onClick={handleDownload}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700"
            title="Télécharger"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 12l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
        )}
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12H9m12-4a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v.01M12 12v.01M12 18v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 6a1 1 0 110-2 1 1 0 010 2zm0 6a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}


