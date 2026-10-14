# Technical Test - Fullstack Menu Management

Aplikasi pengelolaan menu bertingkat (parent - child) dengan REST API dan antarmuka web.
Menu bisa ditambah, diubah, dihapus, dan dipindahkan antar level lewat drag and drop.

Repo ini berisi dua aplikasi:

| Folder | Isi | Dokumentasi |
| --- | --- | --- |
| `backend/` | REST API, Go + Fiber v3 + GORM + PostgreSQL | [backend/README.md](backend/README.md) |
| `frontend/` | Antarmuka web, Next.js + TanStack Query + Zustand + shadcn/ui | [frontend/README.md](frontend/README.md) |

## Fitur

**Menu (CRUD + hierarki)**

- Menampilkan menu bertingkat dengan expand/collapse per node.
- Menambah menu di level mana pun (induk dipilih dari dropdown).
- Mengubah nama dan URL menu lewat form dengan validasi.
- Menghapus menu dengan konfirmasi; submenu di bawahnya ikut terhapus (cascade).
- Mencari menu berdasarkan nama, tanpa memutus hierarkinya.

**Drag and drop**

- Mengurutkan ulang menu dalam satu level.
- Memindahkan menu ke induk lain, termasuk ke level paling atas.
- Menu tidak bisa dipindahkan ke dalam submenu-nya sendiri (dicek di frontend dan backend).

**Lain-lain**

- Dokumentasi API (OpenAPI 3) dengan Swagger UI di `/docs`.
- Loading state, error state dengan tombol coba lagi, dan notifikasi untuk setiap aksi.
- Responsive: di layar kecil panel detail menempel di bawah dan sidebar menjadi panel geser.

## Tangkapan layar

| Halaman menu (desktop, 1440x900) | Panel detail (mobile, 390x844) | Sidebar (mobile) |
| --- | --- | --- |
| ![Halaman menu di desktop](docs/screenshots/desktop.png) | ![Tree dan panel detail di mobile](docs/screenshots/mobile-detail.png) | ![Sidebar sebagai panel geser di mobile](docs/screenshots/mobile-sidebar.png) |

## Menjalankan

Prasyarat: Go 1.27+, Bun (atau Node.js 20+), dan database PostgreSQL.

```bash
# 1. Backend
cd backend
cp .env.example .env      # isi DATABASE_URL dengan koneksi PostgreSQL
go run .
# migration jalan otomatis saat server start
# Swagger UI: http://localhost:4000/docs

# 2. Frontend (terminal terpisah)
cd frontend
cp .env.example .env.local   # NEXT_PUBLIC_API_URL harus sama dengan PORT di backend/.env
bun install
bun dev
# http://localhost:3000
```

Isi data contoh (opsional):

```bash
cd backend
python3 seed/push.py --url http://localhost:4000
python3 seed/push.py --url http://localhost:4000 --file menus-mockup.json
```

## Menjalankan dengan Docker

### Development (hot reload kedua aplikasi)

```bash
docker compose up --build
```

Yang jalan di dalam stack ini:

| Service | Isi |
| --- | --- |
| `database` | PostgreSQL 18, datanya disimpan di volume `database-data` |
| `backend` | Go + air; folder `backend/` di-mount, server restart otomatis saat berkas `.go` berubah |
| `frontend` | Next.js dev; folder `frontend/` di-mount, halaman dimuat ulang saat berkas berubah |

Frontend: http://localhost:3000 · Backend: http://localhost:4000 · PostgreSQL: `localhost:5432`

Nilai seperti nama/password database dan port di komputer bisa diubah lewat berkas
`.env` di folder ini (contohnya di `.env.example`). Port host perlu diubah kalau
sudah dipakai proses lain:

```bash
BACKEND_PORT=4001 FRONTEND_PORT=3100 NEXT_PUBLIC_API_URL=http://localhost:4001 docker compose up -d
```

> Perintah di README ini memakai `docker compose` (plugin). Kalau CLI-mu belum
> mengenalinya, pakai `docker-compose` — perintahnya sama.

> **Hot reload di macOS.** Docker Desktop sudah meneruskan perubahan berkas dari
> komputer ke container. Kalau memakai **colima**, set `mountInotify: true` di
> `~/.colima/default/colima.yaml` lalu jalankan ulang colima; tanpanya perubahan
> berkas tidak terdeteksi di dalam container — hot reload frontend tidak jalan,
> sedangkan backend tetap jalan karena air memeriksa berkas secara berkala
> (`poll = true` di `backend/.air.toml`).

```bash
docker compose logs -f backend    # lihat log satu service
docker compose down               # hentikan (data database tetap ada)
docker compose down -v            # hentikan dan hapus data database
```

