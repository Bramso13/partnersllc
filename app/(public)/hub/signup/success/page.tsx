import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Inscription réussie | Partners Hub",
  description: "Bienvenue sur Partners Hub",
};

export default function HubSignupSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface/50 p-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Bienvenue !
        </h1>
        <p className="mt-3 text-text-secondary">
          Votre paiement a bien été enregistré. Votre compte Partners Hub est prêt.
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
