"use client";

import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/Button";

export function SiteHeader() {
  const { theme, toggleTheme } = useAppContext();

  return (
    <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
      <Link href="/" className="text-lg font-semibold">
        Partners ReactNext
      </Link>
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-wide text-neutral-500">
          Thème : {theme}
        </span>
        <Button type="button" onClick={toggleTheme}>
          Basculer le thème
        </Button>
      </div>
    </header>
  );
}

