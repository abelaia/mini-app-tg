package admin

import "testing"

func TestACL(t *testing.T) {
    acl := NewACL([]int64{42, 7, 7})
    if !acl.IsAdmin(7) || !acl.IsAdmin(42) || acl.IsAdmin(1) {
        t.Fatal("acl mismatch")
    }
    if NewACL(nil).IsAdmin(1) {
        t.Fatal("empty acl should deny")
    }
}
