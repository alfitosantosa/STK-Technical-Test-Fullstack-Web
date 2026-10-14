import { z } from "zod";

// Aturan validasi form menu. Batasannya sengaja disamakan dengan yang dipakai
// backend (model/menu.go), supaya user tidak pernah mengirim data yang
// pasti ditolak server.
//
// Aturan panjang nama di backend: `required,min=3,max=100`.
// Aturan panjang url: `omitempty,max=255`.
export const menuFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Nama menu minimal 3 karakter")
    .max(100, "Nama menu maksimal 100 karakter"),
  url: z.string().trim().max(255, "URL maksimal 255 karakter"),
  // Id menu induk berupa CUID2 (teks), atau null untuk menu level paling atas.
  parent_id: z.string().nullable(),
});

export type MenuFormValues = z.infer<typeof menuFormSchema>;
