import { createAdminClient } from "@/lib/supabase/server";

// =========================================================
// TYPES
// =========================================================

export interface AgentStepQueueItem {
  id: string;
  assigned_to: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  step: {
    id: string;
    code: string;
    label: string | null;
    step_type: "CLIENT" | "ADMIN";
  };
  dossier: {
    id: string;
    status: string;
    product: {
      name: string;
    };
    client: {
      full_name: string | null;
    };
  };
}

export interface CreateurStepDetails {
  id: string;
  step_id: string;
  dossier_id: string;
  assigned_to: string;
  started_at: string | null;
  completed_at: string | null;

  step: {
    id: string;
    code: string;
    label: string;
    description: string | null;
    position: number;
    step_type: 'ADMIN'; // Always ADMIN for créateur
  };

  dossier: {
    id: string;
    status: string;
    created_at: string;
    product: {
      name: string;
      description: string;
    };
    client: {
      id: string;
      full_name: string;
      phone?: string;
    };
    total_steps: number;
  };

  // Données de TOUTES les steps précédentes (SANS documents)
  previous_steps_data: Array<{
    step: {
      code: string;
      label: string;
      position: number;
    };
    completed_at: string | null;
    fields: Array<{
      label: string;
      field_key: string;
      field_type: string;
      value: string | null;
      value_jsonb: any;
    }>;
  }>;

  // Documents à créer par l'agent (type ADMIN)
  admin_documents: Array<{
    document_type: {
      id: string;
      code: string;
      label: string;
      description: string;
    };
    document?: {
      id: string;
      status: 'PENDING' | 'DELIVERED';
      source: 'ADMIN';
      current_version: {
        id: string;
        file_url: string;
        file_name: string;
        uploaded_at: string;
      };
      delivered_at?: string;
    };
  }>;

  notes: Array<{
    id: string;
    content: string;
    created_at: string;
    agent_name: string;
  }>;
}

export async function getAgentStepQueue(
  agentEmail: string,
  agentName?: string | null
): Promise<AgentStepQueueItem[]> {
  const supabase = createAdminClient();

  // Récupérer ou créer l'agent à partir de l'email
  const { data: existingAgent, error: existingError } = await supabase
    .from("agents")
    .select("id, agent_type")
    .eq("email", agentEmail)
    .single();

  let agent: { id: string; agent_type: "VERIFICATEUR" | "CREATEUR" };

  if (existingError || !existingAgent) {
    // Si aucun agent: le créer avec le type par défaut (VERIFICATEUR)
    const { data: newAgent, error: createError } = await supabase
      .from("agents")
      .insert({
        email: agentEmail,
        name: agentName || agentEmail,
        active: true,
      })
      .select("id, agent_type")
      .single();

    if (createError || !newAgent) {
      console.error("[getAgentStepQueue] Error creating agent", createError);
      return [];
    }

    agent = newAgent as typeof agent;
  } else {
    agent = existingAgent as typeof agent;
  }

  const stepTypeForUnassigned =
    agent.agent_type === "VERIFICATEUR" ? "CLIENT" : "ADMIN";

  const { data, error } = await supabase
    .from("step_instances")
    .select(
      `
      id,
      assigned_to,
      started_at,
      completed_at,
      created_at,
      step:steps (
        id,
        code,
        label,
        step_type
      ),
      dossier:dossiers!step_instances_dossier_id_fkey (
        id,
        status,
        product:products (
          name
        ),
        client:profiles (
          full_name
        )
      )
    `
    )
    .is("completed_at", null)
    // On récupère toutes les steps incomplètes soit assignées à l'agent,
    // soit non assignées (le filtrage par type d'agent sera fait en mémoire).
    .or(`assigned_to.eq.${agent.id},assigned_to.is.null`)
    .order("created_at", { ascending: true });

  if (error || !data) {
    console.error("[getAgentStepQueue] Error fetching step queue", error);
    return [];
  }

  // Filtrage en mémoire pour respecter la logique:
  // - toujours inclure les steps déjà assignées à l'agent courant
  // - pour les steps non assignées, n'inclure que celles dont le type
  //   correspond au type d'agent (CLIENT ↔ VERIFICATEUR, ADMIN ↔ CREATEUR)
  const filtered = (data as any[]).filter((row) => {
    if (row.assigned_to === agent.id) {
      return true;
    }

    if (row.assigned_to === null) {
      const stepRow = Array.isArray(row.step) ? row.step[0] : row.step;
      return stepRow?.step_type === stepTypeForUnassigned;
    }

    return false;
  });

  return filtered.map((row) => {
    const step = Array.isArray(row.step) ? row.step[0] : row.step;
    const dossier = Array.isArray(row.dossier) ? row.dossier[0] : row.dossier;
    const product = dossier?.product
      ? Array.isArray(dossier.product)
        ? dossier.product[0]
        : dossier.product
      : null;
    const client = dossier?.client
      ? Array.isArray(dossier.client)
        ? dossier.client[0]
        : dossier.client
      : null;

    return {
      id: row.id,
      assigned_to: row.assigned_to,
      started_at: row.started_at,
      completed_at: row.completed_at,
      created_at: row.created_at,
      step: {
        id: step?.id,
        code: step?.code,
        label: step?.label,
        step_type: step?.step_type,
      },
      dossier: {
        id: dossier?.id,
        status: dossier?.status,
        product: {
          name: product?.name ?? "",
        },
        client: {
          full_name: client?.full_name ?? null,
        },
      },
    } as AgentStepQueueItem;
  });
}

