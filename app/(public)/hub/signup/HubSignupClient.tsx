"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, Building } from "lucide-react";
import { SignupProgressBar } from "@/components/hub/signup/SignupProgressBar";
import { CountrySelect } from "@/components/hub/signup/CountrySelect";
import type { CountryOption } from "@/lib/hub/countries";
import PhoneInputWithCountrySelect from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { isValidPhoneNumber } from "react-phone-number-input";
import Link from "next/link";

const TOTAL_STEPS = 4;
const BIO_MAX = 300;
const JOB_SUGGESTIONS = [
  "Avocat", "Entrepreneur E-commerce", "Consultant", "Comptable", "Développeur",
  "Architecte", "Médecin", "Expert-comptable", "Notaire", "Ingénieur",
  "Chef de projet", "Freelance", "Directeur", "Manager", "Designer",
  "Commercial", "Formateur", "Coach", "Traducteur", "Rédacteur",
];

const step1Schema = z.object({
  accountType: z.enum(["new", "existing_llc"]),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
}).refine(
  (d) => d.accountType !== "existing_llc" || (!!d.email && d.email.includes("@")),
  { message: "L'email est requis pour les clients Partners LLC", path: ["email"] }
);

const step2NewSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(8, "Minimum 8 caractères").regex(
    /^(?=.*[A-Za-z])(?=.*[\d@$!%*?&#])[\w@$!%*?&#]+$/,
    "Lettre + chiffre ou caractère spécial"
  ),
  phone: z.string().optional().refine((v) => !v || isValidPhoneNumber(v), "Téléphone invalide"),
});

const step2LlcSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Format d'email invalide"),
  phone: z.string().optional().refine((v) => !v || isValidPhoneNumber(v), "Téléphone invalide"),
});

