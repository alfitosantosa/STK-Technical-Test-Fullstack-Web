import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Konfigurasi test dipisah dari konfigurasi Next supaya test tetap ringan
// (tanpa DOM) dan hanya menguji logika murni di lib/.
export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    // Samakan alamat import "@/..." dengan yang dipakai aplikasi (tsconfig).
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
