"use client";

import { useEffect, useState } from "react";
import type { ResolvePendingStatus } from "@/app/api/register/resolve-pending/route";

interface ResolveResult {
  status: ResolvePendingStatus;
  redirectUrl?: string;
  message?: string;
}

interface ResolvePendingRegistrationProps {
  /** Pages on which to run resolve (e.g. "login" | "home"). Used to avoid double fetch when used in multiple layouts. */
  page?: "login" | "home";
}

/**
 * Calls GET /api/register/resolve-pending on mount. If paid_incomplete or unpaid/expired with redirectUrl, redirects or shows banner.
 * Used on login and optionally public home.
 */
export function ResolvePendingRegistration({
  page = "login",
}: ResolvePendingRegistrationProps) {
  const [result, setResult] = useState<ResolveResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      try {
        const res = await fetch("/api/register/resolve-pending", {
          credentials: "include",
        });
        if (cancelled) return;
        if (res.status === 429) {
          setResult({ status: "invalid" });
          setLoading(false);
          return;
        }
        const data = (await res.json()) as ResolveResult;
        setResult(data);

        if (data.status === "paid_incomplete" && data.redirectUrl) {
          window.location.href = data.redirectUrl;
          return;
        }
        if (
          (data.status === "unpaid" || data.status === "expired") &&
          data.redirectUrl
        ) {
          // Option: auto-redirect to payment page, or show banner. Story says: "redirection vers la page de paiement, ou affichage d'un bandeau"
          window.location.href = data.redirectUrl;
          return;
        }
      } catch {
        if (!cancelled) setResult({ status: "none" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    resolve();
    return () => {
      cancelled = true;
    };
  }, [page]);

  if (loading || !result || result.status === "none" || result.status === "paid_complete" || result.status === "invalid") {
    return null;
  }

  return null;
}
