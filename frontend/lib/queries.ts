"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { menuApi } from "@/lib/api";
import type { MenuPayload, MovePayload } from "@/lib/types";

// Semua query menu memakai key ini, jadi satu invalidate sudah cukup untuk
// menyegarkan seluruh tampilan (tree, sidebar, dan form) setelah data berubah.
export const menuKeys = {
  all: ["menus"] as const,
  tree: () => [...menuKeys.all, "tree"] as const,
};

// useMenuTree mengambil menu bersarang.
// Sidebar dan halaman memakai hook yang sama, jadi requestnya otomatis
// diambil dari cache yang sama (React Query yang mengurus).
export function useMenuTree() {
  return useQuery({
    queryKey: menuKeys.tree(),
    queryFn: menuApi.tree,
    // Data ini hanya berubah lewat aplikasi ini sendiri, jadi 30 detik
    // cukup untuk menahan refetch yang tidak perlu.
    staleTime: 30_000,
  });
}

// useMenuMutations mengumpulkan semua aksi yang mengubah data.
// Setiap aksi menyegarkan cache dan menampilkan notifikasi di satu tempat,
// supaya komponen tidak perlu mengulang keduanya.
export function useMenuMutations() {
  const queryClient = useQueryClient();

  const refreshMenus = () =>
    queryClient.invalidateQueries({ queryKey: menuKeys.all });

  const showError = (error: Error) => toast.error(error.message);

  const create = useMutation({
    mutationFn: (payload: MenuPayload) => menuApi.create(payload),
    onSuccess: (menu) => {
      toast.success(`Menu "${menu.name}" ditambahkan`);
      void refreshMenus();
    },
    onError: showError,
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: MenuPayload }) =>
      menuApi.update(id, payload),
    onSuccess: (menu) => {
      toast.success(`Menu "${menu.name}" disimpan`);
      void refreshMenus();
    },
    onError: showError,
  });

  const remove = useMutation({
    mutationFn: (id: number) => menuApi.remove(id),
    onSuccess: () => {
      toast.success("Menu dihapus");
      void refreshMenus();
    },
    onError: showError,
  });

  const move = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: MovePayload }) =>
      menuApi.move(id, payload),
    onSuccess: () => {
      toast.success("Urutan menu diperbarui");
      void refreshMenus();
    },
    onError: (error) => {
      // Kalau server menolak (misalnya memindah menu ke dalam submenu-nya
      // sendiri), tampilkan alasan aslinya.
      toast.error(error.message);
      void refreshMenus();
    },
  });

  return { create, update, remove, move };
}
