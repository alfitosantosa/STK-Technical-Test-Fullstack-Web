import { MenuRoute } from "@/components/menu/menu-route";

// /menus/<id> menampilkan pengelolaan menu untuk satu menu tertentu,
// dengan breadcrumb di posisi judul halaman.
export default async function Page({ params }: PageProps<"/menus/[menus]">) {
  const { menus } = await params;

  return <MenuRoute menuId={menus} />;
}
