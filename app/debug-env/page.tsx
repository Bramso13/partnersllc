"use client";

export default function DebugEnvPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-neutral-800 bg-neutral-900 p-8">
        <h1 className="mb-6 text-2xl font-bold text-white">Debug - Variables d'environnement</h1>
        
        <div className="space-y-4">
          <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
            <h2 className="mb-2 text-sm font-semibold text-neutral-400">NEXT_PUBLIC_SUPABASE_URL</h2>
            <p className="text-white">
              {supabaseUrl ? (
                <>
                  <span className="text-green-400">✓ Définie</span>
                  <br />
                  <span className="text-xs text-neutral-500 mt-2 block">
                    {supabaseUrl.substring(0, 30)}...
                  </span>
                </>
              ) : (
                <span className="text-red-400">✗ Non définie</span>
              )}
            </p>
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
            <h2 className="mb-2 text-sm font-semibold text-neutral-400">NEXT_PUBLIC_SUPABASE_ANON_KEY</h2>
            <p className="text-white">
              {supabaseAnonKey ? (
                <>
                  <span className="text-green-400">✓ Définie</span>
                  <br />
                  <span className="text-xs text-neutral-500 mt-2 block">
                    {supabaseAnonKey.substring(0, 20)}...{supabaseAnonKey.substring(supabaseAnonKey.length - 10)}
                  </span>
                </>
              ) : (
                <span className="text-red-400">✗ Non définie</span>
              )}
            </p>
          </div>

          <div className="mt-6 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
            <h3 className="mb-2 text-sm font-semibold text-yellow-400">Instructions</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-neutral-300">
              <li>Va sur Vercel → Ton projet → Settings → Environment Variables</li>
              <li>Vérifie que NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont bien définies</li>
              <li>Assure-toi qu'elles sont activées pour "Production"</li>
              <li>Redéploie ton projet après avoir ajouté/modifié les variables</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

