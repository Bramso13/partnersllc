"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { useData } from "@/context/DataContext";
import { ContactButton } from "@/components/ui/ContactButton";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
};

type AssociateInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
};

export default function DossierLLCPage() {
  const router = useRouter();
  const { user, getUser, signOut } = useAuth();
  const { profile, fetchProfile } = useProfile();
  const data = useData();
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [step1Complete, setStep1Complete] = useState(false);
  const [step1Status, setStep1Status] = useState<"complete" | "validated" | null>(null);
  const [step2Status, setStep2Status] = useState<"complete" | "validated" | null>(null);
  const [step3Status, setStep3Status] = useState<"complete" | "validated" | null>(null);
  const [allAdminStepsValidated, setAllAdminStepsValidated] = useState(false);
  const [isStep3ConfirmModalOpen, setIsStep3ConfirmModalOpen] = useState(false);
  const [isStep1ModalOpen, setIsStep1ModalOpen] = useState(false);
  const [submittingStep1, setSubmittingStep1] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [dossierStatus, setDossierStatus] = useState<"en_cours" | "accepte" | "refuse" | null>(null);
  const [dossierName, setDossierName] = useState<string | null>(null);
  const [dossierId, setDossierId] = useState<string | null>(null);
  const [currentStepInfo, setCurrentStepInfo] = useState<{
    stepNumber: number;
    stepName: string;
    totalSteps: number;
  } | null>(null);
  const [isStep2ModalOpen, setIsStep2ModalOpen] = useState(false);
  const [submittingStep2, setSubmittingStep2] = useState(false);
  const [step2Error, setStep2Error] = useState<string | null>(null);
  const [allIdCards, setAllIdCards] = useState<File[]>([]);
  const [allIdCardPreviews, setAllIdCardPreviews] = useState<string[]>([]);
  const [associatesList, setAssociatesList] = useState<AssociateInput[]>([]);
  const [isViewStep1ModalOpen, setIsViewStep1ModalOpen] = useState(false);
  const [isViewStep2ModalOpen, setIsViewStep2ModalOpen] = useState(false);
  const [step2ViewImages, setStep2ViewImages] = useState<string[]>([]);
  const [isEditingStep1, setIsEditingStep1] = useState(false);
  const [isSavingStep1, setIsSavingStep1] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [step1ViewData, setStep1ViewData] = useState<{
    client: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      address: string;
      llcName: string;
      llcNameSecondary: string;
      structure: string;
    } | null;
    associates: Array<{
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      address: string;
    }>;
  } | null>(null);
  const [step1Form, setStep1Form] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    llcName: string;
    llcNameSecondary: string;
    associates: AssociateInput[];
  }>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    llcName: "",
    llcNameSecondary: "",
    associates: [
      { firstName: "", lastName: "", email: "", phone: "", address: "" },
    ],
  });

  useEffect(() => {
    async function fetchProfileAndDossier() {
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

      // Charger le dossier existant pour ce user (si présent)
      const dossier = await data.getDossierByUserId(currentUser.id);

      if (dossier) {
        const dossierId = dossier.id;
        setStep1Complete(true);
        setDossierId(dossierId);
        setCurrentStep(2);
        setDossierStatus(dossier.status ?? "en_cours");
        setDossierName(dossier.llc_name || null);

        // Essayer de charger depuis llc_dossier_steps (nouveau système)
        const { data: step1Info } = await data.getStepByNumber(1);

        if (step1Info?.id) {
          const { data: step1Data, error: step1DataError } = await data.getDossierStep(dossierId, step1Info.id);

          if (step1DataError) {
            console.error("Erreur lors du chargement du statut étape 1:", step1DataError);
          }

          if (step1Data) {
            // Charger le statut de l'étape 1
            console.log("Statut étape 1 depuis BDD:", step1Data.status, "Type:", typeof step1Data.status);
            if (step1Data.status === "validated" || step1Data.status === "complete") {
              console.log("Définition du statut étape 1 à:", step1Data.status);
              setStep1Status(step1Data.status as "complete" | "validated");
            } else if (step1Data.status) {
              // Si le statut existe mais n'est pas reconnu, on le met quand même
              console.warn("Statut étape 1 non reconnu:", step1Data.status);
              // On peut quand même le définir si c'est un statut valide
              if (step1Data.status === "en_attente" || step1Data.status === "bloque") {
                setStep1Status(null);
              }
            } else {
              console.warn("Aucun statut trouvé pour l'étape 1");
            }
            
            if (step1Data.content) {
              const content = step1Data.content as any;
              // Pré-remplir le formulaire avec les données de l'étape 1
              if (content.client) {
                setStep1Form({
                  firstName: content.client.firstName || "",
                  lastName: content.client.lastName || "",
                  email: content.client.email || "",
                  phone: content.client.phone || "",
                  address: content.client.address || "",
                  llcName: content.client.llcName || "",
                  llcNameSecondary: content.client.llcNameSecondary || "",
                  associates: content.associates && content.associates.length > 0
                    ? content.associates.map((a: any) => ({
                        firstName: a.firstName || "",
                        lastName: a.lastName || "",
                        email: a.email || "",
                        phone: a.phone || "",
                        address: a.address || "",
                      }))
                    : [{ firstName: "", lastName: "", email: "", phone: "", address: "" }],
                });
              }
              // Charger les associés pour l'étape 2
              if (content.associates && content.associates.length > 0) {
                setAssociatesList(
                  content.associates.map((a: any) => ({
                    firstName: a.firstName || "",
                    lastName: a.lastName || "",
                    email: a.email || "",
                    phone: a.phone || "",
                    address: a.address || "",
                  }))
                );
              } else {
                setAssociatesList([]);
              }
            }
          } else {
            // Fallback : charger depuis llc_dossiers et llc_associates (ancien système)
            setStep1Form({
              firstName: dossier.first_name || "",
              lastName: dossier.last_name || "",
              email: dossier.email || "",
              phone: dossier.phone || "",
              address: dossier.address || "",
              llcName: dossier.llc_name || "",
              llcNameSecondary: (dossier as any).llc_name_secondary || "",
              associates: [{ firstName: "", lastName: "", email: "", phone: "", address: "" }],
            });

            const { data: associatesData } = await data.getAssociatesByDossierId(dossierId);

            if (associatesData && associatesData.length > 0) {
              const mappedAssociates = associatesData.map((a: any) => ({
                firstName: a.first_name || "",
                lastName: a.last_name || "",
                email: a.email || "",
                phone: a.phone || "",
                address: a.address || "",
              }));
              setAssociatesList(mappedAssociates);
              setStep1Form((prev) => ({
                ...prev,
                associates: mappedAssociates.length > 0 ? mappedAssociates : prev.associates,
              }));
            } else {
              setAssociatesList([]);
            }
          }
        } else {
          // Fallback si llc_steps n'existe pas : charger depuis llc_dossiers et llc_associates
          setStep1Form({
            firstName: dossier.first_name || "",
            lastName: dossier.last_name || "",
            email: dossier.email || "",
            phone: dossier.phone || "",
            address: dossier.address || "",
            llcName: dossier.llc_name || "",
            llcNameSecondary: "",
            associates: [{ firstName: "", lastName: "", email: "", phone: "", address: "" }],
          });

          const { data: associatesData } = await data.getAssociatesByDossierId(dossierId);

          if (associatesData && associatesData.length > 0) {
            const mappedAssociates = associatesData.map((a: any) => ({
              firstName: a.first_name || "",
              lastName: a.last_name || "",
              email: a.email || "",
              phone: a.phone || "",
              address: a.address || "",
            }));
            setAssociatesList(mappedAssociates);
            setStep1Form((prev) => ({
              ...prev,
              associates: mappedAssociates.length > 0 ? mappedAssociates : prev.associates,
            }));
          } else {
            setAssociatesList([]);
          }
        }

        // Charger le statut de l'étape 2
        const { data: step2Info } = await data.getStepByNumber(2);

        if (step2Info?.id) {
          const { data: step2Data } = await data.getDossierStep(dossierId, step2Info.id);

          if (step2Data && (step2Data.status === "validated" || step2Data.status === "complete")) {
            setStep2Status(step2Data.status as "complete" | "validated");
          }
        }

        // Déterminer l'étape actuelle exacte depuis la BDD
        await determineCurrentStep(dossierId);
      } else {
        setStep1Complete(false);
        setCurrentStep(1);
        setDossierStatus(null);
        setDossierName(null);
        setDossierId(null);
      }

      setLoading(false);
    }

    fetchProfileAndDossier();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fonction pour déterminer l'étape actuelle exacte depuis la BDD
  const determineCurrentStep = async (dossierId: string) => {
    try {
      // Récupérer toutes les étapes définies pour le rôle de l'utilisateur
      const userRole = profile?.role || "user";
      const { data: allSteps } = await data.getAllSteps(userRole);
      if (!allSteps || allSteps.length === 0) {
        console.warn("Aucune étape définie dans llc_steps");
        return;
      }

      // Récupérer toutes les étapes du dossier
      const { data: dossierSteps } = await data.getAllDossierSteps(dossierId);
      
      // Créer un map des statuts des étapes du dossier
      const dossierStepsMap = new Map();
      if (dossierSteps) {
        dossierSteps.forEach((ds: any) => {
          const stepId = ds.step_id || (ds.llc_steps && typeof ds.llc_steps === 'object' ? ds.llc_steps.id : null);
          if (stepId && ds.status) {
            dossierStepsMap.set(stepId, ds.status);
          }
        });
      }
      
      // Vérifier si l'étape 6 (admin) est validée
      let step6AdminValidated = false;
      // Récupérer toutes les étapes admin pour trouver l'étape 6
      const { data: allAdminSteps } = await data.getAllSteps("admin");
      
      if (allAdminSteps && allAdminSteps.length > 0) {
        // Trouver l'étape 6 avec role = 'admin'
        const step6Admin = allAdminSteps.find(step => step.step_number === 6 && step.role === 'admin');
        
        if (step6Admin?.id) {
          const step6Status = dossierStepsMap.get(step6Admin.id);
          step6AdminValidated = step6Status === 'validated';
        }
      }
      
      console.log("Toutes les étapes définies:", allSteps);
      console.log("Étapes du dossier:", dossierSteps);
      console.log("Étape 6 admin validée:", step6AdminValidated);
      
      // Mettre à jour l'état pour l'affichage conditionnel de l'étape Mercury Bank
      setAllAdminStepsValidated(step6AdminValidated);
      
      // Filtrer les étapes : si l'étape 3 (Mercury Bank) existe, ne l'afficher que si l'étape 6 admin est validée
      const filteredSteps = allSteps.filter(step => {
        // Si c'est l'étape 3 (Mercury Bank), vérifier que l'étape 6 admin est validée
        if (step.step_number === 3 && step.name?.includes('Mercury')) {
          return step6AdminValidated;
        }
        // Sinon, afficher toutes les autres étapes
        return true;
      });
      
      // Trier les étapes par order_index
      const sortedSteps = [...filteredSteps].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      
      // Le dossierStepsMap a déjà été créé plus haut, on l'utilise directement
      // Ajouter les logs pour le débogage
      if (dossierSteps) {
        dossierSteps.forEach((ds: any) => {
          const stepId = ds.step_id || (ds.llc_steps && typeof ds.llc_steps === 'object' ? ds.llc_steps.id : null);
          if (stepId && ds.status) {
            console.log(`Étape ${stepId} a le statut: ${ds.status}`);
          }
        });
      }

      // Trouver l'étape actuelle (première étape non complétée)
      let currentStep = sortedSteps[0]; // Par défaut, la première étape
      
      for (let i = 0; i < sortedSteps.length; i++) {
        const step = sortedSteps[i];
        const stepStatus = dossierStepsMap.get(step.id);
        
        console.log(`Vérification étape ${step.step_number} (${step.name}): statut = ${stepStatus || 'non trouvé'}`);
        
        // Si l'étape n'existe pas dans dossier_steps, c'est l'étape actuelle
        if (!stepStatus) {
          console.log(`Étape ${step.step_number} n'existe pas dans dossier_steps, c'est l'étape actuelle`);
          currentStep = step;
          break;
        }
        
        // Si l'étape est en cours ou en attente, c'est l'étape actuelle
        if (stepStatus === "en_cours" || stepStatus === "en_attente") {
          console.log(`Étape ${step.step_number} est en cours/en attente, c'est l'étape actuelle`);
          currentStep = step;
          break;
        }
        
        // Si l'étape est complétée ou validée, on vérifie la suivante
        if (stepStatus === "complete" || stepStatus === "validated") {
          console.log(`Étape ${step.step_number} est complétée/validée, on vérifie la suivante`);
          // Si c'est la dernière étape et qu'elle est complétée, c'est l'étape actuelle
          if (i === sortedSteps.length - 1) {
            console.log(`C'est la dernière étape et elle est complétée, c'est l'étape actuelle`);
            currentStep = step;
            break;
          }
          // Sinon, on continue à chercher la prochaine étape
          // (on ne break pas, on continue la boucle)
        } else {
          // Si l'étape est bloquée ou autre statut, c'est l'étape actuelle
          console.log(`Étape ${step.step_number} a un autre statut (${stepStatus}), c'est l'étape actuelle`);
          currentStep = step;
          break;
        }
      }

      console.log(`Étape actuelle déterminée: Étape ${currentStep.step_number} - ${currentStep.name}`);

      // Charger le statut de l'étape 3 Mercury Bank si elle existe et est visible
      if (step6AdminValidated) {
        const step3Mercury = allSteps.find(step => step.step_number === 3 && step.name?.includes('Mercury') && step.role === 'user');
        if (step3Mercury?.id) {
          const step3StatusValue = dossierStepsMap.get(step3Mercury.id);
          if (step3StatusValue === "validated" || step3StatusValue === "complete") {
            setStep3Status(step3StatusValue as "complete" | "validated");
          } else {
            setStep3Status(null);
          }
        }
      } else {
        // Si l'étape 6 admin n'est pas validée, l'étape 3 Mercury Bank n'est pas visible
        setStep3Status(null);
      }

      // Mettre à jour l'état avec l'étape actuelle
      setCurrentStepInfo({
        stepNumber: currentStep.step_number || 1,
        stepName: currentStep.name || `Étape ${currentStep.step_number || 1}`,
        totalSteps: sortedSteps.length,
      });
    } catch (error) {
      console.error("Erreur lors de la détermination de l'étape actuelle:", error);
    }
  };

  const handleStep1Submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStep1Error(null);

    if (!profile) {
      setStep1Error("Utilisateur non authentifié.");
      return;
    }

    // Validation des champs obligatoires
    if (!step1Form.llcName.trim()) {
      setStep1Error("Le nom de la LLC est obligatoire.");
      return;
    }

    if (!step1Form.llcNameSecondary.trim()) {
      setStep1Error("Le nom LLC secondaire est obligatoire.");
      return;
    }

    const filledAssociates = step1Form.associates.filter(
      (a) =>
        a.firstName.trim() ||
        a.lastName.trim() ||
        a.email.trim() ||
        a.phone.trim() ||
        a.address.trim()
    );
    if (filledAssociates.length > 0) {
      const hasIncomplete = filledAssociates.some(
        (a) =>
          !a.firstName.trim() ||
          !a.lastName.trim() ||
          !a.email.trim() ||
          !a.phone.trim() ||
          !a.address.trim()
      );
      if (hasIncomplete) {
        setStep1Error("Tous les champs des associés sont obligatoires.");
        return;
      }
    }

    setSubmittingStep1(true);
    try {
      const dossierStructure = filledAssociates.length > 1 ? "Plusieurs associés" : "1 associé";

      const { data: dossier, error: dossierError } = await data.upsertDossier({
        user_id: profile.id,
        first_name: step1Form.firstName.trim(),
        last_name: step1Form.lastName.trim(),
        email: step1Form.email.trim(),
        phone: step1Form.phone.trim(),
        address: step1Form.address.trim(),
        llc_name: step1Form.llcName.trim(),
        structure: dossierStructure,
        status: "en_cours",
      });

      if (dossierError || !dossier?.id) {
        setStep1Error(dossierError?.message || "Impossible d'enregistrer le dossier.");
        return;
      }

      const dossierId = dossier.id;

      // Nettoie et réinsère les associés si nécessaire
      await data.deleteAssociatesByDossierId(dossierId);

      if (filledAssociates.length > 0) {
        const associatesPayload = filledAssociates.map((assoc) => ({
          dossier_id: dossierId,
          first_name: assoc.firstName.trim(),
          last_name: assoc.lastName.trim(),
          email: assoc.email.trim(),
          phone: assoc.phone.trim(),
          address: assoc.address.trim(),
        }));

        const { data: insertedAssociates, error: associatesError } = await data.insertAssociates(associatesPayload);
        if (associatesError) {
          console.error("Erreur lors de l'insertion des associés:", associatesError);
          setStep1Error(associatesError.message || "Erreur lors de l'enregistrement des associés.");
          return;
        }
        console.log("Associés insérés avec succès dans llc_associates:", insertedAssociates?.length || 0);
      }

      // Récupérer l'ID de l'étape 1 depuis llc_steps
      const { data: step1Data, error: step1Error } = await data.getStepByNumber(1);

      if (step1Error || !step1Data) {
        console.error("Erreur lors de la récupération de l'étape 1:", step1Error);
        // Continue même si l'étape n'est pas trouvée (pour la rétrocompatibilité)
      } else {
        // Préparer le content JSON pour l'étape 1
        const step1Content: any = {
          client: {
            firstName: step1Form.firstName.trim(),
            lastName: step1Form.lastName.trim(),
            email: step1Form.email.trim(),
            phone: step1Form.phone.trim(),
            address: step1Form.address.trim(),
            llcName: step1Form.llcName.trim(),
            llcNameSecondary: step1Form.llcNameSecondary.trim(),
            structure: dossierStructure,
          },
        };
        
        // Ne sauvegarder les associés que s'il y en a vraiment
        if (filledAssociates.length > 0) {
          step1Content.associates = filledAssociates.map((assoc) => ({
            firstName: assoc.firstName.trim(),
            lastName: assoc.lastName.trim(),
            email: assoc.email.trim(),
            phone: assoc.phone.trim(),
            address: assoc.address.trim(),
          }));
        }

        // Vérifier le statut actuel avant de mettre à jour
        const { data: existingStep1 } = await data.getDossierStep(dossierId, step1Data.id);

        // Si le statut est déjà "validated", on le garde, sinon on met "complete"
        const newStatus = existingStep1?.status === "validated" ? "validated" : "complete";

        // Enregistrer dans llc_dossier_steps
        const { error: dossierStepError } = await data.upsertDossierStep(
          dossierId,
          step1Data.id,
          newStatus,
          step1Content
        );

        if (dossierStepError) {
          console.error("Erreur lors de l'enregistrement de l'étape 1:", dossierStepError);
          // Continue même si l'enregistrement de l'étape échoue
        }
      }

      setStep1Complete(true);
      // Ne pas réinitialiser le statut si il est déjà "validated"
      // Le statut sera mis à jour par la requête upsert ci-dessus
      if (step1Status !== "validated") {
        setStep1Status("complete");
      }
      setDossierId(dossierId);
      setCurrentStep(2);
      setDossierStatus("en_cours");
      setDossierName(step1Form.llcName.trim());
      setIsStep1ModalOpen(false);

      // Mettre à jour la liste des associés pour l'étape 2
      setAssociatesList(filledAssociates);

      // Recalculer l'étape actuelle
      await determineCurrentStep(dossierId);

      // Mettre à jour aussi step1ViewData si la modal de visualisation est ouverte
      if (isViewStep1ModalOpen) {
        setStep1ViewData({
          client: {
            firstName: step1Form.firstName.trim(),
            lastName: step1Form.lastName.trim(),
            email: step1Form.email.trim(),
            phone: step1Form.phone.trim(),
            address: step1Form.address.trim(),
            llcName: step1Form.llcName.trim(),
            llcNameSecondary: step1Form.llcNameSecondary.trim() || "",
            structure: dossierStructure,
          },
          associates: filledAssociates.map((assoc) => ({
            firstName: assoc.firstName.trim(),
            lastName: assoc.lastName.trim(),
            email: assoc.email.trim(),
            phone: assoc.phone.trim(),
            address: assoc.address.trim(),
          })),
        });
      }
    } catch (err) {
      setStep1Error("Une erreur est survenue.");
    } finally {
      setSubmittingStep1(false);
    }
  };

  const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setStep2Error(null);
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setStep2Error(`La taille du fichier "${file.name}" ne doit pas dépasser 10 Mo.`);
        continue;
      }
      if (!file.type.startsWith("image/")) {
        setStep2Error(`Le fichier "${file.name}" doit être une image.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Lire tous les fichiers pour créer les previews
    let loadedCount = 0;
    validFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews[index] = reader.result as string;
        loadedCount++;
        if (loadedCount === validFiles.length) {
          setAllIdCards((prev) => [...prev, ...validFiles]);
          setAllIdCardPreviews((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadIdCardToStorage = async (file: File, path: string): Promise<string | null> => {
    try {
      const { data: uploadData, error } = await data.uploadToStorage("identity-cards", path, file);

      if (error) {
        console.error("Erreur upload:", error);
        return null;
      }

      if (!uploadData) {
        return null;
      }

      const publicUrl = data.getPublicUrl("identity-cards", uploadData.path);
      return publicUrl;
    } catch (err) {
      console.error("Erreur lors de l'upload:", err);
      return null;
    }
  };

  const handleStep2Submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStep2Error(null);

    if (!profile || !dossierId) {
      setStep2Error("Erreur: dossier non trouvé.");
      return;
    }

    if (allIdCards.length === 0) {
      setStep2Error("Veuillez téléverser au moins une photo de pièce d'identité.");
      return;
    }

    setSubmittingStep2(true);
    try {
      // Upload de toutes les photos (client + associés)
      const allIdCardUrls: string[] = [];
      for (let i = 0; i < allIdCards.length; i++) {
        const file = allIdCards[i];
        const idCardPath = `${dossierId}/id-card-${i}-${Date.now()}.${file.name.split(".").pop()}`;
        const idCardUrl = await uploadIdCardToStorage(file, idCardPath);

        if (!idCardUrl) {
          setStep2Error(`Erreur lors du téléversement de la photo ${i + 1}.`);
          return;
        }
        allIdCardUrls.push(idCardUrl);
      }

      // Stocker toutes les images (sans distribution spécifique)

      // Mettre à jour le dossier pour marquer l'identité comme vérifiée (si la colonne existe)
      // Si la colonne n'existe pas, on continue quand même car on enregistre dans llc_dossier_steps
      const { error: updateError } = await data.updateDossier(dossierId, {
        identity_verified: true,
      });

      if (updateError) {
        // Si l'erreur est due à la colonne manquante, on continue quand même
        // car on enregistre tout dans llc_dossier_steps et llc_identity_images
        if (!updateError.message?.includes("identity_verified") && !updateError.message?.includes("column")) {
          setStep2Error(updateError.message || "Erreur lors de la mise à jour du dossier.");
          return;
        }
        // Sinon, on continue (la colonne n'existe peut-être pas, mais on a les données ailleurs)
      }

      // Mettre à jour les associés avec les URLs de leurs photos
      if (associatesList.length > 0) {
        // Récupérer les associés avec leurs IDs
        const { data: existingAssociates, error: fetchError } = await data.getAssociatesByDossierId(dossierId);

        if (fetchError || !existingAssociates) {
          setStep2Error("Erreur lors de la récupération des associés.");
          return;
        }

        // Créer un mapping email -> id
        const emailToIdMap = new Map(
          existingAssociates.map((a) => [a.email, a.id])
        );

        // Note: Les images sont maintenant stockées dans llc_identity_images et llc_dossier_steps
        // On ne met plus à jour id_card_url dans llc_associates (colonnes obsolètes)
      }

      // Supprimer les anciennes images de llc_identity_images pour ce dossier
      await data.deleteIdentityImagesByDossierId(dossierId);

      // Insérer toutes les images dans llc_identity_images (une ligne par image)
      const imagesToInsert = allIdCardUrls.map((imageUrl) => ({
        dossier_id: dossierId,
        image_url: imageUrl,
      }));

      if (imagesToInsert.length > 0) {
        const { error: insertImagesError } = await data.insertIdentityImages(imagesToInsert);

        if (insertImagesError) {
          console.error("Erreur lors de l'enregistrement des images:", insertImagesError);
          // Continue même si l'insertion échoue (les images sont déjà dans Storage et llc_dossiers)
        }
      }

      // Enregistrer l'étape 2 dans llc_dossier_steps avec le content JSON
      const { data: step2Info } = await data.getStepByNumber(2);

      if (step2Info?.id) {
        const step2Content = {
          images: allIdCardUrls, // Toutes les URLs des images
        };

        const { error: dossierStep2Error } = await data.upsertDossierStep(
          dossierId,
          step2Info.id,
          "validated",
          step2Content
        );

        if (dossierStep2Error) {
          console.error("Erreur lors de l'enregistrement de l'étape 2:", dossierStep2Error);
          setStep2Error("Erreur lors de l'enregistrement. Veuillez réessayer.");
          return;
        } else {
          // Mettre à jour l'état local du statut
          setStep2Status("validated");
        }
      }

      // Réinitialiser les images après l'enregistrement
      setAllIdCards([]);
      setAllIdCardPreviews([]);
      setIsStep2ModalOpen(false);
      // Optionnel : afficher un message de succès
      alert("Photos téléversées avec succès !");
      
      // Recharger la page pour s'assurer que tout est synchronisé
      window.location.reload();
    } catch (err) {
      setStep2Error("Une erreur est survenue lors de la validation d'identité.");
    } finally {
      setSubmittingStep2(false);
    }
  };

  /**
   * COMMENT VÉRIFIER SI L'ÉTAPE 1 EST VALIDÉE
   * 
   * Il y a plusieurs façons de vérifier si l'étape 1 est complétée :
   * 
   * 1. Vérifier le state local (le plus rapide) :
   *    if (step1Complete) { ... }
   * 
   * 2. Vérifier directement dans la base de données (plus fiable) :
   *    const { data } = await supabase
   *      .from("llc_dossiers")
   *      .select("id")
   *      .eq("user_id", user.id)
   *      .maybeSingle();
   *    if (data) { ... } // L'étape 1 est validée
   * 
   * 3. Vérifier si le dossier existe ET a les champs requis :
   *    const { data } = await supabase
   *      .from("llc_dossiers")
   *      .select("first_name, last_name, email, phone, address, llc_name")
   *      .eq("user_id", user.id)
   *      .maybeSingle();
   *    if (data && data.first_name && data.last_name && data.llc_name) {
   *      // L'étape 1 est complètement remplie
   *    }
   * 
   * EXEMPLES D'UTILISATION :
   * - Activer/désactiver des boutons
   * - Afficher/masquer des sections
   * - Charger des données conditionnelles
   * - Déclencher des actions automatiques
   */

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-900">
        <p className="text-neutral-500">Chargement...</p>
      </div>
    );
  }

  const userName = profile?.full_name || profile?.email?.split("@")[0] || "Utilisateur";

  const handleLogout = async () => {
    await signOut();
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
                className="flex items-center gap-3 rounded-lg bg-green-500/20 px-3 py-2.5 text-green-400 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <span className="font-medium">Mon dossier LLC</span>
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
                <span>Mon entreprise</span>
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
                placeholder="Q Rechercher dans votre dossier..."
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
        <main className="flex-1 overflow-y-auto bg-neutral-900 p-4 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            {/* Left Column - Steps */}
            <div className="lg:col-span-8">
              <div className="mb-4 lg:mb-6">
                <h1 className="text-2xl lg:text-3xl font-bold">Création de votre LLC</h1>
                <p className="mt-2 text-sm lg:text-base text-neutral-400">
                  Suivez les étapes ci-dessous pour finaliser la création de votre entreprise.
                </p>
              </div>

              <div className="space-y-4">
                {/* Étape 1 */}
                <div
                  className={`rounded-xl bg-neutral-950 p-4 lg:p-6 border ${
                    step1Status === "validated"
                      ? "border-green-500/50 bg-green-500/5"
                      : step1Complete
                      ? "border-amber-400"
                      : "border-neutral-800"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                        step1Status === "validated"
                          ? "bg-green-500 border-2 border-green-400"
                          : step1Complete
                          ? "bg-amber-500"
                          : "bg-neutral-700"
                      }`}
                    >
                      {step1Status === "validated" ? (
                        <span className="text-lg font-semibold text-white">✓</span>
                      ) : (
                        <span className="text-sm font-semibold text-white">1</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base lg:text-lg font-semibold">Étape 1: Informations de base</h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            step1Status === "validated"
                              ? "bg-green-500/20 text-green-300 border border-green-400/60"
                              : step1Complete
                              ? "bg-amber-500/20 text-amber-300 border border-amber-400/60"
                              : "bg-neutral-800 text-neutral-200"
                          }`}
                        >
                          {step1Status === "validated" 
                            ? "Validé" 
                            : step1Complete 
                            ? "En cours de validation" 
                            : "À faire"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-neutral-400">
                        Renseignez vos informations pour lancer la création de votre LLC.
                      </p>
                      {!step1Complete && (
                        <button
                          className="mt-4 rounded-lg bg-green-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600"
                          onClick={() => setIsStep1ModalOpen(true)}
                        >
                          Continuer
                        </button>
                      )}
                      {step1Complete && step1Status !== "validated" && (
                        <div className="mt-4 flex gap-3">
                          <button
                            className="rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                            onClick={async () => {
                              // Charger les données de l'étape 1 pour affichage
                              if (!dossierId) return;
                              
                              // Essayer de charger depuis llc_dossier_steps
                              const { data: step1Info } = await data.getStepByNumber(1);

                              if (step1Info?.id) {
                                const { data: step1Data } = await data.getDossierStep(dossierId, step1Info.id);

                                if (step1Data?.content) {
                                  const content = step1Data.content as any;
                                  setStep1ViewData({
                                    client: content.client ? {
                                      ...content.client,
                                      llcNameSecondary: content.client.llcNameSecondary || "",
                                    } : null,
                                    associates: Array.isArray(content.associates) ? content.associates : [],
                                  });
                                } else {
                                  // Fallback : charger depuis llc_dossiers + llc_associates
                                  const { data: dossierData } = await data.getDossierById(dossierId);

                                  const { data: associatesData } = await data.getAssociatesByDossierId(dossierId);

                                  if (dossierData) {
                                    setStep1ViewData({
                                      client: {
                                        firstName: dossierData.first_name || "",
                                        lastName: dossierData.last_name || "",
                                        email: dossierData.email || "",
                                        phone: dossierData.phone || "",
                                        address: dossierData.address || "",
                                        llcName: dossierData.llc_name || "",
                                        llcNameSecondary: (dossierData as any).llc_name_secondary || "",
                                        structure: dossierData.structure || "",
                                      },
                                      associates: associatesData && associatesData.length > 0
                                        ? associatesData.map((a) => ({
                                            firstName: a.first_name || "",
                                            lastName: a.last_name || "",
                                            email: a.email || "",
                                            phone: a.phone || "",
                                            address: a.address || "",
                                          }))
                                        : [],
                                    });
                                  }
                                }
                              }
                              setIsViewStep1ModalOpen(true);
                            }}
                          >
                            Voir mes informations
                          </button>
                          <button
                            className="rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors bg-green-500 hover:bg-green-600"
                            onClick={async () => {
                              if (!dossierId) return;
                              
                              try {
                                // Récupérer l'ID de l'étape 1
                                const { data: step1Info, error: step1InfoError } = await data.getStepByNumber(1);

                                if (step1InfoError || !step1Info) {
                                  console.error("Erreur lors de la récupération de l'étape 1:", step1InfoError);
                                  return;
                                }

                                // Récupérer le contenu existant pour le préserver
                                const { data: existingData } = await data.getDossierStep(dossierId, step1Info.id);

                                // Mettre à jour le statut avec upsert
                                const { error: updateError } = await data.upsertDossierStep(
                                  dossierId,
                                  step1Info.id,
                                  "validated",
                                  existingData?.content || null
                                );

                                if (updateError) {
                                  console.error("Erreur lors de la validation de l'étape 1:", updateError);
                                  alert("Erreur lors de la validation. Veuillez réessayer.");
                                  return;
                                }

                                // Mettre à jour l'état local
                                setStep1Status("validated");
                                
                                // Recharger la page pour s'assurer que tout est synchronisé
                                window.location.reload();
                              } catch (error) {
                                console.error("Erreur lors de la validation:", error);
                                alert("Erreur lors de la validation. Veuillez réessayer.");
                              }
                            }}
                          >
                            Valider les informations
                          </button>
                        </div>
                      )}
                      {step1Status === "validated" && (
                        <div className="mt-4 flex gap-3">
                          <button
                            className="rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                            onClick={async () => {
                              // Charger les données de l'étape 1 pour affichage
                              if (!dossierId) return;
                              
                              // Essayer de charger depuis llc_dossier_steps
                              const { data: step1Info } = await data.getStepByNumber(1);

                              if (step1Info?.id) {
                                const { data: step1Data } = await data.getDossierStep(dossierId, step1Info.id);

                                if (step1Data?.content) {
                                  const content = step1Data.content as any;
                                  setStep1ViewData({
                                    client: content.client ? {
                                      ...content.client,
                                      llcNameSecondary: content.client.llcNameSecondary || "",
                                    } : null,
                                    associates: Array.isArray(content.associates) ? content.associates : [],
                                  });
                                } else {
                                  // Fallback : charger depuis llc_dossiers + llc_associates
                                  const { data: dossierData } = await data.getDossierById(dossierId);

                                  const { data: associatesData } = await data.getAssociatesByDossierId(dossierId);

                                  if (dossierData) {
                                    setStep1ViewData({
                                      client: {
                                        firstName: dossierData.first_name || "",
                                        lastName: dossierData.last_name || "",
                                        email: dossierData.email || "",
                                        phone: dossierData.phone || "",
                                        address: dossierData.address || "",
                                        llcName: dossierData.llc_name || "",
                                        llcNameSecondary: (dossierData as any).llc_name_secondary || "",
                                        structure: dossierData.structure || "",
                                      },
                                      associates: associatesData && associatesData.length > 0
                                        ? associatesData.map((a) => ({
                                            firstName: a.first_name || "",
                                            lastName: a.last_name || "",
                                            email: a.email || "",
                                            phone: a.phone || "",
                                            address: a.address || "",
                                          }))
                                        : [],
                                    });
                                  }
                                }
                              }
                              setIsViewStep1ModalOpen(true);
                            }}
                          >
                            Voir mes informations
                          </button>
                          <div className="flex items-center">
                            <span className="inline-flex items-center rounded-lg bg-green-500/20 border border-green-400/60 px-6 py-2.5 text-sm font-medium text-green-300">
                              ✓ Validé
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Étape 2 */}
                <div className={`rounded-xl border bg-neutral-950 p-6 ${
                  step2Status === "validated"
                    ? "border-green-500/50 bg-green-500/5"
                    : step2Status === "complete"
                    ? "border-amber-400"
                    : "border-neutral-800"
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                      step2Status === "validated"
                        ? "bg-green-500 border-2 border-green-400"
                        : step2Status === "complete"
                        ? "bg-amber-500"
                        : "bg-neutral-900 border border-neutral-700"
                    }`}>
                      {step2Status === "validated" ? (
                        <span className="text-lg font-semibold text-white">✓</span>
                      ) : (
                        <span className="text-sm font-semibold text-white">2</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base lg:text-lg font-semibold">Étape 2: Validation d&apos;identité</h3>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                          step2Status === "validated"
                            ? "bg-green-500/20 text-green-300 border border-green-400/60"
                            : step2Status === "complete"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-400/60"
                            : "bg-neutral-800 text-neutral-200"
                        }`}>
                          {step2Status === "validated" 
                            ? "Validé" 
                            : step2Status === "complete"
                            ? "En cours de validation" 
                            : "À faire"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-neutral-400">
                        Vérifiez votre identité (KYC). Disponible une fois l&apos;étape précédente validée.
                      </p>
                      {step2Status === "validated" ? (
                        <div className="mt-4 flex gap-3">
                          <button
                            className="rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                            onClick={async () => {
                              // Charger les images de l'étape 2 pour affichage
                              if (!dossierId) return;
                              
                              try {
                                // Récupérer l'ID de l'étape 2
                                const { data: step2Info } = await data.getStepByNumber(2);

                                if (step2Info?.id) {
                                  // Charger les données de l'étape 2
                                  const { data: step2Data } = await data.getDossierStep(dossierId, step2Info.id);

                                  if (step2Data?.content) {
                                    const content = step2Data.content as any;
                                    const images = content.images || [];
                                    setStep2ViewImages(images);
                                    setIsViewStep2ModalOpen(true);
                                  }
                                }
                              } catch (error) {
                                console.error("Erreur lors du chargement des images:", error);
                              }
                            }}
                          >
                            Voir mes informations
                          </button>
                          <div className="flex items-center">
                            <span className="inline-flex items-center rounded-lg bg-green-500/20 border border-green-400/60 px-6 py-2.5 text-sm font-medium text-green-300">
                              ✓ Validé
                            </span>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="mt-4 rounded-lg bg-green-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
                          disabled={!step1Complete}
                          onClick={async () => {
                          // Charger les images sauvegardées si elles existent
                          if (dossierId) {
                            try {
                              // Récupérer l'ID de l'étape 2
                              const { data: step2Info } = await data.getStepByNumber(2);

                              if (step2Info?.id) {
                                // Charger les données de l'étape 2
                                const { data: step2Data } = await data.getDossierStep(dossierId, step2Info.id);

                                if (step2Data?.content) {
                                  const content = step2Data.content as any;
                                  const savedImages = content.images || [];
                                  
                                  if (savedImages.length > 0) {
                                    // Afficher les images sauvegardées comme previews
                                    setAllIdCardPreviews(savedImages);
                                    // Note: on ne peut pas recréer les File objects depuis les URLs,
                                    // donc on garde juste les previews pour l'affichage
                                    // Si l'utilisateur veut ajouter de nouvelles images, elles seront ajoutées
                                  }
                                }
                              }
                            } catch (error) {
                              console.error("Erreur lors du chargement des images:", error);
                            }
                          }
                          setIsStep2ModalOpen(true);
                        }}
                      >
                        Commencer
                      </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Étape 3 - Création de mon compte en banque Mercury Bank */}
                {allAdminStepsValidated && (
                  <div className={`rounded-xl border bg-neutral-950 p-6 ${
                    step3Status === "validated"
                      ? "border-green-500/50 bg-green-500/5"
                      : step3Status === "complete"
                      ? "border-amber-400"
                      : "border-neutral-800"
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                        step3Status === "validated"
                          ? "bg-green-500 border-2 border-green-400"
                          : step3Status === "complete"
                          ? "bg-amber-500"
                          : "bg-neutral-900 border border-neutral-700"
                      }`}>
                        {step3Status === "validated" ? (
                          <span className="text-lg font-semibold text-white">✓</span>
                        ) : (
                          <span className="text-sm font-semibold text-white">3</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base lg:text-lg font-semibold">Étape 3: Création de mon compte en banque Mercury Bank</h3>
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                            step3Status === "validated"
                              ? "bg-green-500/20 text-green-300 border border-green-400/60"
                              : step3Status === "complete"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-400/60"
                              : "bg-neutral-800 text-neutral-200"
                          }`}>
                            {step3Status === "validated" 
                              ? "Validé" 
                              : step3Status === "complete"
                              ? "En cours" 
                              : "À faire"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-neutral-400">
                          Créez votre compte bancaire professionnel Mercury Bank pour votre LLC. Accédez à tous les outils bancaires nécessaires pour gérer votre entreprise.
                        </p>
                        {!step3Status && (
                          <div className="mt-4 flex gap-3">
                            <a
                              href="/formation"
                              className="inline-block rounded-lg bg-green-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600"
                            >
                              Créer mon compte Mercury Bank
                            </a>
                            <button
                              onClick={() => setIsStep3ConfirmModalOpen(true)}
                              className="rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                            >
                              J&apos;ai créé mon compte
                            </button>
                          </div>
                        )}
                        {step3Status === "complete" && (
                          <div className="mt-4 flex items-center">
                            <span className="inline-flex items-center rounded-lg bg-amber-500/20 border border-amber-400/60 px-6 py-2.5 text-sm font-medium text-amber-300">
                              En cours de validation
                            </span>
                          </div>
                        )}
                        {step3Status === "validated" && (
                          <div className="mt-4 flex items-center">
                            <span className="inline-flex items-center rounded-lg bg-green-500/20 border border-green-400/60 px-6 py-2.5 text-sm font-medium text-green-300">
                              ✓ Validé
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Summary */}
            <div className="lg:col-span-4 space-y-4 lg:space-y-6">
              {/* Votre Dossier */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
                <h3 className="mb-2 text-base lg:text-lg font-semibold">Votre Dossier</h3>
                <p className="mb-1 text-sm font-medium">
                  {dossierName || "Aucun dossier créé pour le moment"}
                </p>
                <p className="mb-4 text-xs text-neutral-400">
                  Statut :{" "}
                  <span className="font-medium">
                    {dossierStatus === "accepte"
                      ? "✅ Dossier accepté par l'administrateur"
                      : dossierStatus === "refuse"
                      ? "❌ Dossier refusé"
                      : step1Status === "validated" && step2Status === "validated"
                      ? "2 étapes validées - En attente de validation admin"
                      : step1Status === "validated" || step2Status === "validated"
                      ? "1 étape validée"
                      : step1Complete || step2Status === "complete"
                      ? "En cours de validation"
                      : "À faire"}
                  </span>
                </p>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-neutral-400">Progression globale</span>
                    <span className="font-semibold">
                      {dossierStatus === "accepte"
                        ? "100%"
                        : step1Status === "validated" && step2Status === "validated"
                        ? "100%"
                        : step1Status === "validated" || step2Status === "validated"
                        ? "50%"
                        : "0%"}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-800">
                    <div
                      className={`h-full rounded-full ${
                        dossierStatus === "refuse"
                          ? "bg-red-500"
                          : dossierStatus === "accepte" || (step1Status === "validated" && step2Status === "validated")
                          ? "bg-green-500"
                          : "bg-amber-400"
                      }`}
                      style={{
                        width:
                          dossierStatus === "accepte" || (step1Status === "validated" && step2Status === "validated")
                            ? "100%"
                            : step1Status === "validated" || step2Status === "validated"
                            ? "50%"
                            : "0%",
                      }}
                    ></div>
                  </div>
                  {dossierStatus === "accepte" && (
                    <div className="mt-4 rounded-lg bg-green-500/20 border-2 border-green-500/50 px-4 py-3">
                      <p className="text-sm font-semibold text-green-300 mb-1">
                        🎉 Félicitations ! Votre dossier a été accepté
                      </p>
                      <p className="text-xs text-green-400/90">
                        Votre demande de création de LLC a été validée par notre équipe. Vous recevrez prochainement tous les documents nécessaires pour finaliser votre entreprise.
                      </p>
                    </div>
                  )}
                  {dossierStatus === "refuse" && (
                    <div className="mt-4 rounded-lg bg-red-500/20 border-2 border-red-500/50 px-4 py-3">
                      <p className="text-sm font-semibold text-red-300 mb-1">
                        ⚠️ Dossier refusé
                      </p>
                      <p className="text-xs text-red-400/90">
                        Votre dossier nécessite des corrections. Veuillez contacter notre équipe pour plus d'informations.
                      </p>
                    </div>
                  )}
                  {step1Status === "validated" && step2Status === "validated" && dossierStatus !== "accepte" && dossierStatus !== "refuse" && (
                    <p className="mt-4 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-300">
                      🎉 Votre dossier est complet ! Notre équipe va prendre en charge votre demande dans les 72 heures à venir. Vous recevrez une notification dès qu&apos;un administrateur aura traité votre dossier.
                    </p>
                  )}
                </div>
              </div>

              {/* Progression */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6">
                <h3 className="mb-4 text-lg font-semibold">Votre progression</h3>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-neutral-400">Étape courante</span>
                  <span className="font-semibold">
                    {currentStepInfo
                      ? `Étape ${currentStepInfo.stepNumber} / ${currentStepInfo.totalSteps}`
                      : dossierId
                      ? "Chargement..."
                      : "Étape 1 / 2"}
                  </span>
                </div>
                {currentStepInfo && (
                  <p className="mb-2 text-xs text-neutral-400">
                    {currentStepInfo.stepName}
                  </p>
                )}
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className={`h-full rounded-full transition-all ${
                      dossierStatus === "accepte" || (step1Status === "validated" && step2Status === "validated")
                        ? "bg-green-500"
                        : step1Status === "validated" || step2Status === "validated"
                        ? "bg-green-500"
                        : step1Complete
                        ? "bg-amber-400"
                        : "bg-neutral-700"
                    }`}
                    style={{
                      width: currentStepInfo
                        ? `${((currentStepInfo.stepNumber - 1) / currentStepInfo.totalSteps) * 100}%`
                        : step1Status === "validated" && step2Status === "validated"
                        ? "100%"
                        : step1Status === "validated" || step2Status === "validated"
                        ? "50%"
                        : step1Complete
                        ? "50%"
                        : "0%",
                    }}
                  ></div>
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                  {currentStepInfo
                    ? `${Math.round(((currentStepInfo.stepNumber - 1) / currentStepInfo.totalSteps) * 100)}% complété`
                    : step1Status === "validated" && step2Status === "validated"
                    ? "100% complété"
                    : step1Status === "validated" || step2Status === "validated"
                    ? "50% complété"
                    : step1Complete
                    ? "50% complété"
                    : "0% complété"}
                </p>
              </div>

              {/* Conseiller dédié */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
                <h3 className="mb-3 text-base lg:text-lg font-semibold">Conseiller dédié</h3>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600"></div>
                  <div>
                    <p className="text-sm font-medium">Alex Johnson</p>
                    <p className="text-xs text-neutral-400">Spécialiste LLC</p>
                  </div>
                </div>
                <button className="mt-4 w-full rounded-lg bg-green-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600">
                  Programmer un appel
                </button>
              </div>

              {/* Ressources */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 lg:p-6">
                <h3 className="mb-3 text-base lg:text-lg font-semibold">Ressources utiles</h3>
                <ul className="space-y-2 text-sm text-neutral-400">
                  <li>
                    <a className="text-green-400 hover:underline" href="#">
                      Guide complet de création LLC
                    </a>
                  </li>
                  <li>
                    <a className="text-green-400 hover:underline" href="#">
                      Choisir l&apos;État optimal
                    </a>
                  </li>
                  <li>
                    <a className="text-green-400 hover:underline" href="#">
                      Checklist des documents
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {isStep1ModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
              <div className="w-full max-w-3xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">Étape 1 : Informations de base</h3>
                    <p className="text-sm text-neutral-400">Renseignez les informations requises.</p>
                  </div>
                  <button
                    className="text-neutral-400 transition-colors hover:text-white"
                    onClick={() => setIsStep1ModalOpen(false)}
                  >
                    ✕
                  </button>
                </div>

                <form className="space-y-4" onSubmit={handleStep1Submit}>
                  {step1Error && (
                    <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                      {step1Error}
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm text-neutral-300">Prénom</label>
                      <input
                        required
                        value={step1Form.firstName}
                        onChange={(e) => setStep1Form((prev) => ({ ...prev, firstName: e.target.value }))}
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-neutral-300">Nom</label>
                      <input
                        required
                        value={step1Form.lastName}
                        onChange={(e) => setStep1Form((prev) => ({ ...prev, lastName: e.target.value }))}
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm text-neutral-300">Email</label>
                      <input
                        type="email"
                        required
                        value={step1Form.email}
                        onChange={(e) => setStep1Form((prev) => ({ ...prev, email: e.target.value }))}
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-neutral-300">Téléphone</label>
                      <input
                        required
                        value={step1Form.phone}
                        onChange={(e) => setStep1Form((prev) => ({ ...prev, phone: e.target.value }))}
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-neutral-300">Adresse</label>
                    <input
                      required
                      value={step1Form.address}
                      onChange={(e) => setStep1Form((prev) => ({ ...prev, address: e.target.value }))}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-neutral-300">Nom de la LLC souhaité</label>
                    <input
                      required
                      value={step1Form.llcName}
                      onChange={(e) => setStep1Form((prev) => ({ ...prev, llcName: e.target.value }))}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-neutral-300">Nom LLC secondaire souhaité</label>
                    <input
                      required
                      value={step1Form.llcNameSecondary}
                      onChange={(e) => setStep1Form((prev) => ({ ...prev, llcNameSecondary: e.target.value }))}
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-white">Associés</p>
                    <div className="space-y-4 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white">Liste des associés</p>
                        <button
                          type="button"
                          className="text-sm font-medium text-green-400 hover:text-green-300"
                          onClick={() =>
                            setStep1Form((prev) => ({
                              ...prev,
                              associates: [
                                ...prev.associates,
                                {
                                  firstName: "",
                                  lastName: "",
                                  email: "",
                                  phone: "",
                                  address: "",
                                },
                              ],
                            }))
                          }
                        >
                          + Ajouter un associé
                        </button>
                      </div>
                      <div className="space-y-4">
                        {step1Form.associates.map((assoc, idx) => (
                          <div
                            key={idx}
                            className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-950 p-3"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-white">Associé {idx + 1}</p>
                              <button
                                type="button"
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-700 text-neutral-300 transition-colors hover:border-red-500 hover:text-red-400"
                                onClick={() =>
                                  setStep1Form((prev) => {
                                    const updated = [...prev.associates];
                                    updated.splice(idx, 1);
                                    return { ...prev, associates: updated };
                                  })
                                }
                                aria-label={`Supprimer l'associé ${idx + 1}`}
                              >
                                ×
                              </button>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <div className="space-y-2">
                                <label className="text-sm text-neutral-300">Prénom de l&apos;associé</label>
                                <input
                                  required
                                  value={assoc.firstName}
                                  onChange={(e) =>
                                    setStep1Form((prev) => {
                                      const updated = [...prev.associates];
                                      updated[idx] = { ...updated[idx], firstName: e.target.value };
                                      return { ...prev, associates: updated };
                                    })
                                  }
                                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm text-neutral-300">Nom de l&apos;associé</label>
                                <input
                                  required
                                  value={assoc.lastName}
                                  onChange={(e) =>
                                    setStep1Form((prev) => {
                                      const updated = [...prev.associates];
                                      updated[idx] = { ...updated[idx], lastName: e.target.value };
                                      return { ...prev, associates: updated };
                                    })
                                  }
                                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <div className="space-y-2">
                                <label className="text-sm text-neutral-300">Email de l&apos;associé</label>
                                <input
                                  type="email"
                                  required
                                  value={assoc.email}
                                  onChange={(e) =>
                                    setStep1Form((prev) => {
                                      const updated = [...prev.associates];
                                      updated[idx] = { ...updated[idx], email: e.target.value };
                                      return { ...prev, associates: updated };
                                    })
                                  }
                                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm text-neutral-300">Téléphone de l&apos;associé</label>
                                <input
                                  required
                                  value={assoc.phone}
                                  onChange={(e) =>
                                    setStep1Form((prev) => {
                                      const updated = [...prev.associates];
                                      updated[idx] = { ...updated[idx], phone: e.target.value };
                                      return { ...prev, associates: updated };
                                    })
                                  }
                                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm text-neutral-300">Adresse de l&apos;associé</label>
                              <input
                                required
                                value={assoc.address}
                                onChange={(e) =>
                                  setStep1Form((prev) => {
                                    const updated = [...prev.associates];
                                    updated[idx] = { ...updated[idx], address: e.target.value };
                                    return { ...prev, associates: updated };
                                  })
                                }
                                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 transition-colors hover:border-neutral-500"
                      onClick={() => setIsStep1ModalOpen(false)}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submittingStep1}
                      className="rounded-lg bg-green-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
                    >
                      {submittingStep1 ? "Enregistrement..." : "Valider et passer à l'étape 2"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal pour visualiser et modifier l'étape 1 */}
          {isViewStep1ModalOpen && step1ViewData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Mes informations - Étape 1</h3>
                  <button
                    onClick={() => {
                      setIsViewStep1ModalOpen(false);
                      setIsEditingStep1(false);
                    }}
                    className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!dossierId || !step1ViewData.client) return;
                    
                    // Empêcher la modification si le statut est validé
                    if (step1Status === "validated") {
                      alert("Le dossier est validé et ne peut plus être modifié.");
                      return;
                    }

                    // Validation des champs obligatoires
                    if (!step1ViewData.client.llcName.trim()) {
                      alert("Le nom de la LLC est obligatoire.");
                      return;
                    }

                    if (!step1ViewData.client.llcNameSecondary?.trim()) {
                      alert("Le nom LLC secondaire est obligatoire.");
                      return;
                    }

                    setIsSavingStep1(true);
                    try {
                      const filledAssociates = step1ViewData.associates.filter(
                        (a) =>
                          a.firstName.trim() ||
                          a.lastName.trim() ||
                          a.email.trim() ||
                          a.phone.trim() ||
                          a.address.trim()
                      );
                      
                      // Validation : si des associés sont partiellement remplis, tous les champs doivent être remplis
                      if (filledAssociates.length > 0) {
                        const hasIncomplete = filledAssociates.some(
                          (a) =>
                            !a.firstName.trim() ||
                            !a.lastName.trim() ||
                            !a.email.trim() ||
                            !a.phone.trim() ||
                            !a.address.trim()
                        );
                        if (hasIncomplete) {
                          alert("Tous les champs des associés sont obligatoires.");
                          setIsSavingStep1(false);
                          return;
                        }
                      }
                      
                      const dossierStructure = filledAssociates.length > 1 ? "Plusieurs associés" : "1 associé";

                      // Mettre à jour llc_dossiers
                      const { error: dossierError } = await data.updateDossier(dossierId, {
                        first_name: step1ViewData.client.firstName.trim(),
                        last_name: step1ViewData.client.lastName.trim(),
                        email: step1ViewData.client.email.trim(),
                        phone: step1ViewData.client.phone.trim(),
                        address: step1ViewData.client.address.trim(),
                        llc_name: step1ViewData.client.llcName.trim(),
                        structure: dossierStructure,
                      });

                      if (dossierError) {
                        alert("Erreur lors de la mise à jour du dossier: " + dossierError.message);
                        return;
                      }

                      // Supprimer et réinsérer les associés
                      await data.deleteAssociatesByDossierId(dossierId);

                      if (filledAssociates.length > 0) {
                        const associatesPayload = filledAssociates.map((assoc) => ({
                          dossier_id: dossierId,
                          first_name: assoc.firstName.trim(),
                          last_name: assoc.lastName.trim(),
                          email: assoc.email.trim(),
                          phone: assoc.phone.trim(),
                          address: assoc.address.trim(),
                        }));

                        const { error: associatesError } = await data.insertAssociates(associatesPayload);

                        if (associatesError) {
                          alert("Erreur lors de la mise à jour des associés: " + associatesError.message);
                          return;
                        }
                      }

                      // Mettre à jour llc_dossier_steps
                      const { data: step1Info } = await data.getStepByNumber(1);

                      if (step1Info?.id) {
                        const step1Content: any = {
                          client: {
                            firstName: step1ViewData.client.firstName.trim(),
                            lastName: step1ViewData.client.lastName.trim(),
                            email: step1ViewData.client.email.trim(),
                            phone: step1ViewData.client.phone.trim(),
                            address: step1ViewData.client.address.trim(),
                            llcName: step1ViewData.client.llcName.trim(),
                            llcNameSecondary: step1ViewData.client.llcNameSecondary.trim(),
                            structure: dossierStructure,
                          },
                        };
                        
                        // Ne sauvegarder les associés que s'il y en a vraiment
                        if (filledAssociates.length > 0) {
                          step1Content.associates = filledAssociates.map((assoc) => ({
                            firstName: assoc.firstName.trim(),
                            lastName: assoc.lastName.trim(),
                            email: assoc.email.trim(),
                            phone: assoc.phone.trim(),
                            address: assoc.address.trim(),
                          }));
                        }

                        await data.upsertDossierStep(dossierId, step1Info.id, "complete", step1Content);
                      }

                      // Mettre à jour les données locales
                      setDossierName(step1ViewData.client.llcName.trim());
                      setAssociatesList(filledAssociates);

                      alert("Modifications enregistrées avec succès !");
                      setIsEditingStep1(false);
                    } catch (err: any) {
                      alert("Erreur lors de la sauvegarde: " + (err.message || "Erreur inconnue"));
                    } finally {
                      setIsSavingStep1(false);
                    }
                  }}
                >
                  {/* Informations du client */}
                  <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-950 p-6">
                    <h4 className="mb-4 text-lg font-semibold">Informations personnelles</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm text-neutral-400">Prénom</label>
                          {isEditingStep1 ? (
                            <input
                              type="text"
                              value={step1ViewData.client?.firstName || ""}
                              onChange={(e) =>
                                setStep1ViewData({
                                  ...step1ViewData,
                                  client: { ...step1ViewData.client!, firstName: e.target.value },
                                })
                              }
                              disabled={step1Status === "validated"}
                              className={`w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none ${
                                step1Status === "validated" ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                            />
                          ) : (
                            <p className="text-sm text-neutral-200">{step1ViewData.client?.firstName || "-"}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-neutral-400">Nom</label>
                          {isEditingStep1 ? (
                            <input
                              type="text"
                              value={step1ViewData.client?.lastName || ""}
                              onChange={(e) =>
                                setStep1ViewData({
                                  ...step1ViewData,
                                  client: { ...step1ViewData.client!, lastName: e.target.value },
                                })
                              }
                              disabled={step1Status === "validated"}
                              className={`w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none ${
                                step1Status === "validated" ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                            />
                          ) : (
                            <p className="text-sm text-neutral-200">{step1ViewData.client?.lastName || "-"}</p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-neutral-400">Email</label>
                        {isEditingStep1 ? (
                          <input
                            type="email"
                            value={step1ViewData.client?.email || ""}
                            onChange={(e) =>
                              setStep1ViewData({
                                ...step1ViewData,
                                client: { ...step1ViewData.client!, email: e.target.value },
                              })
                            }
                            disabled={step1Status === "validated"}
                            className={`w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none ${
                              step1Status === "validated" ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          />
                        ) : (
                          <p className="text-sm text-neutral-200">{step1ViewData.client?.email || "-"}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-neutral-400">Téléphone</label>
                        {isEditingStep1 ? (
                          <input
                            type="tel"
                            value={step1ViewData.client?.phone || ""}
                            onChange={(e) =>
                              setStep1ViewData({
                                ...step1ViewData,
                                client: { ...step1ViewData.client!, phone: e.target.value },
                              })
                            }
                            disabled={step1Status === "validated"}
                            className={`w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none ${
                              step1Status === "validated" ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          />
                        ) : (
                          <p className="text-sm text-neutral-200">{step1ViewData.client?.phone || "-"}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-neutral-400">Adresse</label>
                        {isEditingStep1 ? (
                          <input
                            type="text"
                            value={step1ViewData.client?.address || ""}
                            onChange={(e) =>
                              setStep1ViewData({
                                ...step1ViewData,
                                client: { ...step1ViewData.client!, address: e.target.value },
                              })
                            }
                            disabled={step1Status === "validated"}
                            className={`w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none ${
                              step1Status === "validated" ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          />
                        ) : (
                          <p className="text-sm text-neutral-200">{step1ViewData.client?.address || "-"}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Informations de la LLC */}
                  <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-950 p-6">
                    <h4 className="mb-4 text-lg font-semibold">Informations de la LLC</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm text-neutral-400">Nom de la LLC</label>
                        {isEditingStep1 ? (
                          <input
                            type="text"
                            value={step1ViewData.client?.llcName || ""}
                            onChange={(e) =>
                              setStep1ViewData({
                                ...step1ViewData,
                                client: { ...step1ViewData.client!, llcName: e.target.value },
                              })
                            }
                            disabled={step1Status === "validated"}
                            className={`w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none ${
                              step1Status === "validated" ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          />
                        ) : (
                          <p className="text-sm text-neutral-200">{step1ViewData.client?.llcName || "-"}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-neutral-400">Nom LLC secondaire souhaité</label>
                        {isEditingStep1 ? (
                          <input
                            type="text"
                            required
                            value={step1ViewData.client?.llcNameSecondary || ""}
                            onChange={(e) =>
                              setStep1ViewData({
                                ...step1ViewData,
                                client: { ...step1ViewData.client!, llcNameSecondary: e.target.value },
                              })
                            }
                            disabled={step1Status === "validated"}
                            className={`w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none ${
                              step1Status === "validated" ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          />
                        ) : (
                          <p className="text-sm text-neutral-200">
                            {step1ViewData.client?.llcNameSecondary || "-"}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-neutral-400">Structure</label>
                        {isEditingStep1 ? (
                          <select
                            value={step1ViewData.client?.structure || "1 associé"}
                            onChange={(e) =>
                              setStep1ViewData({
                                ...step1ViewData,
                                client: { ...step1ViewData.client!, structure: e.target.value },
                              })
                            }
                            disabled={step1Status === "validated"}
                            className={`w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none ${
                              step1Status === "validated" ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          >
                            <option value="1 associé">1 associé</option>
                            <option value="Plusieurs associés">Plusieurs associés</option>
                          </select>
                        ) : (
                          <p className="text-sm text-neutral-200">{step1ViewData.client?.structure || "-"}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Liste des associés */}
                  <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-950 p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-lg font-semibold">
                        Associés {step1ViewData.associates && step1ViewData.associates.length > 0 ? `(${step1ViewData.associates.length})` : ""}
                      </h4>
                      {isEditingStep1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setStep1ViewData({
                              ...step1ViewData,
                              associates: [
                                ...(step1ViewData.associates || []),
                                { firstName: "", lastName: "", email: "", phone: "", address: "" },
                              ],
                            });
                          }}
                          disabled={step1Status === "validated"}
                          className={`rounded-lg border border-green-500/50 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400 hover:bg-green-500/20 ${
                            step1Status === "validated" ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          + Ajouter un associé
                        </button>
                      )}
                    </div>
                    {step1ViewData.associates && step1ViewData.associates.length > 0 ? (
                      <div className="space-y-4">
                        {step1ViewData.associates.map((associate, index) => (
                          <div key={index} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                            <h5 className="mb-3 text-sm font-semibold text-neutral-300">Associé {index + 1}</h5>
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-xs text-neutral-400">Prénom</label>
                                  {isEditingStep1 ? (
                                    <input
                                      type="text"
                                      value={associate.firstName || ""}
                                      onChange={(e) => {
                                        const updated = [...step1ViewData.associates];
                                        updated[index] = { ...updated[index], firstName: e.target.value };
                                        setStep1ViewData({ ...step1ViewData, associates: updated });
                                      }}
                                      disabled={step1Status === "validated"}
                                      className={`w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-green-500 focus:outline-none ${
                                        step1Status === "validated" ? "opacity-50 cursor-not-allowed" : ""
                                      }`}
                                    />
                                  ) : (
                                    <p className="text-xs text-neutral-200">{associate.firstName || "-"}</p>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs text-neutral-400">Nom</label>
                                  {isEditingStep1 ? (
                                    <input
                                      type="text"
                                      value={associate.lastName || ""}
                                      onChange={(e) => {
                                        const updated = [...step1ViewData.associates];
                                        updated[index] = { ...updated[index], lastName: e.target.value };
                                        setStep1ViewData({ ...step1ViewData, associates: updated });
                                      }}
                                      disabled={step1Status === "validated"}
                                      className={`w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-green-500 focus:outline-none ${
                                        step1Status === "validated" ? "opacity-50 cursor-not-allowed" : ""
                                      }`}
                                    />
                                  ) : (
                                    <p className="text-xs text-neutral-200">{associate.lastName || "-"}</p>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs text-neutral-400">Email</label>
                                {isEditingStep1 ? (
                                  <input
                                    type="email"
                                    value={associate.email || ""}
                                    onChange={(e) => {
                                      const updated = [...step1ViewData.associates];
                                      updated[index] = { ...updated[index], email: e.target.value };
                                      setStep1ViewData({ ...step1ViewData, associates: updated });
                                    }}
                                    disabled={step1Status === "validated"}
                                    className={`w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-green-500 focus:outline-none ${
                                      step1Status === "validated" ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                                  />
                                ) : (
                                  <p className="text-xs text-neutral-200">{associate.email || "-"}</p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs text-neutral-400">Téléphone</label>
                                {isEditingStep1 ? (
                                  <input
                                    type="tel"
                                    value={associate.phone || ""}
                                    onChange={(e) => {
                                      const updated = [...step1ViewData.associates];
                                      updated[index] = { ...updated[index], phone: e.target.value };
                                      setStep1ViewData({ ...step1ViewData, associates: updated });
                                    }}
                                    disabled={step1Status === "validated"}
                                    className={`w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-green-500 focus:outline-none ${
                                      step1Status === "validated" ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                                  />
                                ) : (
                                  <p className="text-xs text-neutral-200">{associate.phone || "-"}</p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs text-neutral-400">Adresse</label>
                                {isEditingStep1 ? (
                                  <input
                                    type="text"
                                    value={associate.address || ""}
                                    onChange={(e) => {
                                      const updated = [...step1ViewData.associates];
                                      updated[index] = { ...updated[index], address: e.target.value };
                                      setStep1ViewData({ ...step1ViewData, associates: updated });
                                    }}
                                    disabled={step1Status === "validated"}
                                    className={`w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-green-500 focus:outline-none ${
                                      step1Status === "validated" ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                                  />
                                ) : (
                                  <p className="text-xs text-neutral-200">{associate.address || "-"}</p>
                                )}
                              </div>
                              {isEditingStep1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = step1ViewData.associates.filter((_, i) => i !== index);
                                    setStep1ViewData({ ...step1ViewData, associates: updated });
                                  }}
                                  disabled={step1Status === "validated"}
                                  className={`mt-2 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 ${
                                    step1Status === "validated" ? "opacity-50 cursor-not-allowed" : ""
                                  }`}
                                >
                                  Supprimer cet associé
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500">
                        {isEditingStep1 
                          ? "Aucun associé pour le moment. Cliquez sur 'Ajouter un associé' pour en ajouter un."
                          : "Aucun associé enregistré."}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    {!isEditingStep1 ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsViewStep1ModalOpen(false);
                          }}
                          className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
                        >
                          Fermer
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsEditingStep1(true);
                          }}
                          disabled={step1Status === "validated"}
                          className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                            step1Status === "validated"
                              ? "bg-gray-500 cursor-not-allowed opacity-50"
                              : "bg-blue-500 hover:bg-blue-600"
                          }`}
                          title={step1Status === "validated" ? "Le dossier est validé et ne peut plus être modifié" : ""}
                        >
                          Modifier
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Recharger les données depuis la BDD pour annuler les modifications
                            if (!dossierId) {
                              setIsEditingStep1(false);
                              return;
                            }

                            // Recharger les données originales
                            const { data: step1Info } = await data.getStepByNumber(1);

                            if (step1Info?.id) {
                              const { data: step1Data } = await data.getDossierStep(dossierId, step1Info.id);

                              if (step1Data?.content) {
                                const content = step1Data.content as any;
                                setStep1ViewData({
                                  client: content.client || null,
                                  associates: content.associates || [],
                                });
                              } else {
                                // Fallback : charger depuis llc_dossiers + llc_associates
                                const { data: dossierData } = await data.getDossierById(dossierId);

                                const { data: associatesData } = await data.getAssociatesByDossierId(dossierId);

                                if (dossierData) {
                                  setStep1ViewData({
                                    client: {
                                      firstName: dossierData.first_name || "",
                                      lastName: dossierData.last_name || "",
                                      email: dossierData.email || "",
                                      phone: dossierData.phone || "",
                                      address: dossierData.address || "",
                                      llcName: dossierData.llc_name || "",
                                      llcNameSecondary: "",
                                      structure: dossierData.structure || "",
                                    },
                                    associates: (associatesData || []).map((a: any) => ({
                                      firstName: a.first_name || "",
                                      lastName: a.last_name || "",
                                      email: a.email || "",
                                      phone: a.phone || "",
                                      address: a.address || "",
                                    })),
                                  });
                                }
                              }
                            }
                            setIsEditingStep1(false);
                          }}
                          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 hover:border-neutral-500"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingStep1 || step1Status === "validated"}
                          className={`rounded-lg px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400 ${
                            step1Status === "validated" ? "bg-gray-500" : "bg-green-500"
                          }`}
                        >
                          {isSavingStep1 ? "Enregistrement..." : "Enregistrer les modifications"}
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {isViewStep2ModalOpen && step2ViewImages.length > 0 && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Mes images - Étape 2</h3>
                  <button
                    onClick={() => setIsViewStep2ModalOpen(false)}
                    className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-neutral-400">
                    Vous avez téléversé {step2ViewImages.length} image{step2ViewImages.length > 1 ? "s" : ""} pour la validation d'identité.
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {step2ViewImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Image d'identité ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg border border-neutral-700"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => window.open(imageUrl, "_blank")}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium"
                          >
                            Voir en grand
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setIsViewStep2ModalOpen(false)}
                    className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}

          {isStep2ModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
              <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">Étape 2 : Validation d&apos;identité</h3>
                    <p className="text-sm text-neutral-400">
                      Veuillez téléverser votre pièce d&apos;identité ainsi que celles de vos associés pour valider votre identité.
                    </p>
                  </div>
                  <button
                    className="text-neutral-400 transition-colors hover:text-white"
                    onClick={() => {
                      setIsStep2ModalOpen(false);
                      // Réinitialiser les images quand on ferme la modal
                      setAllIdCards([]);
                      setAllIdCardPreviews([]);
                    }}
                  >
                    ✕
                  </button>
                </div>

                <form className="space-y-6" onSubmit={handleStep2Submit}>
                  {step2Error && (
                    <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                      {step2Error}
                    </div>
                  )}

                  <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 px-4 py-3">
                    <p className="text-sm text-blue-200">
                      <strong>Important :</strong> Vous devez ajouter votre pièce d&apos;identité ainsi que celles de tous vos associés. Vous pouvez ajouter plusieurs photos pour chaque personne (recto et verso si nécessaire).
                    </p>
                  </div>

                  {/* Upload des pièces d'identité */}
                  <div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                    <div className="space-y-3">
                      <label className="block">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleIdCardChange}
                          className="hidden"
                          id="id-card-input"
                          required={allIdCards.length === 0}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('id-card-input')?.click()}
                          className="w-full rounded-lg border border-green-500 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-400 transition-colors hover:bg-green-500/20"
                        >
                          + Ajouter une image
                        </button>
                      </label>
                      <div>
                        <p className="mb-2 text-xs text-neutral-400">
                          Aperçu {allIdCardPreviews.length > 0 && `(${allIdCardPreviews.length} photo${allIdCardPreviews.length > 1 ? "s" : ""})`} :
                        </p>
                        {allIdCardPreviews.length > 0 ? (
                          <div className="flex flex-wrap gap-3">
                            {allIdCardPreviews.map((preview, idx) => (
                              <div key={idx} className="relative">
                                <img
                                  src={preview}
                                  alt={`Aperçu ${idx + 1}`}
                                  className="h-32 w-32 rounded-lg border border-neutral-700 object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Supprimer l'image des previews
                                    setAllIdCardPreviews((prev) => prev.filter((_, i) => i !== idx));
                                    // Supprimer aussi le fichier correspondant si c'est une nouvelle image
                                    if (idx < allIdCards.length) {
                                      setAllIdCards((prev) => prev.filter((_, i) => i !== idx));
                                    }
                                    // Si c'est une image sauvegardée (index >= allIdCards.length),
                                    // on la supprimera de la BDD lors de la prochaine soumission
                                  }}
                                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600"
                                  aria-label="Supprimer la photo"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed border-neutral-700 bg-neutral-950 p-8 text-center">
                            <p className="text-sm text-neutral-500">Aucune image sélectionnée</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 transition-colors hover:border-neutral-500"
                      onClick={() => {
                        setIsStep2ModalOpen(false);
                        // Réinitialiser les images quand on annule
                        setAllIdCards([]);
                        setAllIdCardPreviews([]);
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={submittingStep2}
                      className="rounded-lg bg-green-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
                    >
                      {submittingStep2 ? "Téléversement en cours..." : "Valider et soumettre"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal de confirmation pour l'étape 3 Mercury Bank */}
          {isStep3ConfirmModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
              <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">Confirmer la validation</h3>
                    <p className="text-sm text-neutral-400">Confirmez que vous avez créé votre compte Mercury Bank.</p>
                  </div>
                  <button
                    className="text-neutral-400 transition-colors hover:text-white"
                    onClick={() => setIsStep3ConfirmModalOpen(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-neutral-300">
                    Êtes-vous sûr de vouloir valider cette étape ? Vous confirmez avoir créé votre compte bancaire Mercury Bank.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsStep3ConfirmModalOpen(false)}
                    className="flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-5 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsStep3ConfirmModalOpen(false);
                      if (!dossierId) return;
                      
                      try {
                        // Récupérer toutes les étapes user pour trouver l'étape 3 Mercury Bank
                        const { data: allUserSteps } = await data.getAllSteps("user");
                        
                        // Trouver l'étape 3 Mercury Bank avec role = 'user'
                        const step3Mercury = allUserSteps?.find(
                          step => step.step_number === 3 && step.name?.includes('Mercury') && step.role === 'user'
                        );
                        
                        if (step3Mercury?.id) {
                          // Marquer l'étape 3 comme validée
                          const completionData = { 
                            completed: true, 
                            completed_at: new Date().toISOString() 
                          };
                          
                          console.log("📤 Envoi vers la BDD - Étape 3 Mercury Bank:", {
                            dossier_id: dossierId,
                            step_id: step3Mercury.id,
                            status: "validated",
                            content: completionData
                          });
                          
                          const { data: savedStep, error } = await data.upsertDossierStep(
                            dossierId,
                            step3Mercury.id,
                            "validated",
                            completionData
                          );
                          
                          if (error) {
                            console.error("❌ Erreur lors de l'enregistrement dans la BDD:", error);
                            alert("Erreur lors de la mise à jour de l'étape: " + error.message);
                          } else if (savedStep) {
                            console.log("✅ VÉRIFICATION BDD - Données confirmées enregistrées:", {
                              id: savedStep.id,
                              dossier_id: savedStep.dossier_id,
                              step_id: savedStep.step_id,
                              status: savedStep.status,
                              content: savedStep.content,
                              completed_at: savedStep.completed_at,
                              created_at: savedStep.created_at,
                              updated_at: savedStep.updated_at
                            });
                            console.log("✅ L'étape 3 Mercury Bank est bien stockée dans la table llc_dossier_steps de Supabase");
                            setStep3Status("validated");
                            // Recharger les données
                            await determineCurrentStep(dossierId);
                          } else {
                            console.warn("⚠️ Aucune donnée retournée après l'enregistrement");
                            alert("L'enregistrement semble avoir réussi mais aucune donnée n'a été retournée.");
                          }
                        } else {
                          alert("Étape Mercury Bank introuvable");
                        }
                      } catch (error: any) {
                        console.error("Erreur:", error);
                        alert("Erreur: " + (error.message || "Erreur inconnue"));
                      }
                    }}
                    className="flex-1 rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

