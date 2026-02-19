"use client";

import Link from "next/link";
import type { HubMemberProfilePublic } from "@/types/hub-profile";

interface Props {
  profile: HubMemberProfilePublic;
  isOwner: boolean;
}

export function HubMemberProfileView({ profile, isOwner }: Props) {
  const name = profile.display_name || "Membre";
  const country = profile.country ? profile.country.toUpperCase() : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header card */}
      <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex-shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-2 ring-border"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-brand-accent/20 flex items-center justify-center">
                <span className="text-3xl sm:text-4xl text-brand-accent font-semibold">
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {name}
              </h1>
              {profile.is_llc_client && (
                <span className="px-2 py-0.5 text-xs font-medium bg-brand-accent/20 text-brand-accent rounded-full">
                  Client LLC
                </span>
              )}
            </div>
            {profile.profession && (
              <p className="text-brand-text-secondary font-medium mb-1">
                {profile.profession}
              </p>
            )}
            {country && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <i className="fa-solid fa-location-dot" />
                {country}
              </p>
            )}
            <div className="flex flex-wrap gap-3 mt-4">
              {isOwner && (
                <Link
                  href="/hub/profile/edit"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                >
                  <i className="fa-solid fa-pen" />
                  Modifier mon profil
                </Link>
              )}
              <button
                type="button"
                disabled
                title="Bientôt disponible"
                className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg cursor-not-allowed text-sm font-medium"
              >
                <i className="fa-solid fa-envelope" />
                Envoyer un message
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <section className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            À propos
          </h2>
          <p className="text-foreground/90 whitespace-pre-wrap">{profile.bio}</p>
        </section>
      )}

      {/* Expertise */}
      {profile.expertise_tags?.length > 0 && (
        <section className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Expertises
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.expertise_tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-brand-accent/10 text-brand-accent rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Langues */}
      {profile.languages?.length > 0 && (
        <section className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Langues
          </h2>
          <ul className="space-y-2">
            {profile.languages.map((lang, i) => (
              <li
                key={`${lang.code}-${i}`}
                className="flex items-center gap-2 text-foreground/90"
              >
                <span className="font-medium uppercase text-sm">{lang.code}</span>
                <span className="text-muted-foreground">—</span>
                <span>{lang.level}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Années d'expérience */}
      {profile.years_experience != null && (
        <section className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            Années d&apos;expérience
          </h2>
          <p className="text-foreground/90">
            {profile.years_experience} an
            {profile.years_experience > 1 ? "s" : ""} d&apos;expérience
          </p>
        </section>
      )}

      {/* Liens */}
      {(profile.website || profile.linkedin_url || profile.twitter_handle) && (
        <section className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-3">Liens</h2>
          <div className="flex flex-wrap gap-4">
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-brand-accent hover:underline"
              >
                <i className="fa-solid fa-globe" />
                Site web
              </a>
            )}
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-brand-accent hover:underline"
              >
                <i className="fa-brands fa-linkedin" />
                LinkedIn
              </a>
            )}
            {profile.twitter_handle && (
              <a
                href={`https://twitter.com/${profile.twitter_handle.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-brand-accent hover:underline"
              >
                <i className="fa-brands fa-x-twitter" />
                @{profile.twitter_handle.replace(/^@/, "")}
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
