-- Migration 0002: id menu pindah dari BIGSERIAL ke CUID2 (TEXT).
--
-- Id menu sekarang dibuat oleh aplikasi (cuid2.Generate() di service), bukan
-- database. Karena itu kolom id dan parent_id harus bertipe TEXT, bukan angka.
-- Data menu yang lama (11 baris contoh) terhapus karena id-nya tidak bisa
-- dipakai lagi: id baru dibuat aplikasi, jadi baris lama tidak punya id CUID2.
-- Isi ulang datanya dengan `python3 seed/push.py --url http://localhost:8080`.
DROP TABLE IF EXISTS menus;

CREATE TABLE menus (
    id         TEXT PRIMARY KEY,
    parent_id  TEXT REFERENCES menus (id) ON DELETE CASCADE,
    name       VARCHAR(100) NOT NULL,
    url        VARCHAR(255) NOT NULL DEFAULT '',
    position   INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dipakai saat menampilkan submenu dari sebuah menu, sudah urut sesuai tampilannya.
CREATE INDEX IF NOT EXISTS menus_parent_id_position_idx ON menus (parent_id, position);