const step3Schema = z.object({
  country: z.object({ value: z.string(), label: z.string(), code: z.string() }).nullable()
    .refine((v) => v != null && v.code?.length === 2, "Sélectionnez un pays"),
  city: z.string().max(100).optional(),
  profession: z.string().min(1, "Le métier est requis"),
  bio: z.string().max(BIO_MAX, `Max ${BIO_MAX} caractères`),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2NewData = z.infer<typeof step2NewSchema>;
type Step2LlcData = z.infer<typeof step2LlcSchema>;
type Step3Data = z.infer<typeof step3Schema>;

type Plan = "monthly" | "yearly";

interface LlcCheckResult {
  is_llc_client: boolean;
  existing_user_id?: string;
}

export function HubSignupClient() {
  const [step, setStep] = useState(1);
  const [apiError, setApiError] = useState<string | null>(null);
  const [llcCheck, setLlcCheck] = useState<LlcCheckResult | null>(null);

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { accountType: undefined as unknown as "new" | "existing_llc", email: "" },
  });

  const step2Form = useForm<Step2NewData | Step2LlcData>({
    defaultValues: {
      firstName: "", lastName: "", email: "", password: "", phone: undefined,
    },
  });

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: { country: null, city: "", profession: "", bio: "" },
  });

  const [selectedPlan, setSelectedPlan] = useState<Plan>("yearly");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLlcClient = llcCheck?.is_llc_client ?? false;
  const existingUserId = llcCheck?.existing_user_id;

  // Step 1: Check LLC client
  const onStep1Submit = async (data: Step1Data) => {
    setApiError(null);
    if (data.accountType === "new") {
      setLlcCheck({ is_llc_client: false });
      step2Form.setValue("email", "");
      setStep(2);
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/hub/signup/check-llc-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setApiError(json?.error ?? "Erreur lors de la vérification");
        return;
      }
      setLlcCheck({ is_llc_client: true, existing_user_id: json.existing_user_id });
      step2Form.setValue("email", (data.email ?? "").trim());
      setStep(2);
    } catch {
      setApiError("Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Personal info
  const onStep2Submit = async (data: Step2NewData | Step2LlcData) => {
    setApiError(null);
    const schema = isLlcClient ? step2LlcSchema : step2NewSchema;
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      const errs = parsed.error.flatten().fieldErrors;
      Object.entries(errs).forEach(([key, msgs]) => {
        const msg = Array.isArray(msgs) ? msgs[0] : msgs;
        step2Form.setError(key as keyof Step2NewData, { message: msg ?? "Erreur" });
      });
      return;
    }
    setStep(3);
  };

  // Step 3: Profile Hub
  const onStep3Submit = async (data: Step3Data) => {
    setApiError(null);
    setStep(4);
  };

  // Step 4a: LLC client – create without payment
  const handleCreateLlcAccount = async () => {
    setApiError(null);
    setIsSubmitting(true);
    const step2Data = step2Form.getValues();
    const step3Data = step3Form.getValues();
    try {
      const res = await fetch("/api/hub/signup/complete-llc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          existing_user_id: existingUserId,
          email: step2Data.email,
          first_name: step2Data.firstName,
          last_name: step2Data.lastName,
          phone: step2Data.phone || undefined,
          country: step3Data.country?.code ?? step3Data.country?.value,
          city: step3Data.city?.trim() || undefined,
          profession: step3Data.profession?.trim() ?? "",
          bio: step3Data.bio?.trim() ?? "",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setApiError(json?.error ?? "Erreur lors de la création du compte");
        return;
      }
      window.location.href = "/hub/signup/success";
    } catch {
      setApiError("Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 4b: New member – create auth + Stripe checkout
  const handleCreateAndPay = async () => {
    setApiError(null);
    setIsSubmitting(true);
    const step2Data = step2Form.getValues() as Step2NewData;
    const step3Data = step3Form.getValues();
    try {
      const res = await fetch("/api/hub/signup/create-and-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: step2Data.firstName,
          last_name: step2Data.lastName,
          email: step2Data.email,
          password: step2Data.password,
          phone: step2Data.phone || undefined,
          country: step3Data.country?.code ?? step3Data.country?.value,
          city: step3Data.city?.trim() || undefined,
          profession: step3Data.profession?.trim() ?? "",
          bio: step3Data.bio?.trim() ?? "",
          plan: selectedPlan,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setApiError(json?.error ?? "Erreur lors de la création");
        return;
      }
      if (json?.url) {
        window.location.href = json.url;
      } else {
        setApiError("Réponse serveur inattendue");
      }
    } catch {
      setApiError("Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SignupProgressBar currentStep={step} totalSteps={TOTAL_STEPS} className="mb-6" />

      {step === 1 && (
        <>
          <h1 className="text-2xl font-bold text-foreground mb-1">Type de compte</h1>
          <p className="text-text-secondary mb-6">Choisissez comment vous rejoignez Partners Hub.</p>
          <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-6">
            {apiError && (
              <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
                {apiError}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => { step1Form.setValue("accountType", "new"); step1Form.setValue("email", ""); setApiError(null); }}
                className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-left transition ${
                  step1Form.watch("accountType") === "new" ? "border-accent bg-accent/10" : "border-border bg-surface/50 hover:border-accent/50"
                }`}
              >
                <UserPlus className={`h-10 w-10 ${step1Form.watch("accountType") === "new" ? "text-accent" : "text-text-secondary"}`} />
                <span className="font-semibold text-foreground">Nouveau membre</span>
                <span className="text-sm text-text-secondary">Je crée mon compte Partners Hub</span>
              </button>
              <button
                type="button"
                onClick={() => step1Form.setValue("accountType", "existing_llc")}
                className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-left transition ${
                  step1Form.watch("accountType") === "existing_llc" ? "border-accent bg-accent/10" : "border-border bg-surface/50 hover:border-accent/50"
                }`}
              >
                <Building className={`h-10 w-10 ${step1Form.watch("accountType") === "existing_llc" ? "text-accent" : "text-text-secondary"}`} />
                <span className="font-semibold text-foreground">Client Partners LLC</span>
                <span className="text-sm text-text-secondary">J&apos;ai déjà un compte client</span>
              </button>
            </div>
            <input type="hidden" {...step1Form.register("accountType")} />
            {step1Form.watch("accountType") === "existing_llc" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="vous@exemple.com"
                  className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground"
                  {...step1Form.register("email")}
                />
                {step1Form.formState.errors.email && (
                  <p className="mt-1 text-sm text-danger">{step1Form.formState.errors.email.message}</p>
                )}
              </div>
            )}
            <button
              type="submit"
              disabled={!step1Form.watch("accountType") || (step1Form.watch("accountType") === "existing_llc" && !step1Form.watch("email")?.includes("@")) || isSubmitting}
              className="w-full rounded-xl bg-accent py-3.5 font-semibold text-background disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Vérification..." : "Suivant"}
            </button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <h1 className="text-2xl font-bold text-foreground mb-1">Informations personnelles</h1>
          <p className="text-text-secondary mb-6">Étape 2 sur 4</p>
          <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-5">
            {apiError && (
              <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{apiError}</div>
            )}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">Prénom</label>
                <input
                  {...step2Form.register("firstName")}
                  className="input-field w-full rounded-md border border-border bg-surface px-4 py-3"
                />
                {step2Form.formState.errors.firstName && <p className="mt-1 text-sm text-danger">{step2Form.formState.errors.firstName.message}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">Nom</label>
                <input
                  {...step2Form.register("lastName")}
                  className="input-field w-full rounded-md border border-border bg-surface px-4 py-3"
                />
                {step2Form.formState.errors.lastName && <p className="mt-1 text-sm text-danger">{step2Form.formState.errors.lastName.message}</p>}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">Email</label>
              <input
                {...step2Form.register("email")}
                type="email"
                disabled={isLlcClient}
                className="input-field w-full rounded-md border border-border bg-surface px-4 py-3 disabled:opacity-70"
              />
              {step2Form.formState.errors.email && <p className="mt-1 text-sm text-danger">{step2Form.formState.errors.email.message}</p>}
            </div>
            {!isLlcClient && (
              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">Mot de passe</label>
                <input
                  {...step2Form.register("password")}
                  type="password"
                  className="input-field w-full rounded-md border border-border bg-surface px-4 py-3"
                />
                {((step2Form.formState.errors as Record<string, { message?: string }>).password) && (
                <p className="mt-1 text-sm text-danger">{(step2Form.formState.errors as Record<string, { message?: string }>).password?.message}</p>
              )}
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">Téléphone (optionnel)</label>
              <Controller
                name="phone"
                control={step2Form.control}
                render={({ field }) => (
                  <PhoneInputWithCountrySelect
                    international
                    defaultCountry="FR"
                    value={field.value ?? undefined}
                    onChange={field.onChange}
                    numberInputProps={{ className: "input-field w-full rounded-md border border-border bg-surface px-4 py-3" }}
                    countrySelectComponent="select"
                    className="flex gap-2 rounded-md border border-border bg-surface"
                  />
                )}
              />
              {step2Form.formState.errors.phone && <p className="mt-1 text-sm text-danger">{step2Form.formState.errors.phone.message}</p>}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)} className="rounded-xl border border-border py-3 px-6 font-medium">
                Précédent
              </button>
              <button type="submit" className="flex-1 rounded-xl bg-accent py-3 px-6 font-semibold text-background">
                Suivant
              </button>
            </div>
          </form>
        </>
      )}

      {step === 3 && (
        <>
          <h1 className="text-2xl font-bold text-foreground mb-1">Votre profil Partners Hub</h1>
          <p className="text-text-secondary mb-6">Étape 3 sur 4 — Complétez votre profil.</p>
          <form onSubmit={step3Form.handleSubmit(onStep3Submit)} className="space-y-5">
            {apiError && (
              <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{apiError}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Pays</label>
              <Controller
                name="country"
                control={step3Form.control}
                render={({ field }) => (
                  <CountrySelect value={field.value} onChange={field.onChange} placeholder="Rechercher un pays..." />
                )}
              />
              {step3Form.formState.errors.country && <p className="mt-1.5 text-sm text-danger">{step3Form.formState.errors.country.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Ville (optionnel)</label>
              <input
                {...step3Form.register("city")}
                type="text"
                placeholder="Ex. Paris, Lyon..."
                maxLength={100}
                className="w-full min-h-[44px] px-4 rounded-xl border border-border bg-surface"
              />
              {step3Form.formState.errors.city && <p className="mt-1.5 text-sm text-danger">{step3Form.formState.errors.city.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Métier</label>
              <input
                {...step3Form.register("profession")}
                list="job-suggestions"
                placeholder="Ex. Avocat, Consultant..."
                className="w-full min-h-[44px] px-4 rounded-xl border border-border bg-surface"
              />
              <datalist id="job-suggestions">
                {JOB_SUGGESTIONS.map((j) => <option key={j} value={j} />)}
              </datalist>
              {step3Form.formState.errors.profession && <p className="mt-1.5 text-sm text-danger">{step3Form.formState.errors.profession.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Bio</label>
              <textarea
                {...step3Form.register("bio")}
                rows={4}
                maxLength={BIO_MAX}
                placeholder="Présentez-vous en quelques mots..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface resize-y"
              />
              <p className="mt-1.5 text-sm text-text-secondary text-right">
                {(step3Form.watch("bio")?.length ?? 0)}/{BIO_MAX}
              </p>
              {step3Form.formState.errors.bio && <p className="mt-1 text-sm text-danger">{step3Form.formState.errors.bio.message}</p>}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(2)} className="rounded-xl border border-border py-3 px-6 font-medium">
                Précédent
              </button>
              <button type="submit" className="flex-1 rounded-xl bg-accent py-3 px-6 font-semibold text-background">
                Suivant
              </button>
            </div>
          </form>
        </>
      )}

      {step === 4 && (
        <>
          <h1 className="text-2xl font-bold text-foreground mb-1">Finalisation</h1>
          <p className="text-text-secondary mb-6">Étape 4 sur 4</p>

          {isLlcClient ? (
            <div className="space-y-6">
              <p className="text-sm text-text-secondary">
                En tant que client Partners LLC, vous pouvez rejoindre Partners Hub sans paiement supplémentaire.
              </p>
              {apiError && (
                <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{apiError}</div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(3)} className="rounded-xl border border-border py-3 px-6 font-medium">
                  Précédent
                </button>
                <button
                  type="button"
                  onClick={handleCreateLlcAccount}
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-accent py-3 px-6 font-semibold text-background disabled:opacity-50"
                >
                  {isSubmitting ? "Création..." : "Créer mon compte Hub"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-text-secondary">Choisissez votre plan et procédez au paiement.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSelectedPlan("monthly")}
                  className={`rounded-xl border-2 p-5 text-left transition ${selectedPlan === "monthly" ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"}`}
                >
                  <span className="text-lg font-bold">Monthly</span>
                  <p className="mt-1 text-2xl font-bold">€29 <span className="text-sm font-normal text-text-secondary">/mois</span></p>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlan("yearly")}
                  className={`rounded-xl border-2 p-5 text-left transition relative ${selectedPlan === "yearly" ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"}`}
                >
                  <span className="absolute right-3 top-3 rounded bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">Économisez €58</span>
                  <span className="text-lg font-bold">Yearly</span>
                  <p className="mt-1 text-2xl font-bold">€290 <span className="text-sm font-normal text-text-secondary">/an</span></p>
                </button>
              </div>
              {apiError && (
                <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{apiError}</div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(3)} className="rounded-xl border border-border py-3 px-6 font-medium">
                  Précédent
                </button>
                <button
                  type="button"
                  onClick={handleCreateAndPay}
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-accent py-3 px-6 font-semibold text-background disabled:opacity-50"
                >
                  {isSubmitting ? "Redirection..." : "Procéder au paiement"}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <Link href="/hub" className="mt-6 block text-center text-sm text-text-secondary hover:text-foreground">
        Retour à l&apos;accueil Hub
      </Link>
    </>
  );
}
