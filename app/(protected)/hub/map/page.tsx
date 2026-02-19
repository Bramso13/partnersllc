import { requireAuth } from "@/lib/auth";
import { MapVisualizationDynamic } from "@/components/hub/map/MapVisualizationDynamic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Carte du réseau | PARTNERS Hub",
  description: "Carte interactive du réseau PARTNERS Hub",
};

export default async function HubMapPage() {
  await requireAuth();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col p-4 md:p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-brand-text-primary">Carte du réseau</h1>
        <p className="mt-1 text-sm text-brand-text-secondary">
          Découvrez les membres du PARTNERS Hub à travers le monde.
        </p>
      </header>
      <div className="min-h-[400px] flex-1">
        <MapVisualizationDynamic />
      </div>
    </div>
  );
}
