import { createClient, SupabaseClientOptions } from "@supabase/supabase-js";

// Récupérer les variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Vérifier que les variables sont définies
if (!supabaseUrl || !supabaseAnonKey) {
  // En mode build, on utilise des valeurs placeholder pour éviter l'erreur
  // En runtime, on devrait avoir les vraies valeurs
  if (typeof window === "undefined") {
    // Côté serveur (build) - utiliser des placeholders
    console.warn(
      "Supabase environment variables are missing. Using placeholders for build."
    );
  } else {
    // Côté client (runtime) - erreur si les variables ne sont pas définies
    console.error(
      "Supabase environment variables are missing! Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel."
    );
    console.error("Current URL:", supabaseUrl || "NOT SET");
    console.error("Current Key:", supabaseAnonKey ? "SET (hidden)" : "NOT SET");
  }
}

// Options de configuration pour le client Supabase
const options: SupabaseClientOptions<"public"> = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
  global: {
    headers: {
      "x-client-info": "partners-reactnext",
    },
  },
};

// Créer le client Supabase avec les vraies valeurs ou des placeholders pour le build
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder",
  options
);


