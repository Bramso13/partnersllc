import { requireAuth } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import { Metadata } from "next";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import LogoutButton from "@/components/auth/LogoutButton";

export const metadata: Metadata = {
  title: "Profil - Partners LLC",
  description: "Votre profil Partners LLC",
};

export default async function ProfilePage() {
  const user = await requireAuth();
  const profile = await getProfile(user.id);

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-text-secondary">
          Erreur: Profil utilisateur introuvable
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Mon profil</h1>
          <LogoutButton />
        </div>

        <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Informations personnelles
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-text-secondary">Email</label>
                <p className="text-foreground">{user.email}</p>
              </div>
              {profile.full_name && (
                <div>
                  <label className="text-sm text-text-secondary">Nom</label>
                  <p className="text-foreground">{profile.full_name}</p>
                </div>
              )}
              {profile.phone && (
                <div>
                  <label className="text-sm text-text-secondary">Téléphone</label>
                  <p className="text-foreground">{profile.phone}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Statut du compte
            </h2>
            <StatusBadge status={profile.status} />
            {profile.status === "PENDING" && (
              <p className="text-text-secondary mt-3">
                Votre paiement est en cours de traitement. Vous recevrez un email
                lorsque votre compte sera activé.
              </p>
            )}
            {profile.status === "SUSPENDED" && (
              <p className="text-text-secondary mt-3">
                Votre paiement n'a pas abouti. Veuillez compléter votre paiement
                pour accéder à votre dossier.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
