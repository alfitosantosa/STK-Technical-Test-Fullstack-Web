"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";

// QueryClient di browser dipakai ulang supaya cache tidak hilang saat
// halaman dirender ulang. Di server, tiap render dapat client baru supaya
// cache antar request tidak saling bocor.
let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    return new QueryClient();
  }

  browserQueryClient ??= new QueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      {children}
      {/* Aplikasi ini tidak punya mode gelap, jadi notifikasi dikunci terang
          supaya tidak ikut gelap saat sistem operasi user memakai dark mode. */}
      <Toaster position="top-right" theme="light" />
    </QueryClientProvider>
  );
}
