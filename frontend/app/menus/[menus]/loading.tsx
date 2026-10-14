import { MenuPage } from "@/components/menu/menu-page";

// Isi halaman selagi /menus/<id> menunggu nilai `params`. MenuPage merender
// keadaan "sedang memuat" yang sama dengan halaman "/", jadi tidak ada
// pergeseran tata letak saat isi sebenarnya masuk.
export default function Loading() {
  return <MenuPage />;
}
