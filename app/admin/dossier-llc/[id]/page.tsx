'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { useData } from '@/context/DataContext';
import { emailTemplates } from '@/lib/email';

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
};

type Dossier = {
  id: string;
  llc_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  structure: string | null;
  status: string | null;
  created_at: string | null;
};

type Associate = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
};

type DossierStep = {
  id: string;
  dossier_id: string;
  step_id: string;
  status: string;
  content: {
    client?: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      address: string;
      llcName: string;
      structure: string;
    };
    associates?: Array<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      address: string;
    }>;
  } | string[] | null; // Peut être un objet (step1) ou un tableau de strings (step2 images)
  completed_at: string | null;
};

export default function DossierLLCDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const dossierId = typeof params?.id === 'string' ? params.id : undefined;
  const { getUser, signOut } = useAuth();
  const { profile, fetchProfile } = useProfile();
  const data = useData();
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [dossierStep1, setDossierStep1] = useState<DossierStep | null>(null);
  const [dossierStep2, setDossierStep2] = useState<DossierStep | null>(null);
  const [step2Images, setStep2Images] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Array<{ id: string; name: string; category: string; file_url: string; status: string; created_at: string }>>([]);
  const [allSteps, setAllSteps] = useState<Array<{ id: string; step_number: number; name: string; description: string | null; order_index: number | null; role: string | null }>>([]);
  const [allDossierSteps, setAllDossierSteps] = useState<Map<string, DossierStep>>(new Map());
  const [updatingStep, setUpdatingStep] = useState<string | null>(null);
  const [isStep4UploadOpen, setIsStep4UploadOpen] = useState(false);
  const [step4StepId, setStep4StepId] = useState<string | null>(null);
  const [step4Uploading, setStep4Uploading] = useState(false);
  const [step4UploadError, setStep4UploadError] = useState<string | null>(null);
  const [isStep4ConfirmModalOpen, setIsStep4ConfirmModalOpen] = useState(false);
  const [step4DocumentsCount, setStep4DocumentsCount] = useState(0);
  const step4FormRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (!dossierId) return;

    // Créer une constante locale pour TypeScript
    const currentDossierId = dossierId;

    async function load() {
      const user = await getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const currentProfile = await fetchProfile(user.id);

      if (!currentProfile || currentProfile.role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      const { data: dossierData, error: dossierError } = await data.getDossierById(currentDossierId);

      if (dossierError || !dossierData) {
        setLoading(false);
        return;
      }

      const typedDossier = dossierData as Dossier;
      setDossier(typedDossier);

      // Charger toutes les étapes (user + admin) pour l'admin
      const { data: allStepsData } = await data.getAllSteps("admin");
      if (allStepsData) {
        // Trier par order_index
        const sorted = [...allStepsData].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        setAllSteps(sorted);
      }

      // Charger tous les statuts des étapes du dossier
      const { data: allDossierStepsData } = await data.getAllDossierSteps(typedDossier.id);
      if (allDossierStepsData) {
        const stepsMap = new Map<string, DossierStep>();
        allDossierStepsData.forEach((ds: any) => {
          // La structure retournée par getAllDossierSteps inclut llc_steps en jointure
          const stepId = ds.step_id || (ds.llc_steps && typeof ds.llc_steps === 'object' ? ds.llc_steps.id : null);
          if (stepId) {
            // Extraire seulement les champs de DossierStep (sans llc_steps)
            const dossierStep: DossierStep = {
              id: ds.id,
              dossier_id: ds.dossier_id,
              step_id: stepId,
              status: ds.status,
              content: ds.content,
              completed_at: ds.completed_at,
            };
            stepsMap.set(stepId, dossierStep);
          }
        });
        setAllDossierSteps(stepsMap);
      }

      // Récupérer les IDs des étapes 1 et 2 (pour compatibilité avec le code existant)
      const { data: step1Info } = await data.getStepByNumber(1);

      const { data: step2Info } = await data.getStepByNumber(2);

      // Charger l'étape 1 d'abord pour avoir toutes les données
      let step1ContentData: any = null;
      if (step1Info?.id) {
        const { data: step1Data } = await data.getDossierStep(typedDossier.id, step1Info.id);

        if (step1Data) {
          setDossierStep1(step1Data as DossierStep);
          
          // Extraire le content de l'étape 1
          if (step1Data.content && typeof step1Data.content === 'object' && !Array.isArray(step1Data.content)) {
            step1ContentData = step1Data.content;
          }
        }
      }

      // Charger les associés depuis la table llc_associates (source principale)
      const { data: assocData, error: assocError } = await data.getAssociatesByDossierId(typedDossier.id);
      
      if (assocError) {
        console.error("Erreur lors du chargement des associés depuis llc_associates:", assocError);
      }
      
      // Si on a des associés dans la table, on les utilise
      if (assocData && Array.isArray(assocData) && assocData.length > 0) {
        console.log("Associés chargés depuis llc_associates:", assocData.length);
        setAssociates(assocData as Associate[]);
      } else {
        // Fallback : charger depuis le JSON de llc_dossier_steps
        if (step1ContentData?.associates && Array.isArray(step1ContentData.associates) && step1ContentData.associates.length > 0) {
          console.log("Associés chargés depuis llc_dossier_steps (JSON):", step1ContentData.associates.length);
          const associatesFromStep = step1ContentData.associates.map((assoc: any, index: number) => ({
            id: `step-assoc-${index}`,
            first_name: assoc.firstName || assoc.first_name || null,
            last_name: assoc.lastName || assoc.last_name || null,
            email: assoc.email || null,
            phone: assoc.phone || null,
            address: assoc.address || null,
          }));
          setAssociates(associatesFromStep);
        } else {
          console.log("Aucun associé trouvé dans llc_associates ni dans llc_dossier_steps");
          setAssociates([]);
        }
      }

      // Charger l'étape 2
      if (step2Info?.id) {
        const { data: step2Data } = await data.getDossierStep(typedDossier.id, step2Info.id);

        if (step2Data) {
          setDossierStep2(step2Data as DossierStep);

          // Charger les images depuis le content de l'étape 2
          // Le content peut être un objet avec une propriété "images" ou directement un tableau
          let images: string[] = [];
          
          if (step2Data.content) {
            if (Array.isArray(step2Data.content)) {
              images = step2Data.content as string[];
            } else if (typeof step2Data.content === 'object' && 'images' in step2Data.content) {
              const contentObj = step2Data.content as any;
              if (Array.isArray(contentObj.images)) {
                images = contentObj.images;
              }
            }
          }

          if (images.length > 0) {
            setStep2Images(images);
          } else {
            // Fallback : charger depuis llc_identity_images
            const { data: imagesData } = await data.getIdentityImagesByDossierId(typedDossier.id);

            if (imagesData && imagesData.length > 0) {
              setStep2Images(imagesData.map((img: any) => img.image_url));
            }
          }
        } else {
          // Fallback : charger depuis llc_identity_images même si pas de dossier_steps
          const { data: imagesData } = await data.getIdentityImagesByDossierId(typedDossier.id);

          if (imagesData && imagesData.length > 0) {
            setStep2Images(imagesData.map((img: any) => img.image_url));
          }
        }
      }

      // Charger les documents du dossier
      if (typedDossier) {
        const { data: documentsData, error: documentsError } = await data.getDocumentsByDossierId(typedDossier.id);
        if (documentsError) {
          console.error("Error fetching documents:", documentsError);
        } else {
          setDocuments(documentsData || []);
        }
      }

      setLoading(false);
    }

    load();
  }, [dossierId, router, getUser, fetchProfile, data]);

  const uploadDocumentToStorage = async (file: File, path: string): Promise<{ url: string | null; error: string | null }> => {
    try {
      const { data: uploadData, error } = await data.uploadToStorage("documents", path, file);

      if (error) {
        console.error("Erreur upload:", error);
        return { url: null, error: error.message || "Erreur lors de l'upload" };
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

    if (!dossierId || !dossier) {
      setUploadError("Aucun dossier trouvé.");
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

  const handleStep4UploadSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStep4UploadError(null);
    setStep4Uploading(true);

    if (!dossierId || !dossier || !step4StepId) {
      setStep4UploadError("Données manquantes.");
      setStep4Uploading(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const fileInput = formData.get("file") as File | null;

    if (!name || !category || !fileInput) {
      setStep4UploadError("Veuillez remplir tous les champs.");
      setStep4Uploading(false);
      return;
    }

    // Vérifier la taille du fichier (10 Mo max)
    if (fileInput.size > 10 * 1024 * 1024) {
      setStep4UploadError("La taille du fichier ne doit pas dépasser 10 Mo.");
      setStep4Uploading(false);
      return;
    }

    try {
      // Upload du fichier vers Supabase Storage
      const fileExtension = fileInput.name.split(".").pop() || "pdf";
      const filePath = `${dossierId}/${Date.now()}-${fileInput.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      
      const { url: fileUrl, error: uploadError } = await uploadDocumentToStorage(fileInput, filePath);

      if (uploadError || !fileUrl) {
        setStep4UploadError(uploadError || "Erreur lors du téléversement du fichier.");
        setStep4Uploading(false);
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
        setStep4UploadError(insertError.message || "Erreur lors de l'enregistrement du document.");
        setStep4Uploading(false);
        return;
      }

      // Récupérer les documents existants de l'étape 4
      const { data: currentStep4 } = await data.getDossierStep(dossierId, step4StepId);
      const step4Content = currentStep4?.content || {};
      const step4Documents = Array.isArray(step4Content.documents) ? step4Content.documents : [];
      
      // Ajouter le nouveau document à la liste (vérifier que newDocument existe)
      if (!newDocument || !newDocument.id) {
        setStep4UploadError("Erreur : le document n'a pas pu être créé.");
        setStep4Uploading(false);
        return;
      }
      const updatedDocuments = [...step4Documents, newDocument.id];

      // Mettre à jour l'étape 4 avec les documents
      const { error: stepError } = await data.upsertDossierStep(
        dossierId,
        step4StepId,
        "complete",
        { documents: updatedDocuments }
      );

      if (stepError) {
        setStep4UploadError(stepError.message || "Erreur lors de la mise à jour de l'étape.");
        setStep4Uploading(false);
        return;
      }

      // Ajouter le nouveau document à la liste locale
      if (newDocument) {
        setDocuments((prev) => [newDocument, ...prev]);
      }

      // Recharger les données de l'étape
      const { data: updatedStep } = await data.getDossierStep(dossierId, step4StepId);
      if (updatedStep) {
        setAllDossierSteps(prev => {
          const newMap = new Map(prev);
          newMap.set(step4StepId, updatedStep);
          return newMap;
        });
      }

      // Réinitialiser le formulaire (mais ne pas fermer le popup pour permettre d'ajouter plusieurs documents)
      if (step4FormRef.current) {
        step4FormRef.current.reset();
      }
      setStep4UploadError(null);
      
      // Afficher un message de succès
      alert(`Document "${name}" ajouté avec succès ! Vous pouvez ajouter d'autres documents ou fermer le popup.`);
    } catch (error: any) {
      setStep4UploadError(error?.message || "Une erreur est survenue lors du téléversement.");
    } finally {
      setStep4Uploading(false);
    }
  };

  const handleStep4UploadClose = async () => {
    // Récupérer le nombre de documents avant d'afficher le popup de confirmation
    if (step4StepId && dossierId) {
      try {
        const { data: currentStep4 } = await data.getDossierStep(dossierId, step4StepId);
        const step4Content = currentStep4?.content || {};
        const step4Documents = Array.isArray(step4Content.documents) ? step4Content.documents : [];
        setStep4DocumentsCount(step4Documents.length);
        setIsStep4ConfirmModalOpen(true);
      } catch (error) {
        console.error("Erreur lors de la récupération des documents:", error);
        // Si erreur, fermer directement le popup
        setIsStep4UploadOpen(false);
        setStep4StepId(null);
        setStep4UploadError(null);
      }
    } else {
      setIsStep4UploadOpen(false);
      setStep4StepId(null);
      setStep4UploadError(null);
    }
  };

  const handleStep4ConfirmValidation = async () => {
    // Fermer le popup de confirmation
    setIsStep4ConfirmModalOpen(false);
    
    // Mettre l'étape 4 en "validated"
    if (step4StepId && dossierId) {
      try {
        const { data: currentStep4 } = await data.getDossierStep(dossierId, step4StepId);
        // Mettre l'étape en "validated" - conserver le content existant ou utiliser null
        const contentToUse = currentStep4?.content || null;
        const { error: validateError } = await data.upsertDossierStep(
          dossierId,
          step4StepId,
          "validated",
          contentToUse
        );
        
        if (validateError) {
          console.error("Erreur lors de la validation de l'étape 4:", validateError);
          alert("Erreur lors de la validation de l'étape 4: " + validateError.message);
        } else {
          // Recharger les données avec le nouveau statut
          const { data: updatedStep } = await data.getDossierStep(dossierId, step4StepId);
          if (updatedStep) {
            setAllDossierSteps(prev => {
              const newMap = new Map(prev);
              newMap.set(step4StepId, updatedStep);
              return newMap;
            });
          }
        }
      } catch (error) {
        console.error("Erreur lors de la validation de l'étape 4:", error);
        alert("Erreur lors de la validation de l'étape 4");
      }
    }
    
    setIsStep4UploadOpen(false);
    setStep4StepId(null);
    setStep4UploadError(null);
  };

  const getStepState = (stepId: string): 'A_FAIRE' | 'TERMINEE' | 'EN_COURS' => {
    if (!dossier) return 'A_FAIRE';

    const dossierStep = allDossierSteps.get(stepId);
    if (dossierStep) {
      if (dossierStep.status === 'validated') return 'TERMINEE';
      if (dossierStep.status === 'complete') return 'EN_COURS';
      if (dossierStep.status === 'en_cours') return 'EN_COURS';
    }
    return 'A_FAIRE';
  };

  const getStepStateByNumber = (stepNumber: number): 'A_FAIRE' | 'TERMINEE' | 'EN_COURS' => {
    if (!dossier) return 'A_FAIRE';
    
    const step = allSteps.find(s => s.step_number === stepNumber);
    if (!step) return 'A_FAIRE';
    
    return getStepState(step.id);
  };

  const handleCompleteStep = async (stepId: string, stepNumber: number) => {
    if (!dossierId || updatingStep === stepId) return;
    
    setUpdatingStep(stepId);
    try {
      // Vérifier si l'étape précédente est complétée (sauf pour l'étape 1)
      if (stepNumber > 1) {
        const previousStep = allSteps.find(s => s.step_number === stepNumber - 1);
        if (previousStep) {
          const previousDossierStep = allDossierSteps.get(previousStep.id);
          if (!previousDossierStep || (previousDossierStep.status !== 'complete' && previousDossierStep.status !== 'validated')) {
            alert(`Veuillez d'abord compléter l'étape ${stepNumber - 1}`);
            setUpdatingStep(null);
            return;
          }
        }
      }

      // Si c'est l'étape 4, ouvrir le popup d'upload de documents AVANT de mettre à jour
      if (stepNumber === 4) {
        setStep4StepId(stepId);
        setIsStep4UploadOpen(true);
        setUpdatingStep(null);
        return;
      }

      // Si c'est l'étape 6 (EIN disponible), envoyer un email et mettre directement en "validated"
      if (stepNumber === 6 && dossier) {
        const userEmail = dossier.email;
        const userName = dossier.first_name && dossier.last_name 
          ? `${dossier.first_name} ${dossier.last_name}`
          : dossier.first_name || dossier.last_name || 'Cher client';
        const llcName = dossier.llc_name || 'votre LLC';

        if (userEmail) {
          try {
            const template = emailTemplates.step6EINReady(userName, llcName);
            
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
              // Si l'email est envoyé avec succès, mettre l'étape en "validated"
              const { error: validateError } = await data.upsertDossierStep(dossierId, stepId, "validated", null);
              
              if (validateError) {
                console.error("Erreur lors de la validation de l'étape 6:", validateError);
                alert("Erreur lors de la validation de l'étape: " + validateError.message);
              } else {
                // Recharger les données avec le nouveau statut
                const { data: updatedStep } = await data.getDossierStep(dossierId, stepId);
                if (updatedStep) {
                  setAllDossierSteps(prev => {
                    const newMap = new Map(prev);
                    newMap.set(stepId, updatedStep);
                    return newMap;
                  });
                }
              }
            } else {
              const errorData = await emailResponse.json();
              console.error("Erreur lors de l'envoi de l'email:", errorData.error);
              // Mettre quand même l'étape en validated même si l'email échoue
              const { error: validateError } = await data.upsertDossierStep(dossierId, stepId, "validated", null);
              if (validateError) {
                console.error("Erreur lors de la validation de l'étape 6:", validateError);
                alert("Erreur lors de la validation de l'étape: " + validateError.message);
              } else {
                const { data: updatedStep } = await data.getDossierStep(dossierId, stepId);
                if (updatedStep) {
                  setAllDossierSteps(prev => {
                    const newMap = new Map(prev);
                    newMap.set(stepId, updatedStep);
                    return newMap;
                  });
                }
              }
            }
          } catch (emailError) {
            console.error("Erreur lors de l'envoi de l'email:", emailError);
            // Mettre quand même l'étape en validated même si l'email échoue
            const { error: validateError } = await data.upsertDossierStep(dossierId, stepId, "validated", null);
            if (validateError) {
              console.error("Erreur lors de la validation de l'étape 6:", validateError);
              alert("Erreur lors de la validation de l'étape: " + validateError.message);
            } else {
              const { data: updatedStep } = await data.getDossierStep(dossierId, stepId);
              if (updatedStep) {
                setAllDossierSteps(prev => {
                  const newMap = new Map(prev);
                  newMap.set(stepId, updatedStep);
                  return newMap;
                });
              }
            }
          }
        } else {
          console.warn("Email utilisateur non trouvé pour l'envoi de notification");
          // Mettre quand même l'étape en validated
          const { error: validateError } = await data.upsertDossierStep(dossierId, stepId, "validated", null);
          if (validateError) {
            console.error("Erreur lors de la validation de l'étape 6:", validateError);
            alert("Erreur lors de la validation de l'étape: " + validateError.message);
          } else {
            const { data: updatedStep } = await data.getDossierStep(dossierId, stepId);
            if (updatedStep) {
              setAllDossierSteps(prev => {
                const newMap = new Map(prev);
                newMap.set(stepId, updatedStep);
                return newMap;
              });
            }
          }
        }
        setUpdatingStep(null);
        return;
      }

      // Si c'est l'étape 5, envoyer un email et mettre directement en "validated"
      if (stepNumber === 5 && dossier) {
        const userEmail = dossier.email;
        const userName = dossier.first_name && dossier.last_name 
          ? `${dossier.first_name} ${dossier.last_name}`
          : dossier.first_name || dossier.last_name || 'Cher client';

        if (userEmail) {
          try {
            const template = emailTemplates.step5Validated(userName);
            
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
              // Si l'email est envoyé avec succès, mettre l'étape en "validated"
              const { error: validateError } = await data.upsertDossierStep(dossierId, stepId, "validated", null);
              
              if (validateError) {
                console.error("Erreur lors de la validation de l'étape 5:", validateError);
                alert("Erreur lors de la validation de l'étape: " + validateError.message);
              } else {
                // Recharger les données avec le nouveau statut
                const { data: updatedStep } = await data.getDossierStep(dossierId, stepId);
                if (updatedStep) {
                  setAllDossierSteps(prev => {
                    const newMap = new Map(prev);
                    newMap.set(stepId, updatedStep);
                    return newMap;
                  });
                }
              }
            } else {
              const errorData = await emailResponse.json();
              console.error("Erreur lors de l'envoi de l'email:", errorData.error);
              // Mettre quand même l'étape en validated même si l'email échoue
              const { error: validateError } = await data.upsertDossierStep(dossierId, stepId, "validated", null);
              if (validateError) {
                console.error("Erreur lors de la validation de l'étape 5:", validateError);
                alert("Erreur lors de la validation de l'étape: " + validateError.message);
              } else {
                const { data: updatedStep } = await data.getDossierStep(dossierId, stepId);
                if (updatedStep) {
                  setAllDossierSteps(prev => {
                    const newMap = new Map(prev);
                    newMap.set(stepId, updatedStep);
                    return newMap;
                  });
                }
              }
            }
          } catch (emailError) {
            console.error("Erreur lors de l'envoi de l'email:", emailError);
            // Mettre quand même l'étape en validated même si l'email échoue
            const { error: validateError } = await data.upsertDossierStep(dossierId, stepId, "validated", null);
            if (validateError) {
              console.error("Erreur lors de la validation de l'étape 5:", validateError);
              alert("Erreur lors de la validation de l'étape: " + validateError.message);
            } else {
              const { data: updatedStep } = await data.getDossierStep(dossierId, stepId);
              if (updatedStep) {
                setAllDossierSteps(prev => {
                  const newMap = new Map(prev);
                  newMap.set(stepId, updatedStep);
                  return newMap;
                });
              }
            }
          }
        } else {
          console.warn("Email utilisateur non trouvé pour l'envoi de notification");
          // Mettre quand même l'étape en validated
          const { error: validateError } = await data.upsertDossierStep(dossierId, stepId, "validated", null);
          if (validateError) {
            console.error("Erreur lors de la validation de l'étape 5:", validateError);
            alert("Erreur lors de la validation de l'étape: " + validateError.message);
          } else {
            const { data: updatedStep } = await data.getDossierStep(dossierId, stepId);
            if (updatedStep) {
              setAllDossierSteps(prev => {
                const newMap = new Map(prev);
                newMap.set(stepId, updatedStep);
                return newMap;
              });
            }
          }
        }
        setUpdatingStep(null);
        return;
      }

      // Si c'est l'étape 3 (Enregistrement), envoyer un email et mettre directement en "validated"
      if (stepNumber === 3) {
        if (dossier) {
          const userEmail = dossier.email;
          const userName = dossier.first_name && dossier.last_name 
            ? `${dossier.first_name} ${dossier.last_name}`
            : dossier.first_name || dossier.last_name || 'Cher client';

          if (userEmail) {
          try {
            const template = emailTemplates.step3Validated(userName);
            
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
              // Si l'email est envoyé avec succès, mettre l'étape en "validated"
              const { error: validateError } = await data.upsertDossierStep(dossierId, stepId, "validated", null);
              
              if (validateError) {
                console.error("Erreur lors de la validation de l'étape 3:", validateError);
                alert("Erreur lors de la validation de l'étape: " + validateError.message);
              } else {
                // Recharger les données avec le nouveau statut
                const { data: updatedStep } = await data.getDossierStep(dossierId, stepId);
                if (updatedStep) {
                  setAllDossierSteps(prev => {
                    const newMap = new Map(prev);
                    newMap.set(stepId, updatedStep);
                    return newMap;
                  });
                }
              }
            } else {
              const errorData = await emailResponse.json();
              console.error("Erreur lors de l'envoi de l'email:", errorData.error);
              // Mettre quand même l'étape en validated même si l'email échoue
              const { error: validateError } = await data.upsertDossierStep(dossierId, stepId, "validated", null);
              if (validateError) {
                console.error("Erreur lors de la validation de l'étape 3:", validateError);
                alert("Erreur lors de la validation de l'étape: " + validateError.message);
              } else {
                const { data: updatedStep } = await data.getDossierStep(dossierId, stepId);
                if (updatedStep) {
                  setAllDossierSteps(prev => {
                    const newMap = new Map(prev);
                    newMap.set(stepId, updatedStep);
                    return newMap;
                  });
                }
              }
            }
          } catch (emailError) {
            console.error("Erreur lors de l'envoi de l'email:", emailError);
            // Mettre quand même l'étape en validated même si l'email échoue
            const { error: validateError } = await data.upsertDossierStep(dossierId, stepId, "validated", null);
            if (validateError) {
              console.error("Erreur lors de la validation de l'étape 3:", validateError);
              alert("Erreur lors de la validation de l'étape: " + validateError.message);
            } else {
              const { data: updatedStep } = await data.getDossierStep(dossierId, stepId);
              if (updatedStep) {
                setAllDossierSteps(prev => {
                  const newMap = new Map(prev);
                  newMap.set(stepId, updatedStep);
                  return newMap;
                });
              }
            }
          }
          } else {
            console.warn("Email utilisateur non trouvé pour l'envoi de notification");
          }
        }
        
        // Mettre l'étape en validated (même si pas d'email ou pas de dossier)
        const { error: validateError } = await data.upsertDossierStep(dossierId, stepId, "validated", null);
        if (validateError) {
          console.error("Erreur lors de la validation de l'étape 3:", validateError);
          alert("Erreur lors de la validation de l'étape: " + validateError.message);
        } else {
          const { data: updatedStep } = await data.getDossierStep(dossierId, stepId);
          if (updatedStep) {
            setAllDossierSteps(prev => {
              const newMap = new Map(prev);
              newMap.set(stepId, updatedStep);
              return newMap;
            });
          }
        }
        setUpdatingStep(null);
        return;
      }

      // Pour les autres étapes (non gérées spécifiquement), mettre en "complete"
      const { error } = await data.upsertDossierStep(dossierId, stepId, "complete", null);
      
      if (error) {
        console.error("Erreur lors de la mise à jour de l'étape:", error);
        alert("Erreur lors de la mise à jour de l'étape: " + error.message);
      } else {
        // Recharger les données
        const { data: updatedStep } = await data.getDossierStep(dossierId, stepId);
        if (updatedStep) {
          setAllDossierSteps(prev => {
            const newMap = new Map(prev);
            newMap.set(stepId, updatedStep);
            return newMap;
          });
        }
      }
    } catch (err: any) {
      console.error("Erreur:", err);
      alert("Erreur: " + (err.message || "Erreur inconnue"));
    } finally {
      setUpdatingStep(null);
    }
  };

  const renderStepBadge = (state: 'A_FAIRE' | 'TERMINEE' | 'EN_COURS') => {
    if (state === 'TERMINEE') {
      return (
        <span className="inline-flex items-center rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400 border border-green-500/60">
          ✓ Validée
        </span>
      );
    }
    if (state === 'EN_COURS') {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-400 border border-amber-500/60">
          En cours
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-neutral-800 px-3 py-1 text-xs font-medium text-neutral-300">
        À faire
      </span>
    );
  };

  // Helper pour accéder au content de l'étape 1 de manière sécurisée
  const getStep1Content = () => {
    if (!dossierStep1?.content) return null;
    if (typeof dossierStep1.content === 'object' && !Array.isArray(dossierStep1.content)) {
      return dossierStep1.content;
    }
    return null;
  };

  const getProgress = () => {
    if (!dossier) return { done: 0, total: allSteps.length || 2 };
    const total = allSteps.length || 2;
    let done = 0;
    
    // Compter les étapes validées
    allSteps.forEach(step => {
      const state = getStepState(step.id);
      if (state === 'TERMINEE') {
        done++;
      }
    });
    
    return { done, total };
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-900 text-white">
        Chargement...
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="flex min-h-screen flex-col bg-neutral-900 text-white">
        <div className="mx-auto mt-24 max-w-md text-center">
          <p className="mb-4 text-lg font-semibold">Dossier introuvable.</p>
          <button
            onClick={() => router.push('/admin/dossiers-llc')}
            className="mt-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
          >
            Retour aux dossiers
          </button>
        </div>
      </div>
    );
  }

  const { done, total } = getProgress();

  return (
    <div className="flex min-h-screen bg-neutral-900 text-white">
      {/* Sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-neutral-800 bg-neutral-950 p-6 lg:flex">
        <Logo variant="admin" />
        <nav className="mt-6 space-y-1">
          <Link
            href="/admin"
            className="block rounded-lg px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            Tableau de bord
          </Link>
          <Link
            href="/admin/dossiers-llc"
            className="block rounded-lg bg-green-500/20 px-3 py-2 text-sm text-green-400"
          >
            Dossiers LLC
          </Link>
        </nav>
        <div className="mt-auto pt-6">
          <button
            onClick={async () => await signOut()}
            className="w-full rounded-md border border-neutral-700 px-3 py-2 text-xs font-medium text-neutral-300 transition-colors hover:border-red-500 hover:bg-red-500/10 hover:text-red-400"
          >
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-y-auto p-8">
        <header className="mb-6 flex items-center justify-between border-b border-neutral-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold">{dossier.llc_name || 'LLC'}</h1>
            <p className="mt-1 text-sm text-neutral-300">
              {dossier.first_name} {dossier.last_name} • {dossier.email}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              #{dossier.id.slice(0, 8).toUpperCase()} •{' '}
              {dossier.created_at
                ? new Date(dossier.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Date inconnue'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs font-medium">
              {dossier.status === 'accepte'
                ? 'Dossier accepté'
                : dossier.status === 'refuse'
                ? 'Dossier à revoir'
                : 'En cours de validation'}
            </span>
          </div>
        </header>

        {/* Global progress */}
        <section className="mb-8">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-neutral-400">
              {done}/{total} étapes complétées
            </span>
            <span className="font-medium">
              {Math.round((done / total) * 100)}%
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-neutral-800">
            <div
              className="h-full rounded-full bg-green-500"
              style={{ width: `${(done / total) * 100}%` }}
            />
          </div>
        </section>

        {/* Steps detail */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Étapes du dossier</h2>

          {/* Afficher toutes les étapes dynamiquement */}
          {allSteps.map((step) => {
            const stepState = getStepState(step.id);
            const isAdminStep = step.role === 'admin';
            // Permettre de continuer si l'étape n'est pas encore validée (A_FAIRE ou EN_COURS)
            const canComplete = isAdminStep && stepState !== 'TERMINEE';
            
            return (
              <div
                key={step.id}
                className={`flex items-center justify-between rounded-xl border p-4 ${
                  stepState === 'TERMINEE' 
                    ? 'border-green-500/50 bg-green-500/5' 
                    : stepState === 'EN_COURS'
                    ? 'border-amber-500/50 bg-amber-500/5'
                    : 'border-neutral-800 bg-neutral-950'
                }`}
              >
            <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white ${
                    stepState === 'TERMINEE'
                      ? 'bg-green-500 border-2 border-green-400'
                      : stepState === 'EN_COURS'
                      ? 'bg-amber-500'
                      : 'bg-neutral-700'
                  }`}>
                    {stepState === 'TERMINEE' ? '✓' : step.step_number}
              </div>
              <div>
                    <p className="font-semibold">
                      Étape {step.step_number} : {step.name}
                    </p>
                <p className="text-xs text-neutral-400">
                      {step.description || ''}
                </p>
              </div>
            </div>
                <div className="flex items-center gap-3">
                  {renderStepBadge(stepState)}
                  {canComplete && (
                    <button
                      onClick={() => handleCompleteStep(step.id, step.step_number)}
                      disabled={updatingStep === step.id}
                      className="rounded-lg bg-green-500 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingStep === step.id ? 'En cours...' : 'Continuer'}
                    </button>
                  )}
          </div>
              </div>
            );
          })}

          {/* Images de l'étape 2 */}
          {step2Images.length > 0 && (
            <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-950 p-6">
              <h3 className="mb-4 text-lg font-semibold">Documents d&apos;identité (Étape 2)</h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {step2Images.map((imageUrl, index) => (
                  <div key={index} className="group relative overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
                    <img
                      src={imageUrl}
                      alt={`Document d'identité ${index + 1}`}
                      className="h-48 w-full object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-image.png';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-xs text-white">Document {index + 1}</p>
              </div>
              </div>
                ))}
            </div>
          </div>
          )}
        </section>

        {/* Informations complètes du dossier */}
        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
            <h2 className="mb-4 text-lg font-semibold">Informations du client</h2>
            <dl className="space-y-2 text-sm text-neutral-300">
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-400">Prénom</dt>
                <dd>{getStep1Content()?.client?.firstName || dossier.first_name || '-'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-400">Nom</dt>
                <dd>{getStep1Content()?.client?.lastName || dossier.last_name || '-'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-400">Email</dt>
                <dd>{getStep1Content()?.client?.email || dossier.email || '-'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-400">Téléphone</dt>
                <dd>{getStep1Content()?.client?.phone || dossier.phone || '-'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-400">Adresse</dt>
                <dd className="text-right">{getStep1Content()?.client?.address || dossier.address || '-'}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
            <h2 className="mb-4 text-lg font-semibold">Détails de la LLC</h2>
            <dl className="space-y-2 text-sm text-neutral-300">
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-400">Nom de la LLC</dt>
                <dd className="text-right">{getStep1Content()?.client?.llcName || dossier.llc_name || '-'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-400">Structure</dt>
                <dd className="text-right">{getStep1Content()?.client?.structure || dossier.structure || '-'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-400">Statut interne</dt>
                <dd className="text-right">{dossier.status || '-'}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Associates */}
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Associés</h2>

          {/* Cas 1 : plusieurs associés depuis llc_dossier_steps ou llc_associates */}
          {associates.length > 0 && (
            <div className="space-y-4">
              {associates.map((a, index) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-neutral-800 bg-neutral-950 p-4"
                >
                  <h3 className="mb-3 text-sm font-semibold text-neutral-200">
                    Associé {index + 1}
                  </h3>
                  <dl className="space-y-2 text-sm text-neutral-300">
                    <div className="flex justify-between gap-4">
                      <dt className="text-neutral-400">Prénom</dt>
                      <dd>{a.first_name || '-'}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-neutral-400">Nom</dt>
                      <dd>{a.last_name || '-'}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-neutral-400">Email</dt>
                      <dd>{a.email || '-'}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-neutral-400">Téléphone</dt>
                      <dd>{a.phone || '-'}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-neutral-400">Adresse</dt>
                      <dd className="text-right">{a.address || '-'}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          )}

          {/* Cas 2 : structure = 1 associé → le client est l'unique associé, pas besoin d'afficher la section */}
          {associates.length === 0 && (getStep1Content()?.client?.structure === '1 associé' || dossier.structure === '1 associé') && (
            <p className="text-sm text-neutral-500">
              Structure à un seul associé : le client est l'unique associé de la LLC.
            </p>
          )}

          {/* Cas 3 : structure = plusieurs associés mais aucun enregistré pour l'instant */}
          {associates.length === 0 && getStep1Content()?.client?.structure !== '1 associé' && dossier.structure !== '1 associé' && (
            <p className="text-sm text-neutral-500">Aucun associé enregistré.</p>
          )}
        </section>

        {/* Documents */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Documents</h2>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="rounded-lg bg-green-500 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-green-600"
            >
              + Téléverser un document
            </button>
                </div>

          {documents.length === 0 ? (
            <p className="text-sm text-neutral-500">Aucun document téléversé pour ce dossier.</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => {
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

                const getStatusColor = (status: string) => {
                  switch (status) {
                    case "signe":
                    case "valide":
                      return "bg-green-500/20 text-green-400 border border-green-500/50";
                    case "archive":
                      return "bg-neutral-700/60 text-neutral-200 border border-neutral-700/50";
                    default:
                      return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50";
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

                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950 p-4"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{doc.name}</p>
                      <p className="mt-1 text-xs text-neutral-400">
                        {getCategoryLabel(doc.category)} • {formatDate(doc.created_at)}
                      </p>
                </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${getStatusColor(doc.status)}`}>
                        {getStatusLabel(doc.status)}
                      </span>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
                        title="Voir le document"
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </a>
                </div>
                </div>
                );
              })}
                </div>
          )}
        </section>

        {/* Modal de confirmation pour valider l'étape 4 */}
        {isStep4ConfirmModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-white">
                    Confirmer la validation
                  </h2>
                  <p className="mt-2 text-sm text-neutral-300">
                    Êtes-vous sûr de vouloir valider l&apos;étape 4 ?
                  </p>
                  <p className="mt-2 text-xs text-neutral-400">
                    {step4DocumentsCount > 0 
                      ? `${step4DocumentsCount} document${step4DocumentsCount > 1 ? 's' : ''} ${step4DocumentsCount > 1 ? 'ont été' : 'a été'} ajouté${step4DocumentsCount > 1 ? 's' : ''}. L&apos;étape sera validée et les documents seront disponibles pour le client.`
                      : "Aucun document n'a été ajouté. L'étape sera validée sans documents."}
                  </p>
                </div>
                <button
                  onClick={() => setIsStep4ConfirmModalOpen(false)}
                  className="ml-4 text-neutral-500 hover:text-neutral-300"
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

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  onClick={() => setIsStep4ConfirmModalOpen(false)}
                  className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800"
                >
                  Annuler
                </button>
                <button
                  onClick={handleStep4ConfirmValidation}
                  className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
                >
                  Oui, valider l&apos;étape
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Téléverser un document - Étape 4 */}
        {isStep4UploadOpen && step4StepId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Déposer des documents - Étape 4
                  </h2>
                  <p className="mt-1 text-xs text-neutral-400">
                    Ajoutez les documents nécessaires pour cette étape. L&apos;utilisateur devra les valider.
                  </p>
                  {/* Afficher le nombre de documents ajoutés */}
                  {(() => {
                    const currentStep4 = allDossierSteps.get(step4StepId || '');
                    const step4Content = currentStep4?.content;
                    // Vérifier que content est un objet et qu'il a une propriété documents
                    const step4Documents = (step4Content && typeof step4Content === 'object' && !Array.isArray(step4Content) && 'documents' in step4Content && Array.isArray((step4Content as any).documents)) 
                      ? (step4Content as any).documents 
                      : [];
                    return step4Documents.length > 0 ? (
                      <p className="mt-2 text-sm font-medium text-green-400">
                        {step4Documents.length} document{step4Documents.length > 1 ? 's' : ''} ajouté{step4Documents.length > 1 ? 's' : ''}
                      </p>
                    ) : null;
                  })()}
                </div>
                <button
                  onClick={() => {
                    setIsStep4UploadOpen(false);
                    setStep4StepId(null);
                    setStep4UploadError(null);
                  }}
                  disabled={step4Uploading}
                  className="text-neutral-500 hover:text-neutral-300 disabled:opacity-50"
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

              {step4UploadError && (
                <div className="mb-3 rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {step4UploadError}
            </div>
          )}

              <form ref={step4FormRef} onSubmit={handleStep4UploadSubmit} className="space-y-4">
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
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-green-500 file:px-4 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-green-600 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <p className="mt-1 text-[10px] text-neutral-500">
                    Formats acceptés : PDF, DOC, DOCX, JPG, JPEG, PNG (max 10 Mo)
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleStep4UploadClose}
                    disabled={step4Uploading}
                    className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-800 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={step4Uploading}
                    className="rounded-lg bg-green-500 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50"
                  >
                    {step4Uploading ? "Téléversement..." : "Ajouter le document"}
                  </button>
                </div>
              </form>

              <div className="mt-4 flex items-center justify-end">
                <button
                  onClick={handleStep4UploadClose}
                  disabled={step4Uploading}
                  className="rounded-lg bg-blue-500 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
                >
                  Terminer et valider l&apos;étape
                </button>
              </div>
            </div>
          </div>
        )}

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
                    Ajoutez un document pour ce client.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (!uploading) {
                      setIsUploadOpen(false);
                      setUploadError(null);
                    }
                  }}
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
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-green-500 file:px-4 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-green-600 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <p className="mt-1 text-[10px] text-neutral-500">
                    Formats acceptés : PDF, DOC, DOCX, JPG, JPEG, PNG (max 10 Mo)
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!uploading) {
                        setIsUploadOpen(false);
                        setUploadError(null);
                      }
                    }}
                    disabled={uploading}
                    className="rounded-lg border border-neutral-700 px-4 py-2 text-xs font-medium text-neutral-200 transition-colors hover:border-neutral-500 disabled:opacity-50"
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
    </div>
  );
}