### Production (multi-stage build)

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Bedanya dengan mode development: image dibangun lewat `Dockerfile` (multi-stage),
frontend memakai output `standalone`, tidak ada source code yang di-mount, dan tidak
ada hot reload.

Dua hal yang perlu diketahui:

- **`NEXT_PUBLIC_API_URL` ditanam saat build**, karena nilainya dibaca browser. Kalau
  alamatnya berubah, image frontend harus dibangun ulang:
  `docker compose -f docker-compose.prod.yml build frontend`.
- **Data database ada di volume `database-data`.** `docker compose down -v` akan
  menghapusnya.

## Konfigurasi

Backend (`backend/.env`):

| Variable | Wajib | Default | Keterangan |
| --- | --- | --- | --- |
| `DATABASE_URL` | ya | - | Koneksi PostgreSQL |
| `PORT` | tidak | `3000` | Port HTTP server |

Frontend (`frontend/.env.local`):

| Variable | Wajib | Default | Keterangan |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | tidak | `http://localhost:8080` | Alamat backend |

## Ringkasan API

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET | `/health` | Status server |
| GET | `/api/menus` | Semua menu (datar) |
| GET | `/api/menus/tree` | Menu bersarang |
| POST | `/api/menus` | Tambah menu |
| GET | `/api/menus/:id` | Detail satu menu |
| PUT | `/api/menus/:id` | Ubah menu |
| DELETE | `/api/menus/:id` | Hapus menu beserta submenunya |
| PATCH | `/api/menus/:id/move` | Pindah induk / ubah urutan (dipakai drag and drop) |

Dokumentasi lengkap: `http://localhost:PORT/docs` (sumbernya `backend/api.docs.yml`).

## Struktur database

Satu tabel `menus` dengan relasi ke dirinya sendiri:

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | BIGSERIAL | Primary key |
| `parent_id` | BIGINT NULL | Induk menu; `NULL` berarti level paling atas |
| `name` | VARCHAR(100) | Nama menu |
| `url` | VARCHAR(255) | Tujuan menu |
| `position` | INTEGER | Urutan tampil di antara menu dengan induk yang sama |
| `created_at`, `updated_at` | TIMESTAMPTZ | Waktu dibuat dan diubah (UTC) |

Schema ditentukan oleh file di `backend/database/migrations/`, dijalankan otomatis
saat server start dan dicatat di tabel `schema_migrations`.

## Test

```bash
cd backend  && go test ./...     # logika penomoran posisi dan penyusunan tree
cd frontend && bun run test      # logika pengolahan menu bersarang (vitest)
```

Pemeriksaan lain di frontend: `bun run lint`, `bunx tsc --noEmit`, `bun run build`.

## Performa

Yang sudah dikerjakan (sengaja sederhana dan bisa ditelusuri):

| Bagian | Yang dilakukan |
| --- | --- |
| Database | Index `(parent_id, position)`, dipakai saat mengambil submenu dalam urutan tampil |
| Backend | Tree disusun dari **satu** query di Go, bukan satu query per node; pindah/urutkan ulang dikerjakan dalam satu transaksi |
| Frontend | Data menu di-cache TanStack Query (`staleTime` 30 detik); sidebar dan halaman memakai query key yang sama, jadi hanya ada satu request |
| Frontend | Pencarian disaring di memori (tanpa request tambahan), dan hasilnya dihitung ulang hanya saat tree atau kata kunci berubah |
| Frontend | React Compiler aktif (bawaan Next 16) sehingga komponen di-memoize otomatis |
| Build | Output `standalone` membuat image produksi hanya berisi berkas yang dipakai |

Yang belum dikerjakan: virtualisasi daftar menu. Baru perlu kalau jumlah menu dalam
satu tampilan mencapai ribuan, dan menambah kompleksitas untuk kasus yang sekarang
belum ada.

## Keputusan teknis

- **Layer backend**: `route` (HTTP) → `service` (aturan bisnis) → `repository` (query).
  Hanya `repository` yang menyentuh GORM.
- **Schema dari file SQL, bukan AutoMigrate.** GORM dipakai untuk query; struktur tabel
  ditentukan file migration supaya terlihat dan bisa direview.
- **Satu endpoint untuk pindah dan urutkan ulang** (`PATCH /api/menus/:id/move`).
  Keduanya operasi yang sama: menaruh satu menu di posisi tertentu di bawah induk tertentu.
- **Data server dan state UI dipisah tegas di frontend.** TanStack Query memegang semua
  data dari server, Zustand hanya memegang state tampilan (menu terpilih, node terbuka,
  kata kunci pencarian). Tidak ada data menu yang disimpan di Zustand.
- **Validasi ditulis sekali** sebagai schema Zod, lalu dipakai form lewat react-hook-form.

Penjelasan lebih panjang ada di README masing-masing folder.
