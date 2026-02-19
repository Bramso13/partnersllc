import { z } from "zod";
import { isValidIsoCountryCode } from "@/lib/data/iso-countries";

const accountTypeEnum = z.enum(["new", "existing_llc"]);

/**
 * Schéma pour POST /api/hub/signup/step1
 * - accountType requis
 * - email requis uniquement si accountType === 'existing_llc'
 */
export const hubSignupStep1BodySchema = z
  .object({
    accountType: accountTypeEnum,
    email: z.string().email("Email invalide").optional(),
  })
  .refine(
    (data) => {
      if (data.accountType === "existing_llc") {
        return typeof data.email === "string" && data.email.length > 0;
      }
      return true;
    },
    {
      message: "L'email est requis pour le type de compte Client Partners LLC",
      path: ["email"],
    }
  );

export type HubSignupStep1Body = z.infer<typeof hubSignupStep1BodySchema>;

/** E.164: +[1-9] puis 1 à 14 chiffres */
const e164Phone = z
  .string()
  .regex(
    /^\+[1-9]\d{1,14}$/,
    "Téléphone au format international E.164 (ex: +33612345678)"
  )
  .optional()
  .or(z.literal(""));

/** Mot de passe: min 8 caractères, au moins une lettre et un chiffre/caractère spécial */
const strongPassword = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .regex(
    /^(?=.*[A-Za-z])(?=.*[\d@$!%*?&#])[\w@$!%*?&#]+$/,
    "Le mot de passe doit contenir au moins une lettre et un chiffre ou caractère spécial"
  );

/** Schéma base pour l'étape 2 (champs communs) */
const step2BaseSchema = z.object({
  first_name: z.string().min(1, "Le prénom est requis"),
  last_name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: e164Phone.optional().transform((v) => (v === "" ? undefined : v)),
});

/** Schéma step2 pour nouveau compte: password requis */
export const step2NewUserSchema = step2BaseSchema.extend({
  password: strongPassword,
});

/** Schéma step2 pour client LLC: pas de password */
export const step2LlcClientSchema = step2BaseSchema;

/** Alias pour cohérence avec les tests / docs (nouveau membre = nouveau user) */
export const step2NewMemberSchema = step2NewUserSchema;

export type Step2NewUserInput = z.infer<typeof step2NewUserSchema>;
export type Step2NewMemberInput = z.infer<typeof step2NewMemberSchema>;
export type Step2LlcClientInput = z.infer<typeof step2LlcClientSchema>;

const BIO_MAX_LENGTH = 300;
const PROFESSION_MIN_LENGTH = 2;

/** Schéma body étape 3 : pays, métier, bio (profil Hub). */
export const hubSignupStep3BodySchema = z
  .object({
    signup_session_id: z.string().uuid("signup_session_id doit être un UUID"),
    country: z
      .string()
      .length(2, "Le pays doit être un code ISO 3166-1 alpha-2 (2 caractères)")
      .refine((val) => isValidIsoCountryCode(val))
      .transform((val) => val.toUpperCase()),
    profession: z
      .string()
      .min(1, "La profession est requise")
      .min(
        PROFESSION_MIN_LENGTH,
        `La profession doit contenir au moins ${PROFESSION_MIN_LENGTH} caractères`
      )
      .trim(),
    bio: z
      .string()
      .max(
        BIO_MAX_LENGTH,
        `La bio ne doit pas dépasser ${BIO_MAX_LENGTH} caractères`
      )
      .trim()
      .optional()
      .default(""),
  })
  .strict();

export type HubSignupStep3Body = z.infer<typeof hubSignupStep3BodySchema>;

export const HUB_SIGNUP_STEP3 = {
  BIO_MAX_LENGTH,
  PROFESSION_MIN_LENGTH,
} as const;
