package service

import (
	"cmp"
	"context"
	"errors"
	"slices"

	"assesment/model"
	"assesment/repository"
)

// Error yang dikembalikan service. Layer route yang mengubahnya menjadi status HTTP.
var (
	ErrNotFound       = errors.New("menu tidak ditemukan")
	ErrParentNotFound = errors.New("menu induk tidak ditemukan")
	ErrInvalidParent  = errors.New("menu induk tidak boleh menu itu sendiri atau submenu di bawahnya")
)

// MenuService berisi aturan bisnis menu: validasi induk, penentuan urutan,
// dan penyusunan menu bersarang.
type MenuService struct {
	repo *repository.MenuRepository
}

func NewMenuService(repo *repository.MenuRepository) *MenuService {
	return &MenuService{repo: repo}
}

// List mengembalikan semua menu dalam bentuk datar.
func (s *MenuService) List(ctx context.Context) ([]model.Menu, error) {
	return s.repo.FindAll(ctx)
}

// Tree mengembalikan menu bersarang. Yang dikembalikan hanya menu paling atas,
// submenu-nya ada di dalam field children.
func (s *MenuService) Tree(ctx context.Context) ([]*model.MenuNode, error) {
	menus, err := s.repo.FindAll(ctx)
	if err != nil {
		return nil, err
	}

	return buildTree(menus), nil
}

// Get mengambil satu menu.
func (s *MenuService) Get(ctx context.Context, id int64) (*model.Menu, error) {
	menu, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if menu == nil {
		return nil, ErrNotFound
	}

	return menu, nil
}

// Create menambahkan menu baru.
// Kalau position tidak dikirim, menu ditaruh di urutan paling akhir.
func (s *MenuService) Create(ctx context.Context, req model.MenuRequest) (*model.Menu, error) {
	if err := s.checkParentExists(ctx, req.ParentID); err != nil {
		return nil, err
	}

	position := 0
	if req.Position != nil {
		position = *req.Position
	} else {
		lastPosition, err := s.repo.LastPosition(ctx, req.ParentID)
		if err != nil {
			return nil, err
		}
		position = lastPosition + 1
	}

	menu := &model.Menu{
		ParentID: req.ParentID,
		Name:     req.Name,
		URL:      req.URL,
		Position: position,
	}
	if err := s.repo.Create(ctx, menu); err != nil {
		return nil, err
	}

	return menu, nil
}

// Update mengganti data menu.
//
// Position hanya diubah kalau dikirim, supaya urutan yang sudah diatur tidak
// hilang saat user cuma mengedit nama menu.
// ponytail: posisi yang dikirim langsung dipakai tanpa menggeser menu lain.
// Penggeseran sibling dikerjakan di endpoint reorder (bagian bonus).
func (s *MenuService) Update(ctx context.Context, id int64, req model.MenuRequest) (*model.Menu, error) {
	menu, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}

	if err := s.checkParentAvailable(ctx, id, req.ParentID); err != nil {
		return nil, err
	}

	menu.Name = req.Name
	menu.URL = req.URL
	menu.ParentID = req.ParentID
	if req.Position != nil {
		menu.Position = *req.Position
	}

	if err := s.repo.Update(ctx, menu); err != nil {
		return nil, err
	}

	return menu, nil
}

