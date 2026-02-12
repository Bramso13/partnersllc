import type { Metadata } from "next";
import {
  LandingHeader,
  HeroSection,
  WhyPartnersHub,
  PricingSection,
  TestimonialsSection,
  LandingFooter,
} from "@/components/hub/landing";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://partnersllc.com";
const HUB_URL = `${SITE_URL}/hub`;

export const metadata: Metadata = {
  title: "Partners Hub - Réseau de partenaires professionnels | Partners LLC",
  description:
    "Rejoignez Partners Hub : la plateforme qui connecte les professionnels, centralise la gestion des dossiers et accélère votre croissance. Tarifs simples, réseau international.",
  keywords: [
    "Partners Hub",
    "réseau partenaires",
    "gestion dossiers",
    "Partners LLC",
    "plateforme professionnelle",
  ],
  authors: [{ name: "Partners LLC" }],
  openGraph: {
    type: "website",
    url: HUB_URL,
    title: "Partners Hub - Réseau de partenaires professionnels | Partners LLC",
    description:
      "Rejoignez Partners Hub : plateforme de connexion et gestion de dossiers pour professionnels. Tarifs transparents.",
    siteName: "Partners LLC",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Partners Hub | Partners LLC",
    description: "Réseau de partenaires et gestion de dossiers. Rejoignez Partners Hub.",
  },
  alternates: {
    canonical: HUB_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
};

function OrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Partners LLC",
    url: SITE_URL,
    logo: `${SITE_URL}/logo_partnersllc_blanc.png`,
    description:
      "Partners LLC propose Partners Hub, une plateforme pour les professionnels : réseau de partenaires, gestion de dossiers et outils collaboratifs.",
    sameAs: [],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function HubLandingPage() {
  return (
    <>
      <OrganizationJsonLd />
      <div className="min-h-screen bg-background text-foreground">
        <LandingHeader />
        <main>
          <HeroSection />
          <WhyPartnersHub />
          <PricingSection />
          <TestimonialsSection />
        </main>
        <LandingFooter />
      </div>
    </>
  );
}
