// Formation visibility and access control logic

import { createClient } from "@/lib/supabase/server";
import type {
  Formation,
  FormationWithElements,
  FormationVisibilityConfig,
} from "@/types/formations";

/**
 * Get formations accessible to a user based on visibility rules
 * @param userId - User ID to check access for
 * @returns Array of accessible formations
 */
export async function getAccessibleFormations(
  userId: string
): Promise<Formation[]> {
  const supabase = await createClient();

  // Get all formations (will filter based on visibility)
  const { data: formations, error: formationsError } = await supabase
    .from("formations")
    .select("*")
    .order("display_order", { ascending: true });

  console.log("[getAccessibleFormations] Fetched formations from DB:", formations?.length, formations);

  if (formationsError) {
    console.error("[getAccessibleFormations] Error fetching formations:", formationsError);
    throw new Error("Failed to fetch formations");
  }

  if (!formations || formations.length === 0) {
    console.log("[getAccessibleFormations] No formations in database");
    return [];
  }

  // Get user's products (from orders and dossiers)
  const { data: userDossiers, error: dossiersError } = await supabase
    .from("dossiers")
    .select("product_id, type")
    .eq("user_id", userId);

  console.log("[getAccessibleFormations] User dossiers:", userDossiers);

  if (dossiersError) {
    console.error("[getAccessibleFormations] Error fetching user dossiers:", dossiersError);
    throw new Error("Failed to fetch user dossiers");
  }

  const userProductIds = new Set(
    userDossiers?.map((d) => d.product_id) || []
  );
  const userDossierTypes = new Set(
    userDossiers?.map((d) => d.type) || []
  );

  console.log("[getAccessibleFormations] User product IDs:", Array.from(userProductIds));
  console.log("[getAccessibleFormations] User dossier types:", Array.from(userDossierTypes));

  // Filter formations based on visibility rules
  const accessibleFormations = formations.filter((formation) => {
    const isAccessible = isFormationAccessibleToUser(
      formation as Formation,
      userProductIds,
      userDossierTypes
    );
    console.log(`[getAccessibleFormations] Formation "${formation.titre}" (visibility: ${formation.visibility_type}): ${isAccessible ? "ACCESSIBLE" : "DENIED"}`);
    return isAccessible;
  });

  console.log("[getAccessibleFormations] Accessible formations count:", accessibleFormations.length);

  return accessibleFormations as Formation[];
}

/**
 * Check if a formation is accessible to a user
 * @param formation - Formation to check
 * @param userProductIds - Set of product IDs the user has access to
 * @param userDossierTypes - Set of dossier types the user has
 * @returns true if accessible, false otherwise
 */
export function isFormationAccessibleToUser(
  formation: Formation,
  userProductIds: Set<string>,
  userDossierTypes: Set<string>
): boolean {
  const { visibility_type, visibility_config } = formation;

  switch (visibility_type) {
    case "all":
      return true;

    case "by_product_ids": {
      const config = visibility_config as { product_ids?: string[] };
      const requiredProductIds = config.product_ids || [];

      // User must have at least one of the required products
      return requiredProductIds.some((productId) =>
        userProductIds.has(productId)
      );
    }

    case "by_dossier_type": {
      const config = visibility_config as { dossier_type?: string };
      const requiredDossierType = config.dossier_type;

      if (!requiredDossierType) {
        return false;
      }

      // User must have a dossier of the required type
      return userDossierTypes.has(requiredDossierType);
    }

    default:
      // Unknown visibility type - deny access by default
      return false;
  }
}

/**
 * Get a single formation with its elements (for admin or accessible user)
 * @param formationId - Formation ID
 * @param checkAccess - If true, check user access; if false, return for admin
 * @param userId - User ID (required if checkAccess is true)
 * @returns Formation with elements or null if not found/accessible
 */
export async function getFormationWithElements(
  formationId: string,
  checkAccess: boolean = false,
  userId?: string
): Promise<FormationWithElements | null> {
  const supabase = await createClient();

  // Fetch formation
  const { data: formation, error: formationError } = await supabase
    .from("formations")
    .select("*")
    .eq("id", formationId)
    .single();

  if (formationError || !formation) {
    console.error("[getFormationWithElements] Formation not found:", formationError);
    return null;
  }

  // Check access if required
  if (checkAccess && userId) {
    const { data: userDossiers } = await supabase
      .from("dossiers")
      .select("product_id, type")
      .eq("user_id", userId);

    const userProductIds = new Set(
      userDossiers?.map((d) => d.product_id) || []
    );
    const userDossierTypes = new Set(
      userDossiers?.map((d) => d.type) || []
    );

    const isAccessible = isFormationAccessibleToUser(
      formation as Formation,
      userProductIds,
      userDossierTypes
    );

    if (!isAccessible) {
      return null;
    }
  }

  // Fetch elements
  const { data: elements, error: elementsError } = await supabase
    .from("formation_elements")
    .select("*")
    .eq("formation_id", formationId)
    .order("position", { ascending: true });

  if (elementsError) {
    console.error("[getFormationWithElements] Error fetching elements:", elementsError);
    throw new Error("Failed to fetch formation elements");
  }

  return {
    ...(formation as Formation),
    elements: elements || [],
  };
}

/**
 * Get user's progress for a formation
 * @param userId - User ID
 * @param formationId - Formation ID
 * @returns User progress or null if not started
 */
export async function getUserProgress(
  userId: string,
  formationId: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_formation_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("formation_id", formationId)
    .maybeSingle();

  if (error) {
    console.error("[getUserProgress] Error fetching progress:", error);
    throw new Error("Failed to fetch user progress");
  }

  return data;
}

/**
 * Update user's progress for a formation
 * @param userId - User ID
 * @param formationId - Formation ID
 * @param lastElementId - Last element viewed
 * @param completedElementIds - Array of completed element IDs
 */
export async function updateUserProgress(
  userId: string,
  formationId: string,
  lastElementId?: string | null,
  completedElementIds?: string[]
) {
  const supabase = await createClient();

  // Check if progress exists
  const { data: existing } = await supabase
    .from("user_formation_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("formation_id", formationId)
    .maybeSingle();

  const updateData: {
    last_element_id?: string | null;
    completed_element_ids?: string[];
  } = {};

  if (lastElementId !== undefined) {
    updateData.last_element_id = lastElementId;
  }

  if (completedElementIds !== undefined) {
    updateData.completed_element_ids = completedElementIds;
  }

  if (existing) {
    // Update existing progress
    const { error } = await supabase
      .from("user_formation_progress")
      .update(updateData)
      .eq("user_id", userId)
      .eq("formation_id", formationId);

    if (error) {
      console.error("[updateUserProgress] Error updating progress:", error);
      throw new Error("Failed to update progress");
    }
  } else {
    // Insert new progress
    const { error } = await supabase
      .from("user_formation_progress")
      .insert({
        user_id: userId,
        formation_id: formationId,
        ...updateData,
        completed_element_ids: completedElementIds || [],
      });

    if (error) {
      console.error("[updateUserProgress] Error creating progress:", error);
      throw new Error("Failed to create progress");
    }
  }
}
