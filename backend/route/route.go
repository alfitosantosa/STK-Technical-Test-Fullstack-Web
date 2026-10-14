package route

import (
	"errors"

	"assesment/service"

	"github.com/gofiber/fiber/v3"
	"github.com/nrednav/cuid2"
)

// Register mendaftarkan seluruh endpoint aplikasi.
//
// apiDocs adalah isi file api.docs.yml yang sudah dibundel ke binary (lihat server.go).
func Register(app *fiber.App, menuHandler *MenuHandler, apiDocs []byte) {
	app.Get("/health", health)
	registerDocsRoutes(app, apiDocs)
	menuHandler.Register(app)
}

// health dipakai untuk memastikan server masih hidup.
func health(c fiber.Ctx) error {
	return c.JSON(fiber.Map{"status": "ok"})
}

// parseID membaca parameter :id dan memastikan isinya CUID2 yang valid.
// Id menu dibuat aplikasi (lihat service.Create), jadi bentuknya selalu CUID2.
//
// cuid2.IsCuid masih menerima panjang 2..32, sedangkan id yang dibuat selalu
// DefaultIdLength (24), jadi panjangnya ikut diperiksa.
func parseID(c fiber.Ctx) (string, error) {
	id := c.Params("id")
	if !cuid2.IsCuid(id) || len(id) != cuid2.DefaultIdLength {
		return "", fiber.NewError(fiber.StatusBadRequest, "id menu tidak valid")
	}

	return id, nil
}

// toHTTPError mengubah error dari layer service menjadi error HTTP.
// Handler memanggil ini supaya penentuan status code ada di satu tempat.
func toHTTPError(err error) error {
	switch {
	case errors.Is(err, service.ErrNotFound):
		return fiber.NewError(fiber.StatusNotFound, err.Error())

	case errors.Is(err, service.ErrParentNotFound), errors.Is(err, service.ErrInvalidParent):
		return fiber.NewError(fiber.StatusBadRequest, err.Error())

	default:
		// Error tak terduga (misalnya database mati) dibiarkan apa adanya lalu
		// diterjemahkan menjadi 500 oleh error handler di server.go.
		return err
	}
}
