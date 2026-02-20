"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { HubMemberSearchResult } from "@/lib/hub/types";

/* ── Fix Leaflet default icon paths ── */
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
    ._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

/* ── Dark map tiles (CartoDB Dark Matter) ── */
const DARK_TILE_URL =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

/* ── Country centroids ── */
const COUNTRY_COORDS: Record<string, [number, number]> = {
  FR: [46.2276, 2.2137],
  US: [37.0902, -95.7129],
  GB: [55.3781, -3.436],
  DE: [51.1657, 10.4515],
  ES: [40.4637, -3.7492],
  IT: [41.8719, 12.5674],
  CA: [56.1304, -106.3468],
  AU: [-25.2744, 133.7751],
  BE: [50.5039, 4.4699],
  CH: [46.8182, 8.2275],
  NL: [52.1326, 5.2913],
  PT: [39.3999, -8.2245],
  MA: [31.7917, -7.0926],
  SN: [14.4974, -14.4524],
  CM: [3.848, 11.5021],
  TN: [33.8869, 9.5375],
  DZ: [28.0339, 1.6596],
  CI: [7.54, -5.5471],
  MX: [23.6345, -102.5528],
  BR: [-14.235, -51.9253],
  AR: [-38.4161, -63.6167],
  LU: [49.8153, 6.1296],
  AT: [47.5162, 14.5501],
  SE: [60.1282, 18.6435],
  NO: [60.472, 8.4689],
  DK: [56.2639, 9.5018],
  FI: [61.9241, 25.7482],
  PL: [51.9194, 19.1451],
  CZ: [49.8175, 15.473],
  RO: [45.9432, 24.9668],
  GR: [39.0742, 21.8243],
  TR: [38.9637, 35.2433],
  AE: [23.4241, 53.8478],
  SA: [23.8859, 45.0792],
  SG: [1.3521, 103.8198],
  JP: [36.2048, 138.2529],
  CN: [35.8617, 104.1954],
  IN: [20.5937, 78.9629],
  ZA: [-30.5595, 22.9375],
  NG: [9.082, 8.6753],
  KE: [-0.0236, 37.9062],
  EG: [26.8206, 30.8025],
};

/* ── City-level offsets for a few major cities ── */
const CITY_OFFSETS: Record<string, [number, number]> = {
  Paris: [48.8566, 2.3522],
  Lyon: [45.748, 4.8467],
  Marseille: [43.2965, 5.3698],
  Bordeaux: [44.8378, -0.5792],
  Toulouse: [43.6047, 1.4442],
  London: [51.5074, -0.1278],
  "New York": [40.7128, -74.006],
  Berlin: [52.52, 13.405],
  Madrid: [40.4168, -3.7038],
  Rome: [41.9028, 12.4964],
  Dubai: [25.2048, 55.2708],
  Singapore: [1.3521, 103.8198],
  Tokyo: [35.6762, 139.6503],
  Montreal: [45.5017, -73.5673],
  Brussels: [50.8503, 4.3517],
  Amsterdam: [52.3676, 4.9041],
  Zurich: [47.3769, 8.5417],
  Geneva: [46.2044, 6.1432],
  Casablanca: [33.5731, -7.5898],
  Dakar: [14.6928, -17.4467],
  Abidjan: [5.3599, -4.0083],
  "Buenos Aires": [[-34.6037], [-58.3816]].flat() as [number, number],
};

function getCoords(member: HubMemberSearchResult): [number, number] | null {
  const city = member.city?.trim();
  if (city && CITY_OFFSETS[city]) return CITY_OFFSETS[city];

  const country = member.country?.toUpperCase();
  if (country && COUNTRY_COORDS[country]) {
    // Add small jitter per member so dots don't fully overlap
    const base = COUNTRY_COORDS[country];
    const jitter: [number, number] = [
      base[0] + (Math.random() - 0.5) * 2.5,
      base[1] + (Math.random() - 0.5) * 2.5,
    ];
    return jitter;
  }
  return null;
}

