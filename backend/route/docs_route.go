package route

import "github.com/gofiber/fiber/v3"

// swaggerHTML adalah halaman Swagger UI yang membaca spec dari /api.docs.yml.
// Library-nya diambil dari CDN supaya tidak ada dependency tambahan di Go.
const swaggerHTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Menu Management API</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: "/api.docs.yml",
          dom_id: "#swagger-ui",
        });
      };
    </script>
  </body>
</html>
`

// registerDocsRoutes menyajikan dokumentasi API.
//
// apiDocs adalah isi file api.docs.yml. File itu dibundel ke binary saat compile
// (lihat server.go), jadi dokumentasi tetap tampil tanpa perlu ikut menyalin file.
func registerDocsRoutes(app *fiber.App, apiDocs []byte) {
	app.Get("/api.docs.yml", func(c fiber.Ctx) error {
		c.Set(fiber.HeaderContentType, "application/yaml")
		return c.Send(apiDocs)
	})

	app.Get("/docs", func(c fiber.Ctx) error {
		c.Set(fiber.HeaderContentType, fiber.MIMETextHTMLCharsetUTF8)
		return c.SendString(swaggerHTML)
	})
}
