"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { HubMemberProfilePublic } from "@/types/hub-profile";

const BIO_MAX = 1000;
const URL_REGEX = /^https?:\/\/.+/;

interface Props {
  profile: HubMemberProfilePublic;
  userId: string;
}

type LangEntry = { code: string; level: string };

export function EditProfileForm({ profile, userId }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [profession, setProfession] = useState(profile.profession ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [expertiseTags, setExpertiseTags] = useState<string[]>(
    profile.expertise_tags ?? []
  );
  const [tagInput, setTagInput] = useState("");
  const [languages, setLanguages] = useState<LangEntry[]>(
    (profile.languages ?? []).length > 0
      ? profile.languages.map((l) => ({ code: l.code, level: l.level }))
      : [{ code: "", level: "" }]
  );
  const [yearsExperience, setYearsExperience] = useState<string>(
    profile.years_experience != null ? String(profile.years_experience) : ""
  );
  const [website, setWebsite] = useState(profile.website ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url ?? "");
  const [twitterHandle, setTwitterHandle] = useState(
    profile.twitter_handle ?? ""
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addTag = useCallback(() => {
    const t = tagInput.trim();
    if (t && !expertiseTags.includes(t) && expertiseTags.length < 20) {
      setExpertiseTags((prev) => [...prev, t]);
      setTagInput("");
    }
  }, [tagInput, expertiseTags]);

  const removeTag = useCallback((tag: string) => {
    setExpertiseTags((prev) => prev.filter((x) => x !== tag));
  }, []);

  const addLanguage = useCallback(() => {
    setLanguages((prev) => [...prev, { code: "", level: "" }]);
  }, []);

  const updateLanguage = useCallback((i: number, field: "code" | "level", value: string) => {
    setLanguages((prev) =>
      prev.map((l, j) => (j === i ? { ...l, [field]: value } : l))
    );
  }, []);

  const removeLanguage = useCallback((i: number) => {
    setLanguages((prev) => prev.filter((_, j) => j !== i));
  }, []);

  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {};
    if (bio.length > BIO_MAX) e.bio = `Max ${BIO_MAX} caractères`;
    if (website && !URL_REGEX.test(website)) e.website = "URL invalide";
    if (linkedinUrl && !URL_REGEX.test(linkedinUrl))
      e.linkedin_url = "URL invalide";
    const y = parseInt(yearsExperience, 10);
    if (yearsExperience !== "" && (Number.isNaN(y) || y < 0))
      e.years_experience = "Entier positif ou vide";
    if (country && country.length !== 2) e.country = "2 lettres (ex: FR)";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [bio, website, linkedinUrl, yearsExperience, country]);

  const handleAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/hub/profile/upload-avatar", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur upload");
        setAvatarUrl(data.avatar_url ?? null);
        toast.success("Photo mise à jour");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur upload");
      } finally {
        setUploading(false);
        e.target.value = "";
      }
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;
      setSaving(true);
      try {
        const payload = {
          display_name: displayName.trim() || null,
          profession: profession.trim() || null,
          country: country.trim().toUpperCase().slice(0, 2) || null,
          bio: bio.trim() || null,
          expertise_tags: expertiseTags,
          languages: languages
            .filter((l) => l.code.trim())
            .map((l) => ({ code: l.code.trim(), level: l.level.trim() })),
          years_experience:
            yearsExperience === ""
              ? null
              : parseInt(yearsExperience, 10),
          website: website.trim() || null,
          linkedin_url: linkedinUrl.trim() || null,
          twitter_handle: twitterHandle.trim() || null,
        };
        const res = await fetch("/api/hub/profile/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur mise à jour");
        toast.success("Profil enregistré");
        router.push(`/hub/members/${userId}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erreur");
      } finally {
        setSaving(false);
      }
    },
    [
      validate,
      displayName,
      profession,
      country,
      bio,
      expertiseTags,
      languages,
      yearsExperience,
      website,
      linkedinUrl,
      twitterHandle,
      router,
      userId,
    ]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Infos de base */}
      <section className="bg-surface border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Infos de base
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Nom affiché
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={100}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Métier / Profession
            </label>
            <input
              type="text"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              maxLength={200}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Pays (code ISO 2 lettres)
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))}
              maxLength={2}
              placeholder="FR"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
            {errors.country && (
              <p className="text-sm text-red-500 mt-1">{errors.country}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Années d&apos;expérience
            </label>
            <input
              type="number"
              min={0}
              max={70}
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
            {errors.years_experience && (
              <p className="text-sm text-red-500 mt-1">
                {errors.years_experience}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Avatar */}
      <section className="bg-surface border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4">Avatar</h2>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover ring-2 ring-border"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent font-semibold text-xl">
                {displayName.charAt(0).toUpperCase() || "?"}
              </div>
            )}
          </div>
          <div>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg cursor-pointer text-sm font-medium">
              <i className="fa-solid fa-upload" />
              {uploading ? "Envoi…" : "Choisir une image"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG ou WebP. Min. 200×200 px, max 5 Mo.
            </p>
          </div>
        </div>
      </section>

      {/* Bio */}
      <section className="bg-surface border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4">Bio</h2>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={BIO_MAX}
          rows={4}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
        />
        <p className="text-sm text-muted-foreground mt-1">
          {bio.length}/{BIO_MAX}
        </p>
        {errors.bio && (
          <p className="text-sm text-red-500 mt-1">{errors.bio}</p>
        )}
      </section>

      {/* Expertise tags */}
      <section className="bg-surface border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Expertises (tags)
        </h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {expertiseTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-brand-accent/10 text-brand-accent rounded-full text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:opacity-70"
                aria-label={`Retirer ${tag}`}
              >
                <i className="fa-solid fa-times text-xs" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            placeholder="Ajouter un tag"
            maxLength={50}
            className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground"
          />
          <button
            type="button"
            onClick={addTag}
            disabled={expertiseTags.length >= 20}
            className="px-4 py-2 bg-muted rounded-lg text-sm font-medium"
          >
            Ajouter
          </button>
        </div>
      </section>

      {/* Langues */}
      <section className="bg-surface border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4">Langues</h2>
        <div className="space-y-3">
          {languages.map((lang, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={lang.code}
                onChange={(e) => updateLanguage(i, "code", e.target.value)}
                placeholder="Code (ex: fr)"
                maxLength={10}
                className="w-24 px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
              <input
                type="text"
                value={lang.level}
                onChange={(e) => updateLanguage(i, "level", e.target.value)}
                placeholder="Niveau (ex: natif)"
                maxLength={50}
                className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              />
              <button
                type="button"
                onClick={() => removeLanguage(i)}
                className="p-2 text-muted-foreground hover:text-foreground"
                aria-label="Retirer"
              >
                <i className="fa-solid fa-trash" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addLanguage}
          className="mt-2 text-sm text-brand-accent hover:underline"
        >
          + Ajouter une langue
        </button>
      </section>

      {/* Liens */}
      <section className="bg-surface border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4">Liens</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Site web
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
            {errors.website && (
              <p className="text-sm text-red-500 mt-1">{errors.website}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              LinkedIn
            </label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/..."
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
            {errors.linkedin_url && (
              <p className="text-sm text-red-500 mt-1">
                {errors.linkedin_url}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Twitter / X (sans @)
            </label>
            <input
              type="text"
              value={twitterHandle}
              onChange={(e) => setTwitterHandle(e.target.value)}
              placeholder="pseudo"
              maxLength={100}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-border rounded-lg font-medium text-foreground hover:bg-muted"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-brand-accent text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
