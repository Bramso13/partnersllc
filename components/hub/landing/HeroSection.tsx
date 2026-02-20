import Image from "next/image";
import Link from "next/link";
import { Globe } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex flex-col items-center justify-center overflow-hidden px-4 py-20 sm:py-28">
      {/* Background: gradient + world map */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(135deg, #191a1d 0%, #1a2520 40%, #191a1d 100%)",
        }}
      />
      <div className="absolute inset-0 -z-10 opacity-30">
        <Image
          src="/hub/world-map-bg.svg"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-background/50 to-background" />

      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-4 py-2 text-sm text-text-secondary">
          <Globe className="h-4 w-4 text-accent" />
          <span>Réseau international de partenaires</span>
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
          Rejoignez{" "}
          <span className="text-accent">Partners Hub</span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-text-secondary sm:text-xl">
          La plateforme qui connecte les professionnels, simplifie la gestion de
          vos dossiers et accélère votre croissance. Un seul espace, une
          communauté mondiale.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/hub/signup"
            className="w-full rounded-xl bg-accent px-8 py-4 text-center text-lg font-semibold text-background shadow-lg transition hover:opacity-90 sm:w-auto"
          >
            Rejoindre Partners Hub
          </Link>
          <Link
            href="/hub#pourquoi"
            className="w-full rounded-xl border border-border bg-surface/50 px-8 py-4 text-center text-lg font-medium text-foreground transition hover:bg-surface sm:w-auto"
          >
            Découvrir les avantages
          </Link>
        </div>
      </div>
    </section>
  );
}