// =========================================================
// VERIFICATEUR STEP DETAILS
// =========================================================

export interface VerificateurStepDetails {
  id: string;
  step_id: string;
  dossier_id: string;
  assigned_to: string;
  started_at: string | null;
  completed_at: string | null;

  step: {
    id: string;
    code: string;
    label: string;
    description: string | null;
    position: number;
    step_type: "CLIENT";
  };

  dossier: {
    id: string;
    status: string;
    product: {
      id: string;
      name: string;
    };
    client: {
      id: string;
      full_name: string | null;
    };
    total_steps: number;
  };

  required_documents: Array<{
    document_type: {
      id: string;
      code: string;
      label: string;
    };
    document?: {
      id: string;
      status: "PENDING" | "APPROVED" | "REJECTED";
      current_version: {
        id: string;
        file_url: string;
        file_name: string;
        uploaded_at: string;
        version_number: number;
      };
      previous_versions: Array<{
        id: string;
        version_number: number;
        uploaded_at: string;
        file_url: string;
        review_status: "APPROVED" | "REJECTED" | null;
        review_reason: string | null;
      }>;
    };
  }>;

  fields: Array<{
    field: {
      id: string;
      field_key: string;
      label: string;
      field_type: string;
      position: number;
    };
    value?: {
      value: string | null;
      value_jsonb: unknown;
    };
  }>;

  notes: Array<{
    id: string;
    content: string;
    created_at: string;
    agent_name: string;
  }>;
}

/**
 * Récupère les détails complets d'une step pour un agent Vérificateur
 * Inclut documents, champs client, et notes internes
 */
