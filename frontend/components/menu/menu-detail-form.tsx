"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { DeleteMenuDialog } from "@/components/menu/delete-menu-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useMenuMutations, useMenuTree } from "@/lib/queries";
import { menuFormSchema, type MenuFormValues } from "@/lib/schemas";
import { findNode, findParent, flattenTree } from "@/lib/tree";
import { useMenuStore } from "@/stores/menu-store";

// MenuDetailForm menampilkan dan mengubah menu yang sedang dipilih.
// Menambah menu dilakukan lewat dialog terpisah (AddMenuDialog), sedangkan
// memindahkan menu dilakukan lewat drag and drop di tree.
export function MenuDetailForm() {
  const { data: roots } = useMenuTree();
  const selectedId = useMenuStore((state) => state.selectedId);
  const { update } = useMenuMutations();

  const tree = roots ?? [];
  const selected = findNode(tree, selectedId);
  const parent = selected ? findParent(tree, selected.id) : null;
  const depthOfSelected = selected
    ? (flattenTree(tree).find((entry) => entry.node.id === selected.id)?.depth ?? 0)
    : 0;

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuFormSchema),
    // `values` membuat form ikut berubah saat menu yang dipilih berganti,
    // tanpa perlu effect reset manual.
    values: {
      name: selected?.name ?? "",
      url: selected?.url ?? "",
      parent_id: selected?.parent_id ?? null,
    },
  });

  const errors = form.formState.errors;

  const onSubmit = form.handleSubmit((values) => {
    if (!selected) {
      return;
    }

    update.mutate({
      id: selected.id,
      payload: {
        name: values.name,
        url: values.url,
        parent_id: values.parent_id,
      },
    });
  });

  if (!selected) {
    return (
      <p className="text-sm text-muted-foreground">
        Pilih salah satu menu di sebelah kiri untuk melihat dan mengubah datanya.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <h2 className="font-heading text-lg font-semibold">Detail Menu</h2>

      {/* Menu ID ditampilkan sebagai teks abu-abu, mengikuti mockup:
          nilainya dibuat backend dan tidak pernah diubah dari sini. */}
      <Field>
        <FieldLabel>Menu ID</FieldLabel>
        <p className="truncate text-sm text-muted-foreground">{selected.id}</p>
      </Field>

      <Field>
        <FieldLabel htmlFor="menu-depth">Depth</FieldLabel>
        <Input
          id="menu-depth"
          value={depthOfSelected}
          readOnly
          className="rounded-md border border-input bg-muted/50 px-3 text-muted-foreground"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="menu-parent">Parent Data</FieldLabel>
        <Input
          id="menu-parent"
          value={parent ? parent.name : "—"}
          readOnly
          className="rounded-md border border-input px-3 text-muted-foreground"
        />
      </Field>

      <Field data-invalid={Boolean(errors.name)}>
        <FieldLabel htmlFor="menu-name">Name</FieldLabel>
        <Input
          id="menu-name"
          aria-invalid={Boolean(errors.name)}
          className="rounded-md border border-input px-3"
          {...form.register("name")}
        />
        <FieldError errors={[errors.name]} />
      </Field>

      <Field data-invalid={Boolean(errors.url)}>
        <FieldLabel htmlFor="menu-url">URL</FieldLabel>
        <Input
          id="menu-url"
          placeholder="/laporan/penjualan"
          aria-invalid={Boolean(errors.url)}
          className="rounded-md border border-input px-3"
          {...form.register("url")}
        />
        <FieldError errors={[errors.url]} />
      </Field>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? "Menyimpan..." : "Save"}
        </Button>
        <DeleteMenuDialog menu={selected} />
      </div>
    </form>
  );
}
