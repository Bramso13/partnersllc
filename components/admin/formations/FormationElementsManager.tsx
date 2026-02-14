"use client";

import { useCallback, useState, useEffect } from "react";
import { FormationElement, FormationElementType } from "@/types/formations";
import { toast } from "sonner";
import { useApi } from "@/lib/api/useApi";
import { AddElementModal } from "./AddElementModal";

interface FormationElementsManagerProps {
  formationId: string;
}

export function FormationElementsManager({
  formationId,
}: FormationElementsManagerProps) {
  const api = useApi();
  const [elements, setElements] = useState<FormationElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingElement, setEditingElement] = useState<FormationElement | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchElements = useCallback(async () => {
    try {
      const data = await api.get<{ elements?: FormationElement[] }>(
        `/api/admin/formations/${formationId}/elements`
      );
      const sortedElements = (data?.elements ?? []).sort(
        (a, b) => a.position - b.position
      );
      setElements(sortedElements);
    } catch {
      toast.error("Erreur lors du chargement des éléments");
    } finally {
      setLoading(false);
    }
  }, [api, formationId]);

  useEffect(() => {
    fetchElements();
  }, [fetchElements]);

  const handleElementSaved = () => {
    setShowAddModal(false);
    setEditingElement(null);
    fetchElements();
    toast.success("Élément sauvegardé");
  };

  const handleDelete = async (element: FormationElement) => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer cet élément (position ${element.position}) ?`
      )
    ) {
      return;
    }

    setDeletingId(element.id);
    try {
      await api.delete(
        `/api/admin/formations/${formationId}/elements/${element.id}`
      );
      toast.success("Élément supprimé");
      fetchElements();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  };

  const handleMoveUp = async (element: FormationElement) => {
    if (element.position === 1) return;

    try {
      // Find element above
      const elementAbove = elements.find(
        (e) => e.position === element.position - 1
      );
      if (!elementAbove) return;

      // Swap positions
      await Promise.all([
        api.put(
          `/api/admin/formations/${formationId}/elements/${element.id}`,
          { position: element.position - 1 }
        ),
        api.put(
          `/api/admin/formations/${formationId}/elements/${elementAbove.id}`,
          { position: elementAbove.position + 1 }
        ),
      ]);

      fetchElements();
    } catch {
      toast.error("Erreur lors du déplacement");
    }
  };

  const handleMoveDown = async (element: FormationElement) => {
    if (element.position === elements.length) return;

    try {
      // Find element below
      const elementBelow = elements.find(
        (e) => e.position === element.position + 1
      );
      if (!elementBelow) return;

      // Swap positions
      await Promise.all([
        api.put(
          `/api/admin/formations/${formationId}/elements/${element.id}`,
          { position: element.position + 1 }
        ),
        api.put(
          `/api/admin/formations/${formationId}/elements/${elementBelow.id}`,
          { position: elementBelow.position - 1 }
        ),
      ]);

      fetchElements();
    } catch {
      toast.error("Erreur lors du déplacement");
    }
  };

  const getElementTypeLabel = (type: FormationElementType): string => {
    switch (type) {
      case "video_link":
        return "Vidéo (lien)";
      case "video_upload":
        return "Vidéo (upload)";
      case "image":
        return "Image";
      case "rich_text":
        return "Texte riche";
      case "custom_html":
        return "Page HTML";
    }
  };

  const getElementTypeIcon = (type: FormationElementType): string => {
    switch (type) {
      case "video_link":
      case "video_upload":
        return "fa-video";
      case "image":
        return "fa-image";
      case "rich_text":
        return "fa-align-left";
      case "custom_html":
        return "fa-code";
    }
  };

  const getElementPreview = (element: FormationElement): string => {
    const payload = element.payload as Record<string, unknown>;
    switch (element.type) {
      case "video_link":
        return (payload.url as string) || "URL non définie";
      case "video_upload":
        return (payload.storage_path as string) || "Vidéo uploadée";
      case "image":
        return (payload.url as string) || (payload.storage_path as string) || "Image";
      case "rich_text":
      case "custom_html": {
        const content = (payload.content as string) || "";
        return content.substring(0, 100) + (content.length > 100 ? "..." : "");
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-brand-card-bg border border-brand-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-brand-text-primary mb-4">
          Éléments du parcours
        </h2>
        <p className="text-brand-text-secondary">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="bg-brand-card-bg border border-brand-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-brand-text-primary">
          Éléments du parcours
        </h2>
        <button
          className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 font-medium"
          onClick={() => setShowAddModal(true)}
        >
          + Ajouter un élément
        </button>
      </div>

      {elements.length === 0 ? (
        <div className="text-center py-8 text-brand-text-secondary">
          <i className="fas fa-layer-group text-4xl mb-3 opacity-50"></i>
          <p>Aucun élément dans cette formation</p>
          <p className="text-sm mt-2">
            Ajoutez des vidéos, images ou textes pour créer votre parcours
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {elements.map((element, index) => (
            <div
              key={element.id}
              className="p-4 bg-brand-dark-bg/50 rounded-lg flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="text-brand-text-secondary font-mono text-sm">
                  #{element.position}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <i
                      className={`fas ${getElementTypeIcon(element.type)} text-brand-accent`}
                    ></i>
                    <span className="text-brand-text-primary font-medium">
                      {element.title?.trim() || "No title yet"}
                    </span>
                    <span className="text-brand-text-secondary text-sm">
                      ({getElementTypeLabel(element.type)})
                    </span>
                  </div>
                  <div className="text-sm text-brand-text-secondary truncate">
                    {getElementPreview(element)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Move up */}
                <button
                  onClick={() => handleMoveUp(element)}
                  disabled={element.position === 1}
                  className="p-2 text-brand-text-secondary hover:text-brand-accent disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Monter"
                >
                  <i className="fas fa-arrow-up"></i>
                </button>

                {/* Move down */}
                <button
                  onClick={() => handleMoveDown(element)}
                  disabled={element.position === elements.length}
                  className="p-2 text-brand-text-secondary hover:text-brand-accent disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Descendre"
                >
                  <i className="fas fa-arrow-down"></i>
                </button>

                {/* Edit */}
                <button
                  onClick={() => setEditingElement(element)}
                  className="p-2 text-brand-accent hover:text-brand-accent/80"
                  title="Éditer"
                >
                  <i className="fas fa-edit"></i>
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(element)}
                  disabled={deletingId === element.id}
                  className="p-2 text-red-400 hover:text-red-300 disabled:opacity-50"
                  title="Supprimer"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingElement) && (
        <AddElementModal
          formationId={formationId}
          element={editingElement}
          nextPosition={elements.length + 1}
          onClose={() => {
            setShowAddModal(false);
            setEditingElement(null);
          }}
          onSaved={handleElementSaved}
        />
      )}
    </div>
  );
}
