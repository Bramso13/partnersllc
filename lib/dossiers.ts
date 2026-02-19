import type { SupabaseClient } from "@supabase/supabase-js";

export {
  type DossierStatus,
  DOSSIER_STATUS_LIST,
  DOSSIER_STATUS_OPTIONS,
  isValidDossierStatus,
} from "@/lib/dossier-status";

export type {
  DossierType,
  Dossier,
  Step,
  StepInstance,
  Product,
  DocumentType,
  TimelineEvent,
  DossierWithDetails,
  DossierWithDetailsAndClient,
} from "@/types/dossiers";

export type { CreateDossierInput } from "@/lib/modules/dossiers/agent/create";

export type { AdvisorInfo } from "@/lib/modules/dossiers/shared/types";

import * as client from "@/lib/modules/dossiers/client";
import * as admin from "@/lib/modules/dossiers/admin";
import * as agent from "@/lib/modules/dossiers/agent";

export async function getUserDossiers() {
  return client.getAll();
}

export async function getDossierById(dossierId: string) {
  return client.getById(dossierId);
}

export async function getAllAdminDossiers() {
  return admin.getAll();
}

export async function getAdminDossierById(dossierId: string) {
  return admin.getById(dossierId);
}

export async function getDossierAdvisor(dossierId: string) {
  return admin.getAdvisor(dossierId);
}

export async function assignFirstCreateurToDossier(
  supabase: SupabaseClient,
  dossierId: string
) {
  return agent.assignFirstCreateur(supabase, dossierId);
}

export async function createDossier(
  supabase: SupabaseClient,
  input: agent.CreateDossierInput
) {
  return agent.create(supabase, input);
}

export async function createAdminStepInstancesForDossier(dossierId: string) {
  return agent.createAdminStepInstances(dossierId);
}
