"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  remember: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    // Vérifier si l'utilisateur vient de réinitialiser son mot de passe
    if (searchParams.get("reset") === "success") {
      setSuccessMessage(
        "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter."
      );
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      remember: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        setError("Identifiants invalides");
        return;
      }

      // Redirect to dashboard on success
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {successMessage && (
        <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-text-secondary mb-2"
        >
          Email
        </label>
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 20C3.45 20 2.97933 19.8043 2.588 19.413C2.196 19.021 2 18.55 2 18V6C2 5.45 2.196 4.97933 2.588 4.588C2.97933 4.196 3.45 4 4 4H20C20.55 4 21.021 4.196 21.413 4.588C21.8043 4.97933 22 5.45 22 6V18C22 18.55 21.8043 19.021 21.413 19.413C21.021 19.8043 20.55 20 20 20H4ZM12 12.825C12.0833 12.825 12.1707 12.8123 12.262 12.787C12.354 12.7623 12.4417 12.725 12.525 12.675L19.6 8.25C19.7333 8.16667 19.8333 8.06267 19.9 7.938C19.9667 7.81267 20 7.675 20 7.525C20 7.19167 19.8583 6.94167 19.575 6.775C19.2917 6.60833 19 6.61667 18.7 6.8L12 11L5.3 6.8C5 6.61667 4.70833 6.61233 4.425 6.787C4.14167 6.96233 4 7.20833 4 7.525C4 7.69167 4.03333 7.83733 4.1 7.962C4.16667 8.08733 4.26667 8.18333 4.4 8.25L11.475 12.675C11.5583 12.725 11.646 12.7623 11.738 12.787C11.8293 12.8123 11.9167 12.825 12 12.825Z"
              fill="#B7B7B7"
            />
          </svg>
          <input
            {...register("email")}
            type="email"
            id="email"
            autoComplete="email"
            placeholder="jean.dupont@example.com"
            className="input-field w-full bg-surface border border-border rounded-md pl-11 pr-4 py-3 text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-danger">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-text-secondary mb-2"
        >
          Mot de passe
        </label>
        <div className="relative">
          <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"></i>
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            id="password"
            autoComplete="current-password"
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

      <div className="flex items-center justify-end pt-2">
        {/* <div className="flex items-center gap-3">
          <input
            {...register("remember")}
            type="checkbox"
            id="remember"
            className="checkbox-custom"
          />
          <label
            htmlFor="remember"
            className="text-sm text-text-secondary cursor-pointer"
          >
            Se souvenir de moi
          </label>
        </div> */}
        <Link
          href="/forgot-password"
          className="text-sm text-accent hover:underline font-medium self-end"
        >
          Mot de passe oublié ?
        </Link>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-accent text-background font-bold py-3.5 rounded-md hover:opacity-90 transition-all shadow-[0_0_15px_rgba(0,240,255,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
