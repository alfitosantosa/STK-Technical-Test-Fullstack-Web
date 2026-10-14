package config

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	DatabaseURL string
	// Kosong berarti semua origin diizinkan; diisi kalau browser memanggil API
	// langsung dari origin lain (di produksi frontend dan API satu origin, jadi
	// CORS tidak dipakai).
	CorsOrigins []string
}

// Load membaca .env kalau ada; kalau tidak, nilainya diambil dari environment.
// Di Docker env var diisi lewat docker-compose.yml, jadi .env tidak dipakai.
func Load() *Config {
	_ = godotenv.Load()

	cfg := &Config{
		Port:        getEnv("PORT", "4000"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
		CorsOrigins: getEnvList("CORS_ORIGINS"),
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

// getEnvList memecah env var berisi daftar yang dipisah koma, contoh
// "https://stk.santosatechid.cloud,http://localhost:3000".
func getEnvList(key string) []string {
	var values []string

	for _, value := range strings.Split(os.Getenv(key), ",") {
		if value = strings.TrimSpace(value); value != "" {
			values = append(values, value)
		}
	}

	return values
}
