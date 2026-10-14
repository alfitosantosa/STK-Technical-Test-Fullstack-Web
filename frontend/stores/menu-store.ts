"use client";

import { create } from "zustand";

import type { MenuId } from "@/lib/types";

// State UI murni: apa yang sedang dibuka dan dipilih. Data menunya ada di React
// Query, supaya tidak ada dua sumber data yang bisa berbeda isi.
type MenuStore = {
  selectedId: MenuId | null;
  expandedIds: MenuId[];
  keyword: string;
  rootId: MenuId | null;
  showDetail: boolean;
  select: (id: MenuId | null) => void;
  setExpanded: (ids: MenuId[]) => void;
  toggleExpanded: (id: MenuId) => void;
  setKeyword: (keyword: string) => void;
  setRootId: (rootId: MenuId | null) => void;
  toggleDetail: () => void;
};

export const useMenuStore = create<MenuStore>((set) => ({
  selectedId: null,
  expandedIds: [],
  keyword: "",
  rootId: null,
  showDetail: true,

  select: (id) => set({ selectedId: id }),

  setExpanded: (ids) => set({ expandedIds: ids }),

  toggleExpanded: (id) =>
    set((state) => ({
      expandedIds: state.expandedIds.includes(id)
        ? state.expandedIds.filter((expandedId) => expandedId !== id)
        : [...state.expandedIds, id],
    })),

  setKeyword: (keyword) => set({ keyword }),

  setRootId: (rootId) => set({ rootId }),

  toggleDetail: () => set((state) => ({ showDetail: !state.showDetail })),
}));
