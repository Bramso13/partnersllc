import type { Metadata } from "next";
import { HubSignupClient } from "./HubSignupClient";

export const metadata: Metadata = {
  title: "Inscription | Partners Hub",
  description: "Rejoignez Partners Hub — le réseau des professionnels indépendants",
};

export default function HubSignupPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[600px] rounded-2xl border border-border bg-surface/50 p-6 sm:p-8">
        <HubSignupClient />
      </div>
    </div>
  );
}
