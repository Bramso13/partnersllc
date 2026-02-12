"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Building } from "lucide-react";

const step1Schema = z
  .object({
    accountType: z.enum(["new", "existing_llc"]),
    email: z.string().email("Email invalide").optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.accountType === "existing_llc") {
        return !!data.email && data.email.length > 0;
      }
      return true;
    },
    {
      message: "L'email est requis pour les clients Partners LLC",
      path: ["email"],
    }
  );

type Step1FormData = z.infer<typeof step1Schema>;

const SIGNUP_SESSION_KEY = "hub_signup_session_id";

export function Step1TypeAccount() {
  const [accountType, setAccountType] = useState<"new" | "existing_llc" | null>(
    null
  );
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      accountType: undefined,
      email: "",
    },
  });

  const selectedType = watch("accountType");
  const email = watch("email");

  const isFormValid =
    accountType === "new" ||
    (accountType === "existing_llc" && email && email.includes("@"));

  const handleSelectType = (type: "new" | "existing_llc") => {
    setAccountType(type);
    setValue("accountType", type);
    setApiError(null);
    if (type === "new") {
      setValue("email", "");
    }
  };

  const onSubmit = async (data: Step1FormData) => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      const body: { accountType: "new" | "existing_llc"; email?: string } = {
        accountType: data.accountType,
      };
      if (data.accountType === "existing_llc" && data.email) {
        body.email = data.email;
      }

      const res = await fetch("/api/hub/signup/step1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 404) {
          setApiError("Email non trouvé dans nos clients LLC");
          return;
        }
        if (res.status === 401 || res.status === 410) {
          router.replace("/hub/signup/step1");
          return;
        }
        setApiError(
          typeof json?.error === "string"
            ? json.error
            : "Une erreur est survenue. Veuillez réessayer."
        );
        return;
      }

      const sessionId = json.signup_session_id;
      if (sessionId) {
        sessionStorage.setItem(SIGNUP_SESSION_KEY, sessionId);
      }
      router.push("/hub/signup/step2");
    } catch {
      setApiError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {apiError && (
        <div
          className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {apiError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => handleSelectType("new")}
          className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-left transition focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background ${
            selectedType === "new"
              ? "border-accent bg-accent/10"
              : "border-border bg-surface/50 hover:border-border/80 hover:bg-surface"
          }`}
        >
          <UserPlus
            className={`h-10 w-10 shrink-0 ${
              selectedType === "new" ? "text-accent" : "text-text-secondary"
            }`}
          />
          <span className="font-semibold text-foreground">Nouveau membre</span>
          <span className="text-sm text-text-secondary">
            Je crée mon compte Partners Hub
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectType("existing_llc")}
          className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-left transition focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background ${
            selectedType === "existing_llc"
              ? "border-accent bg-accent/10"
              : "border-border bg-surface/50 hover:border-border/80 hover:bg-surface"
          }`}
        >
          <Building
            className={`h-10 w-10 shrink-0 ${
              selectedType === "existing_llc"
                ? "text-accent"
                : "text-text-secondary"
            }`}
          />
          <span className="font-semibold text-foreground">
            Client Partners LLC
          </span>
          <span className="text-sm text-text-secondary">
            J&apos;ai déjà un compte client
          </span>
        </button>
      </div>

      <input type="hidden" {...register("accountType")} />

      {accountType === "existing_llc" && (
        <div className="space-y-2">
          <p className="text-sm text-text-secondary">
            Saisissez l&apos;email associé à votre compte client Partners LLC
            pour vérifier votre éligibilité et lier votre abonnement Hub.
          </p>
          <div>
            <label
              htmlFor="step1-email"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Email
            </label>
            <input
              id="step1-email"
              type="email"
              placeholder="vous@exemple.com"
              autoComplete="email"
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-danger">{errors.email.message}</p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 pt-2">
        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="w-full rounded-xl bg-accent py-3.5 font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Envoi..." : "Suivant"}
        </button>
        <Link
          href="/hub"
          className="text-center text-sm text-text-secondary hover:text-foreground"
        >
          Retour à l&apos;accueil Hub
        </Link>
      </div>
    </form>
  );
}