/* ── Map auto-fit handler ── */
function MapFitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 6, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(positions.map((p) => L.latLng(p[0], p[1])));
    map.fitBounds(bounds, { padding: [60, 60], animate: true, maxZoom: 8 });
  }, [positions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

function ResizeHandler() {
  const map = useMap();
  useEffect(() => {
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [map]);
  return null;
}

/* ── Custom pulse marker icon ── */
function createPulseIcon(isSelected: boolean) {
  const color = isSelected ? "#00F0FF" : "#50B989";
  const size = isSelected ? 14 : 10;
  const glowSize = isSelected ? 24 : 18;

  const html = `
    <div style="position:relative;width:${glowSize}px;height:${glowSize}px;display:flex;align-items:center;justify-content:center;">
      <div style="
        position:absolute;inset:0;border-radius:50%;
        background:${color}30;
        ${isSelected ? `animation:pulse-ring 1.5s ease-in-out infinite;` : ""}
      "></div>
      <div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:${color};
        box-shadow:0 0 ${isSelected ? 12 : 8}px ${color}${isSelected ? "cc" : "88"};
        position:relative;z-index:1;
      "></div>
    </div>
  `;
  return L.divIcon({
    html,
    className: "",
    iconSize: [glowSize, glowSize],
    iconAnchor: [glowSize / 2, glowSize / 2],
  });
}

interface MapWithMembersProps {
  members: HubMemberSearchResult[];
  selectedMember: HubMemberSearchResult | null;
  onSelectMember: (m: HubMemberSearchResult | null) => void;
}

/* Cache coords per member ID to avoid jitter on re-renders */
const coordCache = new Map<string, [number, number] | null>();

export default function MapWithMembers({
  members,
  selectedMember,
  onSelectMember,
}: MapWithMembersProps) {
  const membersWithCoords =
    members && Array.isArray(members) && members.length > 0
      ? (members
          .map((m) => {
            if (!coordCache.has(m.user_id)) {
              coordCache.set(m.user_id, getCoords(m));
            }
            return { ...m, coords: coordCache.get(m.user_id) };
          })
          .filter((m) => m.coords !== null) as (HubMemberSearchResult & {
          coords: [number, number];
        })[])
      : [];

  const positions =
    membersWithCoords &&
    Array.isArray(membersWithCoords) &&
    membersWithCoords.length > 0
      ? membersWithCoords.map((m) => m.coords)
      : [];

  return (
    <>
      <style>{`
        .leaflet-container { background: #0d0e10 !important; }
        .leaflet-tile-pane { filter: brightness(0.85) contrast(1.05); }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .leaflet-tooltip {
          background: rgba(10,11,13,0.95) !important;
          border: 1px solid rgba(0,240,255,0.15) !important;
          border-radius: 10px !important;
          color: rgba(255,255,255,0.85) !important;
          font-size: 12px !important;
          padding: 6px 10px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.6) !important;
          backdrop-filter: blur(8px);
        }
        .leaflet-tooltip::before { display: none !important; }
        .leaflet-control-zoom a {
          background: rgba(10,11,13,0.9) !important;
          color: rgba(255,255,255,0.6) !important;
          border-color: rgba(255,255,255,0.06) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(10,11,13,1) !important;
          color: rgba(255,255,255,0.9) !important;
        }
        .leaflet-control-attribution {
          background: rgba(10,11,13,0.7) !important;
          color: rgba(255,255,255,0.25) !important;
        }
        .leaflet-control-attribution a { color: rgba(255,255,255,0.4) !important; }
      `}</style>

      <MapContainer
        center={[20, 5]}
        zoom={2}
        className="h-full w-full"
        style={{ height: "100%", width: "100%", background: "#0d0e10" }}
        scrollWheelZoom
        zoomControl
      >
        <TileLayer
          attribution={TILE_ATTRIBUTION}
          url={DARK_TILE_URL}
          subdomains="abcd"
          maxZoom={19}
          maxNativeZoom={19}
        />
        <ResizeHandler />
        {positions.length > 0 && <MapFitBounds positions={positions} />}

        {membersWithCoords.map((member) => {
          const isSelected = selectedMember?.user_id === member.user_id;
          return (
            <Marker
              key={member.user_id}
              position={member.coords}
              icon={createPulseIcon(isSelected)}
              eventHandlers={{
                click: () => onSelectMember(isSelected ? null : member),
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                <div>
                  <p
                    style={{ fontWeight: 600, color: "#fff", marginBottom: 2 }}
                  >
                    {member.display_name ?? "Membre"}
                  </p>
                  {member.profession && (
                    <p style={{ color: "#00F0FF", fontSize: 11 }}>
                      {member.profession}
                    </p>
                  )}
                  {(member.city || member.country) && (
                    <p
                      style={{
                        color: "rgba(255,255,255,0.4)",
                        fontSize: 11,
                        marginTop: 2,
                      }}
                    >
                      📍{" "}
                      {[member.city, member.country].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </>
  );
}
