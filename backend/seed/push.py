"""Mengirim data menu dari folder seed/ ke API.

Cara pakai:
    python3 seed/push.py                                  # menus.json ke http://localhost:8080
    python3 seed/push.py --url http://localhost:4000       # server di port lain
    python3 seed/push.py --file menus-mockup.json          # pakai data lain

Field "parent" pada file JSON diisi nama menu induk, bukan id, karena id baru
diketahui setelah parent-nya dibuat. Urutan di dalam file harus parent dulu,
baru anaknya.
"""

import argparse
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

SEED_DIR = Path(__file__).parent


def post_menu(base_url, payload):
    """Kirim satu menu, kembalikan data menu dari server."""
    request = urllib.request.Request(
        f"{base_url}/api/menus",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request) as response:
        return json.load(response)


def main():
    parser = argparse.ArgumentParser(description="Kirim data menu ke API.")
    parser.add_argument("--url", default="http://localhost:8080", help="alamat server")
    parser.add_argument("--file", default="menus.json", help="nama file di folder seed/")
    args = parser.parse_args()

    base_url = args.url.rstrip("/")
    menus = json.loads((SEED_DIR / args.file).read_text())
    id_by_name = {}

    for menu in menus:
        name = menu["name"]
        if name in id_by_name:
            sys.exit(f"nama '{name}' dipakai lebih dari sekali, jadi parent tidak bisa dipastikan")

        payload = {"name": name, "url": menu.get("url", "")}
        parent_name = menu.get("parent")
        if parent_name:
            if parent_name not in id_by_name:
                sys.exit(f"parent '{parent_name}' belum dikirim, urutkan datanya dari parent ke anak")
            payload["parent_id"] = id_by_name[parent_name]

        try:
            created = post_menu(base_url, payload)
        except urllib.error.HTTPError as error:
            sys.exit(f"gagal mengirim '{name}': HTTP {error.code} {error.read().decode()}")

        id_by_name[name] = created["id"]
        print(f"id {created['id']:>3}  position {created['position']}  {created['name']}")

    print(f"\n{len(id_by_name)} menu terkirim ke {base_url}")


if __name__ == "__main__":
    main()
