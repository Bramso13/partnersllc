/**
 * Agent types - Safe to import from Client Components
 */

export type AgentType = "VERIFICATEUR" | "CREATEUR";

export interface Agent {
  id: string;
  name: string;
  email: string;
  agent_type: AgentType;
  active?: boolean;
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
