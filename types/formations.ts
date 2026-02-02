// Formation (training courses) types

export type FormationVisibilityType = "all" | "by_product_ids" | "by_dossier_type";

export type FormationElementType =
  | "video_link"
  | "video_upload"
  | "image"
  | "rich_text";

// Payload types for different element types
export type VideoLinkPayload = {
  url: string;
};

export type VideoUploadPayload = {
  storage_path: string;
};

export type ImagePayload = {
  url?: string;
  storage_path?: string;
};

export type RichTextPayload = {
  content: string; // HTML or markdown
};

export type FormationElementPayload =
  | VideoLinkPayload
  | VideoUploadPayload
  | ImagePayload
  | RichTextPayload;

// Visibility configuration
export type VisibilityConfigByProductIds = {
  product_ids: string[];
};

export type VisibilityConfigByDossierType = {
  dossier_type: string;
};

export type FormationVisibilityConfig =
  | Record<string, never> // empty object for 'all'
  | VisibilityConfigByProductIds
  | VisibilityConfigByDossierType;

// Database entities
export interface Formation {
  id: string;
  titre: string;
  description: string | null;
  vignette_url: string | null;
  vignette_path: string | null;
  visibility_type: FormationVisibilityType;
  visibility_config: FormationVisibilityConfig;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface FormationElement {
  id: string;
  formation_id: string;
  type: FormationElementType;
  position: number;
  payload: FormationElementPayload;
  created_at: string;
}

export interface UserFormationProgress {
  user_id: string;
  formation_id: string;
  last_element_id: string | null;
  completed_element_ids: string[]; // Array of element IDs
  updated_at: string;
}

// API request/response types

export interface CreateFormationRequest {
  titre: string;
  description?: string;
  vignette_url?: string;
  vignette_path?: string;
  visibility_type: FormationVisibilityType;
  visibility_config?: FormationVisibilityConfig;
  display_order?: number;
}

export interface UpdateFormationRequest {
  titre?: string;
  description?: string;
  vignette_url?: string;
  vignette_path?: string;
  visibility_type?: FormationVisibilityType;
  visibility_config?: FormationVisibilityConfig;
  display_order?: number;
}

export interface CreateFormationElementRequest {
  type: FormationElementType;
  position: number;
  payload: FormationElementPayload;
}

export interface UpdateFormationElementRequest {
  type?: FormationElementType;
  position?: number;
  payload?: FormationElementPayload;
}

export interface UpdateProgressRequest {
  last_element_id?: string | null;
  completed_element_ids?: string[];
}

// Response types with joined data
export interface FormationWithElements extends Formation {
  elements: FormationElement[];
}

export interface FormationWithProgress extends FormationWithElements {
  progress: UserFormationProgress | null;
}

// Client API response types
export interface GetFormationsResponse {
  formations: Formation[];
}

export interface GetFormationResponse {
  formation: FormationWithElements;
  progress: UserFormationProgress | null;
}

export interface GetProgressResponse {
  progress: UserFormationProgress | null;
}

// Admin API response types
export interface GetFormationElementsResponse {
  elements: FormationElement[];
}

// Step-formations (Story 12.4): many-to-many step <-> formation
export interface StepFormation {
  step_id: string;
  formation_id: string;
  position: number;
}

export interface FormationSummary {
  id: string;
  titre: string;
  description?: string | null;
  vignette_url?: string | null;
}

export interface GetStepFormationsResponse {
  formations: FormationSummary[];
}

export interface PutStepFormationsRequest {
  formation_ids: string[];
}

export interface GetFormationsByStepResponse {
  formations: FormationSummary[];
}
