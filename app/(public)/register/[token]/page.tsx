import { Metadata } from "next";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { createPaymentSession } from "@/app/actions/create-payment-session";

export const metadata: Metadata = {
  title: "Inscription - Partners LLC",
  description: "Créez votre compte Partners LLC",
};

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ payment?: string }>;
}

export default async function RegisterPaymentLinkPage({
  params,
  searchParams,
}: PageProps) {
  const { token } = await params;
  const { payment } = await searchParams;

  // Handle payment cancellation
  if (payment === "cancelled") {
    // Redirect to login with message
    redirect("/login?message=payment_cancelled");
  }

  // Create payment session and redirect to Stripe
  const result = await createPaymentSession(token);

  if (result.error) {
    if (result.error === "INVALID_LINK") {
      notFound();
    }

    return (
      <div className="relative w-full h-screen overflow-hidden bg-background">
        <div className="absolute inset-0 backdrop-blur-[9px] bg-black/50 flex items-center justify-center p-8">
          <div className="relative bg-[#363636] rounded-[18px] w-full max-w-[550px] p-12 shadow-2xl">
            <div className="text-center">
              <p className="text-text-secondary">
                {result.error === "PRODUCT_NOT_CONFIGURED"
                  ? "Erreur: Produit introuvable ou non configuré"
                  : "Une erreur est survenue. Veuillez contacter le support."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (result.redirectUrl) {
    // Redirect to Stripe payment
    redirect(result.redirectUrl);
  }

  // This should not happen, but fallback
  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 backdrop-blur-[9px] bg-black/50 flex items-center justify-center p-8">
        <div className="relative bg-[#363636] rounded-[18px] w-full max-w-[550px] p-12 shadow-2xl">
          <div className="text-center">
            <p className="text-text-secondary">
              Redirection en cours...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
