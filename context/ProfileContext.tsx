"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "./AuthContext";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
};

type ProfileContextValue = {
  profile: Profile | null;
  loading: boolean;
  fetchProfile: (userId: string) => Promise<Profile | null>;
  updateProfile: (userId: string, updates: { full_name?: string }) => Promise<{ error: any }>;
  upsertProfile: (userId: string, profileData: { full_name: string; email: string; role: string }) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

type ProfileProviderProps = {
  children: ReactNode;
};

export function ProfileProvider({ children }: ProfileProviderProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Utiliser useAuth de manière sécurisée
  let user = null;
  try {
    const auth = useAuth();
    user = auth.user;
  } catch {
    // AuthProvider n'est pas encore monté, user reste null
  }

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // Si le profil n'existe pas (code 406 ou PGRST116), ce n'est pas une erreur critique
        // On log uniquement si c'est une vraie erreur (pas juste "not found")
        if (error.code !== 'PGRST116' && error.message !== 'JSON object requested, multiple (or no) rows returned') {
          console.error("Error fetching profile:", error);
        }
        setLoading(false);
        return null;
      }

      setProfile(data);
      setLoading(false);
      return data;
    } catch (error) {
      // Ne pas logger les erreurs de profil non trouvé comme des erreurs critiques
      if (error instanceof Error && !error.message.includes('not found') && !error.message.includes('PGRST116')) {
        console.error("Error fetching profile:", error);
      }
      setLoading(false);
      return null;
    }
  }, []);

  const updateProfile = useCallback(async (userId: string, updates: { full_name?: string }) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId);

      if (error) {
        setLoading(false);
        return { error };
      }

      // Mettre à jour le profil local
      if (profile) {
        setProfile({ ...profile, ...updates });
      }

      setLoading(false);
      return { error: null };
    } catch (error: any) {
      setLoading(false);
      return { error };
    }
  }, [profile]);

  const upsertProfile = useCallback(async (userId: string, profileData: { full_name: string; email: string; role: string }) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            ...profileData,
          },
          {
            onConflict: "id",
          }
        );

      if (error) {
        setLoading(false);
        return { error };
      }

      // Mettre à jour le profil local si c'est l'utilisateur actuel
      if (user && user.id === userId) {
        await fetchProfile(userId);
      }

      setLoading(false);
      return { error: null };
    } catch (error: any) {
      setLoading(false);
      return { error };
    }
  }, [user, fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  // Charger le profil quand l'utilisateur change
  useEffect(() => {
    if (user && !profile) {
      fetchProfile(user.id);
    } else if (!user) {
      setProfile(null);
    }
  }, [user, profile, fetchProfile]);

  const value: ProfileContextValue = useMemo(() => ({
    profile,
    loading,
    fetchProfile,
    updateProfile,
    upsertProfile,
    refreshProfile,
  }), [profile, loading, fetchProfile, updateProfile, upsertProfile, refreshProfile]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within <ProfileProvider>");
  }
  return context;
}

