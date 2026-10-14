import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next memblokir permintaan cross-origin ke sumber daya dev (HMR). Kalau
  // dev server dibuka lewat IP/domain selain localhost, host itu harus
  // didaftarkan di sini, tanpa skema dan tanpa port. Hanya berlaku di dev.
  allowedDevOrigins: (process.env.ALLOWED_DEV_ORIGINS ?? "")
    .split(",")
    .filter(Boolean),
  cacheComponents: true,
  partialPrefetching: true,
  // Buat Dockerfile produksi (runtime-nya di .next/standalone, image lebih kecil).
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
