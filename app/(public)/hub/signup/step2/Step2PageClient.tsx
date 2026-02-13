"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useCallback } from "react";
import { Step2PersonalInfo } from "@/components/hub/signup/Step2PersonalInfo";
import { SignupProgressBar } from "@/components/hub/signup/SignupProgressBar";

const TOTAL_STEPS = 4;
const CURRENT_STEP = 2;

export function Step2PageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const signupSessionId = searchParams.get("signup_session_id");
  const isLlcClient = searchParams.get("is_llc_client") === "true";
  const prefilledEmail = searchParams.get("email") ?? "";

  const redirectToStep1 = useCallback(() => {
    router.replace("/hub/signup/step1");
  }, [router]);

  useEffect(() => {
    if (!signupSessionId || signupSessionId.trim() === "") {
      redirectToStep1();
      return;
    }
  }, [signupSessionId]);

  if (!signupSessionId || signupSessionId.trim() === "") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-text-secondary">Redirection...</p>
      </div>
    );
  }

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
            Informations personnelles
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Étape 2 sur 4 — Renseignez vos informations pour créer votre compte
            Partners Hub.
          </p>
          <div className="mt-6">
            <Step2PersonalInfo
              signupSessionId={signupSessionId}
              isLlcClient={isLlcClient}
              prefilledEmail={prefilledEmail}
              onSessionExpired={redirectToStep1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
