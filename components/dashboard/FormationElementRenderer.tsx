"use client";

import type {
  FormationElement,
  VideoLinkPayload,
  VideoUploadPayload,
  ImagePayload,
  RichTextPayload,
} from "@/types/formations";
import DOMPurify from "isomorphic-dompurify";

interface FormationElementRendererProps {
  element: FormationElement;
}

export function FormationElementRenderer({
  element,
}: FormationElementRendererProps) {
  switch (element.type) {
    case "video_link":
      return <VideoLinkElement payload={element.payload as VideoLinkPayload} />;

    case "video_upload":
      return (
        <VideoUploadElement payload={element.payload as VideoUploadPayload} />
      );

    case "image":
      return <ImageElement payload={element.payload as ImagePayload} />;

    case "rich_text":
      return <RichTextElement payload={element.payload as RichTextPayload} />;

    default:
      return (
        <div className="bg-border/50 border border-border rounded-lg p-6 text-center">
          <i className="fa-solid fa-question-circle text-3xl text-text-secondary mb-3"></i>
          <p className="text-text-secondary">Type d'élément non supporté</p>
        </div>
      );
  }
}

// Video Link Element (YouTube/Vimeo embed)
function VideoLinkElement({ payload }: { payload: VideoLinkPayload }) {
  const embedUrl = getEmbedUrl(payload.url);

  if (!embedUrl) {
    return (
      <div className="space-y-4">
        <div className="bg-border/50 border border-border rounded-lg p-6 text-center">
          <i className="fa-solid fa-video text-3xl text-text-secondary mb-3"></i>
          <p className="text-text-secondary mb-4">
            Impossible d'intégrer cette vidéo automatiquement
          </p>
          <a
            href={payload.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-background rounded-lg transition-colors font-medium"
          >
            <i className="fa-solid fa-external-link"></i>
            Ouvrir la vidéo dans un nouvel onglet
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Vidéo de formation"
      />
    </div>
  );
}

// Video Upload Element (Supabase Storage)
function VideoUploadElement({ payload }: { payload: VideoUploadPayload }) {
  // The storage_path should be converted to a signed URL by the backend
  // For now, we'll use the path directly (backend should provide full URL)
  const videoUrl = payload.storage_path;

  return (
    <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
      <video
        controls
        className="w-full h-full"
        src={videoUrl}
        title="Vidéo de formation"
      >
        <track kind="captions" />
        Votre navigateur ne supporte pas la lecture de vidéos.
      </video>
    </div>
  );
}

// Image Element
function ImageElement({ payload }: { payload: ImagePayload }) {
  const imageUrl = payload.url || payload.storage_path;

  if (!imageUrl) {
    return (
      <div className="bg-border/50 border border-border rounded-lg p-6 text-center">
        <i className="fa-solid fa-image text-3xl text-text-secondary mb-3"></i>
        <p className="text-text-secondary">Image non disponible</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden">
      <img
        src={imageUrl}
        alt="Image de formation"
        className="w-full h-auto rounded-lg"
      />
    </div>
  );
}

// Rich Text Element
function RichTextElement({ payload }: { payload: RichTextPayload }) {
  // Sanitize HTML to prevent XSS
  const sanitizedContent = DOMPurify.sanitize(payload.content, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "a",
      "blockquote",
      "code",
      "pre",
      "img",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "class"],
  });

  return (
    <div
      className="prose prose-invert max-w-none
        prose-headings:text-foreground
        prose-p:text-text-secondary
        prose-a:text-accent prose-a:no-underline hover:prose-a:underline
        prose-strong:text-foreground
        prose-code:text-accent prose-code:bg-surface prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
        prose-pre:bg-surface prose-pre:border prose-pre:border-border
        prose-img:rounded-lg
        prose-ul:text-text-secondary
        prose-ol:text-text-secondary
        prose-li:text-text-secondary
        prose-blockquote:border-l-accent prose-blockquote:text-text-secondary"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}

// Helper function to extract embed URLs from video links
function getEmbedUrl(url: string): string | null {
  // YouTube
  const youtubeRegex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch && youtubeMatch[1]) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  // Vimeo
  const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // If already an embed URL, return as is
  if (
    url.includes("youtube.com/embed/") ||
    url.includes("player.vimeo.com/video/")
  ) {
    return url;
  }

  return null;
}
