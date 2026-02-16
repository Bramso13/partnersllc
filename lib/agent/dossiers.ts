import { createAdminClient } from "@/lib/supabase/server";

// =========================================================
// TYPES
// =========================================================

export interface AgentDossierListItem {
  id: string;
  status: string;
  type: string;
  created_at: string;
  current_step_code: string | null;
  current_step_label: string | null;
  client_full_name: string | null;
  client_company_name: string | null;
  /** Progression Story 8.5: steps complétées par l'agent sur ce dossier */
  steps_completed_by_agent: number;
  /** Total de step_instances du dossier */
  steps_total: number;
  /** Documents traités par l'agent (reviews + livraisons admin) */
  documents_processed_by_agent: number;
  /** Total de documents du dossier (toutes steps) */
  documents_total: number;
}

export interface DossierAllData {
  dossier: {
    id: string;
    status: string;
    type: string;
    created_at: string;
    updated_at: string;
    product_id: string | null;
  };
  product: {
    id: string;
    name: string;
  } | null;
  client: {
    id: string;
    full_name: string | null;
    phone: string | null;
  };
  step_instances: Array<{
    id: string;
    step: {
      id: string;
      label: string | null;
      code: string;
      position: number;
      step_type: "CLIENT" | "ADMIN";
    };
    started_at: string | null;
    completed_at: string | null;
    assigned_to: string | null;
    fields: Array<{
      field_label: string | null;
      field_key: string;
      value: string | null;
      value_jsonb: any;
    }>;
    documents?: Array<{
      document_type: string;
      status: string;
      file_name: string | null;
      uploaded_at: string | null;
    }>;
    /** Pour les steps CLIENT : documents requis pour la vérification (approuver/rejeter, compléter étape) */
    required_documents_verificateur?: Array<{
      document_type: { id: string; code: string; label: string };
      document?: {
        id: string;
        status: "PENDING" | "APPROVED" | "REJECTED";
        current_version: {
          id: string;
          file_url: string;
          file_name: string;
          uploaded_at: string;
          version_number?: number;
        };
        previous_versions?: Array<{
          id: string;
          version_number: number;
          uploaded_at: string;
          file_url: string;
          review_status: "APPROVED" | "REJECTED" | null;
          review_reason: string | null;
        }>;
      };
    }>;
    // ADMIN documents for step type ADMIN
    admin_documents?: Array<{
      document_type: {
        id: string;
        code: string;
        label: string;
        description: string;
      };
      document?: {
        id: string;
        status: "PENDING" | "DELIVERED";
        current_version: {
          id: string;
          file_url: string;
          file_name: string;
          uploaded_at: string;
        };
        delivered_at?: string;
      };
    }>;
  }>;
  admin_steps_without_instance: Array<{
    step: {
      id: string;
      label: string | null;
      code: string;
      position: number;
      step_type: "ADMIN";
    };
    product_step_id: string;
  }>;
}

// =========================================================
// FUNCTIONS
// =========================================================

/**
 * Get all dossiers where the agent is assigned via dossier_agent_assignments
 * @param agentId The agent's id
 * @returns List of dossiers with basic info
 */
