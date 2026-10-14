package model

import "time"

// Menu adalah satu item menu.
//
// Struktur kolomnya ada di database/migrations/0002_menus_cuid_id.sql.
// File migration itu sumber kebenaran schema, jadi kalau struct ini diubah,
// migration-nya wajib ikut diubah.
type Menu struct {
	// ID adalah CUID2 (24 karakter) yang dibuat aplikasi saat Create,
	// bukan angka yang dihasilkan database.
	ID string `gorm:"column:id;primaryKey" json:"id"`

	// ParentID bernilai NULL kalau menu ini ada di level paling atas.
	ParentID *string `gorm:"column:parent_id" json:"parent_id"`

	Name      string    `gorm:"column:name" json:"name"`
	URL       string    `gorm:"column:url" json:"url"`
	Position  int       `gorm:"column:position" json:"position"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at" json:"updated_at"`
}

// TableName memastikan GORM memakai tabel "menus", bukan "menus" hasil tebakan jamak.
func (Menu) TableName() string {
	return "menus"
}

// MenuNode adalah menu beserta submenu di bawahnya.
// Dipakai sebagai bentuk response GET /api/menus/tree.
type MenuNode struct {
	Menu
	Children []*MenuNode `json:"children"`
}

// MenuRequest adalah body request untuk POST dan PUT /api/menus.
//
// Semua field diisi sebagai nilai final (perilaku PUT), dengan dua pengecualian
// yang dijelaskan di service:
//   - ParentID nil  -> menu ditaruh di level paling atas.
//   - Position nil  -> POST menaruh menu di urutan paling akhir,
//     PUT mempertahankan urutan yang sekarang.
type MenuRequest struct {
	Name     string  `json:"name" validate:"required,min=3,max=100"`
	URL      string  `json:"url" validate:"omitempty,max=255"`
	ParentID *string `json:"parent_id"`
	Position *int    `json:"position" validate:"omitempty,gte=0"`
}

// MoveMenuRequest adalah body request untuk PATCH /api/menus/:id/move.
//
// Hanya urutan dan induk yang diubah, jadi name dan url tidak ikut dikirim.
// ParentID nil berarti menu dipindah ke level paling atas, Position nil berarti
// menu ditaruh di urutan paling akhir pada induk tujuan.
type MoveMenuRequest struct {
	ParentID *string `json:"parent_id"`
	Position *int    `json:"position" validate:"omitempty,gte=0"`
}
