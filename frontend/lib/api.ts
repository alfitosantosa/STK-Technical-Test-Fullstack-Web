import type { Menu, MenuId, MenuNode, MenuPayload, MovePayload } from "@/lib/types";

// Kosong = panggil API di origin yang sama dengan halaman (dipakai di produksi,
// request-nya diteruskan reverse proxy ke backend). Di dev diisi alamat backend.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// Membawa status HTTP supaya komponen bisa membedakan "data tidak ditemukan"
// dari "server sedang bermasalah".
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ValidationDetail = { field: string; rule: string };

// Mengubah body error API jadi satu kalimat yang bisa langsung ditampilkan.
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();

    if (Array.isArray(body?.details) && body.details.length > 0) {
      const fields = (body.details as ValidationDetail[])
        .map((detail) => `${detail.field} (${detail.rule})`)
        .join(", ");
      return `${body.error}: ${fields}`;
    }

    if (typeof body?.error === "string") {
      return body.error;
    }
  } catch {
    // Body-nya bukan JSON, pakai pesan cadangan di bawah.
  }

  return `Permintaan gagal dengan status ${response.status}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    // fetch cuma gagal begini kalau servernya tidak bisa dihubungi (belum jalan,
    // alamat salah, atau koneksi putus).
    const alamat = API_URL ? ` di ${API_URL}` : "";
    throw new ApiError(
      `Tidak bisa menghubungi server${alamat}. Pastikan backend sedang berjalan.`,
      0,
    );
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const menuApi = {
  list: () => request<Menu[]>("/api/menus"),

  tree: () => request<MenuNode[]>("/api/menus/tree"),

  create: (payload: MenuPayload) =>
    request<Menu>("/api/menus", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: MenuId, payload: MenuPayload) =>
    request<Menu>(`/api/menus/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  remove: (id: MenuId) =>
    request<void>(`/api/menus/${id}`, { method: "DELETE" }),

  // Dipakai drag and drop: pindah induk sekaligus atur urutannya.
  move: (id: MenuId, payload: MovePayload) =>
    request<Menu>(`/api/menus/${id}/move`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
