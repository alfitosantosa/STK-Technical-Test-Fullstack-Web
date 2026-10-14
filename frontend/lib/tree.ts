import type { MenuNode } from "@/lib/types";

// Kumpulan fungsi murni untuk mengolah menu bersarang.
// Semuanya tidak menyentuh React, jadi gampang ditest dan dipakai ulang
// oleh tree, sidebar, maupun form.

// findNode mencari satu menu berdasarkan id di seluruh kedalaman tree.
export function findNode(nodes: MenuNode[], id: number | null): MenuNode | null {
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

// findParent mencari menu induk dari sebuah id.
// Mengembalikan null kalau id tersebut adalah menu level paling atas.
export function findParent(nodes: MenuNode[], id: number): MenuNode | null {
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

// siblingNodes mengembalikan daftar saudara yang memuat id tersebut.
// Kalau id berada di level paling atas, hasilnya adalah daftar root itu sendiri.
//
// Dipakai drag and drop: urutan disisipkan dihitung dari daftar ini setelah
// menu yang dipindah dikeluarkan, supaya indeksnya tidak bergeser.
export function siblingNodes(nodes: MenuNode[], id: number): MenuNode[] {
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

// flattenTree mengubah menu bersarang menjadi daftar rata beserta levelnya.
// Dipakai dropdown pemilih induk dan penampilan kolom Depth.
export function flattenTree(
  nodes: MenuNode[],
  depth = 0,
): Array<{ node: MenuNode; depth: number }> {
  return nodes.flatMap((node) => [
    { node, depth },
    ...flattenTree(node.children, depth + 1),
  ]);
}

// collectIds mengumpulkan seluruh id menu, atau hanya yang punya submenu
// (dipakai tombol Expand All / Collapse All).
export function collectIds(nodes: MenuNode[], onlyWithChildren = false): number[] {
  return nodes.flatMap((node) => [
    ...(onlyWithChildren && node.children.length === 0 ? [] : [node.id]),
    ...collectIds(node.children, onlyWithChildren),
  ]);
}

// filterTree menyaring menu berdasarkan nama.
// Menu yang cocok tetap ditampilkan bersama seluruh induknya, supaya
// hierarkinya tidak terputus saat difilter.
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

// isDescendant mengecek apakah candidateId berada di dalam subtree root.
// Dipakai drag and drop: menu tidak boleh dipindah ke dalam submenu-nya sendiri.
export function isDescendant(root: MenuNode, candidateId: number): boolean {
  return root.children.some(
    (child) => child.id === candidateId || isDescendant(child, candidateId),
  );
}
