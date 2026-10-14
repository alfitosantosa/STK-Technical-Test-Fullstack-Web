import { describe, expect, it } from "vitest";

import { collectIds, filterTree, findNode, findParent, isDescendant, siblingNodes } from "@/lib/tree";
import type { MenuNode } from "@/lib/types";

// Bentuk data uji: satu menu teratas dengan tiga anak, dan satu menu teratas
// tanpa anak.
//   Transaksi (14) -> Penjualan (15), Pembelian (16), Retur (17)
//   Laporan (18)   -> (tidak ada anak)
function buatMenu(isi: Partial<MenuNode> & { id: number; name: string }): MenuNode {
  return {
    parent_id: null,
    url: "",
    position: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    children: [],
    ...isi,
  };
}

const transaksi = buatMenu({
  id: 14,
  name: "Transaksi",
  position: 0,
  children: [
    buatMenu({ id: 15, name: "Penjualan", parent_id: 14, position: 0 }),
    buatMenu({ id: 16, name: "Pembelian", parent_id: 14, position: 1 }),
    buatMenu({ id: 17, name: "Retur", parent_id: 14, position: 2 }),
  ],
});
const laporan = buatMenu({ id: 18, name: "Laporan", position: 1 });
const tree = [transaksi, laporan];

describe("findNode", () => {
  it("menemukan menu di dalam anak", () => {
    expect(findNode(tree, 15)?.name).toBe("Penjualan");
  });

  it("mengembalikan null kalau id null atau tidak ada", () => {
    expect(findNode(tree, null)).toBeNull();
    expect(findNode(tree, 999)).toBeNull();
  });
});

describe("findParent", () => {
  it("mengembalikan induk dari sebuah anak", () => {
    expect(findParent(tree, 16)?.id).toBe(14);
  });

  it("mengembalikan null untuk menu level paling atas", () => {
    expect(findParent(tree, 18)).toBeNull();
  });
});

describe("siblingNodes", () => {
  it("mengembalikan daftar root kalau id berada di level paling atas", () => {
    expect(siblingNodes(tree, 18).map((s) => s.id)).toEqual([14, 18]);
  });

  it("mengembalikan anak dari induk yang sama", () => {
    expect(siblingNodes(tree, 16).map((s) => s.id)).toEqual([15, 16, 17]);
  });
});

// Perhitungan paling penting untuk drag and drop.
//
// Garis drop di atas sebuah menu berarti "sisipkan tepat di atas menu itu".
// Indeksnya dihitung dari daftar saudara TANPA menu yang sedang dipindah,
// karena backend mengeluarkan menu itu dari urutan lamanya lebih dulu lalu
// menyisipkannya di indeks yang dikirim. Memakai indeks dari daftar lengkap
// membuat menu mendarat satu langkah terlalu jauh.
describe("indeks drop dihitung tanpa menu yang dipindah", () => {
  it("memindahkan Penjualan ke garis di atas Retur menghasilkan indeks 1, bukan 2", () => {
    const saudara = siblingNodes(tree, 17).filter((s) => s.id !== 15);
    expect(saudara.map((s) => s.id)).toEqual([16, 17]);
    expect(saudara.findIndex((s) => s.id === 17)).toBe(1);
  });

  it("memindahkan Retur ke garis di atas Penjualan menghasilkan indeks 0", () => {
    const saudara = siblingNodes(tree, 15).filter((s) => s.id !== 17);
    expect(saudara.map((s) => s.id)).toEqual([15, 16]);
    expect(saudara.findIndex((s) => s.id === 15)).toBe(0);
  });

  it("menjatuhkan menu tepat di atas tetangga berikutnya tidak mengubah urutan", () => {
    const saudara = siblingNodes(tree, 16).filter((s) => s.id !== 15);
    expect(saudara.map((s) => s.id)).toEqual([16, 17]);
    expect(saudara.findIndex((s) => s.id === 16)).toBe(0);
  });

  // Catatan: pindah ke urutan paling akhir dilakukan lewat area drop badan
  // baris induknya (dikirim position: null), bukan lewat garis drop, karena
  // tidak ada garis drop setelah menu terakhir.
});

describe("isDescendant", () => {
  it("mendeteksi anak langsung", () => {
    expect(isDescendant(transaksi, 15)).toBe(true);
  });

  it("tidak menganggap menu lain sebagai turunan", () => {
    expect(isDescendant(transaksi, 18)).toBe(false);
  });
});

describe("filterTree", () => {
  it("mengembalikan semua menu kalau kata kunci kosong", () => {
    expect(filterTree(tree, "  ")).toHaveLength(2);
  });

  it("menyaring tanpa membuang induk dari hasil yang cocok", () => {
    const hasil = filterTree(tree, "penjualan");
    expect(hasil.map((n) => n.name)).toEqual(["Transaksi"]);
    expect(hasil[0].children.map((n) => n.name)).toEqual(["Penjualan"]);
  });

  it("mengembalikan daftar kosong kalau tidak ada yang cocok", () => {
    expect(filterTree(tree, "tidak-ada")).toEqual([]);
  });
});

describe("collectIds", () => {
  it("mengumpulkan semua id", () => {
    expect(collectIds(tree)).toEqual([14, 15, 16, 17, 18]);
  });

  it("saat dipakai Expand All hanya mengambil menu yang punya anak", () => {
    // Laporan (18) tidak punya submenu, jadi tidak perlu ikut dibuka.
    expect(collectIds(tree, true)).toEqual([14]);
  });
});
