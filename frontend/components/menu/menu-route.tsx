"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";

import { MenuBreadcrumb } from "@/components/menu/menu-breadcrumb";
import { MenuPage } from "@/components/menu/menu-page";
import { Button } from "@/components/ui/button";
import { useMenuTree } from "@/lib/queries";
import { menuPath } from "@/lib/tree";
import { useMenuStore } from "@/stores/menu-store";

// MenuRoute membuka satu menu lewat alamat /menus/<id>.
//
// Isinya sengaja sama dengan halaman "/" (toolbar, tree, panel detail) supaya
// perpindahan antar halaman tidak terasa seperti pindah aplikasi; yang berbeda
// hanya judulnya, diganti breadcrumb yang menunjukkan posisi menu itu.
export function MenuRoute({ menuId }: { menuId: string }) {
  const { data: roots, isPending } = useMenuTree();
  const select = useMenuStore((state) => state.select);
  const setRootId = useMenuStore((state) => state.setRootId);

  const path = useMemo(() => menuPath(roots ?? [], menuId), [roots, menuId]);
  const current = path.at(-1) ?? null;

  // Menu dari alamat ikut dipilih supaya dropdown, tree, dan panel detail
  // langsung menunjuk ke menu itu — sama seperti kalau dipilih manual di "/".
  useEffect(() => {
    if (!current) {
      return;
    }

    setRootId(path[0].id);
    select(current.id);
  }, [current, path, select, setRootId]);

  // Id tidak ada di daftar menu: jangan tampilkan tree kosong, jelaskan saja.
  if (!isPending && !current) {
    return (
      <section className="min-w-0 flex-1 p-4 lg:p-6">
        <MenuBreadcrumb path={[]} />

        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <h1 className="font-medium text-destructive">Menu tidak ditemukan.</h1>
          <p className="mt-1 text-muted-foreground">
            Tidak ada menu berid {menuId}. Mungkin menu itu sudah dihapus.
          </p>
          <Button
            variant="link"
            size="sm"
            className="mt-3 px-0"
            nativeButton={false}
            render={<Link href="/" />}
          >
            Kembali ke daftar menu
          </Button>
        </div>
      </section>
    );
  }

  return <MenuPage heading={<MenuBreadcrumb path={path} />} />;
}
