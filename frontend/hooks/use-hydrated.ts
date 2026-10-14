"use client";

import { useSyncExternalStore } from "react";

// Nilai "sudah di-hydrate" hanya berubah sekali dan tidak bisa dilanggan, jadi
// subscribe-nya kosong. Fungsinya harus stabil, karena itu ditaruh di luar
// komponen (React membandingkan alamatnya antar render).
function subscribe() {
  return () => {};
}

// useHydrated memberi tahu apakah komponen ini sudah selesai di-hydrate.
//
// Nilainya false di server dan pada render pertama klien saat hydration, lalu
// true setelah komponen terpasang. Dipakai untuk menahan tampilan yang
// bergantung pada keadaan klien (misalnya data dari cache React Query): HTML
// dari server tidak pernah memuat keadaan itu, jadi menampilkannya lebih awal
// membuat hydration React bentrok.
//
// Pemeriksaannya per komponen (bukan variabel global) supaya komponen yang
// di-hydrate belakangan tetap mendapat render pertama yang sama dengan HTML
// dari server.
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
