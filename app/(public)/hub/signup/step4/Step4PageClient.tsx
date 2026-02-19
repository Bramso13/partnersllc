"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useCallback, useState } from "react";
import { SignupProgressBar } from "@/components/hub/signup/SignupProgressBar";
import Link from "next/link";

const TOTAL_STEPS = 4;
const CURRENT_STEP = 4;

type Plan = "monthly" | "yearly";

interface Recap {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  country: string | null;
  profession: string | null;
}

export function Step4PageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const signupSessionId = searchParams.get("signup_session_id");

  const [recap, setRecap] = useState<Recap | null>(null);
  const [recapLoading, setRecapLoading] = useState(true);
  const [recapError, setRecapError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan>("yearly");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const redirectToStep1 = useCallback(() => {
    router.replace("/hub/signup/step1");
  }, [router]);

  useEffect(() => {
    if (!signupSessionId?.trim()) {
      redirectToStep1();
      return;
    }

    let cancelled = false;
    (async () => {
      setRecapLoading(true);
      setRecapError(null);
      try {
        const res = await fetch(
          `/api/hub/signup/session?signup_session_id=${encodeURIComponent(signupSessionId)}`
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          if (res.status === 404 || res.status === 410) {
            redirectToStep1();
            return;
          }
          setRecapError(data?.error ?? "Erreur lors du chargement");
          setRecap(null);
          return;
        }
        setRecap(data);
      } catch {
        if (!cancelled) setRecapError("Erreur lors du chargement");
      } finally {
        if (!cancelled) setRecapLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [signupSessionId, redirectToStep1]);

  const handleProceedToPayment = async () => {
    if (!signupSessionId?.trim()) return;
    setPaymentError(null);
    setPaymentLoading(true);
    try {
      const res = await fetch("/api/hub/signup/payment/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signup_session_id: signupSessionId,
          plan: selectedPlan,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPaymentError(data?.error ?? "Impossible de lancer le paiement");
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setPaymentError("Réponse serveur inattendue");
    } catch {
      setPaymentError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (!signupSessionId?.trim()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-text-secondary">Redirection...</p>
      </div>
    );
  }

  // Step3 (pays / métier) pas encore implémenté : retour vers step2
  const backHref = `/hub/signup/step2?signup_session_id=${encodeURIComponent(signupSessionId)}`;

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-lg">
        <SignupProgressBar
          currentStep={CURRENT_STEP}
          totalSteps={TOTAL_STEPS}
          className="mb-8"
        />
        <div className="rounded-2xl border border-border bg-surface/50 p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-foreground">
            Paiement sécurisé
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Étape 4 sur 4 — Choisissez votre plan et finalisez votre inscription.
          </p>

          {recapLoading && (
            <div className="mt-6 text-sm text-text-secondary">
              Chargement du récapitulatif...
            </div>
          )}

          {recapError && (
            <div className="mt-6 rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
              {recapError}
            </div>
          )}

          {recap && !recapLoading && (
            <>
              <section className="mt-6 rounded-xl border border-border bg-surface/80 p-4">
                <h2 className="text-sm font-semibold text-foreground">
                  Récapitulatif
                </h2>
                <dl className="mt-3 grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Nom</dt>
                    <dd className="font-medium text-foreground">
                      {[recap.first_name, recap.last_name].filter(Boolean).join(" ") || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Email</dt>
                    <dd className="font-medium text-foreground">
                      {recap.email || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Pays</dt>
                    <dd className="font-medium text-foreground">
                      {recap.country || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-secondary">Métier</dt>
                    <dd className="font-medium text-foreground">
                      {recap.profession || "—"}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="mt-8">
                <h2 className="text-sm font-semibold text-foreground">
                  Choisissez votre plan
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan("monthly")}
                    className={`relative rounded-xl border-2 p-5 text-left transition ${
                      selectedPlan === "monthly"
                        ? "border-accent bg-accent/10"
                        : "border-border bg-surface hover:border-accent/50"
                    }`}
                  >
                    <span className="text-lg font-bold text-foreground">
                      Monthly
                    </span>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      €29
                      <span className="text-sm font-normal text-text-secondary">
                        /mois
                      </span>
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPlan("yearly")}
                    className={`relative rounded-xl border-2 p-5 text-left transition ${
                      selectedPlan === "yearly"
                        ? "border-accent bg-accent/10"
                        : "border-border bg-surface hover:border-accent/50"
                    }`}
                  >
                    <span className="absolute right-3 top-3 rounded bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
                      Économisez €58 / 2 mois offerts
                    </span>
                    <span className="text-lg font-bold text-foreground">
                      Yearly
                    </span>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      €290
                      <span className="text-sm font-normal text-text-secondary">
                        /an
                      </span>
                    </p>
                  </button>
                </div>
              </section>

              {paymentError && (
                <div className="mt-4 rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
                  {paymentError}
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <Link
                  href={backHref}
                  className="order-2 rounded-xl border border-border py-3 text-center font-medium text-foreground transition hover:bg-surface sm:order-1"
                >
                  Précédent
                </Link>
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  disabled={paymentLoading}
                  className="order-1 rounded-xl bg-accent py-3 px-6 font-semibold text-background shadow-[0_0_15px_rgba(0,240,255,0.15)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:order-2"
                >
                  {paymentLoading ? "Redirection..." : "Procéder au paiement"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
