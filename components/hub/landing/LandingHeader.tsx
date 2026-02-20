"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { href: "/hub#pourquoi", label: "Pourquoi" },
  { href: "/hub#tarifs", label: "Tarifs" },
  { href: "/hub#temoignages", label: "Témoignages" },
];

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "bg-background/95 backdrop-blur-md border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/hub" className="flex items-center gap-2">
          <Image
            src="/logo_partnersllc_blanc.png"
            alt="Partners LLC"
            width={140}
            height={40}
            className="h-8 w-auto object-contain"
            priority
          />
          <span className="hidden text-sm text-text-secondary sm:inline">
            Powered by Partners LLC
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-text-secondary transition hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface"
          >
            Connexion
          </Link>
          <Link
            href="/hub/signup"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
          >
            S&apos;inscrire
          </Link>
        </div>
      </div>
    </header>
  );
}
