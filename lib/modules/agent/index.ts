import { createAdminClient } from "@/lib/supabase/server";

export interface AgentDossierListItem {
  id: string;
  status: string;
  type: string;
  created_at: string;
  current_step_code: string | null;
  current_step_label: string | null;
  client_full_name: string | null;
  client_company_name: string | null;
  steps_completed_by_agent: number;
  steps_total: number;
  documents_processed_by_agent: number;
  documents_total: number;
}

export interface AgentProgressSummary {
  steps_completed_by_agent: number;
  steps_total: number;
  documents_processed_by_agent: number;
  documents_total: number;
}

export async function getDossiers(agentId: string): Promise<AgentDossierListItem[]> {
  const supabase = createAdminClient();
  const { data: assignments } = await supabase.from("dossier_agent_assignments").select("dossier_id").eq("agent_id", agentId);
  const uniqueDossierIds = assignments?.map((a: Record<string, unknown>) => a.dossier_id as string) || [];

  const { data: dossiersWithDetails } = await supabase
    .from("dossiers")
    .select(`id, status, type, created_at, user_id, current_step_instance_id, profiles!user_id(id, full_name, phone), current_step_instance:step_instances!current_step_instance_id(step:steps(code, label))`)
    .in("id", uniqueDossierIds);

  const { data: companyNames } = await supabase
    .from("step_field_values")
    .select(`step_instance:step_instances!inner(dossier_id), step_field:step_fields!inner(field_key), value`)
    .in("step_instance.dossier_id", uniqueDossierIds)
    .eq("step_field.field_key", "company_name");

  const companyNameMap = new Map<string, string>();
  companyNames?.forEach((item: Record<string, unknown>) => {
    const stepInstance = item.step_instance as Record<string, unknown>;
    if (stepInstance?.dossier_id && item.value) companyNameMap.set(stepInstance.dossier_id as string, item.value as string);
  });

  const { data: stepInstancesForProgress } = await supabase.from("step_instances").select("id, dossier_id, assigned_to, completed_at, validated_by, validated_at").in("dossier_id", uniqueDossierIds);

  const stepsTotalByDossier = new Map<string, number>();
  const stepsCompletedByAgentByDossier = new Map<string, number>();
  stepInstancesForProgress?.forEach((si: Record<string, unknown>) => {
    const did = si.dossier_id as string;
    stepsTotalByDossier.set(did, (stepsTotalByDossier.get(did) || 0) + 1);
    if (si.validated_by === agentId && si.validated_at) stepsCompletedByAgentByDossier.set(did, (stepsCompletedByAgentByDossier.get(did) || 0) + 1);
  });

  return (dossiersWithDetails || []).map((d: Record<string, unknown>) => ({
    id: d.id as string,
    status: d.status as string,
    type: d.type as string,
    created_at: d.created_at as string,
    current_step_code: ((d.current_step_instance as Record<string, unknown>)?.step as Record<string, unknown> | undefined)?.code as string | null || null,
    current_step_label: ((d.current_step_instance as Record<string, unknown>)?.step as Record<string, unknown> | undefined)?.label as string | null || null,
    client_full_name: ((d.profiles as Record<string, unknown>)?.full_name as string | null) || null,
    client_company_name: companyNameMap.get(d.id as string) || null,
    steps_completed_by_agent: stepsCompletedByAgentByDossier.get(d.id as string) || 0,
    steps_total: stepsTotalByDossier.get(d.id as string) || 0,
    documents_processed_by_agent: 0,
    documents_total: 0,
  }));
}

export async function getAgentProgressSummary(agentId: string): Promise<AgentProgressSummary> {
  const supabase = createAdminClient();
  const { data: assignments } = await supabase.from("dossier_agent_assignments").select("dossier_id").eq("agent_id", agentId);
  const dossierIds = (assignments || []).map((a: Record<string, unknown>) => a.dossier_id as string);
  if (dossierIds.length === 0) return { steps_completed_by_agent: 0, steps_total: 0, documents_processed_by_agent: 0, documents_total: 0 };

  const { data: stepInstances } = await supabase.from("step_instances").select("id, dossier_id, assigned_to, completed_at").in("dossier_id", dossierIds);
  let steps_total = stepInstances?.length ?? 0;
  let steps_completed_by_agent = 0;
  stepInstances?.forEach((si: Record<string, unknown>) => { if (si.assigned_to === agentId && si.completed_at) steps_completed_by_agent += 1; });

  let documents_total = 0;
  let documents_processed_by_agent = 0;
  const stepInstanceIds = (stepInstances || []).map((si: Record<string, unknown>) => si.id as string);

  if (stepInstanceIds.length > 0) {
    const { data: docs } = await supabase.from("documents").select("id, step_instance_id, status").in("step_instance_id", stepInstanceIds);
    documents_total = docs?.length ?? 0;
  }

  return { steps_completed_by_agent, steps_total, documents_processed_by_agent, documents_total };
}

