const TESTIMONIALS = [
  {
    quote:
      "Partners Hub a transformé notre façon de gérer les dossiers. Tout est centralisé, on gagne un temps fou.",
    author: "Marie L.",
    role: "Consultante",
    initial: "M",
  },
  {
    quote:
      "Le réseau de partenaires est une vraie valeur ajoutée. J'ai trouvé des collaborateurs fiables en quelques clics.",
    author: "Thomas B.",
    role: "Partenaire",
    initial: "T",
  },
  {
    quote:
      "Interface claire, support réactif. On sent que l'outil est fait pour les professionnels du terrain.",
    author: "Sophie M.",
    role: "Gestionnaire de dossiers",
    initial: "S",
  },
];

export function TestimonialsSection() {
  return (
    <section
      id="temoignages"
      className="scroll-mt-20 border-t border-border bg-surface/30 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Ils nous font confiance
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-text-secondary">
            Découvrez ce que disent les membres de Partners Hub.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <blockquote
              key={t.author}
              className="rounded-2xl border border-border bg-background p-6"
            >
              <p className="text-foreground">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-4 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent text-sm font-semibold"
                  aria-hidden
                >
                  {t.initial}
                </div>
                <div>
                  <cite className="not-italic font-semibold text-foreground">
                    {t.author}
                  </cite>
                  <p className="text-sm text-text-secondary">{t.role}</p>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
