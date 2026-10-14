package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	DatabaseURL string
}

// Load membaca .env kalau ada; kalau tidak, nilainya diambil dari environment.
// Di Docker env var diisi lewat docker-compose.yml, jadi .env tidak dipakai.
func Load() *Config {
	_ = godotenv.Load()

	cfg := &Config{
		Port:        getEnv("PORT", "4000"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
	}

	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL belum diisi. Copy .env.example menjadi .env lalu isi koneksi database-nya.")
	}

	return cfg
}

func getEnv(key string, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
