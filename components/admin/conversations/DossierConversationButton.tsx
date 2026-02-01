"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DossierConversationButtonProps {
  dossierId: string;
}

export function DossierConversationButton({
  dossierId,
}: DossierConversationButtonProps) {
  const router = useRouter();
  const [existingId, setExistingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(
          `/api/admin/conversations?type=client&dossier_id=${dossierId}`
        );
        if (resp.ok) {
          const data = await resp.json();
          if (data.conversations?.length > 0) {
            setExistingId(data.conversations[0].id);
          }
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, [dossierId]);

  const handleClick = async () => {
    if (existingId) {
      router.push(`/admin/conversations/clients/${existingId}`);
      return;
    }
    setIsCreating(true);
    try {
      const resp = await fetch("/api/admin/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "client", dossier_id: dossierId }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error ?? "Échec création");
      }
      const data = await resp.json();
      router.push(`/admin/conversations/clients/${data.conversation.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur création");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isCreating}
      className="w-full px-4 py-2.5 rounded-lg bg-[#50b989] text-[#191a1d] text-sm font-medium hover:bg-[#50b989]/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
    >
      <i className="fa-brands fa-whatsapp" />
      {existingId
        ? "Ouvrir WhatsApp"
        : isCreating
          ? "Création…"
          : "Créer conversation WhatsApp"}
    </button>
  );
}
