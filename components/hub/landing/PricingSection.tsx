import Link from "next/link";
import { Check } from "lucide-react";

const MONTHLY_PRICE = 29;
const YEARLY_PRICE = 290;
const YEARLY_MONTHS = 12;
const SAVED_MONTHS = 2;

const FEATURES = [
  "Accès illimité à la plateforme",
  "Gestion de dossiers et documents",
  "Réseau de partenaires",
  "Support prioritaire",
  "Mises à jour incluses",
];

export function PricingSection() {
  const yearlyPerMonth = YEARLY_PRICE / (YEARLY_MONTHS + SAVED_MONTHS);

  return (
    <section
      id="tarifs"
      className="scroll-mt-20 border-t border-border py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Tarification simple
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-text-secondary">
            Un abonnement, tous les outils. Sans engagement caché.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:max-w-4xl lg:mx-auto">
          {/* Monthly */}
          <div className="rounded-2xl border border-border bg-surface/50 p-8">
            <h3 className="text-xl font-semibold text-foreground">
              Mensuel
            </h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground">
                €{MONTHLY_PRICE}
              </span>
              <span className="text-text-secondary">/ mois</span>
            </div>
            <ul className="mt-6 space-y-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-text-secondary">
                  <Check className="h-5 w-5 shrink-0 text-accent" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/hub/signup/step1"
              className="mt-8 block w-full rounded-xl border border-border bg-background py-3 text-center font-medium text-foreground transition hover:bg-surface"
            >
              Choisir Mensuel
            </Link>
          </div>

          {/* Yearly - recommended */}
          <div className="relative rounded-2xl border-2 border-accent bg-surface/50 p-8">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-sm font-semibold text-background">
              2 mois offerts
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              Annuel
            </h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground">
                €{YEARLY_PRICE}
              </span>
              <span className="text-text-secondary">/ an</span>
            </div>
            <p className="mt-1 text-sm text-accent">
              Soit €{yearlyPerMonth.toFixed(0)}/mois sur 14 mois
            </p>
            <ul className="mt-6 space-y-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-text-secondary">
                  <Check className="h-5 w-5 shrink-0 text-accent" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/hub/signup/step1"
              className="mt-8 block w-full rounded-xl bg-accent py-3 text-center font-semibold text-background transition hover:opacity-90"
            >
              Choisir Annuel
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
