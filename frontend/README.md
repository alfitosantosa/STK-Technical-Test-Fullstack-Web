# Menu Management (Frontend)

Frontend untuk technical test: pengelolaan menu bertingkat. Dibuat dengan
Next.js, TanStack Query, Zustand, Zod, dan shadcn/ui.

## Fitur

- Menampilkan menu bertingkat (parent - child) dengan expand/collapse per node.
- Memilih node untuk melihat detailnya, dan mengubah datanya lewat form.
- Menambah menu baru di level mana pun (induknya dipilih lewat dropdown).
- Menghapus menu dengan dialog konfirmasi (perubahan bersifat cascade, submenu ikut terhapus).
- **Drag and drop** untuk mengurutkan ulang dalam satu level maupun memindahkan menu ke induk lain.
- Pencarian nama menu; hasilnya otomatis dibuka dan induknya tetap ditampilkan.
- Tombol Expand All / Collapse All, dan pemilih menu teratas.
- Loading state (skeleton), error state dengan tombol "Coba lagi", serta notifikasi untuk setiap aksi.
- Responsive: di layar besar panel detail ada di kanan, di layar kecil menempel di bawah dan sidebar berubah menjadi panel geser.

## Teknologi

| Bagian | Pilihan | Alasan |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) + React 19 | Diminta di brief |
| Bahasa | TypeScript (strict) | Diminta di brief |
| Data server | TanStack Query v5 | Cache, refetch, dan status loading/error otomatis |
| State UI | Zustand | Ringan, hanya untuk state yang benar-benar milik UI |
| Form + validasi | react-hook-form + Zod | Validasi ditulis sekali di schema, dipakai form dan bisa dibaca ulang |
| Komponen UI | shadcn/ui (base-ui) | Komponen siap pakai, bisa diubah langsung di repo |
| Gaya | Tailwind CSS 4 | Diminta di brief |
| Drag and drop | dnd-kit | Standar untuk React, mendukung keyboard |

## Struktur folder

```
frontend/
├── app/
│   ├── layout.tsx            kerangka halaman: provider, sidebar, header
│   ├── providers.tsx         QueryClientProvider + Toaster
│   ├── page.tsx              halaman Menus
│   └── globals.css           tema warna (sidebar biru, aksen biru)
├── components/
│   ├── app-sidebar.tsx       sidebar, isinya diambil dari API
│   ├── menu/
│   │   ├── menu-page.tsx         penyusun halaman (tree + panel detail)
│   │   ├── menu-toolbar.tsx      judul, pemilih menu teratas, expand/collapse, pencarian, tambah
│   │   ├── menu-tree.tsx         tree + logika drag and drop
│   │   ├── menu-detail-form.tsx  form detail/tambah menu
│   │   └── delete-menu-dialog.tsx dialog konfirmasi hapus
│   └── ui/                   komponen shadcn (jangan diubah manual kecuali perlu)
├── lib/
│   ├── api.ts                satu-satunya tempat yang tahu alamat dan bentuk request API
│   ├── queries.ts            query key, hook useMenuTree, dan semua mutation
│   ├── schemas.ts            schema Zod untuk form
│   ├── tree.ts               fungsi murni pengolahan menu bersarang
│   ├── tree.test.ts          unit test untuk lib/tree.ts
│   └── types.ts              tipe yang dipakai bersama
├── stores/menu-store.ts      state UI (node terpilih, node terbuka, pencarian, mode form)
├── hooks/use-mobile.ts       deteksi layar kecil
└── vitest.config.mts         konfigurasi unit test
```

## Cara menjalankan

Prasyarat: Bun (atau Node.js 20+) dan backend sudah jalan.

```bash
cd frontend

# 1. Konfigurasi
cp .env.example .env.local
# pastikan NEXT_PUBLIC_API_URL sama dengan PORT di backend/.env

# 2. Dependency (kalau belum)
bun install

# 3. Development
bun dev
```

Buka `http://localhost:3000`. Backend harus jalan di alamat yang sama dengan
`NEXT_PUBLIC_API_URL` (default `http://localhost:4000`).

Cara menjalankan seluruh aplikasi (frontend + backend + database) lewat Docker ada di
[README root](../README.md#menjalankan-dengan-docker).

### Build produksi

```bash
bun run build
bun start
```

### Pemeriksaan kode

```bash
bun run lint        # eslint
bunx tsc --noEmit   # typecheck
bun run test        # unit test (vitest), menguji logika di lib/tree.ts
bun run build       # build produksi
```

| Environment variable | Wajib | Keterangan |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | tidak | Alamat backend. Kalau kosong dipakai `http://localhost:8080` |

## Pembagian tanggung jawab state

Ini bagian yang paling menentukan mudah-tidaknya kode dirawat:

| Lapisan | Isi | Contoh |
| --- | --- | --- |
| TanStack Query | Semua data dari server | daftar menu, hasil create/update/delete/move |
| Zustand | Semua state UI | node terpilih, node yang terbuka, kata kunci pencarian, mode form |
| Zod | Aturan validasi input | nama 3-100 karakter, url maksimal 255 karakter |
| react-hook-form | Nilai form dan error per field | dipakai lewat komponen `Field` dari shadcn |

Data menu **tidak pernah** disimpan di Zustand. Kalau sebuah nilai bisa dihitung
ulang dari data server, nilai itu tidak disimpan di mana pun.

## Catatan perilaku

- **Drag and drop** memakai dua area drop per baris: garis tipis di atas baris
  (menyisipkan tepat di atas menu itu) dan badan baris (menjadi submenu dari
  menu itu, urutannya paling akhir). Menu tidak bisa dipindah ke dalam
  submenu-nya sendiri; percobaan seperti itu ditolak dengan pesan, dan server
  juga menolaknya.
- **Memindahkan menu ke urutan paling akhir** dilakukan dengan melepasnya ke
  badan baris induknya, karena tidak ada garis drop setelah menu terakhir.
- **Pemilih "Menu"** di toolbar menentukan menu teratas yang ditampilkan. Karena
  itu, memindahkan menu antar menu teratas dilakukan dengan mengubah pilihannya,
  bukan dengan drag antar root.
- **Pencarian** mencari di dalam menu teratas yang sedang ditampilkan. Node yang
  cocok ditampilkan bersama seluruh induknya supaya hierarkinya tidak terputus.
- **Form memakai perilaku PUT**: field yang dikirim selalu dianggap nilai final.
  `parent_id` hanya bisa diubah lewat drag and drop, bukan lewat form, supaya
  pemindahan selalu melewati pengecekan lingkaran.
- Endpoint `PATCH /api/menus/:id/move` dipakai untuk drag and drop. Backend harus
  versi terbaru, kalau tidak drag and drop akan gagal dengan pesan error.

## Kalau ada masalah

| Gejala | Penyebab dan penanganan |
| --- | --- |
| Halaman menampilkan "Tidak bisa menghubungi server ..." | Backend belum jalan, atau `NEXT_PUBLIC_API_URL` tidak cocok dengan `PORT` di `backend/.env` |
| Drag and drop gagal (`404`) | Backend yang jalan masih versi lama; jalankan ulang `go run .` di folder `backend` |
| Port 3000 dipakai proses lain | `bun dev --port 3001` |
