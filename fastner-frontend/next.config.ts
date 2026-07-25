import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit .next/standalone — a self-contained server bundle with only the
  // runtime files it actually needs. Keeps the Cloud Run image small and lets
  // the container start without installing node_modules.
  output: "standalone",
};

export default nextConfig;
