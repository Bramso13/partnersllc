"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import PhoneInputWithCountrySelect from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { isValidPhoneNumber } from "react-phone-number-input";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";

/** Schéma commun : password optionnel ; si requirePassword, un refine impose min 8 caractères. */
function createStep2Schema(requirePassword: boolean) {
  return z
    .object({
      firstName: z.string().min(1, "Le prénom est requis"),
      lastName: z.string().min(1, "Le nom est requis"),
      email: z.string().email("Format d'email invalide"),
      phone: z
        .string()
        .optional()
        .refine(
          (val) => !val || val.length === 0 || isValidPhoneNumber(val ?? ""),
          "Numéro de téléphone invalide (format international)"
        ),
      password: z.string().optional(),
    })
    .refine(
      (data) =>
        !requirePassword ||
        (typeof data.password === "string" && data.password.length >= 8),
      {
        message: "Le mot de passe doit contenir au moins 8 caractères",
        path: ["password"],
      }
    );
}

export type Step2FormData = {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phone?: string;
};

export interface Step2PersonalInfoProps {
  signupSessionId: string;
  isLlcClient: boolean;
  prefilledEmail?: string;
  onSessionExpired: () => void;
}

export function Step2PersonalInfo({
  signupSessionId,
  isLlcClient,
  prefilledEmail = "",
  onSessionExpired,
}: Step2PersonalInfoProps) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const schema = createStep2Schema(!isLlcClient);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Step2FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: prefilledEmail,
      password: "",
      phone: undefined,
    },
  });

  const passwordValue = watch("password");

  const onSubmit = async (data: Step2FormData) => {
    try {
      setIsLoading(true);
      setApiError(null);
      setEmailTaken(false);

      const body: Record<string, unknown> = {
        signup_session_id: signupSessionId,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone || undefined,
      };
      if (!isLlcClient && data.password) {
        body.password = data.password;
      }

      const res = await fetch("/api/hub/signup/step2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => ({}));

      if (res.status === 401 || res.status === 404) {
        const msg = json?.error ?? json?.message ?? "Session expirée";
        if (
          msg.toLowerCase().includes("session") ||
          msg.toLowerCase().includes("expir")
        ) {
          onSessionExpired();
          return;
        }
      }

      if (!res.ok) {
        if (res.status === 409 || json?.code === "EMAIL_TAKEN") {
          setEmailTaken(true);
          setApiError("Un compte existe déjà avec cet email.");
          return;
        }
        setApiError(json?.error ?? json?.message ?? "Une erreur est survenue.");
        return;
      }

      if (json.next_step === "step3") {
        window.location.href = `/hub/signup/step3?signup_session_id=${encodeURIComponent(signupSessionId)}`;
        return;
      }
      setApiError("Réponse serveur inattendue.");
    } catch {
      setApiError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const backHref = `/hub/signup/step1?signup_session_id=${encodeURIComponent(signupSessionId)}`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {apiError && (
        <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
          {apiError}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="firstName"
            className="mb-2 block text-sm font-medium text-text-secondary"
          >
            Prénom
          </label>
          <input
            {...register("firstName")}
            type="text"
            id="firstName"
            autoComplete="given-name"
            placeholder="Jean"
            className="input-field w-full rounded-md border border-border bg-surface px-4 py-3 text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-danger">
              {errors.firstName.message}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="lastName"
            className="mb-2 block text-sm font-medium text-text-secondary"
          >
            Nom
          </label>
          <input
            {...register("lastName")}
            type="text"
            id="lastName"
            autoComplete="family-name"
            placeholder="Dupont"
            className="input-field w-full rounded-md border border-border bg-surface px-4 py-3 text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-danger">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-text-secondary"
        >
          Email
        </label>
        <input
          {...register("email")}
          type="email"
          id="email"
          autoComplete="email"
          placeholder="jean.dupont@example.com"
          disabled={isLlcClient}
          className="input-field w-full rounded-md border border-border bg-surface px-4 py-3 text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-70"
        />
        {(errors.email || emailTaken) && (
          <p className="mt-1 text-sm text-danger">
            {emailTaken
              ? "Un compte existe déjà avec cet email."
              : errors.email?.message}
          </p>
        )}
      </div>

      {!isLlcClient && (
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-text-secondary"
          >
            Mot de passe
          </label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className="input-field w-full rounded-md border border-border bg-surface py-3 pl-4 pr-12 text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-foreground"
              aria-label={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
            >
              {showPassword ? (
                <span className="text-sm">Masquer</span>
              ) : (
                <span className="text-sm">Afficher</span>
              )}
            </button>
          </div>
          {/* <PasswordStrengthIndicator
            password={passwordValue ?? ""}
            className="mt-2"
          /> */}
          {errors.password && (
            <p className="mt-1 text-sm text-danger">
              {errors.password.message}
            </p>
          )}
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-text-secondary">
          Téléphone <span className="text-text-secondary/70">(optionnel)</span>
        </label>
        <Controller
          name="phone"
          control={control}
          render={({ field: { onChange, value } }) => (
            <PhoneInputWithCountrySelect
              international
              defaultCountry="FR"
              value={value ?? undefined}
              onChange={onChange}
              numberInputProps={{
                className:
                  "input-field w-full rounded-md border border-border bg-surface px-4 py-3 text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent",
                placeholder: "6 12 34 56 78",
              }}
              countrySelectComponent="select"
              className="flex gap-2 rounded-md border border-border bg-surface [&_.PhoneInputCountrySelect]:rounded-l-md [&_.PhoneInputCountrySelect]:border-0 [&_.PhoneInputCountrySelect]:bg-surface [&_.PhoneInputCountrySelect]:py-3 [&_.PhoneInputInput]:flex-1 [&_.PhoneInputInput]:border-0"
            />
          )}
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-danger">{errors.phone.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-between">
        <Link
          href={backHref}
          className="order-2 rounded-xl border border-border py-3 text-center font-medium text-foreground transition hover:bg-surface sm:order-1"
        >
          Précédent
        </Link>
        <button
          type="submit"
          disabled={isLoading}
          className="order-1 rounded-xl bg-accent py-3 px-6 font-semibold text-background shadow-[0_0_15px_rgba(0,240,255,0.15)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:order-2"
        >
          {isLoading ? "Envoi..." : "Suivant"}
        </button>
      </div>
    </form>
  );
}
