// Formation (training courses) types

export type FormationVisibilityType = "all" | "by_product_ids" | "by_dossier_type";

export type FormationElementType =
  | "video_link"
  | "video_upload"
  | "image"
  | "rich_text"
  | "custom_html";

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

export type CustomHtmlPayload = {
  content: string; // Full HTML page content (sanitized on display)
};

export type FormationElementPayload =
  | VideoLinkPayload
  | VideoUploadPayload
  | ImagePayload
  | RichTextPayload
  | CustomHtmlPayload;

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
  /** Display title (shown in parcours summary). Default "No title yet" if empty. */
  title: string | null;
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
  /** Optional. Default "No title yet" if omitted or empty. */
  title?: string | null;
  payload: FormationElementPayload;
}

export interface UpdateFormationElementRequest {
  type?: FormationElementType;
  position?: number;
  title?: string | null;
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

// Step formation custom (Story 12.5): custom HTML page per step
export interface StepFormationCustom {
  id: string;
  step_id: string;
  position: number;
  title: string;
  html_content: string;
}

export interface StepFormationCustomSummary {
  id: string;
  step_id: string;
  position: number;
  title: string;
}

// Admin API: list custom formations for a step (full rows for editing)
export interface GetStepFormationsCustomResponse {
  formations: StepFormationCustom[];
}

// Admin API: create/update custom formation
export interface PostStepFormationCustomRequest {
  title: string;
  html_content: string;
  position?: number;
}

export interface PutStepFormationCustomRequest {
  title?: string;
  html_content?: string;
  position?: number;
}

// Client API: by-step returns both linked formations and custom (unified list with type)
export type StepFormationItem =
  | { type: "formation"; id: string; titre: string; url: string }
  | { type: "custom"; id: string; title: string; url: string };

export interface GetFormationsByStepResponseV2 {
  formations: FormationSummary[];
  formations_custom: StepFormationCustomSummary[];
  /** Unified ordered list for display (formation + custom by position) */
  items: StepFormationItem[];
}

// Client API: get one custom formation (for step-custom page)
export interface GetStepFormationCustomResponse {
  id: string;
  step_id: string;
  title: string;
  html_content: string;
}
