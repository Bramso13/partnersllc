/**
 * Format de sortie commun recherche / suggestions (Story 16.2 / 16.3).
 */
export interface HubMemberSearchResult {
  id: string;
  user_id: string;
  display_name: string | null;
  profession: string | null;
  country: string | null;
  city: string | null;
  bio_snippet: string | null;
  avatar_url: string | null;
}
