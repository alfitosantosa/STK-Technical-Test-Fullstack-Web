"use client";

import { useSyncExternalStore } from "react";

// Nilainya cuma berubah sekali dan tidak bisa dilanggan, jadi subscribe-nya
// kosong. Harus stabil, karena itu ditaruh di luar komponen (React membandingkan
// alamatnya antar render).
function subscribe() {
  return () => {};
}

// False di server dan pada render pertama klien, true setelah komponen terpasang.
//
// Dipakai buat menahan tampilan yang bergantung pada keadaan klien (misalnya cache
// React Query): HTML dari server tidak pernah memuat keadaan itu, jadi
// menampilkannya lebih awal bikin hydration React bentrok.
//
// Pemeriksaannya per komponen, bukan variabel global, supaya komponen yang
// di-hydrate belakangan tetap dapat render pertama yang sama dengan HTML server.
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
