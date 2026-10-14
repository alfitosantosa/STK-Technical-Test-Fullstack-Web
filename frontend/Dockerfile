# Image produksi untuk frontend.
# Tiga tahap: pasang dependency, build, lalu jalankan hasil build saja.

# ---------- Tahap 1: dependency ----------
FROM oven/bun:1.4.3-alpine AS dependencies

WORKDIR /app

# Hanya berkas dependency yang disalin, supaya layer ini tetap terpakai ulang
# walau kode berubah.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---------- Tahap 2: build ----------
FROM oven/bun:1.4.3-alpine AS builder

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Alamat API diberikan saat build, karena nilai NEXT_PUBLIC_* ditanam ke berkas
# JavaScript yang dikirim ke browser.
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN bun run build

# ---------- Tahap 3: runtime ----------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -S nextjs

# `output: "standalone"` di next.config.ts membuat Next hanya mengeluarkan
# berkas yang benar-benar dipakai saat produksi.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
