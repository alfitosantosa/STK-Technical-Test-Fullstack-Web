package service

import (
	"testing"

	"assesment/model"
)

// Penomoran posisi saudara setelah satu menu disisipkan harus rapat 0..n, tanpa
// bolong dan tanpa duplikat, dengan satu slot kosong di index sisip.
func TestPlanPositions(t *testing.T) {
	siblings := []model.Menu{
		{ID: "m1", Name: "Satu", Position: 0},
		{ID: "m2", Name: "Dua", Position: 1},
		{ID: "m3", Name: "Tiga", Position: 2},
	}

	tests := []struct {
		nama        string
		targetIndex int
		want        []int
	}{
		{
			nama:        "sisip di paling atas",
			targetIndex: 0,
			want:        []int{1, 2, 3},
		},
		{
			nama:        "sisip di tengah",
			targetIndex: 1,
			want:        []int{0, 2, 3},
		},
		{
			nama:        "sisip di paling akhir",
			targetIndex: 3,
			want:        []int{0, 1, 2},
		},
		{
			nama:        "index di luar jangkauan dijepit ke akhir",
			targetIndex: 99,
			want:        []int{0, 1, 2},
		},
	}

	for _, tt := range tests {
		t.Run(tt.nama, func(t *testing.T) {
			planned := planPositions(siblings, tt.targetIndex)

			if len(planned) != len(siblings) {
				t.Fatalf("jumlah sibling = %d, mau %d", len(planned), len(siblings))
			}

			for i, menu := range planned {
				if menu.ID != siblings[i].ID {
					t.Errorf("urutan sibling ke-%d = id %s, mau id %s", i, menu.ID, siblings[i].ID)
				}
				if menu.Position != tt.want[i] {
					t.Errorf("posisi id %s = %d, mau %d", menu.ID, menu.Position, tt.want[i])
				}
			}
		})
	}
}

func TestPlanPositionsRapatTanpaDuplikat(t *testing.T) {
	siblings := []model.Menu{
		{ID: "m1", Position: 0},
		{ID: "m2", Position: 5},
		{ID: "m3", Position: 9},
	}

	planned := planPositions(siblings, 2)

	terpakai := map[int]bool{}
	for _, menu := range planned {
		if terpakai[menu.Position] {
			t.Errorf("posisi %d dipakai lebih dari satu menu", menu.Position)
		}
		terpakai[menu.Position] = true
	}

	// targetIndex 2 -> yang terpakai 0, 1, dan 3 (slot 2 buat menu yang pindah).
	for _, position := range []int{0, 1, 3} {
		if !terpakai[position] {
			t.Errorf("posisi %d tidak terpakai, urutan tidak rapat", position)
		}
	}
}
