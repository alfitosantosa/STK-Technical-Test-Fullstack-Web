"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useHydrated } from "@/hooks/use-hydrated";
import { menuApi } from "@/lib/api";
import type { MenuId, MenuPayload, MovePayload } from "@/lib/types";

// Satu key untuk semua query menu, jadi satu invalidate cukup buat menyegarkan
// seluruh tampilan (tree, sidebar, form) setelah data berubah.
export const menuKeys = {
  all: ["menus"] as const,
  tree: () => [...menuKeys.all, "tree"] as const,
};

// Dipakai sidebar dan halaman sekaligus, jadi requestnya berbagi cache yang sama.
export function useMenuTree() {
  const hydrated = useHydrated();

  const query = useQuery({
    queryKey: menuKeys.tree(),
    queryFn: menuApi.tree,
    // Data cuma berubah lewat aplikasi ini sendiri, jadi 30 detik cukup buat
    // menahan refetch yang tidak perlu.
    staleTime: 30_000,
  });

  // Server tidak punya cache React Query, jadi HTML dari server selalu berisi
  // keadaan "sedang memuat". Render pertama klien harus sama persis; kalau cache
  // sudah terisi sebelum hydration selesai, React akan membuang HTML server.
  if (hydrated) {
    return query;
  }

  return {
    ...query,
    data: undefined,
    error: null,
    status: "pending" as const,
    isPending: true,
    isSuccess: false,
    isError: false,
  };
}

// Semua aksi yang mengubah data. Refresh cache dan notifikasinya dikumpulkan di
// sini biar komponen tidak mengulang keduanya.
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
    mutationFn: ({ id, payload }: { id: MenuId; payload: MenuPayload }) =>
      menuApi.update(id, payload),
    onSuccess: (menu) => {
      toast.success(`Menu "${menu.name}" disimpan`);
      void refreshMenus();
    },
    onError: showError,
  });

  const remove = useMutation({
    mutationFn: (id: MenuId) => menuApi.remove(id),
    onSuccess: () => {
      toast.success("Menu dihapus");
      void refreshMenus();
    },
    onError: showError,
  });

  const move = useMutation({
    mutationFn: ({ id, payload }: { id: MenuId; payload: MovePayload }) =>
      menuApi.move(id, payload),
    onSuccess: () => {
      toast.success("Urutan menu diperbarui");
      void refreshMenus();
    },
    onError: (error) => {
      // Server menolak (misalnya pindah ke dalam submenu sendiri): tampilkan
      // alasan aslinya.
      toast.error(error.message);
      void refreshMenus();
    },
  });

  return { create, update, remove, move };
}
