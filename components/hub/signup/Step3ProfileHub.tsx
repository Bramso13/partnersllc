"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CountrySelect } from "./CountrySelect";
import type { CountryOption } from "@/lib/hub/countries";

const BIO_MAX = 300;

const step3Schema = z.object({
  country: z
    .object({
      value: z.string(),
      label: z.string(),
      code: z.string(),
    })
    .nullable()
    .refine((val) => val != null && val.value.length > 0, {
      message: "Veuillez sélectionner un pays",
    }),
  job: z.string().min(1, "Le métier est requis"),
  bio: z.string().max(BIO_MAX, `La bio ne doit pas dépasser ${BIO_MAX} caractères`),
});

type Step3FormData = z.infer<typeof step3Schema>;

const JOB_SUGGESTIONS = [
  "Avocat",
  "Entrepreneur E-commerce",
  "Consultant",
  "Comptable",
  "Développeur",
  "Architecte",
  "Médecin",
  "Expert-comptable",
  "Notaire",
  "Ingénieur",
  "Chef de projet",
  "Freelance",
  "Directeur",
  "Manager",
  "Designer",
  "Commercial",
  "Formateur",
  "Coach",
  "Traducteur",
  "Rédacteur",
];

export function Step3ProfileHub() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Step3FormData>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      country: null,
      job: "",
      bio: "",
    },
  });

  const bioLength = watch("bio")?.length ?? 0;

  const onSubmit = async (data: Step3FormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch("/api/hub/signup/step3", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: data.country?.code ?? data.country?.value,
          job: data.job.trim(),
          bio: data.bio.trim(),
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(body.error ?? "Une erreur est survenue. Veuillez réessayer.");
        return;
      }

      router.push("/hub/signup/step4");
      router.refresh();
    } catch (err) {
      console.error("Step3 submit error:", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Progression 3/4 */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-text-secondary mb-2">
          <span>Étape 3 sur 4</span>
          <span>75 %</span>
        </div>
        <div className="w-full h-2 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: "75%" }}
          />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-1">
        Votre profil Partners Hub
      </h1>
      <p className="text-text-secondary text-sm mb-6">
        Complétez votre profil pour finaliser votre inscription.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <div
            className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Pays */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-foreground mb-2">
            Pays
          </label>
          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <CountrySelect
                id="country"
                aria-label="Sélectionner un pays"
                value={field.value}
                onChange={field.onChange}
                placeholder="Rechercher un pays..."
              />
            )}
          />
          {errors.country && (
            <p className="mt-1.5 text-sm text-danger">{errors.country.message}</p>
          )}
        </div>

        {/* Métier avec suggestions */}
        <div>
          <label htmlFor="job" className="block text-sm font-medium text-foreground mb-2">
            Métier
          </label>
          <input
            id="job"
            type="text"
            list="job-suggestions"
            placeholder="Ex. Avocat, Consultant..."
            className="w-full min-h-[44px] px-4 rounded-xl border border-border bg-surface text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            {...register("job")}
          />
          <datalist id="job-suggestions">
            {JOB_SUGGESTIONS.map((job) => (
              <option key={job} value={job} />
            ))}
          </datalist>
          {errors.job && (
            <p className="mt-1.5 text-sm text-danger">{errors.job.message}</p>
          )}
        </div>

        {/* Bio avec compteur */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-foreground mb-2">
            Bio
          </label>
          <textarea
            id="bio"
            rows={4}
            maxLength={BIO_MAX}
            placeholder="Présentez-vous en quelques mots..."
            className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-y"
            {...register("bio")}
          />
          <p className="mt-1.5 text-sm text-text-secondary text-right">
            {bioLength}/{BIO_MAX}
          </p>
          {errors.bio && (
            <p className="mt-1 text-sm text-danger">{errors.bio.message}</p>
          )}
        </div>

        {/* Boutons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/hub/signup/step2"
            className="flex-1 min-h-[44px] flex items-center justify-center rounded-xl border border-border bg-surface text-foreground font-medium hover:bg-border/50 transition-colors"
          >
            Précédent
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 min-h-[44px] rounded-xl bg-accent text-background font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isLoading ? "Envoi en cours..." : "Suivant"}
          </button>
        </div>
      </form>
    </div>
  );
}
