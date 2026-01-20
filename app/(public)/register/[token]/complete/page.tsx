import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { stripe } from "@/lib/stripe";
import { CompleteRegistrationForm } from "./CompleteRegistrationForm";

export const metadata: Metadata = {
  title: "Finaliser l'inscription - Partners LLC",
  description: "Finalisez votre inscription Partners LLC",
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function CompleteRegistrationPage({
  params,
}: PageProps) {
  const { token } = await params;

  const supabase = await createClient();

  // Fetch payment link
  const { data: paymentLink, error: linkError } = await supabase
    .from("payment_links")
    .select("*")
    .eq("token", token)
    .single();

  if (linkError || !paymentLink) {
    notFound();
  }

  // Always verify payment with Stripe first (source of truth)
  let paymentVerified = false;
  let stripeCustomerData: { customer_name?: string; customer_email?: string } | undefined;

  try {
    if (!paymentLink.stripe_checkout_session_id) {
      // No checkout session found - redirect to payment
      return (
        <div className="relative w-full h-screen overflow-hidden bg-background">
          <div className="absolute inset-0 backdrop-blur-[9px] bg-black/50 flex items-center justify-center p-8">
            <div className="relative bg-[#363636] rounded-[18px] w-full max-w-[550px] p-12 shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-danger/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-exclamation-triangle text-danger text-2xl"></i>
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Paiement requis
                </h1>
                <p className="text-text-secondary mb-6">
                  Vous devez d'abord effectuer le paiement avant de pouvoir créer votre compte.
                </p>
                <a
                  href={`/register/${token}`}
                  className="text-accent font-semibold hover:underline"
                >
                  Procéder au paiement
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Verify payment status with Stripe
    const session = await stripe.checkout.sessions.retrieve(
      paymentLink.stripe_checkout_session_id,
      { expand: ["customer"] }
    );

    if (session.payment_status === "paid") {
      paymentVerified = true;
      // Extract customer data from Stripe
      if (session.customer && typeof session.customer === "object" && "name" in session.customer) {
        stripeCustomerData = {
          customer_name: session.customer.name || undefined,
          customer_email: session.customer.email || undefined,
        };
      }
    } else if (session.payment_status === "unpaid" && session.status === "open") {
      // Payment session is still open but not paid
      return (
        <div className="relative w-full h-screen overflow-hidden bg-background">
          <div className="absolute inset-0 backdrop-blur-[9px] bg-black/50 flex items-center justify-center p-8">
            <div className="relative bg-[#363636] rounded-[18px] w-full max-w-[550px] p-12 shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-clock text-warning text-2xl"></i>
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Paiement en attente
                </h1>
                <p className="text-text-secondary mb-6">
                  Votre paiement n'est pas encore finalisé. Veuillez compléter le paiement.
                </p>
                <a
                  href={`/register/${token}`}
                  className="text-accent font-semibold hover:underline"
                >
                  Reprendre le paiement
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (session.status === "expired") {
      // Payment session expired
      return (
        <div className="relative w-full h-screen overflow-hidden bg-background">
          <div className="absolute inset-0 backdrop-blur-[9px] bg-black/50 flex items-center justify-center p-8">
            <div className="relative bg-[#363636] rounded-[18px] w-full max-w-[550px] p-12 shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-danger/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-exclamation-triangle text-danger text-2xl"></i>
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Session expirée
                </h1>
                <p className="text-text-secondary mb-6">
                  Votre session de paiement a expiré. Veuillez recommencer.
                </p>
                <a
                  href={`/register/${token}`}
                  className="text-accent font-semibold hover:underline"
                >
                  Nouveau paiement
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      // Payment failed or unknown status
      return (
        <div className="relative w-full h-screen overflow-hidden bg-background">
          <div className="absolute inset-0 backdrop-blur-[9px] bg-black/50 flex items-center justify-center p-8">
            <div className="relative bg-[#363636] rounded-[18px] w-full max-w-[550px] p-12 shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-danger/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-exclamation-triangle text-danger text-2xl"></i>
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Paiement échoué
                </h1>
                <p className="text-text-secondary mb-6">
                  Votre paiement n'a pas pu être traité. Veuillez réessayer.
                </p>
                <a
                  href={`/register/${token}`}
                  className="text-accent font-semibold hover:underline"
                >
                  Réessayer le paiement
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }
  } catch (stripeError) {
    console.error("Stripe payment verification error:", stripeError);
    return (
      <div className="relative w-full h-screen overflow-hidden bg-background">
        <div className="absolute inset-0 backdrop-blur-[9px] bg-black/50 flex items-center justify-center p-8">
          <div className="relative bg-[#363636] rounded-[18px] w-full max-w-[550px] p-12 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-danger/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-exclamation-triangle text-danger text-2xl"></i>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Erreur de vérification
              </h1>
              <p className="text-text-secondary mb-6">
                Impossible de vérifier le paiement avec Stripe. Veuillez contacter le support.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If payment is not verified, show error (should not happen with above logic)
  if (!paymentVerified) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-background">
        <div className="absolute inset-0 backdrop-blur-[9px] bg-black/50 flex items-center justify-center p-8">
          <div className="relative bg-[#363636] rounded-[18px] w-full max-w-[550px] p-12 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-danger/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-exclamation-triangle text-danger text-2xl"></i>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Paiement non vérifié
              </h1>
              <p className="text-text-secondary mb-6">
                Votre paiement n'a pas été confirmé. Veuillez contacter le support.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If payment link is already used (account created), redirect to login
  if (paymentLink.used_at) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-background">
        <div className="absolute inset-0 backdrop-blur-[9px] bg-black/50 flex items-center justify-center p-8">
          <div className="relative bg-[#363636] rounded-[18px] w-full max-w-[550px] p-12 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-check-circle text-success text-2xl"></i>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Compte déjà créé
              </h1>
              <p className="text-text-secondary mb-6">
                Un compte a déjà été créé avec ce lien de paiement.
              </p>
              <a
                href="/login"
                className="text-accent font-semibold hover:underline"
              >
                Se connecter
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CompleteRegistrationForm
      paymentLink={paymentLink}
      stripeData={stripeCustomerData}
    />
  );
}