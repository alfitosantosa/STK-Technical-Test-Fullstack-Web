"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useMenuMutations } from "@/lib/queries";
import type { MenuNode } from "@/lib/types";
import { useMenuStore } from "@/stores/menu-store";

// DeleteMenuDialog meminta konfirmasi sebelum menghapus menu.
//
// Konfirmasi ini penting karena hapus di backend bersifat cascade:
// seluruh submenu di bawah menu yang dihapus ikut terhapus.
export function DeleteMenuDialog({ menu }: { menu: MenuNode }) {
  const { remove } = useMenuMutations();
  const select = useMenuStore((state) => state.select);

  const childCount = menu.children.length;

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button type="button" variant="destructive">
            Hapus
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus menu ini?</AlertDialogTitle>
          <AlertDialogDescription>
            Menu &quot;{menu.name}&quot; akan dihapus.
            {childCount > 0 &&
              ` Seluruh submenu di bawahnya (${childCount} menu langsung, termasuk semua turunannya) ikut terhapus.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              remove.mutate(menu.id, {
                onSuccess: () => select(null),
              })
            }
            disabled={remove.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
