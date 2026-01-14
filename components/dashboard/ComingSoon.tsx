import Link from "next/link";

interface ComingSoonProps {
  title: string;
  description?: string;
  icon?: string;
}

export function ComingSoon({ title, description, icon }: ComingSoonProps) {
  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-brand-dark-surface border border-brand-dark-border rounded-lg p-12 text-center">
            {/* Icon */}
            {icon && (
              <div className="mb-6 flex justify-center">
                <div className="w-24 h-24 bg-brand-accent/20 rounded-full flex items-center justify-center">
                  <i className={`${icon} text-5xl text-brand-accent`}></i>
                </div>
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl font-bold text-brand-text-primary mb-4">
              {title}
            </h1>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent/20 border border-brand-accent/30 rounded-full mb-6">
              <i className="fa-solid fa-hammer text-brand-accent"></i>
              <span className="text-brand-accent font-semibold">
                En développement
              </span>
            </div>

            {/* Description */}
            {description ? (
              <p className="text-brand-text-secondary text-lg mb-8 max-w-2xl mx-auto">
                {description}
              </p>
            ) : (
              <p className="text-brand-text-secondary text-lg mb-8 max-w-2xl mx-auto">
                Cette fonctionnalité est actuellement en cours de développement.
                Elle sera bientôt disponible !
              </p>
            )}

            {/* Action Button */}
            <div className="flex justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-accent text-brand-dark-bg font-semibold rounded-lg hover:bg-brand-accent/90 transition-all hover:shadow-lg hover:shadow-brand-accent/30"
              >
                <i className="fa-solid fa-arrow-left"></i>
                Retour au tableau de bord
              </Link>
            </div>

            {/* Additional Info */}
            <div className="mt-12 pt-8 border-t border-brand-dark-border">
              <p className="text-brand-text-secondary text-sm">
                <i className="fa-solid fa-info-circle mr-2"></i>
                Vous serez notifié dès que cette fonctionnalité sera disponible.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
