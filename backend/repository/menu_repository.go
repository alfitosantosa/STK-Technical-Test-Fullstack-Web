package repository

import (
	"context"
	"errors"

	"assesment/model"

	"gorm.io/gorm"
)

type MenuRepository struct {
	db *gorm.DB
}

func NewMenuRepository(db *gorm.DB) *MenuRepository {
	return &MenuRepository{db: db}
}

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

// FindByID mengembalikan (nil, nil) kalau menunya tidak ada, supaya layer lain
// tidak perlu tahu gorm.ErrRecordNotFound.
func (r *MenuRepository) FindByID(ctx context.Context, id string) (*model.Menu, error) {
	var menu model.Menu

	// primary key-nya string, jadi id tidak boleh dikirim sebagai argumen kedua
	// First: GORM akan membacanya sebagai potongan SQL.
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&menu).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &menu, nil
}

// Create menyimpan menu baru. ID dibuat aplikasi, timestamp diisi database.
func (r *MenuRepository) Create(ctx context.Context, menu *model.Menu) error {
	return r.db.WithContext(ctx).Create(menu).Error
}

func (r *MenuRepository) Update(ctx context.Context, menu *model.Menu) error {
	return r.db.WithContext(ctx).Save(menu).Error
}

// Delete menghapus satu menu; submenu-nya ikut terhapus lewat ON DELETE CASCADE.
func (r *MenuRepository) Delete(ctx context.Context, id string) error {
	// Sama seperti FindByID: primary key string harus lewat Where, bukan
	// argumen kedua Delete.
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&model.Menu{}).Error
}

// LastPosition mengembalikan position terbesar di antara saudara, atau -1 kalau
// belum ada supaya menu pertama dapat posisi 0.
func (r *MenuRepository) LastPosition(ctx context.Context, parentID *string) (int, error) {
	// interface{} supaya nil jadi NULL di SQL.
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

// Transaction menjalankan fn dalam satu transaksi. txRepo memakai koneksi
// transaksi yang sama, jadi service bisa merangkai beberapa perubahan sekaligus
// tanpa perlu mengimpor GORM.
func (r *MenuRepository) Transaction(ctx context.Context, fn func(txRepo *MenuRepository) error) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		return fn(&MenuRepository{db: tx})
	})
}

// FindSiblings mengambil saudara (induk sama), kecuali excludeID, urut position
// lalu id. excludeID dipakai saat memindahkan menu: menu yang dipindah tidak
// dihitung sebagai saudara karena posisinya sedang direncanakan.
func (r *MenuRepository) FindSiblings(ctx context.Context, parentID *string, excludeID string) ([]model.Menu, error) {
	// interface{} supaya nil jadi NULL di SQL.
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

// UpdateParentAndPosition cuma mengubah parent_id dan position satu baris.
// Sengaja pakai map, bukan Save, supaya kolom lain (name, url) tidak ikut
// tertulis kalau ada perubahan yang belum tersimpan di struct pemanggil.
func (r *MenuRepository) UpdateParentAndPosition(ctx context.Context, id string, parentID *string, position int) error {
	// interface{} supaya nil jadi NULL di SQL.
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
