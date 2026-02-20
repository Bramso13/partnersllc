import type { Metadata } from "next";
import { Suspense } from "react";
import { HubSignupSuccessClient } from "./HubSignupSuccessClient";

export const metadata: Metadata = {
  title: "Inscription réussie | Partners Hub",
  description: "Bienvenue sur Partners Hub",
};

export default function HubSignupSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-text-secondary">Chargement...</p>
        </div>
      }
    >
      <HubSignupSuccessClient />
    </Suspense>
  );
}
