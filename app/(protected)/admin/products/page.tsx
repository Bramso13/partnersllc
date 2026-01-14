import { requireAdminAuth, requireAuth } from "@/lib/auth";
import { getUserRole } from "@/lib/user-role";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { ProductsContent } from "@/components/admin/products/ProductsContent";

export const metadata: Metadata = {
  title: "Product Management - Partners LLC",
  description: "Manage products and their workflow configurations",
};

export default async function ProductsPage() {
  await requireAdminAuth();

  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-brand-text-primary">
              Product Management
            </h1>
            <p className="text-brand-text-secondary mt-1">
              Create and configure products with workflow steps and required
              documents
            </p>
          </div>
          <ProductsContent />
        </div>
      </div>
    </div>
  );
}
