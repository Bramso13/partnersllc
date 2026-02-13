import { useState, useEffect, useRef } from "react";
import { useApi } from "@/lib/api/useApi";
import type { UseStepDataReturn, StepFieldWithValidation } from "../types";
import type { StepInstance } from "@/types/dossiers";
import type {
  FormationSummary,
  FormationWithElements,
  UserFormationProgress,
  StepFormationItem,
} from "@/types/formations";

/**
 * Custom hook to load and manage step data (instance, fields, documents, formations).
 *
 * Handles:
 * - Step instance fetching (creates DRAFT if doesn't exist)
 * - Step fields with current values and validation status
 * - Document loading (filtered for ADMIN steps)
 * - Formation loading (inline for FORMATION steps, recommendations for others)
 * - Loading states and error handling
 *
 * @param dossierId - Dossier ID
 * @param stepId - Current step ID
 * @param stepType - Step type (CLIENT/ADMIN/FORMATION)
 * @param isAdminStep - Whether current step is admin-managed
 * @param isFormationStep - Whether current step is a formation
 * @param formationId - Optional formation ID for FORMATION steps
 * @returns Step data state
 *
 * @example
 * const stepData = useStepData({
 *   dossierId,
 *   stepId: currentStep.step_id,
 *   stepType: currentStep.step?.step_type,
 *   isAdminStep,
 *   isFormationStep,
 *   formationId: currentStep.formation_id
 * });
 */
export function useStepData({
  dossierId,
  stepId,
  stepType,
  isAdminStep,
  isFormationStep,
  formationId,
}: {
  dossierId: string;
  stepId: string;
  stepType?: string;
  isAdminStep: boolean;
  isFormationStep: boolean;
  formationId?: string | null;
}): UseStepDataReturn {
  const api = useApi();
  const [currentStepInstance, setCurrentStepInstance] =
    useState<StepInstance | null>(null);
  const [currentStepFields, setCurrentStepFields] = useState<
    StepFieldWithValidation[]
  >([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [stepFormations, setStepFormations] = useState<FormationSummary[]>([]);
  const [stepFormationItems, setStepFormationItems] = useState<
    StepFormationItem[]
  >([]);
  const [formationFull, setFormationFull] =
    useState<FormationWithElements | null>(null);
  const [formationProgress, setFormationProgress] =
    useState<UserFormationProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formationLoading, setFormationLoading] = useState(false);

  const lastLoadedStepIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!stepId) return;

    // Skip if we're already loading/loaded this step
    if (lastLoadedStepIdRef.current === stepId) return;

    // Mark this step as being loaded immediately to prevent duplicate calls
    lastLoadedStepIdRef.current = stepId;

    const loadStepData = async () => {
      setIsLoading(true);
      try {
        // First, get step instance for this step (will be created in DRAFT if it doesn't exist)
        let stepInstance: StepInstance | null = null;
        try {
          stepInstance = await api.get<StepInstance>(
            `/api/workflow/step-instance?dossier_id=${dossierId}&step_id=${stepId}`
          );
          if (stepInstance) setCurrentStepInstance(stepInstance);
        } catch {
          // Instance may not exist yet
        }

        // Load fields with values if step instance exists (only for client steps, not ADMIN/FORMATION)
        const stepInstanceId = stepInstance?.id;
        let fields: StepFieldWithValidation[] = [];
        if (!isAdminStep && !isFormationStep) {
          const fieldsUrl = stepInstanceId
            ? `/api/workflow/step-fields?step_id=${stepId}&step_instance_id=${stepInstanceId}`
            : `/api/workflow/step-fields?step_id=${stepId}`;

          fields = await api.get<StepFieldWithValidation[]>(fieldsUrl);
          setCurrentStepFields(fields);
        } else {
          // Admin and FORMATION steps don't have fields
          setCurrentStepFields([]);
        }

        // Load uploaded documents for this dossier
        const docsUrl = stepInstanceId
          ? `/api/workflow/dossier-documents?dossier_id=${dossierId}&step_instance_id=${stepInstanceId}`
          : `/api/workflow/dossier-documents?dossier_id=${dossierId}`;

        try {
          const docs = await api.get<any[]>(docsUrl);
          const filteredDocs = isAdminStep
            ? docs.filter((doc: any) => {
                const uploadedByType = doc.current_version?.uploaded_by_type;
                return uploadedByType === "AGENT";
              })
            : docs;
          setUploadedDocuments(filteredDocs);
        } catch {
          setUploadedDocuments([]);
        }

        // Formations: for FORMATION step use formationId; else fetch by-step (recommended)
        if (isFormationStep && formationId) {
          // Fetch full formation with elements for inline display
          setFormationLoading(true);
          try {
            const data = await api.get<{
              formation?: FormationWithElements;
              progress?: UserFormationProgress;
            }>(`/api/formations/${formationId}`);
            const formation = data?.formation ?? null;
            const progress = data?.progress ?? null;
            setFormationFull(formation);
            setFormationProgress(progress);
            if (formation) setStepFormations([formation]);
            else {
              setFormationFull(null);
              setFormationProgress(null);
              setStepFormations([]);
            }
          } catch {
            setFormationFull(null);
            setFormationProgress(null);
            setStepFormations([]);
          } finally {
            setFormationLoading(false);
          }
        } else {
          // Not a formation step, or no formation ID
          setFormationFull(null);
          setFormationProgress(null);
          try {
            const formationsData = await api.get<{
              formations?: FormationSummary[];
              items?: StepFormationItem[];
            }>(`/api/formations/by-step/${stepId}`);
            setStepFormations(formationsData.formations ?? []);
            setStepFormationItems(formationsData.items ?? []);
          } catch {
            setStepFormations([]);
            setStepFormationItems([]);
          }
        }
      } catch {
        // Reset ref on error so we can retry
        lastLoadedStepIdRef.current = null;
        // Reset all states on error
        setCurrentStepInstance(null);
        setCurrentStepFields([]);
        setUploadedDocuments([]);
        setStepFormations([]);
        setStepFormationItems([]);
        setFormationFull(null);
        setFormationProgress(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadStepData();
  }, [dossierId, stepId, isAdminStep, isFormationStep, formationId]);

  const reloadDocuments = async () => {
    const stepInstanceId = currentStepInstance?.id;
    const docsUrl = stepInstanceId
      ? `/api/workflow/dossier-documents?dossier_id=${dossierId}&step_instance_id=${stepInstanceId}`
      : `/api/workflow/dossier-documents?dossier_id=${dossierId}`;

    try {
      const docs = await api.get<any[]>(docsUrl);
      const filteredDocs = isAdminStep
        ? docs.filter((doc: any) => {
            const uploadedByType = doc.current_version?.uploaded_by_type;
            return uploadedByType === "AGENT";
          })
        : docs;
      setUploadedDocuments(filteredDocs);
    } catch {
      // keep current uploadedDocuments
    }
  };

  return {
    currentStepInstance,
    currentStepFields,
    uploadedDocuments,
    stepFormations,
    stepFormationItems,
    formationFull,
    formationProgress,
    isLoading,
    formationLoading,
    reloadDocuments,
  };
}
