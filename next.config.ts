import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongodb", "sharp"],
  experimental: {
    // Next 16 proxy buffers request bodies; raise so capture uploads aren't truncated.
    proxyClientMaxBodySize: "12mb",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "*.blob.vercel-storage.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;

// Enables CF bindings during `next dev`. Safe for standard `next build` / Node start.
initOpenNextCloudflareForDev();