export async function getAgentDossiers(
  agentId: string
): Promise<AgentDossierListItem[]> {
  const supabase = createAdminClient();

  // Get all dossiers where agent is assigned via dossier_agent_assignments
  const { data: assignments, error } = await supabase
    .from("dossier_agent_assignments")
    .select("dossier_id")
    .eq("agent_id", agentId);

  if (error) {
    console.error("Error fetching agent dossier assignments:", error);
    throw error;
  }

  // Get unique dossier IDs
  const uniqueDossierIds = assignments?.map((a: any) => a.dossier_id) || [];

  // Fetch full dossier details with client info and current step
  const { data: dossiersWithDetails, error: detailsError } = await supabase
    .from("dossiers")
    .select(
      `
      id,
      status,
      type,
      created_at,
      user_id,
      current_step_instance_id,
      profiles!user_id (
        id,
        full_name,

        phone
      ),
      current_step_instance:step_instances!current_step_instance_id (
        step:steps (
          code,
          label
        )
      )
    `
    )
    .in("id", uniqueDossierIds);

  if (detailsError) {
    console.error("Error fetching dossier details:", detailsError);
    throw detailsError;
  }

  // Get company names from step_field_values (assuming there's a field for company name)
  const { data: companyNames } = await supabase
    .from("step_field_values")
    .select(
      `
      step_instance:step_instances!inner (
        dossier_id
      ),
      step_field:step_fields!inner (
        field_key
      ),
      value
    `
    )
    .in("step_instance.dossier_id", uniqueDossierIds)
    .eq("step_field.field_key", "company_name");

  // Map company names by dossier ID
  const companyNameMap = new Map<string, string>();
  companyNames?.forEach((item: any) => {
    if (item.step_instance?.dossier_id && item.value) {
      companyNameMap.set(item.step_instance.dossier_id, item.value);
    }
  });

  // Progression: steps and documents per dossier (Story 8.5)
  const { data: stepInstancesForProgress } = await supabase
    .from("step_instances")
    .select(
      "id, dossier_id, assigned_to, completed_at, validated_by, validated_at"
    )
    .in("dossier_id", uniqueDossierIds);

  const stepsTotalByDossier = new Map<string, number>();
  const stepsCompletedByAgentByDossier = new Map<string, number>();
  const stepInstanceIdsByDossier = new Map<string, string[]>();

  stepInstancesForProgress?.forEach((si: any) => {
    const did = si.dossier_id;
    stepsTotalByDossier.set(did, (stepsTotalByDossier.get(did) || 0) + 1);
    if (si.validated_by === agentId && si.validated_at) {
      stepsCompletedByAgentByDossier.set(
        did,
        (stepsCompletedByAgentByDossier.get(did) || 0) + 1
      );
    }
    const ids = stepInstanceIdsByDossier.get(did) || [];
    ids.push(si.id);
    stepInstanceIdsByDossier.set(did, ids);
  });

  const allStepInstanceIds = (stepInstancesForProgress || []).map(
    (si: any) => si.id
  );

  let documentsTotalByDossier = new Map<string, number>();
  let documentsProcessedByAgentByDossier = new Map<string, number>();

  if (allStepInstanceIds.length > 0) {
    const { data: documentsInDossiers } = await supabase
      .from("documents")
      .select("id, step_instance_id, status")
      .in("step_instance_id", allStepInstanceIds);

    const dossierIdByStepInstanceId = new Map<string, string>();
    stepInstancesForProgress?.forEach((si: any) => {
      dossierIdByStepInstanceId.set(si.id, si.dossier_id);
    });

    documentsInDossiers?.forEach((doc: any) => {
      const dossierId = dossierIdByStepInstanceId.get(doc.step_instance_id);
      if (!dossierId) return;
      documentsTotalByDossier.set(
        dossierId,
        (documentsTotalByDossier.get(dossierId) || 0) + 1
      );
    });

    const documentIds = (documentsInDossiers || []).map((d: any) => d.id);
    if (documentIds.length > 0) {
      const { data: reviewsByAgent } = await supabase
        .from("document_reviews")
        .select("document_version_id")
        .eq("reviewer_id", agentId);

      const versionIds = new Set(
        (reviewsByAgent || []).map((r: any) => r.document_version_id)
      );

      const { data: docVersions } = await supabase
        .from("document_versions")
        .select("id, document_id")
        .in("id", Array.from(versionIds));

      const docIdToDossierId = new Map<string, string>();
      (documentsInDossiers || []).forEach((d: any) => {
        const did = dossierIdByStepInstanceId.get(d.step_instance_id);
        if (did) docIdToDossierId.set(d.id, did);
      });

      const reviewedDocIdsByDossier = new Map<string, Set<string>>();
      docVersions?.forEach((dv: any) => {
        const docId = dv.document_id;
        const did = docIdToDossierId.get(docId);
        if (!did) return;
        let set = reviewedDocIdsByDossier.get(did);
        if (!set) {
          set = new Set();
          reviewedDocIdsByDossier.set(did, set);
        }
        set.add(docId);
      });
      reviewedDocIdsByDossier.forEach((docIds, did) => {
        documentsProcessedByAgentByDossier.set(
          did,
          (documentsProcessedByAgentByDossier.get(did) || 0) + docIds.size
        );
      });
    }

    const stepsAssignedToAgent = new Set(
      (stepInstancesForProgress || [])
        .filter((si: any) => si.assigned_to === agentId)
        .map((si: any) => si.id)
    );
    documentsInDossiers?.forEach((doc: any) => {
      if (
        doc.status !== "DELIVERED" ||
        !stepsAssignedToAgent.has(doc.step_instance_id)
      )
        return;
      const dossierId = dossierIdByStepInstanceId.get(doc.step_instance_id);
      if (!dossierId) return;
      documentsProcessedByAgentByDossier.set(
        dossierId,
        (documentsProcessedByAgentByDossier.get(dossierId) || 0) + 1
      );
    });
  }

  // Transform to AgentDossierListItem
  const result: AgentDossierListItem[] =
    dossiersWithDetails?.map((d: any) => ({
      id: d.id,
      status: d.status,
      type: d.type,
      created_at: d.created_at,
      current_step_code: d.current_step_instance?.step?.code || null,
      current_step_label: d.current_step_instance?.step?.label || null,
      client_full_name: d.profiles?.full_name || null,
      client_company_name: companyNameMap.get(d.id) || null,
      steps_completed_by_agent: stepsCompletedByAgentByDossier.get(d.id) || 0,
      steps_total: stepsTotalByDossier.get(d.id) || 0,
      documents_processed_by_agent:
        documentsProcessedByAgentByDossier.get(d.id) || 0,
      documents_total: documentsTotalByDossier.get(d.id) || 0,
    })) || [];

  return result;
}

