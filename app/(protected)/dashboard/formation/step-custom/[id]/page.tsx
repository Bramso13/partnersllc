import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getStepFormationCustomForUser } from "@/lib/formations";
import { sanitizeFormationHtml } from "@/lib/html-sanitize";
import { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const profile = await requireAuth();
  const custom = await getStepFormationCustomForUser(id, profile.id);

  if (!custom) {
    return { title: "Formation introuvable - Partners LLC" };
  }

  return {
    title: `${custom.title} - Formation - Partners LLC`,
    description: "Formation personnalisée pour cette étape",
  };
}

export default async function StepCustomFormationPage({ params }: Props) {
  const { id } = await params;
  const profile = await requireAuth();

  const custom = await getStepFormationCustomForUser(id, profile.id);

  if (!custom) {
    notFound();
  }

  const sanitizedHtml = sanitizeFormationHtml(custom.html_content);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/formation"
          className="text-brand-accent hover:underline text-sm"
        >
          ← Retour aux formations
        </Link>
      </div>
      <header>
        <h1 className="text-2xl font-semibold text-brand-text-primary">
          {custom.title}
        </h1>
      </header>
      <div
        className="prose prose-invert max-w-none
          prose-headings:text-brand-text-primary
          prose-p:text-brand-text-secondary
          prose-a:text-brand-accent prose-a:no-underline hover:prose-a:underline
          prose-strong:text-brand-text-primary
          prose-img:rounded-lg
          prose-video:rounded-lg"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </div>
  );
}
