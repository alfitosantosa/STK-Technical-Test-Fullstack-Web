// Bentuknya mengikuti response API Go di backend/model/menu.go.

// CUID2 dari backend (24 karakter). Perlakukan sebagai teks apa adanya.
export type MenuId = string;

export type Menu = {
  id: MenuId;
  parent_id: MenuId | null;
  name: string;
  url: string;
  position: number;
  created_at: string;
  updated_at: string;
};

// Menu + submenu di bawahnya, dari GET /api/menus/tree.
export type MenuNode = Menu & {
  children: MenuNode[];
};

// Body untuk POST dan PUT /api/menus.
export type MenuPayload = {
  name: string;
  url: string;
  parent_id: MenuId | null;
  position?: number | null;
};

// Body untuk PATCH /api/menus/:id/move (drag and drop).
export type MovePayload = {
  parent_id: MenuId | null;
  position: number | null;
};
