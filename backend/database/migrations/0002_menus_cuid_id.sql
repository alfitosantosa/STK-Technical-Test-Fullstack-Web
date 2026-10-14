-- id pindah dari BIGSERIAL ke CUID2 (TEXT): sekarang id dibuat aplikasi
-- (cuid2.Generate()), jadi kolom id dan parent_id harus TEXT. Tabel lama dibuang
-- karena data contohnya tidak punya id CUID2; isi ulang pakai seed/push.py.
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

-- Penunjang saat menampilkan submenu sebuah menu (sudah urut tampilannya).
CREATE INDEX IF NOT EXISTS menus_parent_id_position_idx ON menus (parent_id, position);
