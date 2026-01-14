"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const registerSchema = z
  .object({
    firstName: z.string().min(1, "Le prénom est requis"),
    lastName: z.string().min(1, "Le nom est requis"),
    email: z.string().email("Email invalide"),
    phone: z.string().min(1, "Le téléphone est requis"),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string().min(1, "Veuillez confirmer le mot de passe"),
    terms: z.boolean().refine((val) => val === true, {
      message: "Vous devez accepter les conditions d'utilisation",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      terms: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: `${data.firstName} ${data.lastName}`,
            phone: data.phone,
          },
        },
      });

      if (signUpError) {
        setError("Une erreur est survenue lors de l'inscription");
        console.error(signUpError);
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
      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-text-secondary mb-2"
          >
            Prénom
          </label>
          <div className="relative">
            <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"></i>
            <input
              {...register("firstName")}
              type="text"
              id="firstName"
              placeholder="Jean"
              className="input-field w-full bg-surface border border-border rounded-md pl-11 pr-4 py-3 text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          {errors.firstName && (
            <p className="mt-1 text-sm text-danger">
              {errors.firstName.message}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-text-secondary mb-2"
          >
            Nom
          </label>
          <div className="relative">
            <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"></i>
            <input
              {...register("lastName")}
              type="text"
              id="lastName"
              placeholder="Dupont"
              className="input-field w-full bg-surface border border-border rounded-md pl-11 pr-4 py-3 text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          {errors.lastName && (
            <p className="mt-1 text-sm text-danger">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

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
          htmlFor="phone"
          className="block text-sm font-medium text-text-secondary mb-2"
        >
          Téléphone
        </label>
        <div className="relative">
          <i className="fa-solid fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"></i>
          <input
            {...register("phone")}
            type="tel"
            id="phone"
            autoComplete="tel"
            placeholder="+33 6 12 34 56 78"
            className="input-field w-full bg-surface border border-border rounded-md pl-11 pr-4 py-3 text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        {errors.phone && (
          <p className="mt-1 text-sm text-danger">{errors.phone.message}</p>
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
              className={`fa-solid ${
                showConfirmPassword ? "fa-eye-slash" : "fa-eye"
              }`}
            ></i>
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-danger">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <div className="flex items-start gap-3 pt-2">
        <input
          {...register("terms")}
          type="checkbox"
          id="terms"
          className="checkbox-custom mt-1"
        />
        <label
          htmlFor="terms"
          className="text-sm text-text-secondary cursor-pointer"
        >
          J&apos;accepte les{" "}
          <a href="#" className="text-accent hover:underline">
            conditions d&apos;utilisation
          </a>{" "}
          et la{" "}
          <a href="#" className="text-accent hover:underline">
            politique de confidentialité
          </a>
        </label>
      </div>
      {errors.terms && (
        <p className="text-sm text-danger">{errors.terms.message}</p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-accent text-background font-bold py-3.5 rounded-md hover:opacity-90 transition-all shadow-[0_0_15px_rgba(0,240,255,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Création..." : "Créer mon compte"}
      </button>
    </form>
  );
}
