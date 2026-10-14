package service

import (
	"context"
	"os"
	"testing"

	"assesment/model"
	"assesment/repository"

	"github.com/joho/godotenv"
	"github.com/nrednav/cuid2"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// ID menu harus CUID2 yang valid, bukan angka dari database. Butuh database,
// jadi test-nya di-skip kalau DATABASE_URL kosong atau database tidak bisa
// dihubungi.
func TestCreateIDBerupaCUID(t *testing.T) {
	svc := newTestService(t)

	menu, err := svc.Create(context.Background(), model.MenuRequest{Name: "Uji ID CUID"})
	if err != nil {
		t.Fatalf("Create gagal: %v", err)
	}
	t.Cleanup(func() {
		if err := svc.Delete(context.Background(), menu.ID); err != nil {
			t.Errorf("gagal menghapus menu uji: %v", err)
		}
	})

	if !cuid2.IsCuid(menu.ID) {
		t.Errorf("id hasil Create = %q, mau CUID2 yang valid", menu.ID)
	}
	if len(menu.ID) != 24 {
		t.Errorf("panjang id hasil Create = %d, mau 24", len(menu.ID))
	}
}

// DATABASE_URL dibaca dari environment, atau dari ../.env karena test jalan dari
// dalam folder service/.
func newTestService(t *testing.T) *MenuService {
	t.Helper()

	if os.Getenv("DATABASE_URL") == "" {
		_ = godotenv.Load("../.env")
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL tidak diisi, test ini butuh database")
	}

	db, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: true,
	}), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Skipf("database tidak bisa dihubungi: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		t.Skipf("database tidak bisa dihubungi: %v", err)
	}
	if err := sqlDB.PingContext(context.Background()); err != nil {
		t.Skipf("database tidak bisa dihubungi: %v", err)
	}

	return NewMenuService(repository.NewMenuRepository(db))
}
