import type { Metadata } from "next";
import { Step4PageClient } from "./Step4PageClient";

export const metadata: Metadata = {
  title: "Inscription - Paiement | Partners Hub",
  description:
    "Choisissez votre plan et procédez au paiement sécurisé pour finaliser votre inscription Partners Hub",
};

export default function HubSignupStep4Page() {
  return <Step4PageClient />;
}
