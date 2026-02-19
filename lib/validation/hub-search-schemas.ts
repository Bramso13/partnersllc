import { z } from "zod";

/**
 * Schéma des query params pour GET /api/hub/search
 * Tous optionnels. Filtres en AND. q = recherche texte sur display_name et bio.
 */
export const hubSearchQuerySchema = z.object({
  country: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").map((c) => c.trim()).filter(Boolean) : undefined)),
  profession: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").map((p) => p.trim()).filter(Boolean) : undefined)),
  expertise: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").map((e) => e.trim()).filter(Boolean) : undefined)),
  languages: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").map((l) => l.trim()).filter(Boolean) : undefined)),
  q: z.string().optional().transform((v) => (v && v.trim() ? v.trim() : undefined)),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type HubSearchQuery = z.infer<typeof hubSearchQuerySchema>;
