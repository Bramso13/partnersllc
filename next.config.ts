import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    // Supprime console.log, console.info, console.debug en production (ex: Vercel).
    // On garde console.error et console.warn pour le diagnostic en prod.
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
};

export default nextConfig;
