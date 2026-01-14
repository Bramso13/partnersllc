import type { User as SupabaseUser } from "@supabase/supabase-js";

export type User = SupabaseUser;

export type UserRole = "CLIENT" | "AGENT" | "ADMIN";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: User;
}

export interface AuthError {
  message: string;
  status?: number;
}
