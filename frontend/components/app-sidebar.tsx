"use client";

import Link from "next/link";
import {
  BoxesIcon,
  ChevronsLeftIcon,
  CircleIcon,
  CodeIcon,
  LayoutGridIcon,
  ListTreeIcon,
  PlugIcon,
  SlidersHorizontalIcon,
  TrophyIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useMenuTree } from "@/lib/queries";
import type { MenuNode } from "@/lib/types";
import { useMenuStore } from "@/stores/menu-store";

// Ikon untuk setiap menu di sidebar.
//
// Ini murni tampilan: nama menu ditentukan user, jadi ikonnya ditebak dari
// kata kunci yang umum dan ada ikon cadangan kalau tidak ada yang cocok.
function ikonMenu(nama: string): LucideIcon {
  const teks = nama.toLowerCase();

  if (teks.includes("api")) return PlugIcon;
  if (teks.includes("code")) return CodeIcon;
  if (teks.includes("system")) return BoxesIcon;
  if (teks.includes("propert")) return SlidersHorizontalIcon;
  if (teks.includes("menu")) return ListTreeIcon;
  if (teks.includes("user") || teks.includes("group")) return UsersIcon;
  if (teks.includes("compet")) return TrophyIcon;

  return CircleIcon;
}

// Sidebar aplikasi.
//
// Isi menu diambil dari API (dua level pertama: menu teratas dan anaknya),
// jadi sidebar selalu mengikuti data yang sedang dikelola. Halaman "Menus"
// sendiri ditulis statis karena dia memang halaman yang sedang dibuka.
export function AppSidebar() {
  const { data: roots, isPending, error } = useMenuTree();
  const { selectedId, select, setRootId } = useMenuStore();
  const { toggleSidebar } = useSidebar();

  // Memilih menu dari sidebar sekaligus menentukan menu teratas yang
  // ditampilkan di halaman, supaya menu yang dipilih pasti terlihat.
  const bukaDariSidebar = (root: MenuNode, node: MenuNode) => {
    setRootId(root.id);
    select(node.id);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground">
            <LayoutGridIcon className="size-4" />
          </div>
          <span className="font-heading text-sm font-semibold tracking-wider group-data-[collapsible=icon]:hidden">
            MAKALUX
          </span>
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Lipat sidebar"
            className="ml-auto rounded p-1 text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden"
          >
            <ChevronsLeftIcon className="size-4" />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Halaman</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive tooltip="Menus" render={<Link href="/" />}>
                  <ListTreeIcon />
                  <span>Menus</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Menu aplikasi</SidebarGroupLabel>
          <SidebarGroupContent>
            {isPending && <SidebarSkeleton />}

            {error && (
              <p className="px-2 py-1 text-xs text-sidebar-foreground/70">
                Gagal memuat menu: {error.message}
              </p>
            )}

            {roots?.length === 0 && (
              <p className="px-2 py-1 text-xs text-sidebar-foreground/70">
                Belum ada menu.
              </p>
            )}

            {roots && roots.length > 0 && (
              <SidebarMenu>
                {roots.map((root) => {
                  const IkonRoot = ikonMenu(root.name);

                  return (
                    <SidebarMenuItem key={root.id}>
                      <SidebarMenuButton
                        isActive={selectedId === root.id}
                        tooltip={root.name}
                        onClick={() => bukaDariSidebar(root, root)}
                      >
                        <IkonRoot />
                        <span>{root.name}</span>
                      </SidebarMenuButton>

                      {root.children.length > 0 && (
                        <SidebarMenuSub>
                          {root.children.map((child) => {
                            const IkonAnak = ikonMenu(child.name);

                            return (
                              <SidebarMenuSubItem key={child.id}>
                                <SidebarMenuSubButton
                                  isActive={selectedId === child.id}
                                  render={<button type="button" />}
                                  onClick={() => bukaDariSidebar(root, child)}
                                >
                                  <IkonAnak />
                                  <span>{child.name}</span>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}

function SidebarSkeleton() {
  return (
    <SidebarMenu>
      {[0, 1, 2, 3].map((key) => (
        <SidebarMenuItem key={key}>
          <Skeleton className="h-8 w-full" />
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
