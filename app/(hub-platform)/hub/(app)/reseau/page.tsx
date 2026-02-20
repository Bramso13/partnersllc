import type { Metadata } from "next";
import { HubReseauClient } from "@/components/hub/reseau/HubReseauClient";

export const metadata: Metadata = {
  title: "Réseau | Partners Hub",
  description: "Carte interactive du réseau Partners Hub — trouvez des membres partout dans le monde",
};

export default function HubReseauPage() {
  return <HubReseauClient />;
}
