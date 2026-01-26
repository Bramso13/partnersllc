import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="bg-surface border border-border rounded-xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Nouveau mot de passe
            </h1>
            <p className="text-text-secondary">
              Entrez votre nouveau mot de passe pour réinitialiser votre compte.
            </p>
          </div>

          <ResetPasswordForm />

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-accent hover:underline font-medium"
            >
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