export interface AgentProgressSummary {
  steps_completed_by_agent: number;
  steps_total: number;
  documents_processed_by_agent: number;
  documents_total: number;
}

/**
 * Résumé de progression d'un agent sur l'ensemble de ses dossiers (Story 8.5 - admin Gestion Agents).
 */
export async function getAgentProgressSummary(
  agentId: string
): Promise<AgentProgressSummary> {
  const supabase = createAdminClient();

  const { data: assignments } = await supabase
    .from("dossier_agent_assignments")
    .select("dossier_id")
    .eq("agent_id", agentId);
  const dossierIds = (assignments || []).map((a: any) => a.dossier_id);
  if (dossierIds.length === 0) {
    return {
      steps_completed_by_agent: 0,
      steps_total: 0,
      documents_processed_by_agent: 0,
      documents_total: 0,
    };
  }

  const { data: stepInstances } = await supabase
    .from("step_instances")
    .select("id, dossier_id, assigned_to, completed_at")
    .in("dossier_id", dossierIds);

  let steps_total = stepInstances?.length ?? 0;
  let steps_completed_by_agent = 0;
  const stepInstanceIds = (stepInstances || []).map((si: any) => si.id);

  stepInstances?.forEach((si: any) => {
    if (si.assigned_to === agentId && si.completed_at)
      steps_completed_by_agent += 1;
  });

  let documents_total = 0;
  let documents_processed_by_agent = 0;

  if (stepInstanceIds.length > 0) {
    const { data: docs } = await supabase
      .from("documents")
      .select("id, step_instance_id, status")
      .in("step_instance_id", stepInstanceIds);
    documents_total = docs?.length ?? 0;

    const stepsAssignedToAgent = new Set(
      (stepInstances || [])
        .filter((si: any) => si.assigned_to === agentId)
        .map((si: any) => si.id)
    );
    const dossierIdByStep = new Map(
      (stepInstances || []).map((si: any) => [si.id, si.dossier_id])
    );

    docs?.forEach((d: any) => {
      if (
        d.status === "DELIVERED" &&
        stepsAssignedToAgent.has(d.step_instance_id)
      ) {
        documents_processed_by_agent += 1;
      }
    });

    const { data: reviews } = await supabase
      .from("document_reviews")
      .select("document_version_id")
      .eq("reviewer_id", agentId);
    const versionIds = (reviews || []).map((r: any) => r.document_version_id);
    if (versionIds.length > 0) {
      const { data: versions } = await supabase
        .from("document_versions")
        .select("id, document_id")
        .in("id", versionIds);
      const reviewedDocIds = new Set(
        (versions || []).map((v: any) => v.document_id)
      );
      const docIdsInDossiers = new Set((docs || []).map((d: any) => d.id));
      reviewedDocIds.forEach((docId) => {
        if (docIdsInDossiers.has(docId)) documents_processed_by_agent += 1;
      });
    }
  }

  return {
    steps_completed_by_agent,
    steps_total,
    documents_processed_by_agent,
    documents_total,
  };
}

