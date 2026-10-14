"use client";

import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import type { MenuNode } from "@/lib/types";

type MenuBreadcrumbProps = {
  // Jalur dari menu teratas sampai menu yang sedang dibuka; kosong berarti
  // datanya belum siap atau menunya tidak ada.
  path: MenuNode[];
};

// Breadcrumb ini menggantikan judul halaman, jadi menu yang sedang dibuka dibuat
// sama dengan judul di "/" sekaligus jadi <h1>, leluhurnya dibikin redup.
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
