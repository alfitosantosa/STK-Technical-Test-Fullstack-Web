# Image produksi untuk backend.
# Dua tahap: tahap pertama meng-compile binary, tahap kedua hanya membawa
# binary-nya. Hasilnya image kecil dan tidak berisi source code atau toolchain.

# ---------- Tahap 1: build ----------
FROM golang:1.27-alpine AS builder

WORKDIR /app

# Dependency disalin lebih dulu supaya layer `go mod download` tetap terpakai
# ulang walau file kode berubah.
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# CGO dimatikan supaya binary bisa jalan di image minimal tanpa libc.
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /server .

# ---------- Tahap 2: runtime ----------
FROM alpine:3.22

# ca-certificates wajib ada untuk koneksi TLS ke database (misalnya Neon).
RUN apk add --no-cache ca-certificates tzdata \
    && adduser -D -u 10001 appuser

USER appuser

COPY --from=builder /server /server

# Port yang dipakai server. Bisa diubah lewat environment variable PORT.
EXPOSE 4000

CMD ["/server"]
