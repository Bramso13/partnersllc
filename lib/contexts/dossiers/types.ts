/**
 * Types for Dossiers context (lightweight shared data).
 */

export interface AdvisorInfo {
  id: string | null;
  name: string;
  email: string;
  role: string;
}

export interface DossierApiResponse {
  id: string;
  user_id: string;
  product_id?: string;
  status: string;
  step_instances?: Array<{
    step_id: string;
    completed_at: string | null;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}
