package repository

import (
	"context"
	"errors"

	"assesment/model"

	"gorm.io/gorm"
)

// MenuRepository adalah satu-satunya tempat yang menulis query untuk tabel menus.
// Layer service dan route tidak perlu tahu GORM.
type MenuRepository struct {
	db *gorm.DB
}

func NewMenuRepository(db *gorm.DB) *MenuRepository {
	return &MenuRepository{db: db}
}

// FindAll mengambil semua menu, diurutkan per level lalu per posisi tampil.
func (r *MenuRepository) FindAll(ctx context.Context) ([]model.Menu, error) {
	var menus []model.Menu

	err := r.db.WithContext(ctx).
		Order("parent_id NULLS FIRST").
		Order("position").
		Order("id").
		Find(&menus).Error
	if err != nil {
		return nil, err
	}

	return menus, nil
}

// FindByID mengambil satu menu.
//
// Mengembalikan (nil, nil) kalau menu tidak ada, supaya layer lain tidak perlu
// tahu error khas GORM (gorm.ErrRecordNotFound).
func (r *MenuRepository) FindByID(ctx context.Context, id int64) (*model.Menu, error) {
	var menu model.Menu

	err := r.db.WithContext(ctx).First(&menu, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &menu, nil
}

// Create menyimpan menu baru. ID dan timestamp diisi oleh database.
func (r *MenuRepository) Create(ctx context.Context, menu *model.Menu) error {
	return r.db.WithContext(ctx).Create(menu).Error
}

// Update menyimpan semua perubahan pada menu yang sudah ada.
func (r *MenuRepository) Update(ctx context.Context, menu *model.Menu) error {
	return r.db.WithContext(ctx).Save(menu).Error
}

// Delete menghapus satu menu. Submenu di bawahnya ikut terhapus lewat
// ON DELETE CASCADE pada tabel menus.
func (r *MenuRepository) Delete(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Delete(&model.Menu{}, id).Error
}

// LastPosition mengembalikan posisi terbesar di antara menu yang induknya sama.
// Dipakai untuk menaruh menu baru di urutan paling akhir.
// Kalau belum ada menu lain, hasilnya -1 supaya menu pertama mendapat posisi 0.
func (r *MenuRepository) LastPosition(ctx context.Context, parentID *int64) (int, error) {
	// parentID dikirim lewat interface{} supaya nil menjadi NULL di SQL.
	var parent any
	if parentID != nil {
		parent = *parentID
	}

	var lastPosition int
	err := r.db.WithContext(ctx).
		Model(&model.Menu{}).
		Where("parent_id IS NOT DISTINCT FROM ?", parent).
		Select("COALESCE(MAX(position), -1)").
		Scan(&lastPosition).Error
	if err != nil {
		return 0, err
	}

	return lastPosition, nil
}

// Transaction menjalankan fn di dalam satu transaksi database.
//
// txRepo memakai koneksi transaksi yang sama, jadi service bisa merangkai
// beberapa perubahan sekaligus tanpa perlu mengimpor GORM.
func (r *MenuRepository) Transaction(ctx context.Context, fn func(txRepo *MenuRepository) error) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		return fn(&MenuRepository{db: tx})
	})
}

// FindSiblings mengambil menu yang induknya sama, kecuali excludeID,
// diurutkan position lalu id.
//
// excludeID dipakai saat memindahkan menu: menu yang dipindah tidak ikut
// dihitung sebagai saudara, karena posisinya yang sedang direncanakan.
func (r *MenuRepository) FindSiblings(ctx context.Context, parentID *int64, excludeID int64) ([]model.Menu, error) {
	// parentID dikirim lewat interface{} supaya nil menjadi NULL di SQL.
	var parent any
	if parentID != nil {
		parent = *parentID
	}

	var menus []model.Menu
	err := r.db.WithContext(ctx).
		Where("parent_id IS NOT DISTINCT FROM ?", parent).
		Where("id <> ?", excludeID).
		Order("position").
		Order("id").
		Find(&menus).Error
	if err != nil {
		return nil, err
	}

	return menus, nil
}

// UpdateParentAndPosition hanya mengubah parent_id dan position satu baris.
//
// Sengaja memakai map, bukan Save, supaya kolom lain (name, url) tidak ikut
// tertulis kalau ada perubahan yang belum tersimpan di struct pemanggil.
func (r *MenuRepository) UpdateParentAndPosition(ctx context.Context, id int64, parentID *int64, position int) error {
	// parentID dikirim lewat interface{} supaya nil menjadi NULL di SQL.
	var parent any
	if parentID != nil {
		parent = *parentID
	}

	return r.db.WithContext(ctx).
		Model(&model.Menu{}).
		Where("id = ?", id).
		Updates(map[string]any{
			"parent_id": parent,
			"position":  position,
		}).Error
}