export async function getVerificateurStepDetails(
  stepInstanceId: string,
  agentId: string,
  isAdmin: boolean = false
): Promise<VerificateurStepDetails | null> {
  const supabase = createAdminClient();

  // 1. Fetch step instance avec step, dossier, product, client
  const { data: stepInstance, error: stepError } = await supabase
    .from("step_instances")
    .select(
      `
      id,
      step_id,
      dossier_id,
      assigned_to,
      started_at,
      completed_at,
      step:steps (
        id,
        code,
        label,
        description,
        position,
        step_type
      ),
      dossier:dossiers!step_instances_dossier_id_fkey (
        id,
        status,
        product_id,
        user_id,
        product:products (
          id,
          name
        ),
        client:profiles!dossiers_user_id_fkey (
          id,
          full_name
        )
      )
    `
    )
    .eq("id", stepInstanceId)
    .single();

  if (stepError || !stepInstance) {
    console.error("[getVerificateurStepDetails] Step not found", stepError);
    return null;
  }

  const step = Array.isArray(stepInstance.step)
    ? stepInstance.step[0]
    : stepInstance.step;
  const dossier = Array.isArray(stepInstance.dossier)
    ? stepInstance.dossier[0]
    : stepInstance.dossier;

  if (!step || !dossier) {
    console.error("[getVerificateurStepDetails] Missing step or dossier data");
    return null;
  }

  // Vérifier accès: assigné à l'agent OU admin
//   if (!isAdmin && stepInstance.assigned_to !== agentId) {
//     console.error("[getVerificateurStepDetails] Access denied - not assigned");
//     return null;
//   }

  // Vérifier type step = CLIENT (pour vérificateur)
  if (step.step_type !== "CLIENT") {
    console.error("[getVerificateurStepDetails] Wrong step type:", step.step_type);
    return null;
  }

  const product = dossier.product
    ? Array.isArray(dossier.product)
      ? dossier.product[0]
      : dossier.product
    : null;
  const client = dossier.client
    ? Array.isArray(dossier.client)
      ? dossier.client[0]
      : dossier.client
    : null;

  // 2. Compter total steps du workflow produit
  const { count: totalSteps } = await supabase
    .from("product_steps")
    .select("id", { count: "exact", head: true })
    .eq("product_id", dossier.product_id);

  // 3. Fetch documents requis pour cette step via step_document_types
  const requiredDocuments: VerificateurStepDetails["required_documents"] = [];

  // Fetch document types requis directement via step_id
  const { data: stepDocTypes } = await supabase
    .from("step_document_types")
    .select(
      `
      document_type:document_types (
        id,
        code,
        label
      )
    `
    )
    .eq("step_id", step.id);

  if (stepDocTypes) {

    // Pour chaque type de document, chercher le document uploadé
    for (const sdt of stepDocTypes) {
      const docType = Array.isArray(sdt.document_type)
        ? sdt.document_type[0]
        : sdt.document_type;

      if (!docType) continue;

      // Chercher document existant pour ce type
      const { data: docData } = await supabase
        .from("documents")
        .select(
          `
          id,
          status,
          current_version_id,
          versions:document_versions (
            id,
            file_url,
            file_name,
            uploaded_at,
            version_number
          )
        `
        )
        .eq("dossier_id", dossier.id)
        .eq("document_type_id", docType.id)
        .eq("step_instance_id", stepInstanceId)
        .single();

      if (docData && docData.versions) {
        const versions = Array.isArray(docData.versions)
          ? docData.versions
          : [docData.versions];

        // Trier par version number desc
        const sortedVersions = versions.sort(
          (a: { version_number: number }, b: { version_number: number }) =>
            b.version_number - a.version_number
        );

        const currentVersion = sortedVersions[0];
        const previousVersions = sortedVersions.slice(1);

        // Fetch reviews pour les versions précédentes
        const previousWithReviews = await Promise.all(
          previousVersions.map(async (v: {
            id: string;
            version_number: number;
            uploaded_at: string;
            file_url: string;
          }) => {
            const { data: review } = await supabase
              .from("document_reviews")
              .select("status, reason")
              .eq("document_version_id", v.id)
              .order("reviewed_at", { ascending: false })
              .limit(1)
              .single();

            return {
              id: v.id,
              version_number: v.version_number,
              uploaded_at: v.uploaded_at,
              file_url: v.file_url,
              review_status: review?.status as "APPROVED" | "REJECTED" | null,
              review_reason: review?.reason || null,
            };
          })
        );

        requiredDocuments.push({
          document_type: docType,
          document: {
            id: docData.id,
            status: docData.status as "PENDING" | "APPROVED" | "REJECTED",
            current_version: {
              id: currentVersion.id,
              file_url: currentVersion.file_url,
              file_name: currentVersion.file_name || "",
              uploaded_at: currentVersion.uploaded_at,
              version_number: currentVersion.version_number,
            },
            previous_versions: previousWithReviews,
          },
        });
      } else {
        // Document non soumis
        requiredDocuments.push({
          document_type: docType,
        });
      }
    }
  }

  // 4. Fetch step fields et values
  const { data: stepFields } = await supabase
    .from("step_fields")
    .select("id, field_key, label, field_type, position")
    .eq("step_id", step.id)
    .order("position", { ascending: true });

  const fields: VerificateurStepDetails["fields"] = [];

  if (stepFields) {
    for (const field of stepFields) {
      const { data: fieldValue } = await supabase
        .from("step_field_values")
        .select("value, value_jsonb")
        .eq("step_instance_id", stepInstanceId)
        .eq("step_field_id", field.id)
        .single();

      fields.push({
        field: {
          id: field.id,
          field_key: field.field_key,
          label: field.label,
          field_type: field.field_type,
          position: field.position,
        },
        value: fieldValue
          ? {
              value: fieldValue.value,
              value_jsonb: fieldValue.value_jsonb,
            }
          : undefined,
      });
    }
  }

  // 5. Fetch notes internes du dossier
  const { data: notesData } = await supabase
    .from("dossier_notes")
    .select(
      `
      id,
      note_text,
      created_at,
      agent:agents (
        name
      )
    `
    )
    .eq("dossier_id", dossier.id)
    .order("created_at", { ascending: false });

  const notes: VerificateurStepDetails["notes"] = (notesData || []).map(
    (note) => {
      const agent = Array.isArray(note.agent) ? note.agent[0] : note.agent;
      return {
        id: note.id,
        content: note.note_text,
        created_at: note.created_at,
        agent_name: agent?.name || "Agent",
      };
    }
  );

  return {
    id: stepInstance.id,
    step_id: stepInstance.step_id,
    dossier_id: stepInstance.dossier_id,
    assigned_to: stepInstance.assigned_to,
    started_at: stepInstance.started_at,
    completed_at: stepInstance.completed_at,
    step: {
      id: step.id,
      code: step.code,
      label: step.label,
      description: step.description,
      position: step.position,
      step_type: "CLIENT",
    },
    dossier: {
      id: dossier.id,
      status: dossier.status,
      product: {
        id: product?.id || "",
        name: product?.name || "",
      },
      client: {
        id: client?.id || "",
        full_name: client?.full_name || null,
      },
      total_steps: totalSteps || 0,
    },
    required_documents: requiredDocuments,
    fields,
    notes,
  };
}

