import Image from "next/image";
import Link from "next/link";
import { Facebook, Linkedin, Twitter } from "lucide-react";

const LEGAL_LINKS = [
  { href: "/documents-legaux/cgv", label: "CGV" },
  { href: "/documents-legaux/politique-remboursement", label: "Politique de remboursement" },
];

const SOCIAL = [
  { href: "#", icon: Linkedin, label: "LinkedIn" },
  { href: "#", icon: Twitter, label: "Twitter" },
  { href: "#", icon: Facebook, label: "Facebook" },
];

const currentYear = new Date().getFullYear();

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Image
              src="/logo_partnersllc_blanc.png"
              alt="Partners LLC"
              width={80}
              height={24}
              className="h-6 w-auto object-contain opacity-80"
            />
            <span>Powered by Partners LLC</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-text-secondary transition hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {SOCIAL.map((s) => {
              const Icon = s.icon;
              return (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="text-text-secondary transition hover:text-accent"
                >
                  <Icon className="h-5 w-5" />
                </a>
              );
            })}
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-text-secondary">
          © {currentYear} Partners LLC. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
