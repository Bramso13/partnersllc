import { requireAuth } from "@/lib/auth";
import { Metadata } from "next";
import { getAccessibleFormations, getUserProgress } from "@/lib/formations";
import { FormationCard } from "@/components/dashboard/FormationCard";
import { FormationsEmptyState } from "@/components/dashboard/FormationsEmptyState";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Formation - Partners LLC",
  description: "Accédez à nos formations et ressources éducatives",
};

export default async function FormationPage() {
  const profile = await requireAuth();
  const supabase = await createClient();

  console.log("[FormationPage] User profile:", profile.id, profile.role);

  // Fetch accessible formations
  const formations = await getAccessibleFormations(profile.id);

  console.log("[FormationPage] Formations found:", formations.length, formations);

  // If no formations, show empty state
  if (formations.length === 0) {
    console.log("[FormationPage] No formations, showing empty state");
    return <FormationsEmptyState />;
  }

  // Fetch progress and element count for each formation
  const formationsWithProgress = await Promise.all(
    formations.map(async (formation) => {
      const [progress, { count: elementCount }] = await Promise.all([
        getUserProgress(profile.id, formation.id),
        // Count elements for this formation
        supabase
          .from("formation_elements")
          .select("id", { count: "exact", head: true })
          .eq("formation_id", formation.id)
          .then((res) => ({ count: res.count || 0 })),
      ]);

      return {
        formation,
        progress,
        totalElements: elementCount,
      };
    })
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Mes Formations
        </h1>
        <p className="text-text-secondary">
          Accédez à vos formations et suivez votre progression
        </p>
      </div>

      {/* Formations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {formationsWithProgress.map(({ formation, progress, totalElements }) => (
          <FormationCard
            key={formation.id}
            formation={formation}
            progress={progress}
            totalElements={totalElements}
          />
        ))}
      </div>
    </div>
  );
}
