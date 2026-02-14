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

export type DossierObservationEvent = {
  id: string;
  action?: string;
  event_type?: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  metadata?: Record<string, unknown> | null;
};

export type DossierObservationStepInstance = {
  id: string;
  step_id: string;
  dossier_id: string;
  started_at: string | null;
  completed_at: string | null;
  validation_status: string;
  step?: { id: string; label: string; step_type: string };
};

export type DossierStatusHistoryEntry = {
  id: string;
  old_status: string;
  new_status: string;
  changed_by_type: string;
  reason: string | null;
  created_at: string;
};

export type DossierObservationNotification = {
  id: string;
  title: string;
  message: string;
  template_code: string | null;
  created_at: string;
  dossier_id: string | null;
  notification_deliveries: Array<{
    id: string;
    channel: string;
    status: string;
    recipient: string;
    sent_at: string | null;
    failed_at: string | null;
    provider_response?: Record<string, unknown> | null;
    created_at: string;
  }>;
};

export type DossierObservation = {
  dossierSummary: DossierSearchResult | null;
  events: DossierObservationEvent[];
  notifications: DossierObservationNotification[];
  stepInstances: DossierObservationStepInstance[];
  statusHistory: DossierStatusHistoryEntry[];
};
