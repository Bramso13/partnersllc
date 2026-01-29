"use server";

import { revalidatePath } from "next/cache";

export async function revalidateDossier(dossierId: string) {
  revalidatePath(`/agent/dossiers/${dossierId}`);
  revalidatePath("/agent/dossiers");
}
