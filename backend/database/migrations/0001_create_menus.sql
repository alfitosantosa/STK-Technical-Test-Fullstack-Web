-- Migration 0001: membuat tabel menu.
--
-- Hierarki menu disimpan lewat kolom parent_id:
--   parent_id NULL    -> menu paling atas (root)
--   parent_id terisi  -> submenu dari menu dengan id tersebut
--
-- ON DELETE CASCADE: menghapus satu menu otomatis menghapus semua submenu
-- di bawahnya, jadi tidak ada submenu yang menggantung tanpa induk.
CREATE TABLE IF NOT EXISTS menus (
    id         BIGSERIAL PRIMARY KEY,
    parent_id  BIGINT REFERENCES menus (id) ON DELETE CASCADE,
    name       VARCHAR(100) NOT NULL,
    url        VARCHAR(255) NOT NULL DEFAULT '',
    position   INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dipakai saat menampilkan submenu dari sebuah menu, sudah urut sesuai tampilannya.
CREATE INDEX IF NOT EXISTS menus_parent_id_position_idx ON menus (parent_id, position);
