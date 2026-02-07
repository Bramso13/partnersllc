import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { MediaViewer } from "@/components/conversations/MediaViewer";

export default async function MediaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Créer le client Supabase
  const cookieStore = await cookies();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        headers: {
          cookie: cookieStore.toString(),
        },
      },
    }
  );

  // Vérifier l'authentification
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si pas connecté, rediriger vers la page de login
  if (!user) {
    // Rediriger vers login avec redirect vers cette page
    redirect(`/login?redirect=/conversations/media/${id}`);
  }

  // Récupérer les métadonnées du fichier
  const { data: media, error: mediaError } = await supabase
    .from("conversation_media")
    .select(
      `
      *,
      conversation:twilio_conversations!conversation_id (
        id,
        type
      ),
      uploader:profiles!uploaded_by (
        full_name
      )
    `
    )
    .eq("id", id)
    .single();

  if (mediaError || !media) {
    return (
      <div className="min-h-screen bg-brand-dark-bg flex items-center justify-center p-4">
        <div className="bg-brand-card-bg border border-brand-stroke rounded-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-brand-text-primary mb-2">
            Fichier non trouvé
          </h1>
          <p className="text-brand-text-secondary">
            Ce fichier n'existe pas ou a été supprimé.
          </p>
        </div>
      </div>
    );
  }

  // Vérifier les permissions
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "ADMIN";
  let hasAccess = isAdmin;

  if (!isAdmin) {
    // Vérifier si l'utilisateur est participant de la conversation
    const { data: participant } = await supabase
      .from("twilio_conversation_participants")
      .select("id")
      .eq("twilio_conversation_id", media.conversation_id)
      .eq("profile_id", user.id)
      .single();

    hasAccess = !!participant;
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-brand-dark-bg flex items-center justify-center p-4">
        <div className="bg-brand-card-bg border border-brand-stroke rounded-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-brand-text-primary mb-2">
            Accès refusé
          </h1>
          <p className="text-brand-text-secondary mb-4">
            Vous n'avez pas l'autorisation d'accéder à ce fichier.
          </p>
          <p className="text-sm text-brand-text-secondary/70">
            Ce fichier fait partie d'une conversation privée.
          </p>
        </div>
      </div>
    );
  }

  // L'utilisateur a accès - afficher le fichier
  return (
    <MediaViewer
      media={media}
      uploaderName={media.uploader?.full_name || "Inconnu"}
    />
  );
}
