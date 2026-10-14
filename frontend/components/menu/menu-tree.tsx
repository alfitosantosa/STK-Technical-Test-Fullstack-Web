"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { ChevronDownIcon, ChevronRightIcon, GripVerticalIcon } from "lucide-react";
import { toast } from "sonner";

import { useMenuMutations } from "@/lib/queries";
import { findNode, findParent, isDescendant, siblingNodes } from "@/lib/tree";
import type { MenuNode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMenuStore } from "@/stores/menu-store";

type MenuTreeProps = {
  // Menu yang ditampilkan (sudah disaring root terpilih dan kata kunci).
  nodes: MenuNode[];
  // Tree lengkap dari API, dipakai untuk menghitung induk dan urutan saat drag.
  fullTree: MenuNode[];
};

// MenuTree menampilkan menu bersarang dan mengatur drag and drop.
//
// Cara memindahkan menu: setiap baris punya dua area drop —
//   garis tipis di atas baris  -> menyisipkan menu tepat di atas baris itu
//   badan baris                -> menjadikan menu itu induknya (masuk sebagai anak)
export function MenuTree({ nodes, fullTree }: MenuTreeProps) {
  const { move } = useMenuMutations();
  const expandedIds = useMenuStore((state) => state.expandedIds);
  const toggleExpanded = useMenuStore((state) => state.toggleExpanded);

  // Jarak 4px supaya klik biasa (memilih menu) tidak terbaca sebagai drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) {
      return;
    }

    const activeId = Number(active.id);
    const [zone, targetText] = String(over.id).split(":");
    const targetId = Number(targetText);

    if (targetId === activeId) {
      return;
    }

    const activeNode = findNode(fullTree, activeId);
    if (activeNode && isDescendant(activeNode, targetId)) {
      toast.error("Menu tidak bisa dipindah ke dalam submenu-nya sendiri");
      return;
    }

    // Dijadikan anak dari menu tujuan, urutannya paling akhir.
    if (zone === "into") {
      move.mutate({
        id: activeId,
        payload: { parent_id: targetId, position: null },
      });

      if (!expandedIds.includes(targetId)) {
        toggleExpanded(targetId);
      }
      return;
    }

    // Disisipkan tepat di atas menu tujuan. Indeksnya dihitung dari daftar
    // saudara tanpa menu yang sedang dipindah, karena backend menyisipkan
    // ke daftar setelah menu itu dikeluarkan dari urutan lamanya.
    const siblings = siblingNodes(fullTree, targetId).filter(
      (sibling) => sibling.id !== activeId,
    );

    move.mutate({
      id: activeId,
      payload: {
        parent_id: findParent(fullTree, targetId)?.id ?? null,
        position: siblings.findIndex((sibling) => sibling.id === targetId),
      },
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <MenuTreeLevel nodes={nodes} depth={0} />
    </DndContext>
  );
}

function MenuTreeLevel({ nodes, depth }: { nodes: MenuNode[]; depth: number }) {
  return (
    <>
      {nodes.map((node) => (
        <MenuTreeRow key={node.id} node={node} depth={depth} />
      ))}
    </>
  );
}

function MenuTreeRow({ node, depth }: { node: MenuNode; depth: number }) {
  const selectedId = useMenuStore((state) => state.selectedId);
  const select = useMenuStore((state) => state.select);
  const expandedIds = useMenuStore((state) => state.expandedIds);
  const toggleExpanded = useMenuStore((state) => state.toggleExpanded);
  const keyword = useMenuStore((state) => state.keyword);

  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.id;
  // Saat mencari, semua hasil dibuka otomatis supaya kecocokan langsung terlihat.
  const isExpanded = keyword.trim() !== "" || expandedIds.includes(node.id);

  const { setNodeRef: setBeforeRef, isOver: isOverBefore } = useDroppable({
    id: `before:${node.id}`,
  });
  const { setNodeRef: setIntoRef, isOver: isOverInto } = useDroppable({
    id: `into:${node.id}`,
  });
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: node.id,
  });

  return (
    <div>
      <div
        ref={setBeforeRef}
        className={cn(
          "h-1.5 rounded-full transition-colors",
          isOverBefore ? "bg-primary" : "bg-transparent",
        )}
      />

      <div
        ref={setIntoRef}
        style={{ paddingLeft: depth * 18 + 4 }}
        className={cn(
          "group/row flex items-center gap-1 rounded-md pr-2 transition-colors",
          isSelected && "bg-primary/10",
          isOverInto && !isSelected && "ring-1 ring-primary/40",
          isDragging && "opacity-40",
        )}
      >
        <button
          ref={setDragRef}
          type="button"
          aria-label={`Pindahkan ${node.name}`}
          className="cursor-grab touch-none rounded p-1 text-muted-foreground/40 transition-colors group-hover/row:text-muted-foreground focus-visible:text-muted-foreground"
          {...listeners}
          {...attributes}
        >
          <GripVerticalIcon className="size-3.5" />
        </button>

        <button
          type="button"
          onClick={() => toggleExpanded(node.id)}
          aria-label={isExpanded ? `Tutup ${node.name}` : `Buka ${node.name}`}
          className={cn(
            "rounded p-1 text-muted-foreground transition-colors hover:text-foreground",
            !hasChildren && "invisible",
          )}
        >
          {isExpanded ? (
            <ChevronDownIcon className="size-3.5" />
          ) : (
            <ChevronRightIcon className="size-3.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => select(node.id)}
          className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left text-sm"
        >
          <span
            className={cn(
              "truncate",
              isSelected && "font-semibold text-primary",
            )}
          >
            {node.name}
          </span>
          {isSelected && (
            <span className="size-3.5 shrink-0 rounded-full bg-primary ring-2 ring-primary/25" />
          )}
        </button>
      </div>

      {hasChildren && isExpanded && (
        <MenuTreeLevel nodes={node.children} depth={depth + 1} />
      )}
    </div>
  );
}
