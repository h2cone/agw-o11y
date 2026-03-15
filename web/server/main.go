package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const (
	defaultVictoriaLogsURL = "http://victoria-logs:9428"
	defaultStaticDir       = "/srv/dist"
	defaultPort            = "3000"
	defaultQuery           = "_time:1h | sort by (_time) desc"
	defaultLimit           = 50
)

type queryResponse struct {
	Logs  []map[string]any `json:"logs"`
	Count int              `json:"count"`
}

func main() {
	victoriaLogsURL := getenv("VICTORIA_LOGS_URL", defaultVictoriaLogsURL)
	staticDir := getenv("STATIC_DIR", defaultStaticDir)
	port := getenv("PORT", defaultPort)

	server := &appServer{
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
		victoriaLogsURL: strings.TrimRight(victoriaLogsURL, "/"),
		staticDir:       staticDir,
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/logs/query", server.handleLogsQuery)
	mux.HandleFunc("/", server.handleSPA)

	addr := ":" + port
	log.Printf("listening on %s; proxying VictoriaLogs at %s; serving assets from %s", addr, server.victoriaLogsURL, server.staticDir)
	if err := http.ListenAndServe(addr, logRequests(mux)); err != nil {
		log.Fatal(err)
	}
}

type appServer struct {
	client          *http.Client
	victoriaLogsURL string
	staticDir       string
}

func (s *appServer) handleLogsQuery(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.Header().Set("Allow", http.MethodGet)
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	params, err := parseLogsQueryParams(r.URL.Query())
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	upstreamURL, err := buildVictoriaLogsQueryURL(s.victoriaLogsURL, params)
	if err != nil {
		http.Error(w, "invalid VictoriaLogs URL", http.StatusInternalServerError)
		return
	}

	req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, upstreamURL, nil)
	if err != nil {
		http.Error(w, "failed to build upstream request", http.StatusInternalServerError)
		return
	}

	resp, err := s.client.Do(req)
	if err != nil {
		http.Error(w, fmt.Sprintf("victorialogs request failed: %v", err), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, readErr := io.ReadAll(io.LimitReader(resp.Body, 64<<10))
		if readErr != nil {
			http.Error(w, fmt.Sprintf("victorialogs returned %s", resp.Status), http.StatusBadGateway)
			return
		}
		message := strings.TrimSpace(string(body))
		if message == "" {
			message = fmt.Sprintf("victorialogs returned %s", resp.Status)
		}
		http.Error(w, message, resp.StatusCode)
		return
	}

	response, err := decodeQueryResponse(resp.Body)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to decode victorialogs response: %v", err), http.StatusBadGateway)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("encode response: %v", err)
	}
}

func (s *appServer) handleSPA(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		w.Header().Set("Allow", "GET, HEAD")
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	candidate := staticAssetCandidate(s.staticDir, r.URL.Path)
	if candidate == "" {
		s.serveIndex(w, r)
		return
	}

	if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
		http.ServeFile(w, r, candidate)
		return
	}

	s.serveIndex(w, r)
}

func (s *appServer) serveIndex(w http.ResponseWriter, r *http.Request) {
	indexPath := filepath.Join(s.staticDir, "index.html")
	if _, err := os.Stat(indexPath); err != nil {
		if errors.Is(err, os.ErrNotExist) {
			http.Error(w, "frontend assets not found", http.StatusServiceUnavailable)
			return
		}
		http.Error(w, "failed to read frontend assets", http.StatusInternalServerError)
		return
	}

	http.ServeFile(w, r, indexPath)
}

func logRequests(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(started).Round(time.Millisecond))
	})
}

func getenv(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}
