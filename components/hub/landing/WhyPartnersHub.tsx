import {
  Users,
  FileCheck,
  Zap,
  Shield,
  type LucideIcon,
} from "lucide-react";

const BENEFITS: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: Users,
    title: "Réseau de partenaires",
    description:
      "Connectez-vous à une communauté de professionnels qualifiés et échangez avec des partenaires partout dans le monde.",
  },
  {
    icon: FileCheck,
    title: "Dossiers centralisés",
    description:
      "Gérez tous vos dossiers, documents et étapes en un seul endroit. Suivi en temps réel et workflows clairs.",
  },
  {
    icon: Zap,
    title: "Efficacité accrue",
    description:
      "Automatisez les tâches répétitives, réduisez les délais et concentrez-vous sur l’essentiel avec des outils dédiés.",
  },
  {
    icon: Shield,
    title: "Sécurité & conformité",
    description:
      "Données sécurisées, conformité RGPD et processus validés. Vos informations et celles de vos clients sont protégées.",
  },
];

export function WhyPartnersHub() {
  return (
    <section
      id="pourquoi"
      className="scroll-mt-20 border-t border-border bg-surface/30 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Pourquoi Partners Hub ?
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-text-secondary">
            Une plateforme pensée pour les professionnels qui veulent
            collaborer, gagner du temps et grandir.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group rounded-2xl border border-border bg-background p-6 transition hover:border-accent/40 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition group-hover:bg-accent/20">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-text-secondary">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
