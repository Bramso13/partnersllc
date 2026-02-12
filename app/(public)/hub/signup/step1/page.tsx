import type { Metadata } from "next";
import { ProgressBar } from "@/components/hub/signup/ProgressBar";
import { Step1TypeAccount } from "@/components/hub/signup/Step1TypeAccount";

export const metadata: Metadata = {
  title: "Inscription - Étape 1 | Partners Hub",
  description: "Choisissez votre type de compte pour commencer votre inscription Partners Hub",
};

export default function HubSignupStep1Page() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[600px] rounded-2xl border border-border bg-surface/50 p-6 sm:p-8">
        <div className="mb-6">
          <ProgressBar currentStep={1} totalSteps={4} />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Type de compte
        </h1>
        <p className="text-text-secondary mb-6">
          Choisissez comment vous souhaitez rejoindre Partners Hub.
        </p>
        <Step1TypeAccount />
      </div>
    </div>
  );
}
