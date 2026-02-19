import { createAdminClient } from "@/lib/supabase/server";
import type { BaseEvent } from "@/lib/modules/events";

export async function getDossierEvents(dossierId: string): Promise<BaseEvent[]> {
  const supabase = createAdminClient();
  const allEvents: Record<string, unknown>[] = [];
  const seenIds = new Set<string>();

  // 1. Events dossier (entity_type dossier ou DOSSIER)
  const { data: dossierEvents, error: err1 } = await supabase
    .from("events")
    .select("*")
    .or("entity_type.eq.dossier,entity_type.eq.DOSSIER")
    .eq("entity_id", dossierId)
    .order("created_at", { ascending: false });

  if (err1) {
    console.error("[getDossierEvents] Error dossier events:", err1);
    throw err1;
  }
  (dossierEvents || []).forEach((e) => {
    if (!seenIds.has(e.id)) {
      seenIds.add(e.id);
      allEvents.push(e);
    }
  });

  // 2. Step instance IDs du dossier
  const { data: stepInstances } = await supabase
    .from("step_instances")
    .select("id")
    .eq("dossier_id", dossierId);
  const stepIds = (stepInstances || []).map((s) => s.id);

  if (stepIds.length > 0) {
    const { data: stepEvents, error: err2 } = await supabase
      .from("events")
      .select("*")
      .or("entity_type.eq.step_instance,entity_type.eq.STEP_INSTANCE")
      .in("entity_id", stepIds)
      .order("created_at", { ascending: false });

    if (!err2) {
      (stepEvents || []).forEach((e) => {
        if (!seenIds.has(e.id)) {
          seenIds.add(e.id);
          allEvents.push(e);
        }
      });
    }
  }

  // 3. Document IDs du dossier
  const { data: documents } = await supabase
    .from("documents")
    .select("id")
    .eq("dossier_id", dossierId);
  const docIds = (documents || []).map((d) => d.id);

  if (docIds.length > 0) {
    const { data: docEvents, error: err3 } = await supabase
      .from("events")
      .select("*")
      .eq("entity_type", "document")
      .in("entity_id", docIds)
      .order("created_at", { ascending: false });

    if (!err3) {
      (docEvents || []).forEach((e) => {
        if (!seenIds.has(e.id)) {
          seenIds.add(e.id);
          allEvents.push(e);
        }
      });
    }
  }

  // 4. Events document_version (via documents du dossier)
  let versionIds: string[] = [];
  if (docIds.length > 0) {
    const { data: docVersions } = await supabase
      .from("document_versions")
      .select("id")
      .in("document_id", docIds);
    versionIds = (docVersions || []).map((v) => v.id);
  }

  if (versionIds.length > 0) {
    const { data: versionEvents, error: err4 } = await supabase
      .from("events")
      .select("*")
      .eq("entity_type", "document_version")
      .in("entity_id", versionIds)
      .order("created_at", { ascending: false });

    if (!err4) {
      (versionEvents || []).forEach((e) => {
        if (!seenIds.has(e.id)) {
          seenIds.add(e.id);
          allEvents.push(e);
        }
      });
    }
  }

  // Tri par created_at décroissant
  allEvents.sort(
    (a, b) =>
      new Date((b.created_at as string) || 0).getTime() -
      new Date((a.created_at as string) || 0).getTime()
  );

  return allEvents as unknown as BaseEvent[];
}
