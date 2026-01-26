"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    // Vérifier si nous avons un token de récupération valide
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsValidToken(true);
      } else {
        setError(
          "Le lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien."
        );
      }
    };

    checkSession();
  }, [supabase.auth]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (updateError) {
        setError(
          "Une erreur est survenue lors de la réinitialisation. Veuillez réessayer."
        );
        return;
      }

      // Déconnecter l'utilisateur après la réinitialisation
      await supabase.auth.signOut();

      // Rediriger vers la page de connexion avec un message de succès
      router.push("/login?reset=success");
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken && error) {
    return (
      <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-4 rounded-md">
        <div className="flex items-start gap-3">
          <i className="fa-solid fa-circle-exclamation text-xl mt-0.5"></i>
          <div>
            <p className="font-medium mb-1">Lien invalide</p>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && isValidToken && (
        <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-text-secondary mb-2"
        >
          Nouveau mot de passe
        </label>
        <div className="relative">
          <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"></i>
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            id="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className="input-field w-full bg-surface border border-border rounded-md pl-11 pr-12 py-3 text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-foreground"
          >
            <i
              className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
            ></i>
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-danger">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-text-secondary mb-2"
        >
          Confirmer le mot de passe
        </label>
        <div className="relative">
          <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"></i>
          <input
            {...register("confirmPassword")}
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            className="input-field w-full bg-surface border border-border rounded-md pl-11 pr-12 py-3 text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-foreground"
          >
            <i
              className={`fa-solid ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}
            ></i>
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-danger">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || !isValidToken}
        className="w-full bg-accent text-background font-bold py-3.5 rounded-md hover:opacity-90 transition-all shadow-[0_0_15px_rgba(0,240,255,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
      </button>
    </form>
  );
}
