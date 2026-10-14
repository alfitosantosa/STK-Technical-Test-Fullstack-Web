"use client";

import Link from "next/link";
import {
  BoxesIcon,
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
} from "@/components/ui/sidebar";
import { useMenuTree } from "@/lib/queries";
import type { MenuNode } from "@/lib/types";
import { useMenuStore } from "@/stores/menu-store";

// Nama menu ditentukan user, jadi ikonnya cuma ditebak dari kata kunci yang umum;
// ada ikon cadangan kalau tidak ada yang cocok.
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

// Isi menunya dari API (menu teratas + anaknya); item "Menus" ditulis statis
// karena itu halaman yang sedang dibuka.
export function AppSidebar() {
  const { data: roots, isPending, error } = useMenuTree();
  const { selectedId, select, setRootId } = useMenuStore();

  const bukaDariSidebar = (root: MenuNode, node: MenuNode) => {
    setRootId(root.id);
    select(node.id);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 py-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-sidebar-accent text-sidebar-accent-foreground">
            <LayoutGridIcon className="size-4" />
          </div>
          <span className="text-sm font-semibold tracking-wider group-data-[collapsible=icon]:hidden"></span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Halaman</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive
                  tooltip="Menus"
                  render={<Link href="/" />}
                >
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