// Move memindahkan menu ke induk lain dan/atau mengubah urutannya.
//
// Endpoint ini melayani dua kebutuhan sekaligus: mengurutkan ulang menu dalam
// satu level (parent_id tetap, position berubah) dan memindahkan menu antar
// induk (parent_id berubah).
//
// Seluruh perubahan parent_id dan position sibling di induk lama maupun baru
// dikerjakan dalam satu transaksi, supaya urutan tidak pernah setengah jadi.
func (s *MenuService) Move(ctx context.Context, id int64, req model.MoveMenuRequest) (*model.Menu, error) {
	menu, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}

	if err := s.checkParentAvailable(ctx, id, req.ParentID); err != nil {
		return nil, err
	}

	oldParentID := menu.ParentID

	err = s.repo.Transaction(ctx, func(tx *repository.MenuRepository) error {
		// Sibling di induk baru, tanpa menu yang dipindah, sudah urut position.
		siblings, err := tx.FindSiblings(ctx, req.ParentID, id)
		if err != nil {
			return err
		}

		targetIndex := len(siblings)
		if req.Position != nil {
			targetIndex = clampIndex(*req.Position, len(siblings))
		}

		if err := tx.UpdateParentAndPosition(ctx, id, req.ParentID, targetIndex); err != nil {
			return err
		}

		// Sibling di induk baru digeser satu slot mulai dari targetIndex
		// supaya menu yang dipindah dapat tempat di posisi itu.
		for _, sibling := range planPositions(siblings, targetIndex) {
			if err := tx.UpdateParentAndPosition(ctx, sibling.ID, sibling.ParentID, sibling.Position); err != nil {
				return err
			}
		}

		// Kalau induknya berubah, urutan di induk lama ikut dirapatkan.
		if sameParent(oldParentID, req.ParentID) {
			return nil
		}

		oldSiblings, err := tx.FindSiblings(ctx, oldParentID, id)
		if err != nil {
			return err
		}

		for _, sibling := range planPositions(oldSiblings, len(oldSiblings)) {
			if err := tx.UpdateParentAndPosition(ctx, sibling.ID, sibling.ParentID, sibling.Position); err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return s.Get(ctx, id)
}

// planPositions menghitung posisi final seluruh sibling setelah satu menu
// disisipkan pada targetIndex.
//
// siblings harus sudah urut (position lalu id). Hasilnya berisi menu yang sama
// dengan posisi yang sudah dirapatkan 0..n, dengan satu slot kosong di
// targetIndex untuk menu yang dipindah. targetIndex di luar jangkauan dijepit
// ke ujung terdekat, bukan dianggap error.
//
// Dipisah dari Move supaya penomoran posisi bisa ditest tanpa database.
func planPositions(siblings []model.Menu, targetIndex int) []model.Menu {
	targetIndex = clampIndex(targetIndex, len(siblings))

	planned := make([]model.Menu, len(siblings))
	for i, menu := range siblings {
		position := i
		if i >= targetIndex {
			position = i + 1
		}

		menu.Position = position
		planned[i] = menu
	}

	return planned
}

// clampIndex menjepit index ke rentang 0..n, di mana n adalah jumlah item.
func clampIndex(index, n int) int {
	if index < 0 {
		return 0
	}
	if index > n {
		return n
	}

	return index
}

// sameParent membandingkan induk dengan memperlakukan nil sebagai NULL.
func sameParent(a, b *int64) bool {
	if a == nil || b == nil {
		return a == nil && b == nil
	}

	return *a == *b
}

// Delete menghapus satu menu beserta seluruh submenu di bawahnya.
func (s *MenuService) Delete(ctx context.Context, id int64) error {
	menu, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if menu == nil {
		return ErrNotFound
	}

	return s.repo.Delete(ctx, id)
}

// checkParentExists memastikan menu induk yang dipilih benar-benar ada.
func (s *MenuService) checkParentExists(ctx context.Context, parentID *int64) error {
	if parentID == nil {
		return nil
	}

	parent, err := s.repo.FindByID(ctx, *parentID)
	if err != nil {
		return err
	}
	if parent == nil {
		return ErrParentNotFound
	}

	return nil
}

// checkParentAvailable memastikan menu induk ada dan tidak membuat lingkaran.
//
// Caranya: telusuri ke atas mulai dari calon induk. Kalau di tengah jalan ketemu
// id menu yang sedang diedit, berarti calon induk itu ada di bawah menu ini.
func (s *MenuService) checkParentAvailable(ctx context.Context, id int64, parentID *int64) error {
	for current := parentID; current != nil; {
		if *current == id {
			return ErrInvalidParent
		}

		parent, err := s.repo.FindByID(ctx, *current)
		if err != nil {
			return err
		}
		if parent == nil {
			return ErrParentNotFound
		}

		current = parent.ParentID
	}

	return nil
}

// buildTree menyusun daftar menu datar menjadi menu bersarang.
// Dipisah dari Tree supaya bisa ditest tanpa database.
func buildTree(menus []model.Menu) []*model.MenuNode {
	nodes := make(map[int64]*model.MenuNode, len(menus))
	for _, menu := range menus {
		// Children diisi slice kosong, bukan nil, supaya JSON-nya [] bukan null.
		nodes[menu.ID] = &model.MenuNode{Menu: menu, Children: []*model.MenuNode{}}
	}

	roots := []*model.MenuNode{}
	for _, menu := range menus {
		node := nodes[menu.ID]

		// Menu tanpa induk ditampilkan di level paling atas. Menu yang induknya
		// tidak ada di daftar juga ikut ditampilkan di atas, supaya tidak hilang
		// dari response.
		if menu.ParentID == nil {
			roots = append(roots, node)
			continue
		}

		parent, found := nodes[*menu.ParentID]
		if !found {
			roots = append(roots, node)
			continue
		}

		parent.Children = append(parent.Children, node)
	}

	sortNodes(roots)
	return roots
}

// sortNodes mengurutkan menu pada setiap level berdasarkan position, lalu id.
func sortNodes(nodes []*model.MenuNode) {
	slices.SortFunc(nodes, func(a, b *model.MenuNode) int {
		if a.Position != b.Position {
			return cmp.Compare(a.Position, b.Position)
		}
		return cmp.Compare(a.ID, b.ID)
	})

	for _, node := range nodes {
		sortNodes(node.Children)
	}
}
