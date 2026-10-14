package database

import (
	"embed"
	"fmt"
	"log"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// File SQL migration ikut dibundel ke dalam binary saat compile, jadi folder
// migrations tidak perlu ikut disalin ke dalam Docker image.
//
//go:embed migrations/*.sql
var migrationFiles embed.FS

// Connect membuka koneksi ke PostgreSQL.
func Connect(databaseURL string) *gorm.DB {
	db, err := gorm.Open(postgres.New(postgres.Config{
		DSN: databaseURL,
		// Satu file migration boleh berisi lebih dari satu statement
		// (CREATE TABLE lalu CREATE INDEX). Mode default pgx hanya mengizinkan
		// satu statement per eksekusi, jadi simple protocol dipakai di sini.
		// ponytail: simple protocol mematikan cache prepared statement. Skala
		// aplikasi ini tidak terasa; kalau nanti throughput jadi masalah,
		// pisahkan koneksi migration dari koneksi aplikasi.
		PreferSimpleProtocol: true,
	}), &gorm.Config{
		// Cukup tampilkan error dan query lambat, supaya log terminal tetap enak dibaca.
		Logger: logger.Default.LogMode(logger.Warn),
		// Timestamp selalu ditulis dalam UTC. Tanpa ini, waktu dari POST/PUT
		// memakai zona waktu server (+07:00) sedangkan hasil GET dari database
		// memakai UTC, jadi satu response bisa berisi dua format waktu berbeda.
		NowFunc: func() time.Time { return time.Now().UTC() },
	})
	if err != nil {
		log.Fatalf("gagal konek ke database: %v", err)
	}

	return db
}

// Migrate menjalankan semua file di folder migrations yang belum pernah dijalankan.
//
// File yang sudah dijalankan dicatat di tabel schema_migrations, jadi fungsi ini
// aman dipanggil setiap kali server start.
func Migrate(db *gorm.DB) error {
	if err := createMigrationTable(db); err != nil {
		return err
	}

	applied, err := appliedMigrations(db)
	if err != nil {
		return err
	}

	// ReadDir sudah mengurutkan nama file, jadi 0001 jalan sebelum 0002.
	entries, err := migrationFiles.ReadDir("migrations")
	if err != nil {
		return fmt.Errorf("gagal membaca folder migrations: %w", err)
	}

	for _, entry := range entries {
		name := entry.Name()
		if applied[name] {
			continue
		}
		if err := applyMigration(db, name); err != nil {
			return err
		}
		log.Printf("migration dijalankan: %s", name)
	}

	return nil
}

// createMigrationTable menyiapkan tabel pencatat migration.
func createMigrationTable(db *gorm.DB) error {
	err := db.Exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
		name       VARCHAR(255) PRIMARY KEY,
		applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	)`).Error
	if err != nil {
		return fmt.Errorf("gagal membuat tabel schema_migrations: %w", err)
	}
	return nil
}

// appliedMigrations mengembalikan daftar nama file migration yang sudah dijalankan.
func appliedMigrations(db *gorm.DB) (map[string]bool, error) {
	var names []string
	if err := db.Raw("SELECT name FROM schema_migrations").Scan(&names).Error; err != nil {
		return nil, fmt.Errorf("gagal membaca schema_migrations: %w", err)
	}

	applied := make(map[string]bool, len(names))
	for _, name := range names {
		applied[name] = true
	}
	return applied, nil
}

// applyMigration menjalankan satu file migration.
// Isi file dan pencatatannya dijalankan dalam satu transaksi, jadi kalau SQL-nya
// gagal, tabel schema_migrations tidak ikut terisi.
func applyMigration(db *gorm.DB, name string) error {
	content, err := migrationFiles.ReadFile("migrations/" + name)
	if err != nil {
		return fmt.Errorf("gagal membaca migration %s: %w", name, err)
	}

	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(string(content)).Error; err != nil {
			return fmt.Errorf("migration %s gagal: %w", name, err)
		}
		return tx.Exec("INSERT INTO schema_migrations (name) VALUES (?)", name).Error
	})
}
