/**
 * POST /api/hub/profile/upload-avatar
 * Auth Hub requise. Image max 5MB, jpg/png/webp. Min 200x200, ratio 1:1 (recadrage auto).
 * Redimensionnement 3 tailles (100, 400, 800). Stockage hub-avatars/[userId]/avatar-[size].webp.
 * Mise à jour avatar_url (URL de la taille 400).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireHubAuth } from "@/lib/hub-auth";
import { profileCache } from "@/lib/profile-cache";
import sharp from "sharp";

const BUCKET = "hub-avatars";
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MIN_DIMENSION = 200;
const SIZES = [100, 400, 800] as const;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireHubAuth();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Fichier manquant" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Fichier trop volumineux (max 5 Mo)" },
        { status: 400 }
      );
    }

    const type = file.type?.toLowerCase();
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Format non autorisé (jpg, png ou webp uniquement)" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const meta = await sharp(buffer).metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;

    if (w < MIN_DIMENSION || h < MIN_DIMENSION) {
      return NextResponse.json(
        { error: "Image trop petite (minimum 200x200 px)" },
        { status: 400 }
      );
    }

    // Recadrage 1:1 (centre)
    const side = Math.min(w, h);
    const left = Math.floor((w - side) / 2);
    const top = Math.floor((h - side) / 2);
    const square = await sharp(buffer)
      .extract({ left, top, width: side, height: side })
      .toBuffer();

    const admin = createAdminClient();
    const prefix = `${userId}`;

    // Supprimer anciens avatars du même utilisateur
    const { data: existing } = await admin.storage.from(BUCKET).list(prefix);
    if (existing?.length) {
      const toRemove = existing.map((f) => `${prefix}/${f.name}`);
      await admin.storage.from(BUCKET).remove(toRemove);
    }

    let avatarUrl: string | null = null;

    for (const size of SIZES) {
      const resized = await sharp(square)
        .resize(size, size)
        .webp({ quality: 85 })
        .toBuffer();
      const path = `${prefix}/avatar-${size}.webp`;
      const { error: uploadErr } = await admin.storage
        .from(BUCKET)
        .upload(path, resized, {
          contentType: "image/webp",
          cacheControl: "3600",
          upsert: true,
        });
      if (uploadErr) {
        console.error("[upload-avatar] Storage error:", uploadErr);
        return NextResponse.json(
          { error: "Erreur lors de l'enregistrement de l'image" },
          { status: 500 }
        );
      }
      if (size === 400) {
        const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
        avatarUrl = data.publicUrl;
      }
    }

    const supabase = await createClient();
    const { error: updateErr } = await supabase
      .from("hub_member_profiles")
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateErr) {
      console.error("[upload-avatar] Profile update error:", updateErr);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour du profil" },
        { status: 500 }
      );
    }

    profileCache.del(profileCache.key(userId));

    return NextResponse.json({
      success: true,
      avatar_url: avatarUrl,
    });
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) {
      throw err;
    }
    console.error("POST /api/hub/profile/upload-avatar:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Une erreur est survenue",
      },
      { status: 500 }
    );
  }
}
