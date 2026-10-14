import { MenuRoute } from "@/components/menu/menu-route";

export default async function Page({ params }: PageProps<"/menus/[menus]">) {
  const { menus } = await params;

  return <MenuRoute menuId={menus} />;
}
