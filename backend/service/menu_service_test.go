package service

import (
	"encoding/json"
	"strings"
	"testing"

	"assesment/model"
)

// Menu datar harus tersusun jadi pohon sesuai hierarki dan urutan position di
// tiap level.
func TestBuildTree(t *testing.T) {
	menus := []model.Menu{
		{ID: "m5", ParentID: new("m4"), Name: "Penjualan Harian", Position: 0},
		{ID: "m3", ParentID: new("m1"), Name: "Produk", Position: 1},
		{ID: "m1", Name: "Master Data", Position: 0},
		{ID: "m2", Name: "Laporan", Position: 1},
		{ID: "m4", ParentID: new("m1"), Name: "Kategori", Position: 0},
	}

	roots := buildTree(menus)

	if len(roots) != 2 {
		t.Fatalf("jumlah menu level atas = %d, mau 2", len(roots))
	}
	if roots[0].ID != "m1" || roots[1].ID != "m2" {
		t.Errorf("urutan menu level atas = [%s, %s], mau [m1, m2]", roots[0].ID, roots[1].ID)
	}

	if len(roots[0].Children) != 2 {
		t.Fatalf("jumlah submenu Master Data = %d, mau 2", len(roots[0].Children))
	}
	if roots[0].Children[0].ID != "m4" || roots[0].Children[1].ID != "m3" {
		t.Errorf(
			"urutan submenu Master Data = [%s, %s], mau [m4, m3] (position 0 lalu 1)",
			roots[0].Children[0].ID,
			roots[0].Children[1].ID,
		)
	}

	if len(roots[1].Children) != 0 {
		t.Errorf("jumlah submenu Laporan = %d, mau 0", len(roots[1].Children))
	}

	if len(roots[0].Children[0].Children) != 1 || roots[0].Children[0].Children[0].ID != "m5" {
		t.Errorf("submenu Kategori salah: %+v", roots[0].Children[0].Children)
	}
}

// Menu tanpa submenu harus mengirim "children": [] dan bukan null, supaya
// frontend tidak perlu menangani dua bentuk.
func TestBuildTreeChildrenNotEmpty(t *testing.T) {
	roots := buildTree([]model.Menu{{ID: "m1", Name: "Laporan"}})

	body, err := json.Marshal(roots[0])
	if err != nil {
		t.Fatalf("gagal menjadikan menu ke JSON: %v", err)
	}

	if !strings.Contains(string(body), `"children":[]`) {
		t.Errorf("JSON menu tanpa submenu = %s, mau berisi \"children\":[]", body)
	}
}

// Menu yang induknya tidak ada di daftar tetap tampil di level paling atas,
// bukan hilang dari response.
func TestBuildTreeOrphan(t *testing.T) {
	roots := buildTree([]model.Menu{{ID: "m7", ParentID: new("m99"), Name: "Menu Yatim"}})

	if len(roots) != 1 || roots[0].ID != "m7" {
		t.Errorf("menu dengan induk tidak dikenal = %+v, mau tampil di level atas", roots)
	}
}
