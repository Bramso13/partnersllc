export type DossierSearchResult = {
  id: string;
  status: string;
  created_at: string;
  user_id: string;
  product_id: string;
  current_step_instance_id: string | null;
  metadata: Record<string, unknown> | null;
  client?: {
    id: string;
    full_name: string;
  } | null;
  product?: {
    id: string;
    name: string;
  } | null;
  step_instances_count?: number;
  documents_count?: number;
};

export type DossierResetData = {
  reason: string;
};

export type CreateDossierForExistingClientData = {
  client_id: string;
  product_id: string;
  initial_status?: string;
};

export type CreateDossierWithNewClientData = {
  full_name: string;
  email: string;
  phone: string;
  product_id: string;
  initial_status?: string;
};

export type EntityType =
  | "dossiers"
  | "orders"
  | "clients"
  | "step-instances"
  | "documents";

export type EntityRow = Record<string, unknown>;

export type EntitiesResponse = {
  data: EntityRow[];
  total: number;
  page: number;
  per_page: number;
};
