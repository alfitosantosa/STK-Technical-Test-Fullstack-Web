package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config menyimpan semua konfigurasi yang dibaca dari environment variable.
type Config struct {
	Port        string
	DatabaseURL string
}

// Load membaca file .env lalu mengambil nilai yang dibutuhkan.
//
// Kalau file .env tidak ada, nilainya diambil langsung dari environment.
// Ini yang terjadi saat aplikasi jalan di Docker, karena environment variable
// di sana diisi lewat docker-compose.yml.
func Load() *Config {
	_ = godotenv.Load()

	cfg := &Config{
		Port:        getEnv("PORT", "3000"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
	}

	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL belum diisi. Copy .env.example menjadi .env lalu isi koneksi database-nya.")
	}

	return cfg
}

// getEnv mengembalikan nilai environment variable, atau nilai cadangan kalau kosong.
func getEnv(key string, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
