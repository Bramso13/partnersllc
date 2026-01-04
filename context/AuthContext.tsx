"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any; data: any }>;
  signUp: (email: string, password: string, metadata?: { full_name?: string; phone?: string }) => Promise<{ error: any; data: any }>;
  signOut: () => Promise<void>;
  getUser: () => Promise<User | null>;
  updateUser: (updates: { password?: string; data?: Record<string, any> }) => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Vérifier la session au chargement
    async function getSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }

    getSession();

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);


  const getUser = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
    return user;
  }, []);

  const updateUser = useCallback(async (updates: { password?: string; data?: Record<string, any> }) => {
    const result = await supabase.auth.updateUser(updates);
    if (result.data?.user) {
      setUser(result.data.user);
    }
    return { error: result.error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (result.data?.user) {
      setUser(result.data.user);
    }
    return result;
  }, []);

  const signUp = useCallback(async (email: string, password: string, metadata?: { full_name?: string; phone?: string }) => {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata || {},
        emailRedirectTo: undefined,
      },
    });
    if (result.data?.user) {
      setUser(result.data.user);
    }
    return result;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
  }, [router]);

  const value: AuthContextValue = useMemo(() => ({
    user,
    loading,
    signIn,
    signUp,
    signOut,
    getUser,
    updateUser,
  }), [user, loading, signIn, signUp, signOut, getUser, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return context;
}

