// Tipe data yang dipakai bersama seluruh aplikasi.
// Bentuknya mengikuti response API Go di backend/model/menu.go.

export type Menu = {
  id: number;
  parent_id: number | null;
  name: string;
  url: string;
  position: number;
  created_at: string;
  updated_at: string;
};

// Menu beserta submenu di bawahnya, dari GET /api/menus/tree.
export type MenuNode = Menu & {
  children: MenuNode[];
};

// Body untuk POST dan PUT /api/menus.
export type MenuPayload = {
  name: string;
  url: string;
  parent_id: number | null;
  position?: number | null;
};

// Body untuk PATCH /api/menus/:id/move (drag and drop).
export type MovePayload = {
  parent_id: number | null;
  position: number | null;
};
