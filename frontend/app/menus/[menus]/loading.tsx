import { MenuPage } from "@/components/menu/menu-page";

// Selagi `params` belum siap, MenuPage merender keadaan "sedang memuat" yang sama
// dengan halaman "/", jadi tidak ada pergeseran tata letak.
export default function Loading() {
  return <MenuPage />;
}
