"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { DeleteMenuDialog } from "@/components/menu/delete-menu-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMenuMutations, useMenuTree } from "@/lib/queries";
import { menuFormSchema, type MenuFormValues } from "@/lib/schemas";
import { findNode, findParent, flattenTree } from "@/lib/tree";
import { useMenuStore } from "@/stores/menu-store";

// Nilai khusus untuk pilihan "level paling atas" di dropdown induk.
const ROOT_OPTION = "root";

// MenuDetailForm menampilkan dan mengubah satu menu.
// Formnya dipakai untuk dua keadaan: mengubah menu yang dipilih (mode edit)
// dan menambah menu baru (mode create).
export function MenuDetailForm() {
  const { data: roots } = useMenuTree();
  const selectedId = useMenuStore((state) => state.selectedId);
  const mode = useMenuStore((state) => state.mode);
  const select = useMenuStore((state) => state.select);
  const cancelCreate = useMenuStore((state) => state.cancelCreate);
  const { create, update } = useMenuMutations();

  const tree = roots ?? [];
  const isCreate = mode === "create";
  const selected = isCreate ? null : findNode(tree, selectedId);
  const parent = selected ? findParent(tree, selected.id) : null;
  const isSaving = create.isPending || update.isPending;

  const flatTree = flattenTree(tree);
  const depthOfSelected = selected
    ? (flatTree.find((entry) => entry.node.id === selected.id)?.depth ?? 0)
    : 0;

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuFormSchema),
    // `values` membuat form ikut berubah saat menu yang dipilih berganti,
    // tanpa perlu effect reset manual.
    values: {
      name: selected?.name ?? "",
      url: selected?.url ?? "",
      // Menu baru memakai menu yang sedang dipilih sebagai induknya.
      parent_id: isCreate ? selectedId : (selected?.parent_id ?? null),
    },
  });

  const errors = form.formState.errors;

  // useWatch dipakai menggantikan form.watch(): nilainya bisa dilacak React
  // Compiler, sedangkan form.watch() membuat komponen ini dilewati optimasi.
  const parentId = useWatch({ control: form.control, name: "parent_id" });

  // Dropdown induk hanya dipakai saat menambah menu. Saat mengubah menu,
  // induk ditampilkan sebagai data dan pemindahan dilakukan lewat drag and drop.
  const parentItems = {
    [ROOT_OPTION]: "Level paling atas",
    ...Object.fromEntries(
      flatTree.map(({ node, depth }) => [
        String(node.id),
        `${"— ".repeat(depth)}${node.name}`,
      ]),
    ),
  };

  const onSubmit = form.handleSubmit((values) => {
    if (isCreate) {
      create.mutate(
        { name: values.name, url: values.url, parent_id: values.parent_id },
        {
          onSuccess: (menu) => {
            // Setelah dibuat, menu baru langsung dipilih supaya hasilnya terlihat.
            select(menu.id);
          },
        },
      );
      return;
    }

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

  if (!isCreate && !selected) {
    return (
      <p className="text-sm text-muted-foreground">
        Pilih salah satu menu di sebelah kiri untuk melihat dan mengubah datanya.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <h2 className="font-heading text-lg font-semibold">
        {isCreate ? "Menu Baru" : "Detail Menu"}
      </h2>

      <Field>
        <FieldLabel htmlFor="menu-id">Menu ID</FieldLabel>
        <Input
          id="menu-id"
          value={selected ? String(selected.id) : "—"}
          readOnly
          className="rounded-md border border-input bg-muted/50 px-3 text-muted-foreground"
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="menu-depth">Depth</FieldLabel>
        <Input
          id="menu-depth"
          value={selected ? String(depthOfSelected) : "—"}
          readOnly
          className="rounded-md border border-input bg-muted/50 px-3 text-muted-foreground"
        />
      </Field>

      {isCreate ? (
        <Field>
          <FieldLabel htmlFor="menu-parent">Parent Data</FieldLabel>
          <Select
            items={parentItems}
            value={String(parentId ?? ROOT_OPTION)}
            onValueChange={(value) =>
              form.setValue(
                "parent_id",
                value === null || value === ROOT_OPTION ? null : Number(value),
                { shouldValidate: true },
              )
            }
          >
            <SelectTrigger
              id="menu-parent"
              className="w-full rounded-md border border-input bg-muted/40 px-3"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ROOT_OPTION}>Level paling atas</SelectItem>
              {flatTree.map(({ node, depth }) => (
                <SelectItem key={node.id} value={String(node.id)}>
                  {"— ".repeat(depth)}
                  {node.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      ) : (
        <Field>
          <FieldLabel htmlFor="menu-parent">Parent Data</FieldLabel>
          <Input
            id="menu-parent"
            value={parent ? parent.name : "—"}
            readOnly
            className="rounded-md border border-input bg-muted/50 px-3 text-muted-foreground"
          />
        </Field>
      )}

      <Field data-invalid={Boolean(errors.name)}>
        <FieldLabel htmlFor="menu-name">Name</FieldLabel>
        <Input
          id="menu-name"
          aria-invalid={Boolean(errors.name)}
          className="rounded-md border border-input bg-muted/40 px-3"
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
          className="rounded-md border border-input bg-muted/40 px-3"
          {...form.register("url")}
        />
        <FieldError errors={[errors.url]} />
      </Field>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Menyimpan..." : "Save"}
        </Button>

        {isCreate ? (
          <Button type="button" variant="outline" onClick={cancelCreate}>
            Batal
          </Button>
        ) : (
          selected && <DeleteMenuDialog menu={selected} />
        )}
      </div>
    </form>
  );
}
