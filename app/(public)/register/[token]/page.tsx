import { Metadata } from "next";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { RegisterPaymentLinkForm } from "./RegisterPaymentLinkForm";

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

  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Handle payment cancellation
  if (payment === "cancelled") {
    // Fetch payment link to get the profile ID (used_by)
    const { data: paymentLink } = await supabase
      .from("payment_links")
      .select("used_by")
      .eq("token", token)
      .single();

    // If a profile was created (used_by exists), update it to SUSPENDED
    if (paymentLink?.used_by) {
      await adminSupabase
        .from("profiles")
        .update({
          status: "SUSPENDED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentLink.used_by);
    }

    // Redirect to login with message
    redirect("/login?message=payment_cancelled");
  }

  // Fetch payment link with product details
  const { data: paymentLink, error: linkError } = await supabase
    .from("payment_links")
    .select(
      `
      *,
      product:products(id, name, description, price_amount, currency, stripe_price_id)
    `
    )
    .eq("token", token)
    .single();

  if (linkError || !paymentLink) {
    notFound();
  }

  // Validate payment link
  const now = new Date();
  const isExpired =
    paymentLink.expires_at && new Date(paymentLink.expires_at) < now;
  const isUsed = paymentLink.status === "USED" || paymentLink.used_at !== null;
  const isActive = paymentLink.status === "ACTIVE";

  if (!isActive || isExpired || isUsed) {
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

        <div className="absolute inset-0 backdrop-blur-[9px] bg-black/50 flex items-center justify-center p-8">
          <div className="relative bg-[#363636] rounded-[18px] w-full max-w-[550px] p-12 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-danger/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-exclamation-triangle text-danger text-2xl"></i>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Lien expiré
              </h1>
              <p className="text-text-secondary mb-6">
                Ce lien a expiré. Veuillez contacter le support.
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

  // Type guard for product
  const product = Array.isArray(paymentLink.product)
    ? paymentLink.product[0]
    : paymentLink.product;

  if (!product || !product.stripe_price_id) {
    return (
      <div className="relative w-full h-screen overflow-hidden bg-background">
        <div className="absolute inset-0 backdrop-blur-[9px] bg-black/50 flex items-center justify-center p-8">
          <div className="relative bg-[#363636] rounded-[18px] w-full max-w-[550px] p-12 shadow-2xl">
            <div className="text-center">
              <p className="text-text-secondary">
                Erreur: Produit introuvable ou non configuré
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RegisterPaymentLinkForm
      paymentLink={paymentLink}
      product={product}
      paymentCancelled={payment === "cancelled"}
    />
  );
}
