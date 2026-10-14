package route

import (
	"assesment/model"
	"assesment/service"

	"github.com/gofiber/fiber/v3"
)

// MenuHandler menampung dependency yang dipakai seluruh endpoint menu.
type MenuHandler struct {
	menuService *service.MenuService
}

func NewMenuHandler(menuService *service.MenuService) *MenuHandler {
	return &MenuHandler{menuService: menuService}
}

// Register mendaftarkan endpoint menu.
func (h *MenuHandler) Register(app *fiber.App) {
	menus := app.Group("/api/menus")

	// /tree wajib didaftarkan sebelum /:id.
	// Fiber mencocokkan route sesuai urutan pendaftaran, jadi kalau /:id lebih
	// dulu, permintaan "/api/menus/tree" akan dianggap meminta menu ber-id "tree".
	menus.Get("/tree", h.tree)

	menus.Get("/", h.list)
	menus.Post("/", h.create)
	menus.Get("/:id", h.get)
	menus.Put("/:id", h.update)
	menus.Patch("/:id/move", h.move)
	menus.Delete("/:id", h.delete)
}

// list menangani GET /api/menus dan mengembalikan semua menu dalam bentuk datar.
func (h *MenuHandler) list(c fiber.Ctx) error {
	menus, err := h.menuService.List(c.Context())
	if err != nil {
		return err
	}

	return c.JSON(menus)
}

// tree menangani GET /api/menus/tree dan mengembalikan menu bersarang.
func (h *MenuHandler) tree(c fiber.Ctx) error {
	nodes, err := h.menuService.Tree(c.Context())
	if err != nil {
		return err
	}

	return c.JSON(nodes)
}

// get menangani GET /api/menus/:id.
func (h *MenuHandler) get(c fiber.Ctx) error {
	id, err := parseID(c)
	if err != nil {
		return err
	}

	menu, err := h.menuService.Get(c.Context(), id)
	if err != nil {
		return toHTTPError(err)
	}

	return c.JSON(menu)
}

// create menangani POST /api/menus.
func (h *MenuHandler) create(c fiber.Ctx) error {
	var req model.MenuRequest
	if err := c.Bind().Body(&req); err != nil {
		// Body rusak dan body tidak lolos validasi ditangani error handler di server.go.
		return err
	}

	menu, err := h.menuService.Create(c.Context(), req)
	if err != nil {
		return toHTTPError(err)
	}

	return c.Status(fiber.StatusCreated).JSON(menu)
}

// update menangani PUT /api/menus/:id.
func (h *MenuHandler) update(c fiber.Ctx) error {
	id, err := parseID(c)
	if err != nil {
		return err
	}

	var req model.MenuRequest
	if err := c.Bind().Body(&req); err != nil {
		return err
	}

	menu, err := h.menuService.Update(c.Context(), id, req)
	if err != nil {
		return toHTTPError(err)
	}

	return c.JSON(menu)
}

// move menangani PATCH /api/menus/:id/move.
// Mengubah induk dan/atau urutan menu, lalu merapikan posisi sibling.
func (h *MenuHandler) move(c fiber.Ctx) error {
	id, err := parseID(c)
	if err != nil {
		return err
	}

	var req model.MoveMenuRequest
	if err := c.Bind().Body(&req); err != nil {
		return err
	}

	menu, err := h.menuService.Move(c.Context(), id, req)
	if err != nil {
		return toHTTPError(err)
	}

	return c.JSON(menu)
}

// delete menangani DELETE /api/menus/:id.
// Submenu di bawah menu yang dihapus ikut terhapus.
func (h *MenuHandler) delete(c fiber.Ctx) error {
	id, err := parseID(c)
	if err != nil {
		return err
	}

	if err := h.menuService.Delete(c.Context(), id); err != nil {
		return toHTTPError(err)
	}

	return c.SendStatus(fiber.StatusNoContent)
}
