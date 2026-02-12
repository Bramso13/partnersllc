"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type {
  FormationWithElements,
  UserFormationProgress,
  FormationElement,
} from "@/types/formations";
import { FormationElementRenderer } from "./FormationElementRenderer";

interface FormationParcoursProps {
  formation: FormationWithElements;
  progress: UserFormationProgress | null;
  userId: string;
  /** When true, hide breadcrumb and adapt layout for embedding (e.g. in workflow stepper) */
  embedded?: boolean;
}

export function FormationParcours({
  formation,
  progress: initialProgress,
  userId,
  embedded = false,
}: FormationParcoursProps) {
  const [currentElementIndex, setCurrentElementIndex] = useState(0);
  const [completedElementIds, setCompletedElementIds] = useState<string[]>(
    initialProgress?.completed_element_ids || []
  );
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  const elements = formation.elements;
  const currentElement = elements[currentElementIndex];
  const totalElements = elements.length;

  // Initialize to last viewed element or first incomplete element
  useEffect(() => {
    if (initialProgress?.last_element_id && elements.length > 0) {
      const lastIndex = elements.findIndex(
        (el) => el.id === initialProgress.last_element_id
      );
      if (lastIndex !== -1) {
        setCurrentElementIndex(lastIndex);
      }
    } else if (initialProgress?.completed_element_ids && elements.length > 0) {
      // Find first incomplete element
      const firstIncompleteIndex = elements.findIndex(
        (el) => !initialProgress.completed_element_ids.includes(el.id)
      );
      if (firstIncompleteIndex !== -1) {
        setCurrentElementIndex(firstIncompleteIndex);
      }
    }
  }, []);

  // Update progress when element changes
  useEffect(() => {
    if (!currentElement) return;

    const updateProgress = async () => {
      try {
        setIsUpdatingProgress(true);
        await fetch(`/api/formations/${formation.id}/progress`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            last_element_id: currentElement.id,
          }),
        });
      } catch (error) {
        console.error("Error updating progress:", error);
      } finally {
        setIsUpdatingProgress(false);
      }
    };

    updateProgress();
  }, [currentElement?.id, formation.id]);

  const handleMarkAsCompleted = async () => {
    if (!currentElement || completedElementIds.includes(currentElement.id))
      return;

    const updatedCompletedIds = [...completedElementIds, currentElement.id];
    setCompletedElementIds(updatedCompletedIds);

    try {
      await fetch(`/api/formations/${formation.id}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed_element_ids: updatedCompletedIds,
          last_element_id: currentElement.id,
        }),
      });
    } catch (error) {
      console.error("Error marking as completed:", error);
      // Revert on error
      setCompletedElementIds(completedElementIds);
    }
  };

  const handlePrevious = () => {
    if (currentElementIndex > 0) {
      setCurrentElementIndex(currentElementIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentElementIndex < totalElements - 1) {
      setCurrentElementIndex(currentElementIndex + 1);
    }
  };

  const completedCount = completedElementIds.length;
  const progressPercentage =
    totalElements > 0 ? Math.round((completedCount / totalElements) * 100) : 0;

  if (elements.length === 0) {
    return (
      <div className={`${embedded ? "p-6" : "max-w-4xl mx-auto"}`}>
        {!embedded && (
          <div className="mb-6">
            <Link
              href="/dashboard/formation"
              className="inline-flex items-center gap-2 text-text-secondary hover:text-accent transition-colors"
            >
              <i className="fa-solid fa-arrow-left"></i>
              Retour aux formations
            </Link>
          </div>
        )}

        <div className="bg-surface border border-border rounded-xl p-8 text-center">
          <i className="fa-solid fa-inbox text-4xl text-text-secondary mb-4"></i>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Aucun élément dans cette formation
          </h2>
          <p className="text-text-secondary">
            Cette formation ne contient pas encore de contenu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${embedded ? "p-6" : "max-w-6xl mx-auto"}`}>
      {/* Breadcrumb (hidden when embedded) */}
      {!embedded && (
        <div className="mb-6">
          <Link
            href="/dashboard/formation"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-accent transition-colors"
          >
            <i className="fa-solid fa-arrow-left"></i>
            Retour aux formations
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
          {formation.titre}
        </h1>

        {formation.description && (
          <p className="text-text-secondary mb-4">{formation.description}</p>
        )}

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">
              {completedCount} / {totalElements} éléments vus
            </span>
            <span className="font-medium text-foreground">
              {progressPercentage}%
            </span>
          </div>
          <div className="w-full h-3 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Element Content */}
        <div className="lg:col-span-3">
          <div className="bg-surface border border-border rounded-xl p-6">
            {/* Element Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-text-secondary">
                  Élément {currentElementIndex + 1} / {totalElements}
                </span>
                <span className="text-foreground font-semibold">
                  {currentElement.title?.trim() || "No title yet"}
                </span>
                {completedElementIds.includes(currentElement.id) && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                    <i className="fa-solid fa-check-circle"></i>
                    Vu
                  </span>
                )}
              </div>

              {!completedElementIds.includes(currentElement.id) && (
                <button
                  onClick={handleMarkAsCompleted}
                  className="px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-colors text-sm font-medium"
                >
                  <i className="fa-solid fa-check mr-2"></i>
                  Marquer comme vu
                </button>
              )}
            </div>

            {/* Element Renderer */}
            <FormationElementRenderer element={currentElement} />

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
              <button
                onClick={handlePrevious}
                disabled={currentElementIndex === 0}
                className="px-4 py-2 bg-surface hover:bg-border border border-border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i>
                Précédent
              </button>

              <button
                onClick={handleNext}
                disabled={currentElementIndex === totalElements - 1}
                className="px-4 py-2 bg-accent hover:bg-accent/90 text-background rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Suivant
                <i className="fa-solid fa-arrow-right ml-2"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar - Table of Contents */}
        <div className="lg:col-span-1">
          <div className="bg-surface border border-border rounded-xl p-4 sticky top-6">
            <h3 className="font-semibold text-foreground mb-4">
              Table des matières
            </h3>

            <div className="space-y-2">
              {elements.map((element, index) => {
                const isCompleted = completedElementIds.includes(element.id);
                const isCurrent = index === currentElementIndex;

                return (
                  <button
                    key={element.id}
                    onClick={() => setCurrentElementIndex(index)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      isCurrent
                        ? "bg-accent text-background"
                        : "hover:bg-border text-text-secondary"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm truncate">
                        {index + 1}. {element.title?.trim() || "No title yet"}
                      </span>
                      {isCompleted && (
                        <i
                          className={`fa-solid fa-check-circle text-xs ${
                            isCurrent ? "text-background" : "text-green-500"
                          }`}
                        ></i>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

