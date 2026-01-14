import { requireAdminAuth, requireAuth } from "@/lib/auth";
import { getUserRole } from "@/lib/user-role";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { PaymentLinksContent } from "@/components/admin/payment-links/PaymentLinksContent";

export const metadata: Metadata = {
  title: "Payment Link Analytics - Partners LLC",
  description: "Track payment link performance and conversion metrics",
};

export default async function PaymentLinksPage() {
  await requireAdminAuth();

  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-brand-text-primary">
              Payment Link Analytics
            </h1>
            <p className="text-brand-text-secondary mt-1">
              Track payment link performance with conversion metrics and usage
              analytics
            </p>
          </div>
          <PaymentLinksContent />
        </div>
      </div>
    </div>
  );
}
