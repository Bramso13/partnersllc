import type { UserProfile } from "@/types/user";

interface ActiveStatusProps {
  profile: UserProfile;
}

export function ActiveStatus({ profile }: ActiveStatusProps) {
  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">
        Vos dossiers
      </h2>
      <p className="text-text-secondary">
        Vos dossiers apparaîtront ici une fois créés.
      </p>
      {/* TODO: Implement dossier list component in future story */}
    </div>
  );
}
