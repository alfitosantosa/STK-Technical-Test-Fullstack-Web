import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Noto_Sans,
  Playfair_Display,
} from "next/font/google";

import "./globals.css";
import { Providers } from "@/app/providers";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const playfairDisplayHeading = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
});

const notoSans = Noto_Sans({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Menu Management",
  description: "Pengelolaan menu bertingkat",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={cn(
        "h-full antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        notoSans.variable,
        playfairDisplayHeading.variable,
      )}
    >
      {/* SidebarProvider harus berada di dalam body: dia merender elemen
          pembungkus, jadi tidak boleh membungkus <html>. */}
      <body className="min-h-full">
        <Providers>
          <SidebarProvider>
            <AppSidebar />
            {/* min-w-0 wajib: tanpa itu elemen flex ini menolak menyusut di
                bawah lebar min-content isinya, sehingga halaman melebar
                horizontal dan konten tertimpa sidebar yang posisinya fixed. */}
            <SidebarInset className="min-w-0">
              <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger />
              </header>
              {children}
            </SidebarInset>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
