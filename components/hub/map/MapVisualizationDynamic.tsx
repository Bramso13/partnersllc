"use client";

import dynamic from "next/dynamic";

const MapVisualization = dynamic(
  () => import("@/components/hub/map").then((m) => m.MapVisualization),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[min(80vh,600px)] w-full items-center justify-center rounded-lg bg-brand-dark-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-accent border-t-transparent" />
          <span className="text-sm text-brand-text-secondary">Chargement de la carte…</span>
        </div>
      </div>
    ),
  }
);

export function MapVisualizationDynamic() {
  return <MapVisualization />;
}
