package packages

import "testing"

func TestIsValidPackageName(t *testing.T) {
	valid := []string{"nginx", "openssh-server", "foo.bar", "libssl3"}
	for _, p := range valid {
		if !isValidPackageName(p) {
			t.Fatalf("expected valid package name: %s", p)
		}
	}
	invalid := []string{"", "Pkg", "nginx;id", "a b"}
	for _, p := range invalid {
		if isValidPackageName(p) {
			t.Fatalf("expected invalid package name: %s", p)
		}
	}
}

func TestIsValidSearchQuery(t *testing.T) {
	if !isValidSearchQuery("nginx web") {
		t.Fatal("expected valid search query")
	}
	if isValidSearchQuery("nginx;rm") {
		t.Fatal("expected invalid search query")
	}
}
