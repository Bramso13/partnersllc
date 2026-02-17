"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

type SendResult =
  | { success: true; messageId: string; accepted: string[]; rejected: string[] }
  | { success: false; error: string };

type TransportKind = "resend" | "smtp";

type TestEmailTabProps = {
  /** Email de test prérempli depuis la config (optionnel) */
  defaultTo?: string;
  /** Transport à utiliser : Resend ou Nodemailer (SMTP) */
  transport: TransportKind;
};

const DEFAULT_HTML = `<p>Ceci est un <strong>email de test</strong> envoyé depuis l'onglet Test admin.</p>
<p>Si vous recevez ce message, l'envoi via Resend (ou SMTP) fonctionne correctement.</p>
<p><em>Partners LLC</em></p>`;

const DEFAULT_SUBJECT = "Test email — Partners LLC";

const TITLES: Record<TransportKind, { title: string; description: string }> = {
  resend: {
    title: "Test d'envoi d'email (Resend)",
    description:
      "Envoi via Resend — nécessite RESEND_API_KEY. Utilise lib/notifications/email.ts avec transport Resend.",
  },
  smtp: {
    title: "Test d'envoi d'email (Nodemailer / SMTP)",
    description:
      "Envoi via Nodemailer (SMTP) — utilise SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD. Utilise lib/notifications/email.ts avec transport SMTP.",
  },
};

export function TestEmailTab({ defaultTo = "", transport }: TestEmailTabProps) {
  const { title, description } = TITLES[transport];
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [text, setText] = useState("");
  const [from, setFrom] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);

  const handleSend = useCallback(async () => {
    const trimmedTo = to.trim();
    if (!trimmedTo) {
      toast.error("Indiquez l'adresse destinataire");
      return;
    }
    if (!subject.trim()) {
      toast.error("Indiquez le sujet");
      return;
    }
    if (!html.trim()) {
      toast.error("Indiquez le contenu HTML");
      return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/test/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: trimmedTo,
          subject: subject.trim(),
          html: html.trim(),
          text: text.trim() || undefined,
          from: from.trim() || undefined,
          replyTo: replyTo.trim() || undefined,
          transport,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({
          success: false,
          error: data?.error ?? `Erreur ${res.status}`,
        });
        toast.error(data?.error ?? "Échec de l'envoi");
        return;
      }

      setResult({
        success: true,
        messageId: data.messageId ?? "",
        accepted: data.accepted ?? [trimmedTo],
        rejected: data.rejected ?? [],
      });
      toast.success("Email envoyé");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur réseau";
      setResult({ success: false, error: message });
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [to, subject, html, text, from, replyTo, transport]);

  const fillTestContent = useCallback(() => {
    setSubject(DEFAULT_SUBJECT);
    setHtml(DEFAULT_HTML);
    setText("");
  }, []);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#f9f9f9] mb-1">{title}</h2>
        <p className="text-sm text-[#b7b7b7]">{description}</p>
      </div>

      <div className="space-y-4 rounded-xl border border-[#363636] bg-[#252628] p-5">
        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-[#b7b7b7]">
            Destinataire <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="destinataire@example.com"
            className="w-full rounded-lg border border-[#363636] bg-[#2d3033] px-3 py-2 text-sm text-[#f9f9f9] placeholder-[#666] focus:border-[#7c6af7] focus:outline-none"
          />
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-[#b7b7b7]">
            Sujet <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Sujet de l'email"
            className="w-full rounded-lg border border-[#363636] bg-[#2d3033] px-3 py-2 text-sm text-[#f9f9f9] placeholder-[#666] focus:border-[#7c6af7] focus:outline-none"
          />
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-[#b7b7b7]">
            Corps HTML <span className="text-red-400">*</span>
          </label>
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            placeholder="<p>Contenu HTML</p>"
            rows={6}
            className="w-full rounded-lg border border-[#363636] bg-[#2d3033] px-3 py-2 font-mono text-sm text-[#f9f9f9] placeholder-[#666] focus:border-[#7c6af7] focus:outline-none"
          />
        </div>

        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-[#b7b7b7]">
            Texte brut{" "}
            <span className="text-xs text-[#666]">
              (optionnel, sinon dérivé du HTML)
            </span>
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Version texte brut"
            rows={2}
            className="w-full rounded-lg border border-[#363636] bg-[#2d3033] px-3 py-2 text-sm text-[#f9f9f9] placeholder-[#666] focus:border-[#7c6af7] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-[#b7b7b7]">
              From (optionnel)
            </label>
            <input
              type="email"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="contact@partnersllc.fr"
              className="w-full rounded-lg border border-[#363636] bg-[#2d3033] px-3 py-2 text-sm text-[#f9f9f9] placeholder-[#666] focus:border-[#7c6af7] focus:outline-none"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-[#b7b7b7]">
              Reply-To (optionnel)
            </label>
            <input
              type="email"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              placeholder="support@partnersllc.com"
              className="w-full rounded-lg border border-[#363636] bg-[#2d3033] px-3 py-2 text-sm text-[#f9f9f9] placeholder-[#666] focus:border-[#7c6af7] focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#7c6af7] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#6b5ad6] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" />
                Envoi…
              </>
            ) : (
              <>
                <i className="fa-solid fa-paper-plane" />
                Envoyer l’email
              </>
            )}
          </button>
          <button
            type="button"
            onClick={fillTestContent}
            className="inline-flex items-center gap-2 rounded-lg border border-[#363636] bg-[#2d3033] px-4 py-2.5 text-sm font-medium text-[#b7b7b7] transition hover:bg-[#363636] hover:text-[#f9f9f9]"
          >
            <i className="fa-solid fa-rotate-left" />
            Contenu de test
          </button>
        </div>
      </div>

      {result && (
        <div
          className={`rounded-xl border p-4 ${
            result.success
              ? "border-emerald-600/50 bg-emerald-950/30"
              : "border-red-600/50 bg-red-950/20"
          }`}
        >
          <h3 className="text-sm font-semibold text-[#f9f9f9] mb-2">
            {result.success ? "Résultat" : "Erreur"}
          </h3>
          {result.success ? (
            <pre className="text-xs text-[#b7b7b7] overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(
                {
                  messageId: result.messageId,
                  accepted: result.accepted,
                  rejected: result.rejected,
                },
                null,
                2
              )}
            </pre>
          ) : (
            <p className="text-sm text-red-300">{result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
