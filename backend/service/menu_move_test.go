package service

import (
	"testing"

	"assesment/model"
)

// TestPlanPositions memastikan penomoran posisi sibling setelah satu menu
// disisipkan selalu rapat 0..n tanpa bolong dan tanpa duplikat, dengan satu
// slot kosong di index sisip.
//
// sibling pada model.Menu dipakai apa adanya; parent_id nil berarti level atas.
func TestPlanPositions(t *testing.T) {
	siblings := []model.Menu{
		{ID: 1, Name: "Satu", Position: 0},
		{ID: 2, Name: "Dua", Position: 1},
		{ID: 3, Name: "Tiga", Position: 2},
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
					t.Errorf("urutan sibling ke-%d = id %d, mau id %d", i, menu.ID, siblings[i].ID)
				}
				if menu.Position != tt.want[i] {
					t.Errorf("posisi id %d = %d, mau %d", menu.ID, menu.Position, tt.want[i])
				}
			}
		})
	}
}

// TestPlanPositionsRapatTanpaDuplikat memastikan hasil penomoran tidak punya
// posisi kembar dan tidak ada angka yang bolong.
func TestPlanPositionsRapatTanpaDuplikat(t *testing.T) {
	siblings := []model.Menu{
		{ID: 1, Position: 0},
		{ID: 2, Position: 5},
		{ID: 3, Position: 9},
	}

	planned := planPositions(siblings, 2)

	terpakai := map[int]bool{}
	for _, menu := range planned {
		if terpakai[menu.Position] {
			t.Errorf("posisi %d dipakai lebih dari satu menu", menu.Position)
		}
		terpakai[menu.Position] = true
	}

	// targetIndex 2 -> posisi yang terpakai 0, 1, dan 3 (slot 2 untuk menu yang dipindah).
	for _, position := range []int{0, 1, 3} {
		if !terpakai[position] {
			t.Errorf("posisi %d tidak terpakai, urutan tidak rapat", position)
		}
	}
}
