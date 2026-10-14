package model

import "time"

// Kolomnya ditentukan database/migrations/0002_menus_cuid_id.sql. Ubah struct
// ini berarti migration-nya juga harus diubah.
type Menu struct {
	// CUID2 (24 karakter) yang dibuat aplikasi, bukan auto-increment database.
	ID string `gorm:"column:id;primaryKey" json:"id"`

	// NULL berarti menu level paling atas.
	ParentID *string `gorm:"column:parent_id" json:"parent_id"`

	Name      string    `gorm:"column:name" json:"name"`
	URL       string    `gorm:"column:url" json:"url"`
	Position  int       `gorm:"column:position" json:"position"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at" json:"updated_at"`
}

func (Menu) TableName() string {
	return "menus"
}

// Menu beserta submenu-nya; bentuk response GET /api/menus/tree.
type MenuNode struct {
	Menu
	Children []*MenuNode `json:"children"`
}

// Body POST dan PUT /api/menus. Field diisi sebagai nilai final (perilaku PUT)
// kecuali dua ini:
//   - ParentID nil -> menu ditaruh di level paling atas.
//   - Position nil -> POST taruh di urutan paling akhir,
//     PUT pertahankan urutan yang sekarang.
type MenuRequest struct {
	Name     string  `json:"name" validate:"required,min=3,max=100"`
	URL      string  `json:"url" validate:"omitempty,max=255"`
	ParentID *string `json:"parent_id"`
	Position *int    `json:"position" validate:"omitempty,gte=0"`
}

// Body PATCH /api/menus/:id/move. ParentID nil berarti pindah ke level paling
// atas, Position nil berarti taruh di urutan paling akhir induk tujuan.
type MoveMenuRequest struct {
	ParentID *string `json:"parent_id"`
	Position *int    `json:"position" validate:"omitempty,gte=0"`
}
