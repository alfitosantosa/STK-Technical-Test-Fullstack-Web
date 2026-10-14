import type { Menu, MenuNode, MenuPayload, MovePayload } from "@/lib/types";

// Alamat backend Go. Diisi lewat .env.local, ada nilai cadangan supaya
// development tetap jalan tanpa konfigurasi tambahan.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// ApiError membawa status HTTP supaya komponen bisa membedakan
// "data tidak ditemukan" dari "server sedang bermasalah".
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ValidationDetail = { field: string; rule: string };

// readErrorMessage mengubah body error API menjadi satu kalimat yang bisa
// langsung ditampilkan ke user.
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
    // Body bukan JSON, pakai pesan cadangan di bawah.
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
    // fetch hanya gagal begini kalau servernya tidak bisa dihubungi
    // (belum jalan, port salah, atau koneksi putus).
    throw new ApiError(
      `Tidak bisa menghubungi server di ${API_URL}. Pastikan backend sedang berjalan.`,
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

// menuApi adalah satu-satunya tempat yang tahu alamat dan bentuk request API.
export const menuApi = {
  list: () => request<Menu[]>("/api/menus"),

  tree: () => request<MenuNode[]>("/api/menus/tree"),

  create: (payload: MenuPayload) =>
    request<Menu>("/api/menus", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: number, payload: MenuPayload) =>
    request<Menu>(`/api/menus/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  remove: (id: number) =>
    request<void>(`/api/menus/${id}`, { method: "DELETE" }),

  // Dipakai drag and drop: pindah induk sekaligus atur urutannya.
  move: (id: number, payload: MovePayload) =>
    request<Menu>(`/api/menus/${id}/move`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
