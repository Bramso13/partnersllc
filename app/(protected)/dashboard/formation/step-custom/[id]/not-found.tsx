import Link from "next/link";

export default function StepCustomFormationNotFound() {
  return (
    <div className="text-center py-12">
      <h1 className="text-xl font-semibold text-brand-text-primary mb-2">
        Formation introuvable
      </h1>
      <p className="text-brand-text-secondary mb-4">
        Cette formation personnalisée n&apos;existe pas ou vous n&apos;y avez
        pas accès.
      </p>
      <Link
        href="/dashboard/formation"
        className="text-brand-accent hover:underline"
      >
        Retour aux formations
      </Link>
    </div>
  );
}
