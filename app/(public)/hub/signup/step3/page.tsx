import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Step3ProfileHub } from "@/components/hub/signup/Step3ProfileHub";

export const metadata: Metadata = {
  title: "Inscription - Étape 3 | Partners Hub",
  description: "Complétez votre profil Partners Hub",
};

export default async function HubSignupStep3Page() {
  const session = await getSession();
  if (!session) {
    redirect("/hub/signup/step1");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface/50 p-6 sm:p-8">
        <Step3ProfileHub />
      </div>
    </div>
  );
}
