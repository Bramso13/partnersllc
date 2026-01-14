import { requireAdminAuth, requireAuth } from "@/lib/auth";
import { getUserRole } from "@/lib/user-role";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { WorkflowConfigContent } from "@/components/admin/products/workflow/WorkflowConfigContent";
import { getProductById } from "@/lib/products";

export const metadata: Metadata = {
  title: "Workflow Configuration - Partners LLC",
  description: "Configure product workflow steps and requirements",
};

interface WorkflowPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkflowConfigPage({
  params,
}: WorkflowPageProps) {
  await requireAdminAuth();

  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    redirect("/admin/products");
  }

  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-brand-text-primary">
              Workflow Configuration
            </h1>
            <p className="text-brand-text-secondary mt-1">
              Configure workflow steps, documents, and custom fields for{" "}
              <span className="font-medium text-brand-text-primary">
                {product.name}
              </span>
            </p>
          </div>
          <WorkflowConfigContent productId={id} />
        </div>
      </div>
    </div>
  );
}
