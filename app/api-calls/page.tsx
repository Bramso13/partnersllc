"use client";

export default function ApiCallsPage() {
  const apiCalls = [
    {
      page: "app/login/page.tsx",
      calls: [
        { line: 24, method: "supabase.auth.signInWithPassword", description: "Connexion utilisateur" },
        { line: 44, method: "supabase.from('profiles').select('role').eq('id', user.id).single()", description: "Récupération du rôle utilisateur" },
      ],
    },
    {
      page: "app/register/page.tsx",
      calls: [
        { line: 41, method: "supabase.auth.signUp", description: "Inscription utilisateur" },
        { line: 65, method: "supabase.from('profiles').upsert", description: "Création/mise à jour du profil" },
        { line: 92, method: "supabase.from('profiles').select('role').eq('id', user.id).single()", description: "Vérification du rôle après inscription" },
      ],
    },
    {
      page: "app/dashboard/page.tsx",
      calls: [
        { line: 22, method: "supabase.auth.signOut", description: "Déconnexion" },
        { line: 30, method: "supabase.auth.getUser", description: "Récupération de l'utilisateur connecté" },
        { line: 37, method: "supabase.from('profiles').select('*').eq('id', user.id).single()", description: "Récupération du profil complet" },
      ],
    },
    {
      page: "app/parametres/page.tsx",
      calls: [
        { line: 79, method: "supabase.auth.getUser", description: "Récupération de l'utilisateur connecté" },
        { line: 86, method: "supabase.from('profiles').select('*').eq('id', user.id).single()", description: "Récupération du profil" },
        { line: 145, method: "supabase.from('profiles').update({ full_name }).eq('id', profile.id)", description: "Mise à jour du nom complet" },
        { line: 159, method: "supabase.auth.getUser", description: "Récupération utilisateur pour métadonnées" },
        { line: 162, method: "supabase.auth.updateUser({ data: { phone, country, bio } })", description: "Mise à jour des métadonnées utilisateur" },
        { line: 214, method: "supabase.auth.updateUser({ password: newPassword })", description: "Changement de mot de passe" },
        { line: 307, method: "supabase.auth.getUser", description: "Récupération utilisateur (sécurité)" },
      ],
    },
    {
      page: "app/documents/page.tsx",
      calls: [
        { line: 28, method: "supabase.auth.getUser", description: "Récupération de l'utilisateur connecté" },
        { line: 35, method: "supabase.from('profiles').select('*').eq('id', user.id).single()", description: "Récupération du profil" },
      ],
    },
    {
      page: "app/support/page.tsx",
      calls: [
        { line: 29, method: "supabase.auth.getUser", description: "Récupération de l'utilisateur connecté" },
        { line: 36, method: "supabase.from('profiles').select('*').eq('id', user.id).single()", description: "Récupération du profil" },
      ],
    },
    {
      page: "app/partners-hub/page.tsx",
      calls: [
        { line: 28, method: "supabase.auth.getUser", description: "Récupération de l'utilisateur connecté" },
        { line: 35, method: "supabase.from('profiles').select('*').eq('id', user.id).single()", description: "Récupération du profil" },
      ],
    },
    {
      page: "app/mon-entreprise/page.tsx",
      calls: [
        { line: 25, method: "supabase.auth.getUser", description: "Récupération de l'utilisateur connecté" },
        { line: 32, method: "supabase.from('profiles').select('*').eq('id', user.id).single()", description: "Récupération du profil" },
      ],
    },
    {
      page: "app/formation/page.tsx",
      calls: [
        { line: 25, method: "supabase.auth.getUser", description: "Récupération de l'utilisateur connecté" },
        { line: 32, method: "supabase.from('profiles').select('*').eq('id', user.id).single()", description: "Récupération du profil" },
      ],
    },
    {
      page: "app/dossier-llc/page.tsx",
      calls: [
        { line: 25, method: "supabase.auth.getUser", description: "Récupération de l'utilisateur connecté" },
        { line: 32, method: "supabase.from('profiles').select('*').eq('id', user.id).single()", description: "Récupération du profil" },
      ],
    },
    {
      page: "app/admin/page.tsx",
      calls: [
        { line: 23, method: "supabase.auth.signOut", description: "Déconnexion" },
        { line: 31, method: "supabase.auth.getUser", description: "Récupération de l'utilisateur connecté" },
        { line: 38, method: "supabase.from('profiles').select('*').eq('id', user.id).single()", description: "Récupération du profil" },
      ],
    },
    {
      page: "app/admin/gestion-clients/page.tsx",
      calls: [
        { line: 35, method: "supabase.auth.signOut", description: "Déconnexion" },
        { line: 43, method: "supabase.auth.getUser", description: "Récupération de l'utilisateur connecté" },
        { line: 50, method: "supabase.from('profiles').select('*').eq('id', user.id).single()", description: "Récupération du profil" },
      ],
    },
    {
      page: "app/admin/dossiers-llc/page.tsx",
      calls: [
        { line: 41, method: "supabase.auth.getUser", description: "Récupération de l'utilisateur connecté" },
        { line: 48, method: "supabase.from('profiles').select('*').eq('id', user.id).single()", description: "Récupération du profil" },
      ],
    },
    {
      page: "app/admin/facturation/page.tsx",
      calls: [
        { line: 42, method: "supabase.auth.getUser", description: "Récupération de l'utilisateur connecté" },
        { line: 49, method: "supabase.from('profiles').select('*').eq('id', user.id).single()", description: "Récupération du profil" },
      ],
    },
    {
      page: "app/admin/notifications/page.tsx",
      calls: [
        { line: 38, method: "supabase.auth.getUser", description: "Récupération de l'utilisateur connecté" },
        { line: 45, method: "supabase.from('profiles').select('*').eq('id', user.id).single()", description: "Récupération du profil" },
      ],
    },
    {
      page: "app/admin/rapports/page.tsx",
      calls: [
        { line: 36, method: "supabase.auth.getUser", description: "Récupération de l'utilisateur connecté" },
        { line: 43, method: "supabase.from('profiles').select('*').eq('id', user.id).single()", description: "Récupération du profil" },
      ],
    },
    {
      page: "app/admin/parametres/page.tsx",
      calls: [
        { line: 59, method: "supabase.auth.getUser", description: "Récupération de l'utilisateur connecté" },
        { line: 66, method: "supabase.from('profiles').select('*').eq('id', user.id).single()", description: "Récupération du profil" },
      ],
    },
  ];

  const getMethodType = (method: string) => {
    if (method.includes("auth.")) return "auth";
    if (method.includes("from(")) return "database";
    if (method.includes("storage.")) return "storage";
    return "other";
  };

  const getMethodColor = (type: string) => {
    switch (type) {
      case "auth":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "database":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "storage":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      default:
        return "bg-neutral-500/20 text-neutral-400 border-neutral-500/50";
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold">Appels API - Documentation</h1>
          <p className="text-neutral-400">Liste complète de tous les appels API dans l'application</p>
        </div>

        <div className="space-y-6">
          {apiCalls.map((pageData, pageIndex) => (
            <div key={pageIndex} className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
              <h2 className="mb-4 text-xl font-semibold text-green-400">{pageData.page}</h2>
              <div className="space-y-3">
                {pageData.calls.map((call, callIndex) => {
                  const methodType = getMethodType(call.method);
                  return (
                    <div
                      key={callIndex}
                      className="rounded-lg border border-neutral-800 bg-neutral-950 p-4"
                    >
                      <div className="mb-2 flex items-center gap-3">
                        <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs font-mono text-neutral-400">
                          Ligne {call.line}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${getMethodColor(methodType)}`}
                        >
                          {methodType.toUpperCase()}
                        </span>
                      </div>
                      <div className="mb-2 font-mono text-sm text-white">{call.method}</div>
                      <div className="text-sm text-neutral-400">{call.description}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Résumé */}
        <div className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="mb-4 text-xl font-semibold">Résumé</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-blue-500/50 bg-blue-500/20 p-4">
              <div className="text-sm text-blue-400">Auth</div>
              <div className="text-2xl font-bold text-white">
                {apiCalls.reduce((acc, page) => acc + page.calls.filter((c) => c.method.includes("auth.")).length, 0)}
              </div>
            </div>
            <div className="rounded-lg border border-green-500/50 bg-green-500/20 p-4">
              <div className="text-sm text-green-400">Database</div>
              <div className="text-2xl font-bold text-white">
                {apiCalls.reduce((acc, page) => acc + page.calls.filter((c) => c.method.includes("from(")).length, 0)}
              </div>
            </div>
            <div className="rounded-lg border border-neutral-500/50 bg-neutral-500/20 p-4">
              <div className="text-sm text-neutral-400">Total</div>
              <div className="text-2xl font-bold text-white">
                {apiCalls.reduce((acc, page) => acc + page.calls.length, 0)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

