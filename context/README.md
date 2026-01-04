# Contextes API - Documentation

Ce dossier contient tous les contextes React qui centralisent les appels API Supabase.

## Architecture

### `AuthContext.tsx`
Gère toutes les opérations d'authentification :
- `signIn(email, password)` - Connexion
- `signUp(email, password, metadata?)` - Inscription
- `signOut()` - Déconnexion
- `getUser()` - Récupération de l'utilisateur
- `updateUser(updates)` - Mise à jour utilisateur (mot de passe, métadonnées)

### `ProfileContext.tsx`
Gère toutes les opérations sur les profils :
- `fetchProfile(userId)` - Récupération d'un profil
- `updateProfile(userId, updates)` - Mise à jour d'un profil
- `upsertProfile(userId, profileData)` - Création/mise à jour d'un profil
- `refreshProfile()` - Rafraîchir le profil actuel

## Utilisation

### Dans une page

```tsx
"use client";

import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";

export default function MyPage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { profile, fetchProfile, loading: profileLoading } = useProfile();

  // Utiliser les fonctions...
}
```

### Exemple complet - Page avec authentification

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";

export default function ProtectedPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { profile, fetchProfile, loading: profileLoading } = useProfile();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user && !profile) {
      fetchProfile(user.id);
    }
  }, [user, authLoading, profile]);

  if (authLoading || profileLoading) {
    return <div>Chargement...</div>;
  }

  if (!user || !profile) {
    return null;
  }

  // Vérifier le rôle
  if (profile.role === "admin") {
    // Logique admin
  }

  return <div>Contenu de la page</div>;
}
```

## Migration des pages existantes

### Avant (appel direct à Supabase)
```tsx
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .single();
```

### Après (utilisation du contexte)
```tsx
const { user } = useAuth();
const { profile, fetchProfile } = useProfile();

useEffect(() => {
  if (user) {
    fetchProfile(user.id);
  }
}, [user]);
```

## Avantages

1. **Centralisation** : Tous les appels API sont au même endroit
2. **Réutilisabilité** : Pas besoin de réécrire le même code dans chaque page
3. **État global** : L'utilisateur et le profil sont disponibles partout
4. **Maintenance** : Facile de modifier la logique d'authentification
5. **Performance** : Évite les appels API redondants

## Notes importantes

- Les contextes sont déjà intégrés dans `app/layout.tsx`
- L'utilisateur est automatiquement synchronisé avec Supabase
- Le profil se charge automatiquement quand l'utilisateur change
- Toutes les pages peuvent utiliser `useAuth()` et `useProfile()`

