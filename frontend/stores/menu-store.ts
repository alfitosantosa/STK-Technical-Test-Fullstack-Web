"use client";

import { create } from "zustand";

// State UI murni: apa yang sedang dibuka dan dipilih di layar.
// Data menu sendiri tidak disimpan di sini — itu urusan React Query,
// supaya tidak ada dua sumber data yang bisa berbeda isi.
type MenuStore = {
  selectedId: number | null;
  expandedIds: number[];
  keyword: string;
  rootId: number | null;
  mode: "edit" | "create";
  showDetail: boolean;
  select: (id: number | null) => void;
  setExpanded: (ids: number[]) => void;
  toggleExpanded: (id: number) => void;
  setKeyword: (keyword: string) => void;
  setRootId: (rootId: number | null) => void;
  startCreate: () => void;
  cancelCreate: () => void;
  toggleDetail: () => void;
};

export const useMenuStore = create<MenuStore>((set) => ({
  selectedId: null,
  expandedIds: [],
  keyword: "",
  rootId: null,
  mode: "edit",
  // Panel detail tampil secara bawaan; checkbox di toolbar bisa
  // menyembunyikannya supaya daftar menu dapat ruang lebih luas.
  showDetail: true,

  // Memilih menu di tree berarti keluar dari mode tambah.
  select: (id) => set({ selectedId: id, mode: "edit" }),

  setExpanded: (ids) => set({ expandedIds: ids }),

  toggleExpanded: (id) =>
    set((state) => ({
      expandedIds: state.expandedIds.includes(id)
        ? state.expandedIds.filter((expandedId) => expandedId !== id)
        : [...state.expandedIds, id],
    })),

  setKeyword: (keyword) => set({ keyword }),

  setRootId: (rootId) => set({ rootId }),

  startCreate: () => set({ mode: "create" }),

  cancelCreate: () => set({ mode: "edit" }),

  toggleDetail: () => set((state) => ({ showDetail: !state.showDetail })),
}));
