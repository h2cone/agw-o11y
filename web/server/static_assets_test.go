package main

import "testing"

func TestStaticAssetCandidate(t *testing.T) {
	if got := staticAssetCandidate("/srv/dist", "/"); got != "" {
		t.Fatalf("expected empty candidate for root path, got %q", got)
	}

	got := staticAssetCandidate("/srv/dist", "/assets/index.js")
	if got != "/srv/dist/assets/index.js" {
		t.Fatalf("unexpected asset candidate: %q", got)
	}
}

func TestStaticAssetCandidateNormalizesTraversalLikePaths(t *testing.T) {
	got := staticAssetCandidate("/srv/dist", "/../../etc/passwd")
	if got != "/srv/dist/etc/passwd" {
		t.Fatalf("expected cleaned path inside static dir, got %q", got)
	}
}
