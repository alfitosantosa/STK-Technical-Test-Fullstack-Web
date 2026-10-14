import { describe, expect, it } from "vitest";

import { collectIds, filterTree, findNode, findParent, isDescendant, siblingNodes } from "@/lib/tree";
import type { MenuNode } from "@/lib/types";

// Id di test ini ditulis pendek supaya mudah dibaca. Di aplikasi, id selalu
// berupa CUID2 dari backend (24 karakter, huruf kecil dan angka), dan seluruh
// logika di lib/tree.ts memperlakukannya sebagai teks biasa.
//
// Bentuk data uji: satu menu teratas dengan tiga anak, dan satu menu teratas
// tanpa anak.
//   Transaksi (c14) -> Penjualan (c15), Pembelian (c16), Retur (c17)
//   Laporan (c18)   -> (tidak ada anak)
const TRANSAKSI = "c14";
const PENJUALAN = "c15";
const PEMBELIAN = "c16";
const RETUR = "c17";
const LAPORAN = "c18";

function buatMenu(isi: Partial<MenuNode> & { id: string; name: string }): MenuNode {
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
  id: TRANSAKSI,
  name: "Transaksi",
  position: 0,
  children: [
    buatMenu({ id: PENJUALAN, name: "Penjualan", parent_id: TRANSAKSI, position: 0 }),
    buatMenu({ id: PEMBELIAN, name: "Pembelian", parent_id: TRANSAKSI, position: 1 }),
    buatMenu({ id: RETUR, name: "Retur", parent_id: TRANSAKSI, position: 2 }),
  ],
});
const laporan = buatMenu({ id: LAPORAN, name: "Laporan", position: 1 });
const tree = [transaksi, laporan];

describe("findNode", () => {
  it("menemukan menu di dalam anak", () => {
    expect(findNode(tree, PENJUALAN)?.name).toBe("Penjualan");
  });

  it("mengembalikan null kalau id null atau tidak ada", () => {
    expect(findNode(tree, null)).toBeNull();
    expect(findNode(tree, "c999")).toBeNull();
  });
});

describe("findParent", () => {
  it("mengembalikan induk dari sebuah anak", () => {
    expect(findParent(tree, PEMBELIAN)?.id).toBe(TRANSAKSI);
  });

  it("mengembalikan null untuk menu level paling atas", () => {
    expect(findParent(tree, LAPORAN)).toBeNull();
  });
});

describe("siblingNodes", () => {
  it("mengembalikan daftar root kalau id berada di level paling atas", () => {
    expect(siblingNodes(tree, LAPORAN).map((s) => s.id)).toEqual([TRANSAKSI, LAPORAN]);
  });

  it("mengembalikan anak dari induk yang sama", () => {
    expect(siblingNodes(tree, PEMBELIAN).map((s) => s.id)).toEqual([
      PENJUALAN,
      PEMBELIAN,
      RETUR,
    ]);
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
    const saudara = siblingNodes(tree, RETUR).filter((s) => s.id !== PENJUALAN);
    expect(saudara.map((s) => s.id)).toEqual([PEMBELIAN, RETUR]);
    expect(saudara.findIndex((s) => s.id === RETUR)).toBe(1);
  });

  it("memindahkan Retur ke garis di atas Penjualan menghasilkan indeks 0", () => {
    const saudara = siblingNodes(tree, PENJUALAN).filter((s) => s.id !== RETUR);
    expect(saudara.map((s) => s.id)).toEqual([PENJUALAN, PEMBELIAN]);
    expect(saudara.findIndex((s) => s.id === PENJUALAN)).toBe(0);
  });

  it("menjatuhkan menu tepat di atas tetangga berikutnya tidak mengubah urutan", () => {
    const saudara = siblingNodes(tree, PEMBELIAN).filter((s) => s.id !== PENJUALAN);
    expect(saudara.map((s) => s.id)).toEqual([PEMBELIAN, RETUR]);
    expect(saudara.findIndex((s) => s.id === PEMBELIAN)).toBe(0);
  });

  // Catatan: pindah ke urutan paling akhir dilakukan lewat area drop badan
  // baris induknya (dikirim position: null), bukan lewat garis drop, karena
  // tidak ada garis drop setelah menu terakhir.
});

describe("isDescendant", () => {
  it("mendeteksi anak langsung", () => {
    expect(isDescendant(transaksi, PENJUALAN)).toBe(true);
  });

  it("tidak menganggap menu lain sebagai turunan", () => {
    expect(isDescendant(transaksi, LAPORAN)).toBe(false);
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
    expect(collectIds(tree)).toEqual([
      TRANSAKSI,
      PENJUALAN,
      PEMBELIAN,
      RETUR,
      LAPORAN,
    ]);
  });

  it("saat dipakai Expand All hanya mengambil menu yang punya anak", () => {
    // Laporan tidak punya submenu, jadi tidak perlu ikut dibuka.
    expect(collectIds(tree, true)).toEqual([TRANSAKSI]);
  });
});
