"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConversations } from "@/lib/contexts/conversations/ConversationsContext";

interface DossierConversationButtonProps {
  dossierId: string;
}

export function DossierConversationButton({
  dossierId,
}: DossierConversationButtonProps) {
  const router = useRouter();
  const { fetchConversations, createConversation } = useConversations();
  const [existingId, setExistingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await fetchConversations({ type: "client", dossier_id: dossierId });
        const arr = Array.isArray(list) ? list : [];
        if (arr.length > 0 && arr[0] && typeof arr[0] === "object" && "id" in arr[0]) {
          setExistingId((arr[0] as { id: string }).id);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, [dossierId, fetchConversations]);

  const handleClick = async () => {
    if (existingId) {
      router.push(`/admin/conversations/clients/${existingId}`);
      return;
    }
    setIsCreating(true);
    try {
      const res = await createConversation({ type: "client", dossier_id: dossierId });
      const id = res?.conversation?.id;
      if (id) {
        router.push(`/admin/conversations/clients/${id}`);
      } else {
        throw new Error(res?.error ?? "Échec création");
      }
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
