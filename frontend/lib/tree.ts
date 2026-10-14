import type { MenuId, MenuNode } from "@/lib/types";

// Fungsi murni di file ini tidak menyentuh React, jadi gampang ditest dan dipakai
// ulang oleh tree, sidebar, maupun form.

export function findNode(nodes: MenuNode[], id: MenuId | null): MenuNode | null {
  if (id === null) {
    return null;
  }

  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }

    const found = findNode(node.children, id);
    if (found) {
      return found;
    }
  }

  return null;
}

// Induk dari id; null kalau id-nya menu level paling atas.
export function findParent(nodes: MenuNode[], id: MenuId): MenuNode | null {
  for (const node of nodes) {
    if (node.children.some((child) => child.id === id)) {
      return node;
    }

    const found = findParent(node.children, id);
    if (found) {
      return found;
    }
  }

  return null;
}

// Daftar saudara yang memuat id; kalau id-nya di level paling atas, hasilnya
// daftar root itu sendiri.
//
// Dipakai drag and drop: urutan sisip dihitung dari daftar ini setelah menu yang
// dipindah dikeluarkan, supaya indeksnya tidak bergeser.
export function siblingNodes(nodes: MenuNode[], id: MenuId): MenuNode[] {
  if (nodes.some((node) => node.id === id)) {
    return nodes;
  }

  for (const node of nodes) {
    const found = siblingNodes(node.children, id);
    if (found.length > 0) {
      return found;
    }
  }

  return [];
}

// Menu bersarang jadi daftar rata + depth-nya (buat dropdown induk dan kolom Depth).
export function flattenTree(
  nodes: MenuNode[],
  depth = 0,
): Array<{ node: MenuNode; depth: number }> {
  return nodes.flatMap((node) => [
    { node, depth },
    ...flattenTree(node.children, depth + 1),
  ]);
}

// Semua id, atau cuma yang punya submenu (buat tombol Expand/Collapse All).
export function collectIds(nodes: MenuNode[], onlyWithChildren = false): MenuId[] {
  return nodes.flatMap((node) => [
    ...(onlyWithChildren && node.children.length === 0 ? [] : [node.id]),
    ...collectIds(node.children, onlyWithChildren),
  ]);
}

// Saring per nama; menu yang cocok tetap tampil bareng semua induknya supaya
// hierarkinya tidak terputus.
export function filterTree(nodes: MenuNode[], keyword: string): MenuNode[] {
  const needle = keyword.trim().toLowerCase();
  if (needle === "") {
    return nodes;
  }

  return nodes.flatMap((node) => {
    const children = filterTree(node.children, keyword);
    const matches = node.name.toLowerCase().includes(needle);

    if (!matches && children.length === 0) {
      return [];
    }

    return [{ ...node, children }];
  });
}

// Dipakai drag and drop: menu tidak boleh dipindah ke dalam submenu-nya sendiri.
export function isDescendant(root: MenuNode, candidateId: MenuId): boolean {
  return root.children.some(
    (child) => child.id === candidateId || isDescendant(child, candidateId),
  );
}

// Jalur dari menu teratas sampai id ini (akar di depan, menunya di akhir).
// Dipakai breadcrumb; kosong kalau id-nya tidak ada di tree.
export function menuPath(nodes: MenuNode[], id: MenuId): MenuNode[] {
  const node = findNode(nodes, id);

  if (!node) {
    return [];
  }

  const path = [node];
  let parent = findParent(nodes, id);

  while (parent) {
    path.unshift(parent);
    parent = findParent(nodes, parent.id);
  }

  return path;
}
