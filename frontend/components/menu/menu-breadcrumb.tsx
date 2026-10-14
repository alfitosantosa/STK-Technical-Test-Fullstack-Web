"use client";

import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import type { MenuNode } from "@/lib/types";

type MenuBreadcrumbProps = {
  // Jalur dari menu teratas sampai menu yang sedang dibuka.
  // Kosong berarti datanya belum siap atau menunya tidak ada.
  path: MenuNode[];
};

// MenuBreadcrumb menunjukkan posisi menu yang sedang dibuka di dalam hierarki:
// Menus / induk / ... / menu itu sendiri.
//
// Karena breadcrumb ini menggantikan judul halaman, menu yang sedang dibuka
// dibuat sama dengan judul di "/" (tebal, 2xl, primary) dan sekaligus menjadi
// <h1> halaman; leluhurnya memakai warna redup yang sama dengan label lain
// supaya yang menonjol tetap menu yang sedang dibuka.
export function MenuBreadcrumb({ path }: MenuBreadcrumbProps) {
  const currentId = path.at(-1)?.id ?? null;

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
        <li className="flex min-w-0 items-center gap-x-1">
          <Link
            href="/"
            className="truncate text-2xl font-bold text-muted-foreground transition-colors hover:text-primary"
          >
            Menus
          </Link>
        </li>

        {path.map((node) => (
          <li key={node.id} className="flex min-w-0 items-center gap-x-1">
            <ChevronRightIcon
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground/50"
            />

            {node.id === currentId ? (
              <h1
                aria-current="page"
                className="truncate text-2xl font-bold text-primary"
              >
                {node.name}
              </h1>
            ) : (
              <Link
                href={`/menus/${node.id}`}
                className="truncate text-2xl font-bold text-muted-foreground transition-colors hover:text-primary"
              >
                {node.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