export interface DossierAllData {
  dossier: { id: string; status: string; type: string; created_at: string; updated_at: string; product_id: string | null };
  product: { id: string; name: string } | null;
  client: { id: string; full_name: string | null; phone: string | null };
  step_instances: Array<{
    id: string;
    step: { id: string; label: string | null; code: string; position: number; step_type: "CLIENT" | "ADMIN" };
    started_at: string | null;
    completed_at: string | null;
    assigned_to: string | null;
    fields: Array<{ field_label: string | null; field_key: string; value: string | null; value_jsonb: unknown }>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    required_documents_verificateur?: any;
    admin_documents?: AdminDocumentItem[];
    documents: DossierDocument[];
  }>;
  admin_steps_without_instance: Array<{ step: { id: string; label: string | null; code: string; position: number; step_type: "ADMIN" }; product_step_id: string }>;
}

export interface DossierDocument {
  document_type: string;
  file_name: string | null;
  uploaded_at: string | null;
  status: string;
}

export interface AdminDocumentItem {
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
}

export async function getDossierAllData(dossierId: string, agentId: string): Promise<DossierAllData | null> {
  const supabase = createAdminClient();

  const { data: accessCheck } = await supabase.from("dossier_agent_assignments").select("id").eq("dossier_id", dossierId).eq("agent_id", agentId).limit(1).maybeSingle();
  if (!accessCheck) throw new Error("Agent does not have access to this dossier");

  const { data: dossier } = await supabase.from("dossiers").select("id, status, type, created_at, updated_at, user_id, product_id").eq("id", dossierId).single();
  if (!dossier) throw new Error("Dossier not found");

  const { data: client } = await supabase.from("profiles").select("id, full_name, phone").eq("id", dossier.user_id).single();

  let product = null;
  if (dossier.product_id) {
    const { data: productData } = await supabase.from("products").select("id, name").eq("id", dossier.product_id).single();
    if (productData) product = { id: productData.id, name: productData.name };
  }

  const { data: stepInstances } = await supabase.from("step_instances").select("id, started_at, completed_at, assigned_to, step:steps(id, code, label, position, step_type)").eq("dossier_id", dossierId).order("step(position)", { ascending: true });
  const stepInstanceIds = stepInstances?.map((si: Record<string, unknown>) => si.id as string) || [];

  const { data: fieldValues } = await supabase.from("step_field_values").select("step_instance_id, value, value_jsonb, step_field:step_fields(field_key, label)").in("step_instance_id", stepInstanceIds);
  const fieldsByStepInstance = new Map<string, Array<{ field_label: string | null; field_key: string; value: string | null; value_jsonb: unknown }>>();
  fieldValues?.forEach((fv: Record<string, unknown>) => {
    const fields = fieldsByStepInstance.get(fv.step_instance_id as string) || [];
    const stepField = fv.step_field as Record<string, unknown>;
    fields.push({ field_label: stepField?.label as string || stepField?.field_key as string, field_key: stepField?.field_key as string, value: fv.value as string | null, value_jsonb: fv.value_jsonb });
    fieldsByStepInstance.set(fv.step_instance_id as string, fields);
  });

  const stepInstancesWithDocuments = (stepInstances || []).map((si: Record<string, unknown>) => {
    const step = Array.isArray(si.step) ? si.step[0] : si.step;
    return {
      id: si.id as string,
      step: { id: step.id as string, label: step.label as string | null, code: step.code as string, position: step.position as number, step_type: step.step_type as "CLIENT" | "ADMIN" },
      started_at: si.started_at as string | null,
      completed_at: si.completed_at as string | null,
      assigned_to: si.assigned_to as string | null,
      fields: fieldsByStepInstance.get(si.id as string) || [],
      documents: [],
    };
  });

  return {
    dossier: { id: dossier.id, status: dossier.status, type: dossier.type, created_at: dossier.created_at, updated_at: dossier.updated_at, product_id: dossier.product_id },
    product,
    client: { id: client?.id || "", full_name: client?.full_name || null, phone: client?.phone || null },
    step_instances: stepInstancesWithDocuments,
    admin_steps_without_instance: [],
  };
}

export const getAgentDossiers = getDossiers;
