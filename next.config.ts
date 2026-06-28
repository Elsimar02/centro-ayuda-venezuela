import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 + Turbopack no está inlinando NEXT_PUBLIC_* vía DefinePlugin
  // automáticamente en este proyecto; forzamos el inline explícito aquí.
  env: {
    NEXT_PUBLIC_ALERTS_ENABLED: process.env.NEXT_PUBLIC_ALERTS_ENABLED,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "venezuelatebusca.com" },
      { protocol: "https", hostname: "*.venezuelatebusca.com" },
    ],
  },
};

export default nextConfig;
