"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";

import type { PaymentLink } from "@/types/payment-links";
import { completeRegistration } from "@/app/actions/complete-registration";

const completeRegistrationSchema = z.object({
  fullName: z.string().min(1, "Le nom complet est requis").optional(),
  phone: z
    .string()
    .min(1, "Le téléphone est requis")
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      "Format de téléphone invalide (format international requis)"
    )
    .optional(),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  termsCGVAccepted: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter les Conditions Générales de Vente",
  }),
  termsRefundAccepted: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter la Politique de Remboursement",
  }),
});

type CompleteRegistrationFormData = z.infer<typeof completeRegistrationSchema>;

interface CompleteRegistrationFormProps {
  paymentLink: PaymentLink;
  stripeData?: {
    customer_name?: string;
    customer_email?: string;
  };
}

export function CompleteRegistrationForm({
  paymentLink,
  stripeData,
}: CompleteRegistrationFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDocument, setModalDocument] = useState<
    "cgv" | "refund_policy" | null
  >(null);
  const [modalTitle, setModalTitle] = useState("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompleteRegistrationFormData>({
    resolver: zodResolver(completeRegistrationSchema),
    defaultValues: {
      fullName: stripeData?.customer_name || "",
      termsCGVAccepted: false,
      termsRefundAccepted: false,
    },
  });

  const onSubmit = async (data: CompleteRegistrationFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await completeRegistration({
        token: paymentLink.token,
        fullName: data.fullName || stripeData?.customer_name || "",
        phone: data.phone || "",
        password: data.password,
        termsAccepted: data.termsCGVAccepted && data.termsRefundAccepted,
      });

      if (result.error) {
        if (result.error === "EMAIL_EXISTS") {
          setError(
            "Un compte existe déjà avec cet email. Veuillez vous connecter."
          );
        } else if (result.error === "INVALID_LINK") {
          setError("Ce lien n'est plus valide. Veuillez contacter le support.");
        } else if (result.error === "PAYMENT_NOT_VERIFIED") {
          setError("Le paiement n'a pas été vérifié. Veuillez contacter le support.");
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
      console.error("Registration completion error:", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  // Ouvrir le modal avec le document spécifié
  const openModal = (document: "cgv" | "refund_policy", title: string) => {
    setModalDocument(document);
    setModalTitle(title);
    setModalOpen(true);
  };

  // Fermer le modal
  const closeModal = () => {
    setModalOpen(false);
    setModalDocument(null);
    setModalTitle("");
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
              Finaliser votre compte
            </h2>
            <p className="text-text-secondary">
              Choisissez votre mot de passe pour accéder à votre compte
            </p>
          </div>

          {/* Success Message */}
          <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded mb-6">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-check-circle"></i>
              <span>Paiement confirmé ! Complétez votre inscription.</span>
            </div>
          </div>

          {/* Email Info */}
          <div className="bg-surface border border-border rounded-md p-4 mb-6">
            <p className="text-sm text-text-secondary">
              Email: <span className="text-foreground font-medium">{paymentLink.prospect_email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="bg-danger/10 border border-danger/20 text-danger px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Full Name - Only show if not provided by Stripe */}
            {(!stripeData?.customer_name || stripeData.customer_name.trim() === "") && (
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
            )}

            {/* Phone - Optional for now */}
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

            {/* Terms and Conditions Checkboxes */}
            <div className="space-y-4 pt-2">
              <div className="bg-surface border border-border rounded-md p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    {...register("termsCGVAccepted")}
                    type="checkbox"
                    className="mt-1 w-4 h-4 text-accent bg-surface border-border rounded focus:ring-accent focus:ring-2"
                  />
                  <div className="flex-1">
                    <span className="text-sm text-foreground">
                      J'accepte les{" "}
                      <button
                        type="button"
                        onClick={() =>
                          openModal("cgv", "Conditions Générales de Vente")
                        }
                        className="text-accent hover:underline font-medium cursor-pointer"
                      >
                        Conditions Générales de Vente
                      </button>{" "}
                      <span className="text-danger">*</span>
                    </span>
                  </div>
                </label>
                {errors.termsCGVAccepted && (
                  <p className="mt-2 text-sm text-danger">
                    {errors.termsCGVAccepted.message}
                  </p>
                )}
              </div>

              <div className="bg-surface border border-border rounded-md p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    {...register("termsRefundAccepted")}
                    type="checkbox"
                    className="mt-1 w-4 h-4 text-accent bg-surface border-border rounded focus:ring-accent focus:ring-2"
                  />
                  <div className="flex-1">
                    <span className="text-sm text-foreground">
                      J'accepte la{" "}
                      <button
                        type="button"
                        onClick={() =>
                          openModal(
                            "refund_policy",
                            "Politique de Remboursement"
                          )
                        }
                        className="text-accent hover:underline font-medium cursor-pointer"
                      >
                        Politique de Remboursement
                      </button>{" "}
                      <span className="text-danger">*</span>
                    </span>
                  </div>
                </label>
                {errors.termsRefundAccepted && (
                  <p className="mt-2 text-sm text-danger">
                    {errors.termsRefundAccepted.message}
                  </p>
                )}
              </div>
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
                "Créer mon compte"
              )}
            </button>
          </form>

          {/* Modal pour les documents légaux */}
          {modalOpen && modalDocument && (
            <LegalDocumentModal
              isOpen={modalOpen}
              onClose={closeModal}
              documentType={modalDocument}
              title={modalTitle}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Import LegalDocumentModal at the top
import { LegalDocumentModal } from "@/components/legal/LegalDocumentModal";