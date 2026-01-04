"use client";

import { Logo } from "@/components/Logo";

export default function TestLogoPage() {
  return (
    <div className="min-h-screen bg-neutral-950 p-8 text-white">
      <div className="mx-auto max-w-4xl space-y-8">
        <h1 className="text-3xl font-bold">Test du Logo</h1>
        
        <div className="space-y-6">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="mb-4 text-xl font-semibold">Variant: sidebar</h2>
            <Logo variant="sidebar" />
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="mb-4 text-xl font-semibold">Variant: admin</h2>
            <Logo variant="admin" />
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="mb-4 text-xl font-semibold">Variant: auth</h2>
            <Logo variant="auth" />
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="mb-4 text-xl font-semibold">Image seule (sans texte)</h2>
            <div className="flex h-10 w-10 items-center justify-center">
              <img
                src="/logo_partnershub_blanc.png"
                alt="PARTNERS Logo"
                className="h-full w-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'text-red-400 text-sm';
                  errorDiv.textContent = 'Image logo_partnershub_blanc.png non trouvée dans /public/';
                  e.currentTarget.parentElement?.appendChild(errorDiv);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

