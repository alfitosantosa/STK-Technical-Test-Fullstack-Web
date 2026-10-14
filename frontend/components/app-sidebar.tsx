"use client";

import Link from "next/link";
import { LayoutGrid, ListTree } from "lucide-react";

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
} from "@/components/ui/sidebar";
import { useMenuTree } from "@/lib/queries";
import type { MenuNode } from "@/lib/types";
import { useMenuStore } from "@/stores/menu-store";

// Sidebar aplikasi.
//
// Isi menu diambil dari API (dua level pertama: menu teratas dan anaknya),
// jadi sidebar selalu mengikuti data yang sedang dikelola. Halaman "Menus"
// sendiri ditulis statis karena dia memang halaman yang sedang dibuka.
export function AppSidebar() {
  const { data: roots, isPending, error } = useMenuTree();
  const { selectedId, select, setRootId } = useMenuStore();

  // Memilih menu dari sidebar sekaligus menentukan menu teratas yang
  // ditampilkan di halaman, supaya menu yang dipilih pasti terlihat.
  const openFromSidebar = (root: MenuNode, node: MenuNode) => {
    setRootId(root.id);
    select(node.id);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground">
            <LayoutGrid className="size-4" />
          </div>
          <span className="font-heading text-sm font-semibold tracking-wider group-data-[collapsible=icon]:hidden">
            MAKALUX
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Halaman</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive tooltip="Menus" render={<Link href="/" />}>
                  <ListTree />
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
                {roots.map((root) => (
                  <SidebarMenuItem key={root.id}>
                    <SidebarMenuButton
                      isActive={selectedId === root.id}
                      tooltip={root.name}
                      onClick={() => openFromSidebar(root, root)}
                    >
                      <span>{root.name}</span>
                    </SidebarMenuButton>

                    {root.children.length > 0 && (
                      <SidebarMenuSub>
                        {root.children.map((child) => (
                          <SidebarMenuSubItem key={child.id}>
                            <SidebarMenuSubButton
                              isActive={selectedId === child.id}
                              render={<button type="button" />}
                              onClick={() => openFromSidebar(root, child)}
                            >
                              <span>{child.name}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                ))}
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
