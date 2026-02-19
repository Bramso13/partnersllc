"use client";

import { useCallback, useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* Corrige le chemin des icônes Leaflet (problème connu avec bundlers) */
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

/** Tuiles Carto Voyager – style soigné, pas de clé API */
const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

/** Vue monde : centre et zoom pour afficher la planète */
const WORLD_CENTER: [number, number] = [20, 0];
const WORLD_ZOOM = 2;

function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [map]);
  return null;
}

export function MapVisualization() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMapReady = useCallback(() => {
    setIsLoaded(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-full min-h-[400px] w-full items-center justify-center rounded-lg bg-brand-dark-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-accent border-t-transparent" />
          <span className="text-sm text-brand-text-secondary">Chargement de la carte…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[400px] w-full overflow-hidden rounded-lg">
      {!isLoaded && (
        <div
          className="absolute inset-0 z-[1000] flex items-center justify-center bg-brand-dark-surface"
          aria-hidden="true"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-accent border-t-transparent" />
            <span className="text-sm text-brand-text-secondary">Initialisation de la carte…</span>
          </div>
        </div>
      )}
      <MapContainer
        center={WORLD_CENTER}
        zoom={WORLD_ZOOM}
        className="h-full w-full"
        style={{ minHeight: "400px" }}
        scrollWheelZoom
        whenReady={handleMapReady}
      >
        <TileLayer
          attribution={TILE_ATTRIBUTION}
          url={TILE_URL}
          subdomains="abcd"
          maxZoom={19}
          maxNativeZoom={19}
        />
        <MapResizeHandler />
      </MapContainer>
    </div>
  );
}
