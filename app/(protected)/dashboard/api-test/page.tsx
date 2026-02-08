import { requireAuth } from "@/lib/auth";
import { UseApiTest } from "@/components/dev/UseApiTest";

/**
 * Page de test manuel pour useApi (Story 17.1).
 * GET /api/health via useApi(). À retirer ou garder pour debug.
 */
export default async function ApiTestPage() {
  await requireAuth();
  return (
    <div className="container py-6">
      <h1 className="mb-4 text-xl font-semibold">Test useApi — GET /api/health</h1>
      <UseApiTest />
    </div>
  );
}
