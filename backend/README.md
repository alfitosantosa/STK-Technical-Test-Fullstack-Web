# Menu Management API (Backend)

Backend untuk technical test: pengelolaan menu bertingkat (parent - child) dengan
REST API. Dibuat dengan Go + Fiber v3 dan PostgreSQL.

## Teknologi

| Bagian | Pilihan |
| --- | --- |
| Bahasa | Go 1.27 |
| Web framework | [Fiber v3](https://docs.gofiber.io/) |
| Database | PostgreSQL |
| Query | GORM (`gorm.io/gorm` + `gorm.io/driver/postgres`) |
| Validasi | `go-playground/validator` lewat `fiber.Config.StructValidator` |
| Migration | File SQL di `database/migrations/`, dijalankan otomatis saat server start |
| Dokumentasi API | OpenAPI 3 di `api.docs.yml`, UI Swagger di `/docs` |

## Struktur folder

```
backend/
├── server.go                  entry point: menyusun dependency, validator, error handler
├── api.docs.yml               spec OpenAPI 3 (dipakai halaman /docs)
├── config/config.go           pembacaan environment variable
├── database/
│   ├── database.go            koneksi GORM + runner migration
│   └── migrations/            file SQL migration, urut berdasarkan nama
├── model/menu.go              struct Menu, MenuNode (response tree), MenuRequest (body)
├── repository/menu_repository.go   semua query ke tabel menus
├── service/menu_service.go         aturan bisnis: validasi induk, urutan, penyusunan tree
└── route/
    ├── route.go               registrasi route + helper error/ID
    ├── menu_route.go          handler endpoint menu
    └── docs_route.go          halaman /docs dan file spec /api.docs.yml
```

Alur request: `route` (HTTP) → `service` (aturan bisnis) → `repository` (SQL).
Handler tidak menulis query, dan repository tidak tahu soal HTTP.

## Cara menjalankan (development)

Prasyarat: Go 1.27+ dan database PostgreSQL yang bisa diakses.

```bash
cd backend

# 1. Siapkan konfigurasi
cp .env.example .env
# lalu isi DATABASE_URL di dalam .env

# 2. Unduh dependency
go mod download

# 3. Jalankan server (migration jalan otomatis)
go run .
```

Server jalan di `http://localhost:3000`. Dokumentasi API: `http://localhost:3000/docs`.

Cara menjalankan seluruh aplikasi (backend + frontend + database) lewat Docker ada di
[README root](../README.md#menjalankan-dengan-docker).

Cek cepat:

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

### Environment variable

| Nama | Wajib | Nilai default | Keterangan |
| --- | --- | --- | --- |
| `DATABASE_URL` | ya | - | Koneksi PostgreSQL, misalnya `postgresql://user:pass@host:5432/db?sslmode=require` |
| `PORT` | tidak | `3000` | Port HTTP server |

Nilai di `.env` hanya dipakai saat development. Di Docker/production, environment
variable diisi langsung dari luar. File `.env` tidak ikut di-commit (lihat `.gitignore`).

## Migration

Migration dijalankan otomatis setiap server start, jadi tidak ada langkah manual.

- File SQL ada di `database/migrations/` dan namanya diberi nomor: `0001_...`, `0002_...`.
  File dijalankan berurutan sesuai nama.
- File yang sudah jalan dicatat di tabel `schema_migrations`, jadi tidak dijalankan dua kali.
- Untuk perubahan berikutnya, tambahkan file baru (jangan ubah file yang sudah pernah
  dijalankan) supaya schema di semua environment tetap sama.

## Endpoint

| Method | Path | Keterangan |
| --- | --- | --- |
| GET | `/health` | Cek server hidup |
| GET | `/api/menus` | Semua menu, bentuk datar, urut per level lalu `position` |
| GET | `/api/menus/tree` | Menu bersarang (submenu ada di field `children`) |
| POST | `/api/menus` | Tambah menu |
| GET | `/api/menus/:id` | Ambil satu menu |
| PUT | `/api/menus/:id` | Ubah menu |
| PATCH | `/api/menus/:id/move` | Pindahkan menu antar induk atau urutkan ulang dalam satu level |
| DELETE | `/api/menus/:id` | Hapus menu beserta seluruh submenu di bawahnya |

Body untuk POST dan PUT:

```json
{
  "name": "Laporan Penjualan",
  "url": "/reports/sales",
  "parent_id": 1,
  "position": 0
}
```

Aturan body:

| Field | Aturan |
| --- | --- |
| `name` | wajib, 3 - 100 karakter |
| `url` | opsional, maksimal 255 karakter, boleh path relatif atau URL lengkap |
| `parent_id` | opsional. Kosong atau `null` berarti menu level paling atas |
| `position` | opsional, minimal 0. POST tanpa `position` menaruh menu di urutan paling akhir; PUT tanpa `position` mempertahankan urutan yang sekarang |

Semua menu yang dibuat bisa punya submenu, tidak ada batas kedalaman dari sisi API.

Body untuk PATCH `/api/menus/:id/move` hanya berisi tujuan pemindahan:

```json
{
  "parent_id": 1,
  "position": 0
}
```

`parent_id` null atau tidak dikirim berarti menu dipindah ke level paling atas.
`position` null atau tidak dikirim berarti menu ditaruh di urutan paling akhir pada
induk tujuan, sedangkan `position` 0..n menyisipkan menu di index tersebut
(0 = paling atas). Nilai `position` di luar jangkauan dijepit ke urutan akhir, bukan
dibalas error. Setelah pemindahan, posisi menu di induk lama dan induk baru selalu
dinomori rapat 0..n-1 tanpa bolong dan tanpa duplikat, semuanya dalam satu transaksi.
Endpoint ini mencakup dua kebutuhan sekaligus: mengurutkan ulang dalam satu level
(`parent_id` tetap) dan memindahkan menu antar induk (`parent_id` berubah).
Karena `parent_id` yang tidak dikirim berarti root, saat mengurutkan ulang di dalam
satu level frontend tetap harus mengirim `parent_id` induk yang sekarang.

### Contoh

```bash
# menu level atas
curl -X POST http://localhost:3000/api/menus \
  -H 'Content-Type: application/json' \
  -d '{"name":"Master Data","url":"/master"}'

# submenu dari menu dengan id 1
curl -X POST http://localhost:3000/api/menus \
  -H 'Content-Type: application/json' \
  -d '{"name":"Kategori","url":"/master/categories","parent_id":1}'

# menu bersarang
curl http://localhost:3000/api/menus/tree
```

### Format error

Error selalu dibalas dalam bentuk JSON:

```json
{ "error": "menu tidak ditemukan" }
```

Kalau body tidak lolos validasi, response berisi detail per field supaya frontend
bisa menandai input yang salah:

```json
{
  "error": "data yang dikirim tidak valid",
  "details": [{ "field": "name", "rule": "min" }]
}
```

| Status | Kapan muncul |
| --- | --- |
| 400 | Body tidak valid, `id` bukan angka positif, menu induk tidak ada, atau induk yang dipilih membuat lingkaran |
| 404 | Menu yang diminta tidak ada |
| 500 | Kesalahan di server (detail aslinya hanya dicatat di log, tidak dikirim ke klien) |

## Dokumentasi API

- Swagger UI: `http://localhost:3000/docs`
- File spec OpenAPI 3: `api.docs.yml`

Spec ditulis manual di satu file dan dibundel ke binary saat compile, jadi halaman
`/docs` tetap jalan tanpa perlu ikut menyalin file tambahan.

## Test

```bash
go test ./...
```

Unit test yang ada menguji penyusunan menu bersarang (`service/menu_service_test.go`)
tanpa perlu database.

## Data contoh

Ada dua berkas data contoh di `seed/`, dan `seed/push.py` mengirimnya ke API satu per satu:

| Berkas | Isi |
| --- | --- |
| `menus.json` | 14 menu contoh aplikasi (Dashboard, Master Data, Transaksi, ...) |
| `menus-mockup.json` | struktur menu yang dipakai pada mockup desain, berguna untuk demo tampilan |

```bash
python3 seed/push.py                                 # menus.json ke http://localhost:8080
python3 seed/push.py --url http://localhost:4000      # kalau server jalan di port lain
python3 seed/push.py --file menus-mockup.json         # pakai berkas data yang lain
```

Field `parent` diisi **nama** menu induk, bukan id, karena id baru diketahui setelah
induknya dibuat. Jadi urutan di dalam file harus induk dulu lalu anaknya, dan nama
menu tidak boleh kembar. Skrip hanya memakai Python standar, tidak ada dependency baru.

Data ini contoh saja. Kalau ingin mulai dari kosong lagi, hapus menunya lewat
`DELETE /api/menus/{id}` (atau lewat tombol Hapus di frontend).

## Catatan keputusan

- **Schema ada di file SQL, bukan AutoMigrate.** GORM dipakai untuk query, sedangkan
  struktur tabel ditentukan file di `database/migrations/`. Jadi struct di `model/`
  wajib disesuaikan kalau migration diubah.
- **Hapus menu bersifat cascade.** Foreign key memakai `ON DELETE CASCADE`, sehingga
  menghapus menu otomatis menghapus submenu di bawahnya. Frontend perlu menampilkan
  konfirmasi sebelum memanggil `DELETE`.
- **Lingkaran hierarki dicegah di service.** Saat memindahkan menu, service menelusuri
  ke atas dari calon induk dan menolak kalau menu yang diedit ada di rantai tersebut.
- **Timestamp memakai UTC** supaya format waktu pada response POST/PUT/GET konsisten.
- **Simple protocol aktif di koneksi database** karena satu file migration berisi lebih
  dari satu statement. Kalau nanti throughput jadi masalah, pisahkan koneksi migration
  dari koneksi aplikasi.
- **CORS masih terbuka untuk semua origin** supaya frontend bisa jalan di port berbeda
  saat development. Batasi `AllowOrigins` sebelum production.

## Rencana tahap berikutnya

1. Frontend Next.js: tampilan tree, tambah/edit/hapus, drag-and-drop, pencarian.
2. Docker Compose (development dengan hot reload) dan Dockerfile multi-stage (production).
3. README di root repo berisi panduan setup seluruh aplikasi.