/**
 * Récupère l'agent à partir de l'email
 */
export async function getAgentByEmail(
  email: string
): Promise<{ id: string; agent_type: "VERIFICATEUR" | "CREATEUR" } | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("agents")
    .select("id, agent_type")
    .eq("email", email)
    .single();

  if (error || !data) {
    return null;
  }

  return data as { id: string; agent_type: "VERIFICATEUR" | "CREATEUR" };
}

/**
 * Récupère les détails complets d'une step pour un agent Créateur
 * Inclut données dossier, steps précédentes, documents admin à créer
 */
export async function getCreateurStepDetails(
  stepInstanceId: string,
  agentId: string,
  isAdmin: boolean = false
): Promise<CreateurStepDetails | null> {
  const supabase = createAdminClient();

  // 1. Fetch step instance avec step, dossier, product, client
  const { data: stepInstance, error: stepError } = await supabase
    .from("step_instances")
    .select(
      `
      id,
      step_id,
      dossier_id,
      assigned_to,
      started_at,
      completed_at,
      step:steps (
        id,
        code,
        label,
        description,
        position,
        step_type
      ),
      dossier:dossiers!step_instances_dossier_id_fkey (
        id,
        status,
        created_at,
        product_id,
        user_id,
        product:products (
          id,
          name,
          description
        ),
        client:profiles!dossiers_user_id_fkey (
          id,
          full_name,
          phone
        )
      )
    `
    )
    .eq("id", stepInstanceId)
    .single();

  if (stepError || !stepInstance) {
    console.error("[getCreateurStepDetails] Step not found", stepError);
    return null;
  }

  const step = Array.isArray(stepInstance.step)
    ? stepInstance.step[0]
    : stepInstance.step;
  const dossier = Array.isArray(stepInstance.dossier)
    ? stepInstance.dossier[0]
    : stepInstance.dossier;

  if (!step || !dossier) {
    console.error("[getCreateurStepDetails] Missing step or dossier data");
    return null;
  }

  // Vérifier accès: assigné à l'agent OU admin
//   if (!isAdmin && stepInstance.assigned_to !== agentId) {
//     console.error("[getCreateurStepDetails] Access denied - not assigned");
//     return null;
//   }

  // Vérifier type step = ADMIN (pour créateur)
  if (step.step_type !== "ADMIN") {
    console.error("[getCreateurStepDetails] Wrong step type:", step.step_type);
    return null;
  }

  const product = dossier.product
    ? Array.isArray(dossier.product)
      ? dossier.product[0]
      : dossier.product
    : null;
  const client = dossier.client
    ? Array.isArray(dossier.client)
      ? dossier.client[0]
      : dossier.client
    : null;

  // 2. Compter total steps du workflow produit
  const { count: totalSteps } = await supabase
    .from("product_steps")
    .select("id", { count: "exact", head: true })
    .eq("product_id", dossier.product_id);

  // 3. Fetch données des steps précédentes (SANS documents)
  const { data: previousStepsData } = await supabase
    .from("step_instances")
    .select(
      `
      id,
      completed_at,
      step:steps (
        code,
        label,
        position
      ),
      fields:step_field_values (
        step_field:step_fields (
          field_key,
          label,
          field_type
        ),
        value,
        value_jsonb
      )
    `
    )
    .eq("dossier_id", dossier.id)
    .lt("step.position", step.position)
    .order("step.position", { ascending: true });

  // Transformer les données des steps précédentes
  const previous_steps_data: CreateurStepDetails["previous_steps_data"] = [];

  if (previousStepsData) {
    for (const prevStep of previousStepsData) {
      const prevStepData = Array.isArray(prevStep.step)
        ? prevStep.step[0]
        : prevStep.step;

      if (!prevStepData) continue;

      const fields = Array.isArray(prevStep.fields)
        ? prevStep.fields.map((f: any) => ({
            label: f.step_field?.label || "",
            field_key: f.step_field?.field_key || "",
            field_type: f.step_field?.field_type || "",
            value: f.value,
            value_jsonb: f.value_jsonb,
          }))
        : [];

      previous_steps_data.push({
        step: {
          code: prevStepData.code,
          label: prevStepData.label,
          position: prevStepData.position,
        },
        completed_at: prevStep.completed_at,
        fields,
      });
    }
  }

  // 4. Fetch document types requis pour cette step ADMIN
  const admin_documents: CreateurStepDetails["admin_documents"] = [];

  // Fetch document types requis directement via step_id
  const { data: stepDocTypes } = await supabase
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

  if (stepDocTypes) {

    // Pour chaque type de document, chercher le document admin existant
    for (const sdt of stepDocTypes) {
      const docType = Array.isArray(sdt.document_type)
        ? sdt.document_type[0]
        : sdt.document_type;

      if (!docType) continue;

      // Chercher document admin existant pour ce type
      const { data: docData } = await supabase
        .from("documents")
        .select(
          `
          id,
          status,
          current_version_id,
          source,
          delivered_at,
          versions:document_versions (
            id,
            file_url,
            file_name,
            uploaded_at,
            version_number
          )
        `
        )
        .eq("dossier_id", dossier.id)
        .eq("document_type_id", docType.id)
        .eq("source", "ADMIN") // Uniquement les documents créés par les agents
        .single();

      let document;
      if (docData && docData.versions) {
        const versions = Array.isArray(docData.versions)
          ? docData.versions
          : [docData.versions];

        // Trier par version number desc
        const sortedVersions = versions.sort(
          (a: { version_number: number }, b: { version_number: number }) =>
            b.version_number - a.version_number
        );

        const currentVersion = sortedVersions[0];

        document = {
          id: docData.id,
          status: docData.status === "DELIVERED" ? "DELIVERED" : "PENDING",
          source: "ADMIN" as const,
          current_version: {
            id: currentVersion.id,
            file_url: currentVersion.file_url,
            file_name: currentVersion.file_name || "",
            uploaded_at: currentVersion.uploaded_at,
          },
          delivered_at: docData.delivered_at,
        };
      }

      admin_documents.push({
        document_type: docType,
        document: document ? (document as CreateurStepDetails["admin_documents"][0]["document"]) : undefined,
      });
    }
  }

  // 5. Fetch notes internes du dossier
  const { data: notesData } = await supabase
    .from("dossier_notes")
    .select(
      `
      id,
      note_text,
      created_at,
      agent:agents (
        name
      )
    `
    )
    .eq("dossier_id", dossier.id)
    .order("created_at", { ascending: false });

  const notes: CreateurStepDetails["notes"] = (notesData || []).map(
    (note) => {
      const agent = Array.isArray(note.agent) ? note.agent[0] : note.agent;
      return {
        id: note.id,
        content: note.note_text,
        created_at: note.created_at,
        agent_name: agent?.name || "Agent",
      };
    }
  );

  return {
    id: stepInstance.id,
    step_id: stepInstance.step_id,
    dossier_id: stepInstance.dossier_id,
    assigned_to: stepInstance.assigned_to,
    started_at: stepInstance.started_at,
    completed_at: stepInstance.completed_at,
    step: {
      id: step.id,
      code: step.code,
      label: step.label,
      description: step.description,
      position: step.position,
      step_type: "ADMIN",
    },
    dossier: {
      id: dossier.id,
      status: dossier.status,
      created_at: dossier.created_at,
      product: {
        name: product?.name || "",
        description: product?.description || "",
      },
      client: {
        id: client?.id || "",
        full_name: client?.full_name || "",

        phone: client?.phone,
      },
      total_steps: totalSteps || 0,
    },
    previous_steps_data,
    admin_documents,
    notes,
  };
}
