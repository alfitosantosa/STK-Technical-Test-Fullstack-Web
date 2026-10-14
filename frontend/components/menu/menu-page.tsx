"use client";

import { useEffect, useMemo } from "react";

import { MenuDetailForm } from "@/components/menu/menu-detail-form";
import { MenuToolbar } from "@/components/menu/menu-toolbar";
import { MenuTree } from "@/components/menu/menu-tree";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMenuTree } from "@/lib/queries";
import { filterTree } from "@/lib/tree";
import { useMenuStore } from "@/stores/menu-store";

// MenuPage menyusun halaman pengelolaan menu:
// toolbar di atas, tree di kiri, panel detail di kanan
// (di layar kecil panel detail menempel di bawah).
export function MenuPage() {
  const { data: roots, isPending, error, refetch } = useMenuTree();
  const rootId = useMenuStore((state) => state.rootId);
  const setRootId = useMenuStore((state) => state.setRootId);
  const selectedId = useMenuStore((state) => state.selectedId);
  const select = useMenuStore((state) => state.select);
  const keyword = useMenuStore((state) => state.keyword);
  const showDetail = useMenuStore((state) => state.showDetail);

  const tree = useMemo(() => roots ?? [], [roots]);
  const visibleRoot = tree.find((root) => root.id === rootId) ?? tree[0] ?? null;

  // Menu teratas pertama dipilih otomatis supaya dropdown dan tree tidak kosong.
  useEffect(() => {
    if (rootId === null && tree.length > 0) {
      setRootId(tree[0].id);
    }
  }, [rootId, tree, setRootId]);

  // Belum ada menu yang dipilih: pakai menu teratas supaya panel detail terisi.
  useEffect(() => {
    if (selectedId === null && visibleRoot) {
      select(visibleRoot.id);
    }
  }, [selectedId, visibleRoot, select]);

  // Hasil penyaringan dihitung ulang hanya saat tree atau kata kunci berubah,
  // bukan setiap kali komponen ini render.
  // ponytail: seluruh baris yang terbuka dirender sekaligus. Kalau nanti ada
  // ribuan menu, ganti dengan virtualisasi daftar.
  const nodes = useMemo(
    () => (visibleRoot ? filterTree([visibleRoot], keyword) : []),
    [visibleRoot, keyword],
  );

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      {/* min-w-0 wajib pada section: tanpa itu baris toolbar di dalamnya
          menentukan lebar min-content dan mendorong panel detail keluar layar. */}
      <section className="min-w-0 flex-1 p-4 lg:p-6">
        <MenuToolbar roots={tree} visibleRoot={visibleRoot} />

        <div className="mt-6">
          {isPending && <TreeSkeleton />}

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p className="font-medium text-destructive">Gagal memuat menu</p>
              <p className="mt-1 text-muted-foreground">{error.message}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => void refetch()}
              >
                Coba lagi
              </Button>
            </div>
          )}

          {!isPending && !error && nodes.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {keyword.trim() === ""
                ? "Belum ada menu. Klik Tambah untuk membuat menu pertama."
                : `Tidak ada menu yang cocok dengan "${keyword}".`}
            </p>
          )}

          {!isPending && !error && nodes.length > 0 && (
            <MenuTree nodes={nodes} fullTree={tree} />
          )}
        </div>
      </section>

      {showDetail && (
        <aside className="sticky bottom-0 z-10 max-h-[55vh] overflow-y-auto border-t bg-background p-4 shadow-[0_-6px_16px_rgba(0,0,0,0.06)] lg:static lg:max-h-none lg:w-[22rem] lg:shrink-0 lg:overflow-visible lg:border-t-0 lg:border-l lg:p-6 lg:shadow-none">
          <MenuDetailForm />
        </aside>
      )}
    </div>
  );
}

function TreeSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2, 3, 4].map((index) => (
        <Skeleton
          key={index}
          className="h-8"
          style={{ marginLeft: (index % 3) * 18, width: `${70 - (index % 3) * 10}%` }}
        />
      ))}
    </div>
  );
}
