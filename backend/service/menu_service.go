package service

import (
	"cmp"
	"context"
	"errors"
	"slices"

	"assesment/model"
	"assesment/repository"

	"github.com/nrednav/cuid2"
)

// Error dari service; layer route yang mengubahnya jadi status HTTP.
var (
	ErrNotFound       = errors.New("menu tidak ditemukan")
	ErrParentNotFound = errors.New("menu induk tidak ditemukan")
	ErrInvalidParent  = errors.New("menu induk tidak boleh menu itu sendiri atau submenu di bawahnya")
)

type MenuService struct {
	repo *repository.MenuRepository
}

func NewMenuService(repo *repository.MenuRepository) *MenuService {
	return &MenuService{repo: repo}
}

func (s *MenuService) List(ctx context.Context) ([]model.Menu, error) {
	return s.repo.FindAll(ctx)
}

func (s *MenuService) Tree(ctx context.Context) ([]*model.MenuNode, error) {
	menus, err := s.repo.FindAll(ctx)
	if err != nil {
		return nil, err
	}

	return buildTree(menus), nil
}

func (s *MenuService) Get(ctx context.Context, id string) (*model.Menu, error) {
	menu, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if menu == nil {
		return nil, ErrNotFound
	}

	return menu, nil
}

// Create menambahkan menu. Position yang tidak dikirim berarti menu ditaruh di
// urutan paling akhir.
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
		// id dibuat aplikasi karena kolomnya TEXT (CUID2), bukan auto-increment.
		ID:       cuid2.Generate(),
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

// Update mengganti data menu. Position cuma diubah kalau dikirim, supaya urutan
// yang sudah diatur tidak hilang saat user cuma mengedit nama.
// Position yang dikirim dipakai apa adanya tanpa menggeser saudaranya;
// penggeseran dikerjakan lewat Move.
func (s *MenuService) Update(ctx context.Context, id string, req model.MenuRequest) (*model.Menu, error) {
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

// Move memindahkan menu ke induk lain dan/atau mengubah urutannya — dua-duanya
// sebenarnya operasi yang sama: menaruh satu menu di posisi tertentu di bawah
// induk tertentu.
//
// Semua perubahan parent_id dan position (di induk lama maupun baru) dikerjakan
// dalam satu transaksi, supaya urutan tidak pernah setengah jadi.
func (s *MenuService) Move(ctx context.Context, id string, req model.MoveMenuRequest) (*model.Menu, error) {
	menu, err := s.Get(ctx, id)
	if err != nil {
		return nil, err
	}

	if err := s.checkParentAvailable(ctx, id, req.ParentID); err != nil {
		return nil, err
	}

	oldParentID := menu.ParentID

	err = s.repo.Transaction(ctx, func(tx *repository.MenuRepository) error {
		// Saudara di induk baru, tanpa menu yang dipindah, sudah urut position.
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

		// Geser saudara satu slot mulai targetIndex supaya menu yang dipindah
		// dapat tempat di posisi itu.
		for _, sibling := range planPositions(siblings, targetIndex) {
			if err := tx.UpdateParentAndPosition(ctx, sibling.ID, sibling.ParentID, sibling.Position); err != nil {
				return err
			}
		}

		if sameParent(oldParentID, req.ParentID) {
			return nil
		}

		// Induknya berubah, jadi urutan di induk lama ikut dirapatkan.
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

// planPositions menghitung posisi final seluruh saudara setelah satu menu
// disisipkan di targetIndex: 0..n rapat dengan satu slot kosong di targetIndex
// untuk menu yang dipindah. siblings harus sudah urut (position lalu id), dan
// targetIndex di luar jangkauan dijepit ke ujung, bukan dianggap error.
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

func clampIndex(index, n int) int {
	if index < 0 {
		return 0
	}
	if index > n {
		return n
	}

	return index
}

func sameParent(a, b *string) bool {
	if a == nil || b == nil {
		return a == nil && b == nil
	}

	return *a == *b
}

func (s *MenuService) Delete(ctx context.Context, id string) error {
	menu, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if menu == nil {
		return ErrNotFound
	}

	return s.repo.Delete(ctx, id)
}

func (s *MenuService) checkParentExists(ctx context.Context, parentID *string) error {
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

// checkParentAvailable memastikan induk ada dan tidak bikin lingkaran: telusuri
// ke atas mulai dari calon induk, kalau ketemu id menu yang sedang diedit berarti
// calon induk itu ada di bawah menu ini.
func (s *MenuService) checkParentAvailable(ctx context.Context, id string, parentID *string) error {
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

// buildTree menyusun daftar menu datar jadi menu bersarang. Dipisah dari Tree
// supaya bisa ditest tanpa database.
func buildTree(menus []model.Menu) []*model.MenuNode {
	nodes := make(map[string]*model.MenuNode, len(menus))
	for _, menu := range menus {
		// Children diisi slice kosong, bukan nil, supaya JSON-nya [] bukan null.
		nodes[menu.ID] = &model.MenuNode{Menu: menu, Children: []*model.MenuNode{}}
	}

	roots := []*model.MenuNode{}
	for _, menu := range menus {
		node := nodes[menu.ID]

		// Tanpa induk, atau induknya tidak ada di daftar, dua-duanya tampil di
		// level paling atas supaya tidak hilang dari response.
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
