import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 px-4 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-6">
            <ShieldX className="h-16 w-16 text-red-600" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-gray-900">
            Accès non autorisé
          </h1>
          <p className="text-lg text-gray-600">
            Vous n&apos;avez pas les permissions nécessaires pour accéder à
            cette page.
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <p className="text-sm text-gray-500">
            Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, veuillez
            contacter votre administrateur.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Retour au tableau de bord
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Se déconnecter
            </Link>
          </div>
        </div>

        <div className="pt-8 text-xs text-gray-400">
          Code d&apos;erreur: 403 - Forbidden
        </div>
      </div>
    </div>
  );
}
