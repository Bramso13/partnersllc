"use client";

import { useState } from "react";
import { toast } from "sonner";

type ConfigTabProps = {
  email: string;
  phone: string;
  onSave: (email: string, phone: string) => void;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value: string): boolean {
  // Accept E.164 or national formats: starts with + or digit, min 7 chars
  return /^[+\d][\d\s\-().]{6,}$/.test(value.trim());
}

export function ConfigTab({ email, phone, onSave }: ConfigTabProps) {
  const [localEmail, setLocalEmail] = useState(email);
  const [localPhone, setLocalPhone] = useState(phone);

  const handleSave = () => {
    if (localEmail && !isValidEmail(localEmail)) {
      toast.error("Format email invalide");
      return;
    }
    if (localPhone && !isValidPhone(localPhone)) {
      toast.error("Format téléphone invalide (ex: +33612345678)");
      return;
    }
    onSave(localEmail.trim(), localPhone.trim());
    toast.success("Coordonnées de test enregistrées");
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#f9f9f9] mb-1">
          Coordonnées de test
        </h2>
        <p className="text-sm text-[#b7b7b7]">
          Ces coordonnées seront utilisées comme destinataires des emails et messages WhatsApp lors des tests. Conservées pour la durée de la session.
        </p>
      </div>

      <div className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#b7b7b7]">
            Email de test{" "}
            <span className="text-xs text-[#666]">(destinataire des emails)</span>
          </label>
          <input
            type="email"
            value={localEmail}
            onChange={(e) => setLocalEmail(e.target.value)}
            placeholder="test@example.com"
            className="w-full bg-[#2d3033] border border-[#363636] rounded-lg px-3 py-2 text-sm text-[#f9f9f9] placeholder-[#666] focus:outline-none focus:border-[#7c6af7]"
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#b7b7b7]">
            Numéro de test{" "}
            <span className="text-xs text-[#666]">(destinataire WhatsApp — format E.164 ex: +33612345678)</span>
          </label>
          <input
            type="tel"
            value={localPhone}
            onChange={(e) => setLocalPhone(e.target.value)}
            placeholder="+33612345678"
            className="w-full bg-[#2d3033] border border-[#363636] rounded-lg px-3 py-2 text-sm text-[#f9f9f9] placeholder-[#666] focus:outline-none focus:border-[#7c6af7]"
          />
        </div>
      </div>

      {/* Status display */}
      {(email || phone) && (
        <div className="rounded-lg bg-[#252628] border border-[#363636] px-4 py-3 space-y-1">
          <p className="text-xs font-medium text-[#b7b7b7] uppercase tracking-wider">
            Coordonnées actuellement en session
          </p>
          {email && (
            <p className="text-sm text-[#f9f9f9]">
              <i className="fa-solid fa-envelope text-[#7c6af7] mr-2" />
              {email}
            </p>
          )}
          {phone && (
            <p className="text-sm text-[#f9f9f9]">
              <i className="fa-brands fa-whatsapp text-[#7c6af7] mr-2" />
              {phone}
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#7c6af7]/15 text-[#7c6af7] border border-[#7c6af7]/30 hover:bg-[#7c6af7]/25 transition-colors text-sm font-medium"
      >
        <i className="fa-solid fa-floppy-disk" />
        Enregistrer
      </button>
    </div>
  );
}
