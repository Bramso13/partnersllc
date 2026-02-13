"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/lib/api/useApi";

type HealthResponse = {
  status?: string;
  database?: string;
  timestamp?: string;
  error?: string;
};

/**
 * Composant de test manuel pour useApi (Story 17.1).
 * Affiche le résultat de GET /api/health. À retirer ou garder pour debug.
 */
export function UseApiTest() {
  const api = useApi();
  const [data, setData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get<HealthResponse>("/api/health")
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Erreur inconnue");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p className="text-muted-foreground">Chargement…</p>;
  if (error) return <p className="text-destructive">Erreur: {error}</p>;
  return (
    <pre className="rounded bg-muted p-2 text-sm">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
