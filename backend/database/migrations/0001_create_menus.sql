-- Hierarki lewat parent_id: NULL = menu paling atas, terisi = submenu.
-- ON DELETE CASCADE: hapus satu menu otomatis menghapus semua submenu di bawahnya,
-- jadi tidak ada submenu yang menggantung tanpa induk.
CREATE TABLE IF NOT EXISTS menus (
    id         BIGSERIAL PRIMARY KEY,
    parent_id  BIGINT REFERENCES menus (id) ON DELETE CASCADE,
    name       VARCHAR(100) NOT NULL,
    url        VARCHAR(255) NOT NULL DEFAULT '',
    position   INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Penunjang saat menampilkan submenu sebuah menu (sudah urut tampilannya).
CREATE INDEX IF NOT EXISTS menus_parent_id_position_idx ON menus (parent_id, position);
