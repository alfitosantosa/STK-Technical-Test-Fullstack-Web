import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: (process.env.ALLOWED_DEV_ORIGINS ?? "")
    .split(",")
    .filter(Boolean),
  cacheComponents: true,
  partialPrefetching: true,
  output: "standalone",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
