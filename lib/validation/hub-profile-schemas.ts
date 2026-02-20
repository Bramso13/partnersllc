import { z } from "zod";

const urlOptional = z
  .string()
  .max(500)
  .refine(
    (v) => !v || v.startsWith("http://") || v.startsWith("https://"),
    "URL invalide (doit commencer par http:// ou https://)"
  )
  .nullable()
  .optional()
  .transform((v) => (v === "" ? null : v));

const languageSchema = z.object({
  code: z.string().min(1).max(10),
  level: z.string().min(1).max(50),
});

/**
 * Schéma pour POST /api/hub/profile/update
 */
export const hubProfileUpdateSchema = z.object({
  display_name: z.string().max(100).nullable().optional(),
  profession: z.string().max(200).nullable().optional(),
  country: z.string().length(2).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  bio: z.string().max(1000).nullable().optional(),
  expertise_tags: z.array(z.string().max(50)).max(20).optional(),
  languages: z.array(languageSchema).max(10).optional(),
  years_experience: z
    .number()
    .int()
    .min(0)
    .max(70)
    .nullable()
    .optional(),
  website: urlOptional,
  linkedin_url: urlOptional,
  twitter_handle: z.string().max(100).nullable().optional().transform((v) => (v === "" ? null : v)),
});

export type HubProfileUpdateInput = z.infer<typeof hubProfileUpdateSchema>;
