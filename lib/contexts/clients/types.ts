/**
 * Types for Clients context. Re-exports from lib/clients + context-specific types.
 */

import type { ClientProfile, ClientWithDossierCount } from "@/lib/clients";
import type { BaseEvent } from "@/lib/events";

export type { ClientProfile, ClientWithDossierCount };

export interface CreateClientData {
  full_name: string;
  email: string;
  phone: string;
  product_id: string;
}

export interface DossierSummary {
  id: string;
  status: string;
  created_at: string;
  product?: { name: string };
}

export type { BaseEvent };
