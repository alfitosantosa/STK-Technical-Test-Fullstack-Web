"use client";

import { useState } from "react";

import { Grid2x2Icon, PlusIcon, SearchIcon } from "lucide-react";

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
  // Semua menu level paling atas, dipakai sebagai pilihan dropdown.
  roots: MenuNode[];
  // Menu teratas yang sedang ditampilkan.
  visibleRoot: MenuNode | null;
};

// MenuToolbar berisi judul halaman, pemilih menu teratas, tombol
// Expand/Collapse All, pencarian, dan tombol tambah menu.
export function MenuToolbar({ roots, visibleRoot }: MenuToolbarProps) {
  const rootId = useMenuStore((state) => state.rootId);
  const setRootId = useMenuStore((state) => state.setRootId);
  const setExpanded = useMenuStore((state) => state.setExpanded);
  const keyword = useMenuStore((state) => state.keyword);
  const setKeyword = useMenuStore((state) => state.setKeyword);
  const showDetail = useMenuStore((state) => state.showDetail);
  const toggleDetail = useMenuStore((state) => state.toggleDetail);

  // Dialog form menu baru dibuka dari tombol Tambah.
  const [dialogTambahTerbuka, setDialogTambahTerbuka] = useState(false);

  // base-ui Select memakai peta nilai -> label untuk menampilkan pilihan terpilih.
  const rootItems = Object.fromEntries(
    roots.map((root) => [root.id, root.name]),
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Checkbox dari mockup. Visualnya mengikuti mockup (caption kecil "Menus"),
          sedangkan nama aksesibelnya menjelaskan fungsinya. */}
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
          Menus
        </label>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Grid2x2Icon className="size-4" />
        </span>
        <h1 className="font-heading text-2xl font-bold text-primary">Menus</h1>
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
            className="rounded-full bg-neutral-900 text-white hover:bg-neutral-800"
            onClick={() =>
              setExpanded(visibleRoot ? collectIds([visibleRoot], true) : [])
            }
          >
            Expand All
          </Button>
          <Button
            type="button"
            size="sm"
            className="rounded-full bg-neutral-900 text-white hover:bg-neutral-800"
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
            className="rounded-md border border-input bg-muted/40 pl-9"
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
