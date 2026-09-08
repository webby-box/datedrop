import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const pages = process.env.GITHUB_PAGES === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/datedrop";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mongodb", "sharp"],
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  experimental: {
    // Next 16 proxy buffers request bodies; raise so capture uploads aren't truncated.
    proxyClientMaxBodySize: "12mb",
  },
  images: {
    unoptimized: pages,
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "*.blob.vercel-storage.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  ...(pages
    ? {
        output: "export" as const,
        trailingSlash: true,
        basePath,
        assetPrefix: basePath,
      }
    : {}),
};

export default nextConfig;

if (!pages) {
  initOpenNextCloudflareForDev();
}
