"use client";

import { useState } from "react";
import {
  FormationElement,
  FormationElementType,
  FormationElementPayload,
} from "@/types/formations";
import { toast } from "sonner";
import { useApi } from "@/lib/api/useApi";

interface AddElementModalProps {
  formationId: string;
  element: FormationElement | null; // null for new, populated for edit
  nextPosition: number;
  onClose: () => void;
  onSaved: () => void;
}

export function AddElementModal({
  formationId,
  element,
  nextPosition,
  onClose,
  onSaved,
}: AddElementModalProps) {
  const api = useApi();
  const [selectedType, setSelectedType] = useState<FormationElementType | null>(
    element?.type || null
  );
  const [title, setTitle] = useState(
    element?.title?.trim() ? element.title.trim() : "No title yet"
  );
  const [loading, setLoading] = useState(false);

  // Form state for video_link
  const [videoUrl, setVideoUrl] = useState(
    element?.type === "video_link"
      ? (element.payload as { url: string }).url
      : ""
  );

  // Form state for video_upload
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(
    element?.type === "video_upload"
      ? (element.payload as { storage_path: string }).storage_path
      : null
  );

  // Form state for image
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    element?.type === "image"
      ? ((element.payload as { url?: string; storage_path?: string }).url ||
          (element.payload as { url?: string; storage_path?: string })
            .storage_path ||
          null)
      : null
  );

  // Form state for rich_text
  const [richTextContent, setRichTextContent] = useState(
    element?.type === "rich_text"
      ? (element.payload as { content: string }).content
      : ""
  );

  // Form state for custom_html
  const [customHtmlContent, setCustomHtmlContent] = useState(
    element?.type === "custom_html"
      ? (element.payload as { content: string }).content ?? ""
      : ""
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(file.name);
    }
  };

  const uploadFile = async (
    file: File,
    bucket: string
  ): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);
    formData.append("folder", "");

    try {
      const data = await api.post<{ path?: string }>(
        "/api/admin/formations/upload",
        formData
      );
      return data?.path ?? null;
    } catch {
      toast.error("Erreur lors de l'upload");
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedType) {
      toast.error("Sélectionnez un type d'élément");
      return;
    }

    setLoading(true);

    try {
      let payload: FormationElementPayload | null = null;

      // Build payload based on type
      switch (selectedType) {
        case "video_link":
          if (!videoUrl.trim()) {
            toast.error("L'URL de la vidéo est requise");
            setLoading(false);
            return;
          }
          payload = { url: videoUrl.trim() };
          break;

        case "video_upload":
          if (!videoFile && !element) {
            toast.error("Sélectionnez une vidéo à uploader");
            setLoading(false);
            return;
          }
          if (videoFile) {
            const uploadedPath = await uploadFile(videoFile, "formation-videos");
            if (!uploadedPath) {
              setLoading(false);
              return;
            }
            payload = { storage_path: uploadedPath };
          } else if (element) {
            // Keep existing path
            payload = element.payload;
          }
          break;

        case "image":
          if (!imageFile && !element) {
            toast.error("Sélectionnez une image");
            setLoading(false);
            return;
          }
          if (imageFile) {
            const uploadedPath = await uploadFile(imageFile, "formation-images");
            if (!uploadedPath) {
              setLoading(false);
              return;
            }
            payload = { storage_path: uploadedPath };
          } else if (element) {
            // Keep existing
            payload = element.payload;
          }
          break;

        case "rich_text":
          if (!richTextContent.trim()) {
            toast.error("Le contenu est requis");
            setLoading(false);
            return;
          }
          payload = { content: richTextContent.trim() };
          break;

        case "custom_html":
          if (customHtmlContent === undefined || customHtmlContent === null) {
            toast.error("Le contenu HTML est requis");
            setLoading(false);
            return;
          }
          payload = { content: String(customHtmlContent).trim() };
          break;
      }

      if (!payload) {
        toast.error("Erreur lors de la création du payload");
        setLoading(false);
        return;
      }

      const titleValue =
        title !== undefined && title !== null && String(title).trim() !== ""
          ? String(title).trim()
          : "No title yet";

      const body = element
        ? { title: titleValue, payload }
        : {
            type: selectedType,
            position: nextPosition,
            title: titleValue,
            payload,
          };

      if (element) {
        await api.put(
          `/api/admin/formations/${formationId}/elements/${element.id}`,
          body
        );
      } else {
        await api.post(
          `/api/admin/formations/${formationId}/elements`,
          body
        );
      }

      onSaved();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la sauvegarde"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-card-bg border border-brand-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-brand-text-primary">
              {element ? "Éditer l'élément" : "Ajouter un élément"}
            </h2>
            <button
              onClick={onClose}
              className="text-brand-text-secondary hover:text-brand-text-primary"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title (all elements) */}
            <div>
              <label className="block text-sm font-medium text-brand-text-primary mb-2">
                Titre
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                placeholder="No title yet"
              />
              <p className="text-sm text-brand-text-secondary mt-1">
                Affiché dans le sommaire et la navigation du parcours
              </p>
            </div>

            {/* Type selection (only for new elements) */}
            {!element && (
              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-3">
                  Type d'élément <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedType("video_link")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedType === "video_link"
                        ? "border-brand-accent bg-brand-accent/10"
                        : "border-brand-border hover:border-brand-accent/50"
                    }`}
                  >
                    <i className="fas fa-link text-2xl mb-2 text-brand-accent"></i>
                    <div className="text-brand-text-primary font-medium">
                      Vidéo (lien)
                    </div>
                    <div className="text-sm text-brand-text-secondary mt-1">
                      YouTube, Vimeo, etc.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedType("video_upload")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedType === "video_upload"
                        ? "border-brand-accent bg-brand-accent/10"
                        : "border-brand-border hover:border-brand-accent/50"
                    }`}
                  >
                    <i className="fas fa-video text-2xl mb-2 text-brand-accent"></i>
                    <div className="text-brand-text-primary font-medium">
                      Vidéo (upload)
                    </div>
                    <div className="text-sm text-brand-text-secondary mt-1">
                      Fichier MP4
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedType("image")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedType === "image"
                        ? "border-brand-accent bg-brand-accent/10"
                        : "border-brand-border hover:border-brand-accent/50"
                    }`}
                  >
                    <i className="fas fa-image text-2xl mb-2 text-brand-accent"></i>
                    <div className="text-brand-text-primary font-medium">
                      Image
                    </div>
                    <div className="text-sm text-brand-text-secondary mt-1">
                      JPG, PNG, WebP
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedType("rich_text")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedType === "rich_text"
                        ? "border-brand-accent bg-brand-accent/10"
                        : "border-brand-border hover:border-brand-accent/50"
                    }`}
                  >
                    <i className="fas fa-align-left text-2xl mb-2 text-brand-accent"></i>
                    <div className="text-brand-text-primary font-medium">
                      Texte riche
                    </div>
                    <div className="text-sm text-brand-text-secondary mt-1">
                      Contenu formaté
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedType("custom_html")}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedType === "custom_html"
                        ? "border-brand-accent bg-brand-accent/10"
                        : "border-brand-border hover:border-brand-accent/50"
                    }`}
                  >
                    <i className="fas fa-code text-2xl mb-2 text-brand-accent"></i>
                    <div className="text-brand-text-primary font-medium">
                      Page HTML
                    </div>
                    <div className="text-sm text-brand-text-secondary mt-1">
                      HTML complet (styles, vidéos, iframes)
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Forms based on type */}
            {selectedType === "video_link" && (
              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-2">
                  URL de la vidéo <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
                <p className="text-sm text-brand-text-secondary mt-2">
                  YouTube, Vimeo ou lien direct
                </p>
              </div>
            )}

            {selectedType === "video_upload" && (
              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-2">
                  Vidéo <span className="text-red-400">*</span>
                </label>
                {videoPreview && (
                  <div className="mb-3 p-3 bg-brand-dark-bg/50 rounded border border-brand-border">
                    <i className="fas fa-video mr-2 text-brand-accent"></i>
                    <span className="text-brand-text-primary">
                      {videoPreview}
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  onChange={handleVideoChange}
                  className="block w-full text-sm text-brand-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-accent file:text-white hover:file:bg-brand-accent/90"
                />
                <p className="text-sm text-brand-text-secondary mt-2">
                  Format MP4 ou WebM recommandé
                </p>
              </div>
            )}

            {selectedType === "image" && (
              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-2">
                  Image <span className="text-red-400">*</span>
                </label>
                {imagePreview && (
                  <div className="mb-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-w-full h-auto max-h-64 rounded border border-brand-border"
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-brand-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-accent file:text-white hover:file:bg-brand-accent/90"
                />
                <p className="text-sm text-brand-text-secondary mt-2">
                  Formats acceptés: JPG, PNG, WebP
                </p>
              </div>
            )}

            {selectedType === "rich_text" && (
              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-2">
                  Contenu <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={richTextContent}
                  onChange={(e) => setRichTextContent(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent font-mono text-sm"
                  placeholder="Contenu en texte (HTML ou Markdown supporté)"
                  required
                />
                <p className="text-sm text-brand-text-secondary mt-2">
                  Vous pouvez utiliser du HTML ou Markdown
                </p>
              </div>
            )}

            {selectedType === "custom_html" && (
              <div>
                <label className="block text-sm font-medium text-brand-text-primary mb-2">
                  Contenu HTML <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={customHtmlContent}
                  onChange={(e) => setCustomHtmlContent(e.target.value)}
                  rows={14}
                  className="w-full px-4 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent font-mono text-sm"
                  placeholder="<div>... HTML complet avec styles, images, vidéos, iframes (YouTube/Vimeo avec sandbox)...</div>"
                />
                <p className="text-sm text-brand-text-secondary mt-2">
                  Page HTML complète (div, style, img, a, iframe en sandbox). Scripts et handlers inline sont supprimés à l&apos;affichage.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-brand-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-brand-border rounded-lg text-brand-text-primary hover:bg-brand-dark-bg/50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || !selectedType}
                className="px-6 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? "Enregistrement..." : element ? "Mettre à jour" : "Ajouter"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
