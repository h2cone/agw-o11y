package main

import "path/filepath"

func staticAssetCandidate(staticDir, requestPath string) string {
	cleanPath := filepath.Clean("/" + requestPath)
	if cleanPath == "/" {
		return ""
	}

	return filepath.Join(staticDir, cleanPath)
}
