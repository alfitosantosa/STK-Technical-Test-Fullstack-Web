package main

import (
	_ "embed"
	"errors"
	"log"
	"reflect"
	"strings"

	"assesment/config"
	"assesment/database"
	"assesment/repository"
	"assesment/route"
	"assesment/service"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/logger"
	"github.com/gofiber/fiber/v3/middleware/recover"
)

// Spec OpenAPI dibundel ke binary supaya halaman /docs tetap jalan
// tanpa perlu ikut menyalin file api.docs.yml.
//
//go:embed api.docs.yml
var apiDocs []byte

func main() {
	cfg := config.Load()

	db := database.Connect(cfg.DatabaseURL)
	if err := database.Migrate(db); err != nil {
		log.Fatalf("migration gagal: %v", err)
	}

	app := fiber.New(fiber.Config{
		AppName:         "Menu Management API",
		StructValidator: newStructValidator(),
		ErrorHandler:    errorHandler,
	})

	app.Use(recover.New())
	app.Use(logger.New())
	// Frontend berjalan di port berbeda saat development, jadi CORS dibuka.
	// ponytail: masih terbuka untuk semua origin; batasi AllowOrigins sebelum production.
	app.Use(cors.New())

	// main adalah tempat menyusun dependency, dari yang paling bawah.
	menuRepository := repository.NewMenuRepository(db)
	menuService := service.NewMenuService(menuRepository)
	menuHandler := route.NewMenuHandler(menuService)

	route.Register(app, menuHandler, apiDocs)

	log.Printf("server berjalan di http://localhost:%s (dokumentasi: /docs)", cfg.Port)
	log.Fatal(app.Listen(":" + cfg.Port))
}

// structValidator menyambungkan library validator ke Fiber.
//
// Fiber memanggil Validate setiap kali request body di-bind ke struct, jadi
// aturan validasi cukup ditulis sebagai tag `validate:"..."` di model.
type structValidator struct {
	validate *validator.Validate
}

func newStructValidator() *structValidator {
	validate := validator.New()

	// Nama field pada pesan error mengikuti tag json, supaya klien menerima
	// "name" (nama field yang dia kirim) bukan "Name".
	validate.RegisterTagNameFunc(func(field reflect.StructField) string {
		return strings.SplitN(field.Tag.Get("json"), ",", 2)[0]
	})

	return &structValidator{validate: validate}
}

func (v *structValidator) Validate(out any) error {
	return v.validate.Struct(out)
}

// errorHandler adalah satu tempat untuk mengubah error menjadi response JSON,
// supaya handler tidak perlu menulis format error sendiri.
func errorHandler(c fiber.Ctx, err error) error {
	// Body tidak lolos aturan validasi: kirim detail per field supaya frontend
	// bisa menandai input mana yang salah.
	var validationErrors validator.ValidationErrors
	if errors.As(err, &validationErrors) {
		details := make([]fiber.Map, 0, len(validationErrors))
		for _, fieldError := range validationErrors {
			details = append(details, fiber.Map{
				"field": fieldError.Field(),
				"rule":  fieldError.Tag(),
			})
		}

		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "data yang dikirim tidak valid",
			"details": details,
		})
	}

	// Body tidak bisa dibaca: JSON rusak atau tipe datanya salah.
	var bindError *fiber.BindError
	if errors.As(err, &bindError) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "body request tidak bisa dibaca",
		})
	}

	// Error yang sudah membawa status HTTP, misalnya dari fiber.NewError di route.
	var httpError *fiber.Error
	if errors.As(err, &httpError) {
		return c.Status(httpError.Code).JSON(fiber.Map{"error": httpError.Message})
	}

	// Sisanya error tak terduga. Detail aslinya dicatat untuk developer,
	// tapi tidak dikirim ke klien.
	log.Printf("error tak terduga: %v", err)
	return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
		"error": "terjadi kesalahan pada server",
	})
}
