package route

import (
	"errors"
	"strconv"

	"assesment/service"

	"github.com/gofiber/fiber/v3"
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

// parseID membaca parameter :id dan memastikan isinya angka positif.
func parseID(c fiber.Ctx) (int64, error) {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil || id <= 0 {
		return 0, fiber.NewError(fiber.StatusBadRequest, "id menu harus berupa angka positif")
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
