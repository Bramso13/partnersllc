"use client";

import { useState } from "react";
import { useApi } from "@/lib/api/useApi";

interface MediaViewerProps {
  media: {
    id: string;
    title: string;
    description?: string;
    filename: string;
    content_type: string;
    file_size: number;
    created_at: string;
  };
  uploaderName: string;
}

export function MediaViewer({ media, uploaderName }: MediaViewerProps) {
  const api = useApi();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = await api.getBlob(`/api/conversations/media/${media.id}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = media.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert("Erreur lors du téléchargement");
    } finally {
      setIsDownloading(false);
    }
  };

  const isImage = media.content_type.startsWith("image/");
  const isPdf = media.content_type === "application/pdf";
  const isVideo = media.content_type.startsWith("video/");
  const isAudio = media.content_type.startsWith("audio/");

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="min-h-screen bg-brand-dark-bg">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="bg-brand-card-bg border border-brand-stroke rounded-lg p-6 mb-4">
          <h1 className="text-2xl font-bold text-brand-text-primary mb-2">
            {media.title}
          </h1>
          {media.description && (
            <p className="text-brand-text-secondary mb-4">
              {media.description}
            </p>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-brand-text-secondary">
            <div className="flex items-center gap-2">
              <i className="fas fa-file"></i>
              <span>{media.filename}</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-weight"></i>
              <span>{formatFileSize(media.file_size)}</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-user"></i>
              <span>Par {uploaderName}</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-calendar"></i>
              <span>
                {new Date(media.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Prévisualisation */}
        <div className="bg-brand-card-bg border border-brand-stroke rounded-lg p-6 mb-4">
          {isImage && (
            <div className="flex justify-center">
              <img
                src={`/api/conversations/media/${media.id}`}
                alt={media.title}
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )}

          {isPdf && (
            <div className="aspect-[3/4] w-full">
              <iframe
                src={`/api/conversations/media/${media.id}`}
                className="w-full h-full rounded-lg"
                title={media.title}
              />
            </div>
          )}

          {isVideo && (
            <div className="flex justify-center">
              <video
                src={`/api/conversations/media/${media.id}`}
                controls
                className="max-w-full h-auto rounded-lg"
              >
                Votre navigateur ne supporte pas la lecture de vidéos.
              </video>
            </div>
          )}

          {isAudio && (
            <div className="flex justify-center py-8">
              <audio
                src={`/api/conversations/media/${media.id}`}
                controls
                className="w-full max-w-md"
              >
                Votre navigateur ne supporte pas la lecture audio.
              </audio>
            </div>
          )}

          {!isImage && !isPdf && !isVideo && !isAudio && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-brand-text-secondary mb-4">
                Prévisualisation non disponible pour ce type de fichier
              </p>
              <p className="text-sm text-brand-text-secondary/70">
                Type : {media.content_type}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 px-6 py-3 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-download mr-2"></i>
            {isDownloading ? "Téléchargement..." : "Télécharger"}
          </button>
          <button
            onClick={() => window.close()}
            className="px-6 py-3 border border-brand-stroke text-brand-text-secondary rounded-lg hover:text-brand-text-primary hover:border-brand-accent transition-colors font-medium"
          >
            <i className="fas fa-times mr-2"></i>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
