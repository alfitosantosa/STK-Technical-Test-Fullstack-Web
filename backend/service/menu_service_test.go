package service

import (
	"encoding/json"
	"strings"
	"testing"

	"assesment/model"
)

// TestBuildTree memastikan menu datar tersusun jadi pohon sesuai hierarki
// dan urutan position pada setiap level.
//
// parent_id pada model.Menu bertipe *int64, jadi menu level atas ditulis
// dengan parent_id nil dan submenu memakai new(int64(...)).
func TestBuildTree(t *testing.T) {
	menus := []model.Menu{
		{ID: 5, ParentID: new(int64(4)), Name: "Penjualan Harian", Position: 0},
		{ID: 3, ParentID: new(int64(1)), Name: "Produk", Position: 1},
		{ID: 1, Name: "Master Data", Position: 0},
		{ID: 2, Name: "Laporan", Position: 1},
		{ID: 4, ParentID: new(int64(1)), Name: "Kategori", Position: 0},
	}

	roots := buildTree(menus)

	if len(roots) != 2 {
		t.Fatalf("jumlah menu level atas = %d, mau 2", len(roots))
	}
	if roots[0].ID != 1 || roots[1].ID != 2 {
		t.Errorf("urutan menu level atas = [%d, %d], mau [1, 2]", roots[0].ID, roots[1].ID)
	}

	if len(roots[0].Children) != 2 {
		t.Fatalf("jumlah submenu Master Data = %d, mau 2", len(roots[0].Children))
	}
	if roots[0].Children[0].ID != 4 || roots[0].Children[1].ID != 3 {
		t.Errorf(
			"urutan submenu Master Data = [%d, %d], mau [4, 3] (position 0 lalu 1)",
			roots[0].Children[0].ID,
			roots[0].Children[1].ID,
		)
	}

	if len(roots[1].Children) != 0 {
		t.Errorf("jumlah submenu Laporan = %d, mau 0", len(roots[1].Children))
	}

	// Submenu dari submenu tetap ikut tersusun.
	if len(roots[0].Children[0].Children) != 1 || roots[0].Children[0].Children[0].ID != 5 {
		t.Errorf("submenu Kategori salah: %+v", roots[0].Children[0].Children)
	}
}

// TestBuildTreeChildrenNotEmpty memastikan menu tanpa submenu mengirim
// "children": [] dan bukan null, supaya frontend tidak perlu menangani dua bentuk.
func TestBuildTreeChildrenNotEmpty(t *testing.T) {
	roots := buildTree([]model.Menu{{ID: 1, Name: "Laporan"}})

	body, err := json.Marshal(roots[0])
	if err != nil {
		t.Fatalf("gagal menjadikan menu ke JSON: %v", err)
	}

	if !strings.Contains(string(body), `"children":[]`) {
		t.Errorf("JSON menu tanpa submenu = %s, mau berisi \"children\":[]", body)
	}
}

// TestBuildTreeOrphan memastikan menu yang induknya tidak ada di daftar tetap
// ditampilkan di level paling atas, bukan hilang dari response.
func TestBuildTreeOrphan(t *testing.T) {
	roots := buildTree([]model.Menu{{ID: 7, ParentID: new(int64(99)), Name: "Menu Yatim"}})

	if len(roots) != 1 || roots[0].ID != 7 {
		t.Errorf("menu dengan induk tidak dikenal = %+v, mau tampil di level atas", roots)
	}
}