/**
 * Get all data for a dossier (for copying)
 * @param dossierId The dossier ID
 * @param agentId The agent's id (for access control)
 * @returns All dossier data including client, steps, fields, and documents
 */
export async function getDossierAllData(
  dossierId: string,
  agentId: string
): Promise<DossierAllData | null> {
  const supabase = createAdminClient();

  // First, verify the agent has access to this dossier via dossier_agent_assignments
  const { data: accessCheck } = await supabase
    .from("dossier_agent_assignments")
    .select("id")
    .eq("dossier_id", dossierId)
    .eq("agent_id", agentId)
    .limit(1)
    .maybeSingle();

  if (!accessCheck) {
    throw new Error("Agent does not have access to this dossier");
  }

  // Get dossier basic info
  const { data: dossier, error: dossierError } = await supabase
    .from("dossiers")
    .select(
      `
      id,
      status,
      type,
      created_at,
      updated_at,
      user_id,
      product_id
    `
    )
    .eq("id", dossierId)
    .single();

  if (dossierError || !dossier) {
    console.error("Error fetching dossier:", dossierError);
    throw dossierError || new Error("Dossier not found");
  }

  // Get client info
  const { data: client, error: clientError } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .eq("id", dossier.user_id)
    .single();

  if (clientError || !client) {
    console.error("Error fetching client:", clientError);
    throw clientError || new Error("Client not found");
  }

  // Get product info if product_id exists
  let product = null;
  if (dossier.product_id) {
    const { data: productData, error: productError } = await supabase
      .from("products")
      .select("id, name")
      .eq("id", dossier.product_id)
      .single();

    if (!productError && productData) {
      product = {
        id: productData.id,
        name: productData.name,
      };
    }
  }

  // Get all step_instances for this dossier
  const { data: stepInstances, error: stepInstancesError } = await supabase
    .from("step_instances")
    .select(
      `
      id,
      started_at,
      completed_at,
      assigned_to,
      step:steps (
        id,
        code,
        label,
        position,
        step_type
      )
    `
    )
    .eq("dossier_id", dossierId)
    .order("step(position)", { ascending: true });

  if (stepInstancesError) {
    console.error("Error fetching step instances:", stepInstancesError);
    throw stepInstancesError;
  }

  // Get all field values for all step instances
  const stepInstanceIds = stepInstances?.map((si: any) => si.id) || [];
  const { data: fieldValues, error: fieldValuesError } = await supabase
    .from("step_field_values")
    .select(
      `
      step_instance_id,
      value,
      value_jsonb,
      step_field:step_fields (
        field_key,
        label
      )
    `
    )
    .in("step_instance_id", stepInstanceIds);

  if (fieldValuesError) {
    console.error("Error fetching field values:", fieldValuesError);
    throw fieldValuesError;
  }

  // Get all documents for all step instances (include id, document_type_id for required_documents_verificateur)
  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select(
      `
      id,
      step_instance_id,
      document_type_id,
      status,
      current_version:document_versions!fk_current_version (
        id,
        file_name,
        uploaded_at,
        version_number
      ),
      document_type:document_types!document_type_id (
        id,
        code,
        label
      )
    `
    )
    .in("step_instance_id", stepInstanceIds);

  if (documentsError) {
    console.error("Error fetching documents:", documentsError);
    // Don't throw, just log - documents are optional
  }

  // Group field values and documents by step_instance_id
  const fieldsByStepInstance = new Map<string, any[]>();
  fieldValues?.forEach((fv: any) => {
    const fields = fieldsByStepInstance.get(fv.step_instance_id) || [];
    fields.push({
      field_label: fv.step_field?.label || fv.step_field?.field_key,
      field_key: fv.step_field?.field_key,
      value: fv.value,
      value_jsonb: fv.value_jsonb,
    });
    fieldsByStepInstance.set(fv.step_instance_id, fields);
  });

  const documentsByStepInstance = new Map<string, any[]>();
  const documentsByStepAndType = new Map<string, any>(); // key: `${stepInstanceId}_${documentTypeId}`
  documents?.forEach((doc: any) => {
    const currentVersion = Array.isArray(doc.current_version)
      ? doc.current_version[0]
      : doc.current_version;
    const docType = Array.isArray(doc.document_type)
      ? doc.document_type[0]
      : doc.document_type;
    const docTypeLabel = docType?.label || "Document";

    if (currentVersion) {
      const docs = documentsByStepInstance.get(doc.step_instance_id) || [];
      docs.push({
        document_type: docTypeLabel,
        status: doc.status,
        file_name: currentVersion?.file_name || null,
        uploaded_at: currentVersion?.uploaded_at || null,
      });
      documentsByStepInstance.set(doc.step_instance_id, docs);

      if (doc.document_type_id && docType) {
        documentsByStepAndType.set(
          `${doc.step_instance_id}_${doc.document_type_id}`,
          {
            id: doc.id,
            status: doc.status,
            current_version: currentVersion,
            document_type: docType,
          }
        );
      }
    }
  });

  // Get ADMIN steps from product that don't have step_instances
  let adminStepsWithoutInstance: Array<{
    step: {
      id: string;
      label: string | null;
      code: string;
      position: number;
      step_type: "ADMIN";
    };
    product_step_id: string;
  }> = [];

  if (dossier.product_id) {
    // Get all steps from product
    const { data: allProductSteps, error: adminStepsError } = await supabase
      .from("product_steps")
      .select(
        `
        id,
        step_id,
        step:steps (
          id,
          code,
          label,
          position,
          step_type
        )
      `
      )
      .eq("product_id", dossier.product_id)
      .order("step(position)", { ascending: true });

    console.log(
      "allProductSteps",
      allProductSteps,
      "adminStepsError",
      adminStepsError
    );

    if (!adminStepsError && allProductSteps) {
      // Filter only ADMIN steps and those that don't have step_instances
      const existingStepIds = new Set(
        stepInstances
          ?.filter((si: any) => si.step.step_type === "ADMIN")
          .map((si: any) => si.step.id) || []
      );

      adminStepsWithoutInstance = allProductSteps
        .filter((aps: any) => {
          const step = Array.isArray(aps.step) ? aps.step[0] : aps.step;
          return (
            step && step.step_type === "ADMIN" && !existingStepIds.has(step.id)
          );
        })
        .map((aps: any) => {
          const step = Array.isArray(aps.step) ? aps.step[0] : aps.step;
          return {
            step: {
              id: step.id,
              label: step.label,
              code: step.code,
              position: step.position,
              step_type: "ADMIN" as const,
            },
            product_step_id: aps.id,
          };
        });
    }
  }

  // For each step instance, fetch admin_documents (ADMIN) or required_documents_verificateur (CLIENT)
  const stepInstancesWithDocuments: DossierAllData["step_instances"] =
    await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (stepInstances || []).map(async (si: any) => {
        const step = Array.isArray(si.step) ? si.step[0] : si.step;
        let admin_documents: DossierAllData["step_instances"][number]["admin_documents"] =
          undefined;
        let required_documents_verificateur: DossierAllData["step_instances"][number]["required_documents_verificateur"] =
          undefined;

        // If step is CLIENT type, build required_documents_verificateur for verification UI
        if (step?.step_type === "CLIENT") {
          const { data: stepDocTypes } = await supabase
            .from("step_document_types")
            .select("document_type:document_types(id, code, label)")
            .eq("step_id", step.id);

          if (stepDocTypes && stepDocTypes.length > 0) {
            required_documents_verificateur = stepDocTypes
              .map((sdt: any) => {
                const docType = Array.isArray(sdt.document_type)
                  ? sdt.document_type[0]
                  : sdt.document_type;
                if (!docType) return null;
                const docEntry = documentsByStepAndType.get(
                  `${si.id}_${docType.id}`
                );
                if (!docEntry) {
                  return {
                    document_type: {
                      id: docType.id,
                      code: docType.code || "",
                      label: docType.label || "",
                    },
                  };
                }
                const cv = docEntry.current_version;
                return {
                  document_type: {
                    id: docType.id,
                    code: docType.code || "",
                    label: docType.label || "",
                  },
                  document: {
                    id: docEntry.id,
                    status: docEntry.status as
                      | "PENDING"
                      | "APPROVED"
                      | "REJECTED",
                    current_version: {
                      id: cv?.id || "",
                      file_url: cv?.file_url || "",
                      file_name: cv?.file_name || "",
                      uploaded_at: cv?.uploaded_at || "",
                      version_number: cv?.version_number,
                    },
                    previous_versions: [],
                  },
                };
              })
              .filter(Boolean) as NonNullable<
              typeof required_documents_verificateur
            >;
          }
        }

        // If step is ADMIN type, fetch required document types and existing documents
        if (step?.step_type === "ADMIN") {
          // 1. Get document types required for this step
          const { data: stepDocTypes, error: stepDocTypesError } =
            await supabase
              .from("step_document_types")
              .select(
                `
            document_type:document_types (
              id,
              code,
              label,
              description
            )
          `
              )
              .eq("step_id", step.id);

          if (!stepDocTypesError && stepDocTypes && stepDocTypes.length > 0) {
            admin_documents = [];

            // 2. For each document type, find existing ADMIN document
            for (const sdt of stepDocTypes) {
              const docType = Array.isArray(sdt.document_type)
                ? sdt.document_type[0]
                : sdt.document_type;

              if (!docType) continue;

              // Find document for this type in this step instance
              const { data: docData } = await supabase
                .from("documents")
                .select(
                  `
                id,
                status,
                delivered_at,
                current_version_id,
                versions:document_versions!fk_current_version (
                  id,
                  file_url,
                  file_name,
                  uploaded_at,
                  version_number
                )
              `
                )
                .eq("dossier_id", dossierId)
                .eq("document_type_id", docType.id)
                .eq("step_instance_id", si.id)
                .maybeSingle();

              let document: NonNullable<
                DossierAllData["step_instances"][number]["admin_documents"]
              >[number]["document"] = undefined;
              if (docData && docData.versions) {
                const versions = Array.isArray(docData.versions)
                  ? docData.versions
                  : [docData.versions];

                // Sort by version desc
                type DocumentVersion = {
                  id: string;
                  file_url: string;
                  file_name: string | null;
                  uploaded_at: string;
                  version_number: number;
                };
                const sortedVersions = (versions as DocumentVersion[]).sort(
                  (a, b) => b.version_number - a.version_number
                );
                const currentVersion = sortedVersions[0];

                document = {
                  id: docData.id as string,
                  status:
                    docData.status === "DELIVERED"
                      ? ("DELIVERED" as const)
                      : ("PENDING" as const),
                  current_version: {
                    id: currentVersion.id,
                    file_url: currentVersion.file_url,
                    file_name: currentVersion.file_name || "",
                    uploaded_at: currentVersion.uploaded_at,
                  },
                  delivered_at: docData.delivered_at
                    ? (docData.delivered_at as string)
                    : undefined,
                };
              }

              admin_documents.push({
                document_type: docType,
                document: document,
              });
            }
          }
        }

        return {
          id: si.id,
          step: {
            id: step.id,
            label: step.label,
            code: step.code,
            position: step.position,
            step_type: step.step_type || "CLIENT",
          },
          started_at: si.started_at,
          completed_at: si.completed_at,
          assigned_to: si.assigned_to,
          fields: fieldsByStepInstance.get(si.id) || [],
          documents: documentsByStepInstance.get(si.id) || [],
          required_documents_verificateur,
          admin_documents: admin_documents,
        };
      })
    );

  // Build the final result
  const result: DossierAllData = {
    dossier: {
      id: dossier.id,
      status: dossier.status,
      type: dossier.type,
      created_at: dossier.created_at,
      updated_at: dossier.updated_at,
      product_id: dossier.product_id,
    },
    product: product,
    client: {
      id: client.id,
      full_name: client.full_name,
      phone: client.phone,
    },
    step_instances: stepInstancesWithDocuments,
    admin_steps_without_instance: adminStepsWithoutInstance,
  };

  return result;
}
