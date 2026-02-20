import type { Metadata } from "next";
import { HubOnboardingClient } from "./HubOnboardingClient";

export const metadata: Metadata = {
  title: "Bienvenue | Partners Hub",
  description: "Découvrez votre réseau professionnel Partners Hub",
};

export default function HubOnboardingWelcomePage() {
  return <HubOnboardingClient />;
}
