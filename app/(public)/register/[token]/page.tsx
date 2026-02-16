import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Inscription - Partners LLC",
  description: "Créez votre compte Partners LLC",
};

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ payment?: string; error?: string }>;
}

export default async function RegisterPaymentLinkPage({
  params,
  searchParams,
}: PageProps) {
  const { token } = await params;
  const { payment, error } = await searchParams;

  // Handle payment cancellation
  if (payment === "cancelled") {
    redirect("/login?message=payment_cancelled");
  }

  // Errors returned by init-payment API (invalid link, etc.)
  if (error === "INVALID_LINK") {
    notFound();
  }
  if (error) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-background">
        <div className="absolute inset-0 backdrop-blur-[9px] bg-black/50 flex items-center justify-center p-8">
          <div className="relative bg-[#363636] rounded-[18px] w-full max-w-[550px] p-12 shadow-2xl">
            <div className="text-center">
              <p className="text-text-secondary">
                {error === "PRODUCT_NOT_CONFIGURED"
                  ? "Erreur: Produit introuvable ou non configuré"
                  : "Une erreur est survenue. Veuillez contacter le support."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to init-payment API: it will set the pending_registration_session cookie and redirect to Stripe
  const initPaymentUrl = `/api/register/init-payment?token=${encodeURIComponent(token)}`;
  redirect(initPaymentUrl);
}
