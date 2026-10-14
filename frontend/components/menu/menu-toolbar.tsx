"use client";

import { useState, type ReactNode } from "react";

import { PlusIcon, SearchIcon } from "lucide-react";

import { AddMenuDialog } from "@/components/menu/add-menu-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { collectIds } from "@/lib/tree";
import type { MenuNode } from "@/lib/types";
import { useMenuStore } from "@/stores/menu-store";

type MenuToolbarProps = {
  // Semua menu level paling atas, buat pilihan dropdown.
  roots: MenuNode[];
  // Menu teratas yang sedang ditampilkan.
  visibleRoot: MenuNode | null;
  // Pengganti judul halaman: /menus/<id> menaruh breadcrumb di posisi judul,
  // halaman "/" membiarkannya kosong dan memakai judul bawaan.
  heading?: ReactNode;
};

export function MenuToolbar({ roots, visibleRoot, heading }: MenuToolbarProps) {
  const rootId = useMenuStore((state) => state.rootId);
  const setRootId = useMenuStore((state) => state.setRootId);
  const setExpanded = useMenuStore((state) => state.setExpanded);
  const keyword = useMenuStore((state) => state.keyword);
  const setKeyword = useMenuStore((state) => state.setKeyword);
  const showDetail = useMenuStore((state) => state.showDetail);
  const toggleDetail = useMenuStore((state) => state.toggleDetail);

  const [dialogTambahTerbuka, setDialogTambahTerbuka] = useState(false);

  // base-ui Select pakai peta nilai -> label buat menampilkan pilihan terpilih.
  const rootItems = Object.fromEntries(
    roots.map((root) => [root.id, root.name]),
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Checkbox dari mockup: visualnya ikut mockup ("Menus Detail Toggle"),
          nama aksesibelnya yang menjelaskan fungsinya. */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="toggle-detail"
          checked={showDetail}
          onCheckedChange={toggleDetail}
          aria-label="Tampilkan panel detail"
        />
        <label
          htmlFor="toggle-detail"
          className="text-sm text-muted-foreground select-none"
        >
          Menus Detail Toggle
        </label>
      </div>

      <div className="flex min-w-0 items-center">
        {heading ?? (
          <h1 className="text-2xl font-bold text-primary">Menus Page</h1>
        )}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="flex flex-col gap-1.5 lg:w-64">
          <label
            htmlFor="menu-root"
            className="text-xs font-medium text-muted-foreground"
          >
            Menu
          </label>
          <Select
            items={rootItems}
            value={rootId}
            onValueChange={(value) => setRootId(value)}
          >
            <SelectTrigger id="menu-root" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roots.map((root) => (
                <SelectItem key={root.id} value={root.id}>
                  {root.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            className="bg-neutral-900 text-white hover:bg-neutral-800"
            onClick={() =>
              setExpanded(visibleRoot ? collectIds([visibleRoot], true) : [])
            }
          >
            Expand All
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-neutral-900 text-white hover:bg-neutral-800"
            onClick={() => setExpanded([])}
          >
            Collapse All
          </Button>
        </div>

        <div className="relative lg:ml-auto lg:w-56">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Cari menu..."
            aria-label="Cari menu"
            className="border border-input bg-muted/40 pl-9"
          />
        </div>

        <Button type="button" onClick={() => setDialogTambahTerbuka(true)}>
          <PlusIcon />
          Tambah
        </Button>
      </div>

      <AddMenuDialog
        open={dialogTambahTerbuka}
        onOpenChange={setDialogTambahTerbuka}
      />
    </div>
  );
}
