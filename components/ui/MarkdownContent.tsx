"use client";

import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * Reusable component for rendering sanitized Markdown content
 * Uses react-markdown with rehype-sanitize to prevent XSS attacks
 * Enhanced with refined typography and spacing
 */
export function MarkdownContent({
  content,
  className = "",
}: MarkdownContentProps) {
  if (!content || !content.trim()) {
    return null;
  }

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{content}</ReactMarkdown>

      <style jsx global>{`
        .markdown-content {
          color: var(--brand-text-secondary);
          line-height: 1.7;
          font-size: 0.9375rem;
        }

        .markdown-content > *:first-child {
          margin-top: 0;
        }

        .markdown-content > *:last-child {
          margin-bottom: 0;
        }

        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3,
        .markdown-content h4 {
          color: var(--brand-text-primary);
          font-weight: 600;
          margin-top: 1.5em;
          margin-bottom: 0.75em;
          line-height: 1.3;
        }

        .markdown-content h1 {
          font-size: 1.5rem;
          letter-spacing: -0.02em;
        }

        .markdown-content h2 {
          font-size: 1.25rem;
          letter-spacing: -0.01em;
        }

        .markdown-content h3 {
          font-size: 1.125rem;
        }

        .markdown-content h4 {
          font-size: 1rem;
        }

        .markdown-content p {
          margin-top: 0.875em;
          margin-bottom: 0.875em;
        }

        .markdown-content strong {
          color: var(--brand-text-primary);
          font-weight: 600;
        }

        .markdown-content em {
          font-style: italic;
        }

        .markdown-content a {
          color: var(--brand-accent);
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.2s ease;
        }

        .markdown-content a:hover {
          border-bottom-color: var(--brand-accent);
        }

        .markdown-content ul,
        .markdown-content ol {
          margin-top: 0.875em;
          margin-bottom: 0.875em;
          padding-left: 1.5em;
        }

        .markdown-content li {
          margin-top: 0.375em;
          margin-bottom: 0.375em;
        }

        .markdown-content li::marker {
          color: var(--brand-accent);
        }

        .markdown-content blockquote {
          margin: 1.25em 0;
          padding-left: 1em;
          border-left: 3px solid var(--brand-accent);
          color: var(--brand-text-secondary);
          font-style: italic;
        }

        .markdown-content code {
          background: rgba(255, 255, 255, 0.05);
          padding: 0.15em 0.4em;
          border-radius: 4px;
          font-size: 0.875em;
          font-family: "IBM Plex Mono", "Courier New", monospace;
          color: var(--brand-accent);
        }

        .markdown-content pre {
          background: rgba(0, 0, 0, 0.3);
          padding: 1em;
          border-radius: 8px;
          overflow-x: auto;
          margin: 1.25em 0;
        }

        .markdown-content pre code {
          background: none;
          padding: 0;
          color: inherit;
        }

        .markdown-content hr {
          border: none;
          border-top: 1px solid var(--brand-border);
          margin: 2em 0;
        }
      `}</style>
    </div>
  );
}

