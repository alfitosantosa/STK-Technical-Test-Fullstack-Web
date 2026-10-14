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

// Migrasi ikut dibundel ke binary, jadi folder migrations tidak perlu disalin
// ke Docker image.
//
//go:embed migrations/*.sql
var migrationFiles embed.FS

func Connect(databaseURL string) *gorm.DB {
	db, err := gorm.Open(postgres.New(postgres.Config{
		DSN: databaseURL,
		// Satu file migration bisa berisi beberapa statement (CREATE TABLE lalu
		// CREATE INDEX); mode default pgx cuma boleh satu statement per eksekusi.
		// Ini mematikan cache prepared statement. Di skala aplikasi ini tidak
		// terasa; kalau throughput jadi masalah, pisahkan koneksi migration dari
		// koneksi aplikasi.
		PreferSimpleProtocol: true,
	}), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
		// Timestamp ditulis UTC. Tanpa ini, waktu dari POST/PUT memakai zona server
		// (+07:00) sedangkan hasil GET dari database UTC, jadi satu response bisa
		// berisi dua format waktu berbeda.
		NowFunc: func() time.Time { return time.Now().UTC() },
	})
	if err != nil {
		log.Fatalf("gagal konek ke database: %v", err)
	}

	return db
}

// Migrate menjalankan file migration yang belum pernah dijalankan. Yang sudah
// jalan dicatat di schema_migrations, jadi aman dipanggil tiap server start.
func Migrate(db *gorm.DB) error {
	if err := createMigrationTable(db); err != nil {
		return err
	}

	applied, err := appliedMigrations(db)
	if err != nil {
		return err
	}

	// ReadDir sudah urut, jadi 0001 jalan sebelum 0002.
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

// applyMigration menjalankan satu file migration. Isi file dan pencatatannya
// dijalankan dalam satu transaksi, jadi SQL yang gagal tidak meninggalkan baris
// di schema_migrations.
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
