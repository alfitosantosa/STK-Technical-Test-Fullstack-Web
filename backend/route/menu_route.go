package route

import (
	"assesment/model"
	"assesment/service"

	"github.com/gofiber/fiber/v3"
)

type MenuHandler struct {
	menuService *service.MenuService
}

func NewMenuHandler(menuService *service.MenuService) *MenuHandler {
	return &MenuHandler{menuService: menuService}
}

func (h *MenuHandler) Register(app *fiber.App) {
	menus := app.Group("/api/menus")

	// /tree harus didaftarkan sebelum /:id. Fiber mencocokkan route sesuai urutan
	// pendaftaran, jadi kalau /:id duluan, "/api/menus/tree" dibaca sebagai
	// permintaan menu ber-id "tree".
	menus.Get("/tree", h.tree)

	menus.Get("/", h.list)
	menus.Post("/", h.create)
	menus.Get("/:id", h.get)
	menus.Put("/:id", h.update)
	menus.Patch("/:id/move", h.move)
	menus.Delete("/:id", h.delete)
}

func (h *MenuHandler) list(c fiber.Ctx) error {
	menus, err := h.menuService.List(c.Context())
	if err != nil {
		return err
	}

	return c.JSON(menus)
}

func (h *MenuHandler) tree(c fiber.Ctx) error {
	nodes, err := h.menuService.Tree(c.Context())
	if err != nil {
		return err
	}

	return c.JSON(nodes)
}

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

func (h *MenuHandler) create(c fiber.Ctx) error {
	var req model.MenuRequest
	if err := c.Bind().Body(&req); err != nil {
		// Body rusak dan body tidak lolos validasi ditangani errorHandler di server.go.
		return err
	}

	menu, err := h.menuService.Create(c.Context(), req)
	if err != nil {
		return toHTTPError(err)
	}

	return c.Status(fiber.StatusCreated).JSON(menu)
}

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

// Mengubah induk dan/atau urutan menu, lalu merapikan posisi saudaranya.
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
