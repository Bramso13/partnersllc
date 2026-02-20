/**
 * Types pour les profils membres Partners Hub (Story 16.1)
 */

export interface HubProfileLanguage {
  code: string;
  level: string;
}

export interface HubMemberProfilePublic {
  id: string;
  user_id: string;
  display_name: string | null;
  profession: string | null;
  country: string | null;
  city: string | null;
  bio: string | null;
  avatar_url: string | null;
  expertise_tags: string[];
  languages: HubProfileLanguage[];
  years_experience: number | null;
  website: string | null;
  linkedin_url: string | null;
  twitter_handle: string | null;
  is_llc_client: boolean;
  created_at: string;
  updated_at: string;
}

export interface HubProfileUpdateBody {
  display_name?: string | null;
  profession?: string | null;
  country?: string | null;
  city?: string | null;
  bio?: string | null;
  expertise_tags?: string[];
  languages?: HubProfileLanguage[];
  years_experience?: number | null;
  website?: string | null;
  linkedin_url?: string | null;
  twitter_handle?: string | null;
}
