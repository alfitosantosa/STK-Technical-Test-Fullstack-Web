"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { flattenTree } from "@/lib/tree";
import type { MenuId } from "@/lib/types";
import { useMenuStore } from "@/stores/menu-store";

// Nilai khusus untuk pilihan "level paling atas" di dropdown induk.
const ROOT_OPTION = "root";

type AddMenuDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// AddMenuDialog menambahkan menu baru lewat form di dalam dialog.
//
// Formnya baru dipasang setiap kali dialog dibuka, jadi isinya selalu kosong
// dan induknya mengikuti menu yang sedang dipilih di tree.
export function AddMenuDialog({ open, onOpenChange }: AddMenuDialogProps) {
  const selectedId = useMenuStore((state) => state.selectedId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <AddMenuForm
          defaultParentId={selectedId}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

type AddMenuFormProps = {
  defaultParentId: MenuId | null;
  onDone: () => void;
};

function AddMenuForm({ defaultParentId, onDone }: AddMenuFormProps) {
  const { data: roots } = useMenuTree();
  const select = useMenuStore((state) => state.select);
  const { create } = useMenuMutations();

  const flatTree = flattenTree(roots ?? []);

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: {
      name: "",
      url: "",
      parent_id: defaultParentId,
    },
  });

  const errors = form.formState.errors;
  const parentId = useWatch({ control: form.control, name: "parent_id" });

  const parentItems = {
    [ROOT_OPTION]: "Level paling atas",
    ...Object.fromEntries(
      flatTree.map(({ node, depth }) => [
        node.id,
        `${"— ".repeat(depth)}${node.name}`,
      ]),
    ),
  };

  const onSubmit = form.handleSubmit((values) => {
    create.mutate(
      { name: values.name, url: values.url, parent_id: values.parent_id },
      {
        onSuccess: (menu) => {
          // Menu baru langsung dipilih supaya hasilnya terlihat di panel detail.
          select(menu.id);
          onDone();
        },
      },
    );
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle>Menu Baru</DialogTitle>
        <DialogDescription>
          Pilih menu induknya, atau pilih Level paling atas untuk membuat menu
          utama.
        </DialogDescription>
      </DialogHeader>

      <Field>
        <FieldLabel htmlFor="new-menu-parent">Parent Data</FieldLabel>
        <Select
          items={parentItems}
          value={parentId ?? ROOT_OPTION}
          onValueChange={(value) =>
            form.setValue(
              "parent_id",
              value === null || value === ROOT_OPTION ? null : value,
              { shouldValidate: true },
            )
          }
        >
          <SelectTrigger
            id="new-menu-parent"
            className="w-full rounded-md border border-input px-3"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ROOT_OPTION}>Level paling atas</SelectItem>
            {flatTree.map(({ node, depth }) => (
              <SelectItem key={node.id} value={node.id}>
                {"— ".repeat(depth)}
                {node.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field data-invalid={Boolean(errors.name)}>
        <FieldLabel htmlFor="new-menu-name">Name</FieldLabel>
        <Input
          id="new-menu-name"
          aria-invalid={Boolean(errors.name)}
          className="rounded-md border border-input px-3"
          {...form.register("name")}
        />
        <FieldError errors={[errors.name]} />
      </Field>

      <Field data-invalid={Boolean(errors.url)}>
        <FieldLabel htmlFor="new-menu-url">URL</FieldLabel>
        <Input
          id="new-menu-url"
          placeholder="/laporan/penjualan"
          aria-invalid={Boolean(errors.url)}
          className="rounded-md border border-input px-3"
          {...form.register("url")}
        />
        <FieldError errors={[errors.url]} />
      </Field>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Menyimpan..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
