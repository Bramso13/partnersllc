"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/lib/supabaseClient";
import { Logo } from "@/components/Logo";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { upsertProfile, fetchProfile } = useProfile();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (!acceptTerms) {
      setError("Vous devez accepter les conditions d'utilisation");
      return;
    }

    setLoading(true);

    const fullName = `${firstName} ${lastName}`.trim();

    const { data: authData, error: signUpError } = await signUp(
      email,
      password,
      {
        full_name: fullName,
        phone: phone,
      }
    );

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    // Créer / mettre à jour l'entrée dans la table profiles avec le vrai prénom + nom
    // On récupère l'id de l'utilisateur depuis user OU depuis la session (selon la config Supabase)
    const userId = authData?.user?.id ?? authData?.session?.user.id;

    if (userId) {
      try {
        const { error: profileError } = await upsertProfile(userId, {
          full_name: fullName,
          email: email,
          role: "user",
        });

        // Si erreur, ce n'est pas grave, le trigger SQL pourrait avoir déjà créé le profil
        if (profileError) {
          console.log("Profile creation note:", profileError.message);
        }
      } catch (err) {
        // Erreur silencieuse, le trigger SQL devrait gérer la création
        console.log("Profile creation handled by trigger SQL");
      }
    }

    setLoading(false);

    // Si une session a été créée automatiquement (confirmation email désactivée), connecter directement
    if (authData?.session) {
      // Attendre un peu pour que le profil soit créé (si trigger SQL)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Vérifier le rôle pour rediriger au bon endroit
      const profile = await fetchProfile(authData.session.user.id);

      if (profile?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } else {
      // Pas de session = confirmation email requise → redirection vers login avec message
      router.push("/login?message=Vérifiez votre email pour confirmer votre compte");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-neutral-800 bg-neutral-900 p-8">
        {/* Logo */}
        <Logo variant="auth" />

        {/* Title */}
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-bold text-white">Créer un compte</h1>
          <p className="text-sm text-neutral-400">Rejoignez PARTNERS et lancez votre LLC</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Prénom et Nom */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="firstName" className="block text-sm font-medium text-neutral-400">
                Prénom
              </label>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 pl-10 pr-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Jean"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="lastName" className="block text-sm font-medium text-neutral-400">
                Nom
              </label>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 pl-10 pr-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="Dupont"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-neutral-400">
              Email
            </label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 pl-10 pr-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="jean.dupont@example.com"
              />
            </div>
          </div>

          {/* Téléphone */}
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-neutral-400">
              Téléphone
            </label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 pl-10 pr-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="+33 6 12 34 56 78"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-neutral-400">
              Mot de passe
            </label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 pl-10 pr-12 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-400"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirmer le mot de passe */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-400">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 pl-10 pr-12 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-400"
              >
                {showConfirmPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Checkbox Conditions */}
          <div className="flex items-start gap-3">
            <input
              id="acceptTerms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-neutral-700 bg-neutral-950 text-green-500 focus:ring-green-500"
            />
            <label htmlFor="acceptTerms" className="text-sm text-neutral-400">
              J&apos;accepte les{" "}
              <Link href="#" className="text-green-400 hover:text-green-300 underline">
                conditions d&apos;utilisation
              </Link>{" "}
              et la{" "}
              <Link href="#" className="text-green-400 hover:text-green-300 underline">
                politique de confidentialité
              </Link>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-60"
          >
            {loading ? "Inscription..." : "Créer mon compte"}
          </button>
        </form>

        {/* Separator */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-neutral-900 px-4 text-neutral-500">Ou s&apos;inscrire avec</span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            className="flex items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 p-3 transition-colors hover:bg-neutral-900"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </button>
          <button
            type="button"
            className="flex items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 p-3 transition-colors hover:bg-neutral-900"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </button>
          <button
            type="button"
            className="flex items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 p-3 transition-colors hover:bg-neutral-900"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="#5865F2">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C2.451 6.018 1.975 7.81 1.975 9.668c0 7.017 4.04 13.168 9.582 16.527a.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-1.626.074.074 0 0 1 .06-.06c.076-.05.176-.116.176-.116s.096-.07.137-.105a.067.067 0 0 1 .08 0c.01.007.022.014.03.021l.014.01a.074.074 0 0 1 .017.126c-.028.02-.064.044-.095.07a.075.075 0 0 1-.088.002c.002-.002-.004-.004 0-.006a.092.092 0 0 1 .041-.037l.008-.004a.077.077 0 0 1 .05-.002c.004 0 .002.003.003.005a.066.066 0 0 1 .004.008.074.074 0 0 1-.002.009c-.003.005-.007.01-.01.015a.068.068 0 0 0-.003.005l-.003.005a.066.066 0 0 1-.004.007.06.06 0 0 1-.006.003c-.004.002-.007.007-.012.01a.064.064 0 0 1-.01.003.08.08 0 0 1-.01.002.066.066 0 0 1-.01.001c-.003 0-.006.002-.009.002h-.006a.074.074 0 0 1-.01-.002.08.08 0 0 1-.01-.002.064.064 0 0 1-.01-.003.066.066 0 0 1-.01-.003c-.005-.003-.008-.008-.012-.01a.06.06 0 0 1-.006-.003.066.066 0 0 1-.004-.007l-.003-.005a.068.068 0 0 0-.003-.005.074.074 0 0 1-.002-.009c0-.005.003-.008.004-.008a.077.077 0 0 1 .05.002l.008.004a.092.092 0 0 1 .041.037c.004.002.002.004 0 .006a.075.075 0 0 1-.088-.002c-.031-.026-.067-.05-.095-.07a.074.074 0 0 1 .017-.126l.014-.01c.008-.007.02-.014.03-.021a.067.067 0 0 1 .08 0s.096.055.137.105a.074.074 0 0 1 .06.06 10.2 10.2 0 0 0 .372 1.626.077.077 0 0 1-.008.128 13.107 13.107 0 0 1-1.872.892.076.076 0 0 0-.041.106c.352.699.764 1.364 1.226 1.994a.078.078 0 0 0 .084.028c5.543-3.36 9.582-9.51 9.582-16.527-.001-1.858-.476-3.65-1.67-5.27a.07.07 0 0 0-.032-.027zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
          </button>
        </div>

        {/* Login Link */}
        <p className="text-center text-sm text-neutral-400">
          Vous avez déjà un compte ?{" "}
          <Link href="/login" className="text-green-400 hover:text-green-300 underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
