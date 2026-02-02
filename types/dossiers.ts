/**
 * Dossier types - NO server dependencies.
 * Safe to import from Client Components.
 */

import type { DossierStatus } from "@/lib/dossier-status";

export type { DossierStatus };

export type DossierType = "LLC" | "CORP" | "BANKING";

export interface Dossier {
  id: string;
  user_id: string;
  product_id: string | null;
  type: DossierType;
  status: DossierStatus;
  current_step_instance_id: string | null;
  metadata: Record<string, unknown> | null;
  is_test?: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Step {
  id: string;
  code: string;
  label: string | null;
  position: number;
}

export interface StepInstance {
  id: string;
  dossier_id: string;
  step_id: string;
  started_at: string | null;
  completed_at: string | null;
  assigned_to: string | null;
  validation_status?:
    | "DRAFT"
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "APPROVED"
    | "REJECTED";
  rejection_reason?: string | null;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
}

export interface DocumentType {
  id: string;
  code: string;
  label: string;
  description: string | null;
  required_step_id: string | null;
  max_file_size_mb: number | null;
  allowed_extensions: string[] | null;
}

export interface TimelineEvent {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  actor_type: string | null;
  actor_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface DossierWithDetails extends Dossier {
  product?: Product | null;
  current_step_instance?: (StepInstance & { step?: Step | null }) | null;
  step_instances?: (StepInstance & { step?: Step | null })[];
  completed_steps_count?: number;
  total_steps_count?: number;
  progress_percentage?: number;
  required_documents?: DocumentType[];
  timeline_events?: TimelineEvent[];
}

export interface DossierWithDetailsAndClient extends DossierWithDetails {
  user?: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
  assigned_agent?: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
  pending_documents_count?: number;
}
