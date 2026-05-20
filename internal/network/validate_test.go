package network

import "testing"

func TestIsValidPort(t *testing.T) {
	if !isValidPort("443") || !isValidPort("80:90") {
		t.Fatal("expected valid ports")
	}
	if isValidPort("80;id") || isValidPort("") {
		t.Fatal("expected invalid ports")
	}
}

func TestIsValidInterfaceName(t *testing.T) {
	if !isValidInterfaceName("eth0") {
		t.Fatal("expected valid interface")
	}
	if isValidInterfaceName("eth0;id") {
		t.Fatal("expected invalid interface")
	}
}
