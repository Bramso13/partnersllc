import Link from "next/link";

export default function FormationNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[500px]">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mb-6 relative inline-block">
          <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl"></div>
          <div className="relative bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-2xl p-8 border border-red-500/20">
            <i className="fa-solid fa-exclamation-triangle text-6xl text-red-500"></i>
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          Formation introuvable
        </h2>

        {/* Description */}
        <p className="text-text-secondary mb-6">
          La formation que vous recherchez n&apos;existe pas ou vous n&apos;y
          avez pas accès.
        </p>

        {/* Back Button */}
        <Link
          href="/dashboard/formation"
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-background rounded-lg transition-colors font-medium"
        >
          <i className="fa-solid fa-arrow-left"></i>
          Retour aux formations
        </Link>
      </div>
    </div>
  );
}
