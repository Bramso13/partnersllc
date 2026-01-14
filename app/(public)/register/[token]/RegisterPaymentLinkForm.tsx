"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";

import type { PaymentLink } from "@/types/payment-links";
import type { Product } from "@/types/products";
import { registerWithPaymentLink } from "@/app/actions/register-payment-link";

const registerSchema = z.object({
  fullName: z.string().min(1, "Le nom complet est requis"),
  phone: z
    .string()
    .min(1, "Le téléphone est requis")
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      "Format de téléphone invalide (format international requis)"
    ),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterPaymentLinkFormProps {
  paymentLink: PaymentLink;
  product: Product;
  paymentCancelled?: boolean;
}

export function RegisterPaymentLinkForm({
  paymentLink,
  product,
  paymentCancelled,
}: RegisterPaymentLinkFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await registerWithPaymentLink({
        token: paymentLink.token,
        fullName: data.fullName,
        phone: data.phone,
        password: data.password,
      });

      if (result.error) {
        if (result.error === "EMAIL_EXISTS") {
          setError(
            "Un compte existe déjà avec cet email. Veuillez vous connecter."
          );
        } else if (result.error === "INVALID_LINK") {
          setError("Ce lien n'est plus valide. Veuillez contacter le support.");
        } else if (result.error === "PRODUCT_NOT_CONFIGURED") {
          setError(
            "Le produit n'est pas correctement configuré. Veuillez contacter le support."
          );
        } else if (result.error === "FAILED_TO_CREATE_USER") {
          setError("Impossible de créer le compte. Veuillez réessayer.");
        } else if (result.error === "FAILED_TO_CREATE_ORDER") {
          setError(
            "Erreur lors de la création de la commande. Veuillez réessayer."
          );
        } else if (result.error === "FAILED_TO_CREATE_CHECKOUT_SESSION") {
          setError(
            "Erreur lors de la création de la session de paiement. Veuillez réessayer."
          );
        } else {
          setError(
            result.error || "Une erreur est survenue. Veuillez réessayer."
          );
        }
        return;
      }

      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  // Format price for display
  const formatPrice = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
    });
    return formatter.format(amount / 100);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Gradient Background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #000000 0%, #2d2d2d 50%, #000000 100%)",
        }}
      />

      {/* Floating Shapes */}
      <div
        className="floating-shape absolute w-[672px] h-[694px] right-[-200px] top-[-100px] opacity-10"
        style={{
          animation: "float 20s infinite ease-in-out",
        }}
      >
        <div className="w-full h-full bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div
        className="floating-shape absolute w-[689px] h-[690px] left-[-250px] bottom-[-200px] opacity-10"
        style={{
          animation: "float 20s infinite ease-in-out 5s",
        }}
      >
        <div className="w-full h-full bg-accent/20 rounded-full blur-3xl" />
      </div>

      {/* Backdrop */}
      <div className="absolute inset-0 backdrop-blur-[9px] bg-black/50 flex items-center justify-center p-8">
        <div className="relative bg-[#363636] rounded-[18px] w-full max-w-[550px] p-12 shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Logo Section */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-[62px] h-[59px] bg-background rounded-[20px] flex items-center justify-center">
                <i className="fa-solid fa-shield-halved text-accent text-2xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-wide">
                  PARTNERS
                </h1>
                <p className="text-xs text-text-secondary">
                  LLC Formation Platform
                </p>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Finaliser votre inscription
            </h2>
            <p className="text-text-secondary">
              Complétez votre profil pour accéder à votre compte
            </p>
          </div>

          {/* Product Information */}
          <div className="bg-surface border border-border rounded-md p-4 mb-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {product.name}
                </h3>
                {product.description && (
                  <p className="text-sm text-text-secondary mt-1">
                    {product.description}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-accent">
                  {formatPrice(product.price_amount, product.currency)}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-sm text-text-secondary">
                Email:{" "}
                <span className="text-foreground">
                  {paymentLink.prospect_email}
                </span>
              </p>
            </div>
          </div>

          {paymentCancelled && (
            <div className="bg-warning/10 border border-warning/20 text-warning px-4 py-3 rounded mb-4">
              Le paiement a été annulé. Veuillez réessayer.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Nom complet <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"></i>
                <input
                  {...register("fullName")}
                  type="text"
                  id="fullName"
                  placeholder="Jean Dupont"
                  className="input-field w-full bg-surface border border-border rounded-md pl-11 pr-4 py-3 text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-sm text-danger">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Téléphone <span className="text-danger">*</span>
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
                <p className="mt-1 text-sm text-danger">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Mot de passe <span className="text-danger">*</span>
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
                    className={`fa-solid ${
                      showPassword ? "fa-eye-slash" : "fa-eye"
                    }`}
                  ></i>
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-danger">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent text-background font-bold py-3.5 rounded-md hover:opacity-90 transition-all shadow-[0_0_15px_rgba(0,240,255,0.15)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Création du compte...</span>
                </>
              ) : (
                "Finaliser l'inscription et payer"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
