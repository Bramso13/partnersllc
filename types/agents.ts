/**
 * Agent types - Safe to import from Client Components
 */

export type AgentType = "VERIFICATEUR" | "CREATEUR" | "VERIFICATEUR_ET_CREATEUR";

export interface AgentProgression {
  steps_completed_by_agent: number;
  steps_total: number;
  documents_processed_by_agent: number;
  documents_total: number;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  agent_type: AgentType;
  active?: boolean;
  /** Résumé de progression sur tous les dossiers (Story 8.5) */
  progression?: AgentProgression;
}

export interface StepInstanceDossierInfo {
  id: string;
  dossier_number: string | null;
  client_name: string;
  product_name: string | null;
}

export interface StepInstanceStepInfo {
  id: string;
  label: string | null;
  step_type: "CLIENT" | "ADMIN";
  code: string;
}

export interface StepInstanceWithDetails {
  id: string;
  dossier_id: string;
  step_id: string;
  assigned_to: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  dossier: StepInstanceDossierInfo;
  step: StepInstanceStepInfo;
}

export interface AgentDashboardData {
  currentSteps: StepInstanceWithDetails[];
  completedSteps: StepInstanceWithDetails[];
  assignableSteps: StepInstanceWithDetails[];
  agent: {
    id: string;
    name: string;
    agent_type: AgentType;
  };
}

export interface AgentsListResponse {
  agents: Agent[];
}
