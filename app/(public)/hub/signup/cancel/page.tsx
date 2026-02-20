"use client";

import Link from "next/link";

export default function HubSignupCancelPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface/50 p-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Paiement annulé
        </h1>
        <p className="mt-3 text-text-secondary">
          Vous avez annulé le paiement. Aucun prélèvement n&apos;a été effectué.
        </p>
        <Link
          href="/hub/signup"
          className="mt-8 inline-block w-full rounded-xl bg-accent py-3 px-6 font-semibold text-background shadow-[0_0_15px_rgba(0,240,255,0.15)] transition hover:opacity-90 sm:w-auto"
        >
          Réessayer l&apos;inscription
        </Link>
      </div>
    </div>
  );
}
