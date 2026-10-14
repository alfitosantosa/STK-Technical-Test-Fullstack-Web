package route

import (
	"errors"

	"assesment/service"

	"github.com/gofiber/fiber/v3"
	"github.com/nrednav/cuid2"
)

func Register(app *fiber.App, menuHandler *MenuHandler, apiDocs []byte) {
	app.Get("/health", health)
	registerDocsRoutes(app, apiDocs)
	menuHandler.Register(app)
}

func health(c fiber.Ctx) error {
	return c.JSON(fiber.Map{"status": "ok"})
}

// parseID memastikan :id berbentuk CUID2. cuid2.IsCuid menerima panjang 2..32
// sedangkan id yang kita buat selalu 24 (DefaultIdLength), jadi panjangnya ikut
// diperiksa.
func parseID(c fiber.Ctx) (string, error) {
	id := c.Params("id")
	if !cuid2.IsCuid(id) || len(id) != cuid2.DefaultIdLength {
		return "", fiber.NewError(fiber.StatusBadRequest, "id menu tidak valid")
	}

	return id, nil
}

// toHTTPError menerjemahkan error service jadi error HTTP. Semua handler lewat
// sini supaya penentuan status code ada di satu tempat.
func toHTTPError(err error) error {
	switch {
	case errors.Is(err, service.ErrNotFound):
		return fiber.NewError(fiber.StatusNotFound, err.Error())

	case errors.Is(err, service.ErrParentNotFound), errors.Is(err, service.ErrInvalidParent):
		return fiber.NewError(fiber.StatusBadRequest, err.Error())

	default:
		// Error tak terduga (misalnya database mati) dibiarkan apa adanya; nanti
		// jadi 500 lewat errorHandler di server.go.
		return err
	}
}
