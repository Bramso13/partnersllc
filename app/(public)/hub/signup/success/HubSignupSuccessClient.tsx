"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export function HubSignupSuccessClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId?.trim() || sessionId.length < 3) {
      setStatus("success");
      return;
    }

    let cancelled = false;
    setStatus("verifying");

    (async () => {
      try {
        const res = await fetch("/api/hub/signup/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setErrorMsg(data?.error ?? "Erreur lors de la vérification du paiement");
          setStatus("error");
          return;
        }
        setStatus("success");
      } catch {
        if (!cancelled) {
          setErrorMsg("Une erreur est survenue");
          setStatus("error");
        }
      }
    })();

    return () => { cancelled = true; };
  }, [sessionId]);

  if (status === "verifying") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface/50 p-8 text-center">
          <p className="text-text-secondary">Vérification du paiement en cours...</p>
          <div className="mt-4 h-2 w-48 mx-auto rounded-full bg-border overflow-hidden">
            <div className="h-full w-1/2 rounded-full bg-accent animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface/50 p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Erreur</h1>
          <p className="mt-3 text-danger">{errorMsg}</p>
          <Link
            href="/hub/signup"
            className="mt-8 inline-block rounded-xl bg-accent py-3 px-6 font-semibold text-background"
          >
            Réessayer l&apos;inscription
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface/50 p-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">Bienvenue !</h1>
        <p className="mt-3 text-text-secondary">
          {sessionId
            ? "Votre paiement a bien été enregistré. "
            : ""}
          Votre compte Partners Hub est prêt.
        </p>
        <Link
          href="/hub/onboarding/welcome"
          className="mt-8 inline-block w-full rounded-xl bg-accent py-3 px-6 font-semibold text-background shadow-[0_0_15px_rgba(0,240,255,0.15)] transition hover:opacity-90 sm:w-auto"
        >
          Découvrir Partners Hub
        </Link>
      </div>
    </div>
  );
}
