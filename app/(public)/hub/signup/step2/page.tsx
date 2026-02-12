import type { Metadata } from "next";
import { Step2PageClient } from "./Step2PageClient";

export const metadata: Metadata = {
  title: "Inscription - Informations personnelles | Partners Hub",
  description: "Renseignez vos informations personnelles pour créer votre compte Partners Hub",
};

export default function HubSignupStep2Page() {
  return <Step2PageClient />;
}
