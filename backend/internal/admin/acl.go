package admin

import "slices"

type ACL struct {
	ids []int64
}

func NewACL(ids []int64) ACL {
	out := append([]int64(nil), ids...)
	slices.Sort(out)
	return ACL{ids: out}
}

func (a ACL) IsAdmin(id int64) bool {
	_, ok := slices.BinarySearch(a.ids, id)
	return ok
}

func (a ACL) Empty() bool {
	return len(a.ids) == 0
}
