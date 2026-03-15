package main

import (
	"net/url"
	"strings"
	"testing"
)

func TestParseLogsQueryParamsDefaults(t *testing.T) {
	params, err := parseLogsQueryParams(url.Values{})
	if err != nil {
		t.Fatalf("parseLogsQueryParams returned error: %v", err)
	}

	if params.Query != defaultQuery {
		t.Fatalf("expected default query %q, got %q", defaultQuery, params.Query)
	}
	if params.Limit != defaultLimit {
		t.Fatalf("expected default limit %d, got %d", defaultLimit, params.Limit)
	}
}

func TestParseLogsQueryParamsTrimsQueryAndForwardsRange(t *testing.T) {
	params, err := parseLogsQueryParams(url.Values{
		"query": []string{"  foo bar  "},
		"limit": []string{"25"},
		"start": []string{"  6h  "},
		"end":   []string{" now "},
	})
	if err != nil {
		t.Fatalf("parseLogsQueryParams returned error: %v", err)
	}

	if params.Query != "foo bar" {
		t.Fatalf("expected trimmed query, got %q", params.Query)
	}
	if params.Limit != 25 {
		t.Fatalf("expected parsed limit 25, got %d", params.Limit)
	}
	if params.Start != "6h" || params.End != "now" {
		t.Fatalf("expected trimmed range, got start=%q end=%q", params.Start, params.End)
	}
}

func TestParseLogsQueryParamsRejectsInvalidLimit(t *testing.T) {
	_, err := parseLogsQueryParams(url.Values{"limit": []string{"0"}})
	if err == nil {
		t.Fatal("expected invalid limit error")
	}
}

func TestParseLogsQueryParamsRejectsNonIntegerLimit(t *testing.T) {
	_, err := parseLogsQueryParams(url.Values{"limit": []string{"abc"}})
	if err == nil {
		t.Fatal("expected non-integer limit error")
	}
}

func TestBuildVictoriaLogsQueryURL(t *testing.T) {
	rawURL, err := buildVictoriaLogsQueryURL("http://victoria-logs:9428", logsQueryParams{
		Query: "foo",
		Limit: 25,
		Start: "1h",
		End:   "now",
	})
	if err != nil {
		t.Fatalf("buildVictoriaLogsQueryURL returned error: %v", err)
	}

	parsed, err := url.Parse(rawURL)
	if err != nil {
		t.Fatalf("url.Parse returned error: %v", err)
	}

	values := parsed.Query()
	if values.Get("query") != "foo" {
		t.Fatalf("expected query to be forwarded, got %q", values.Get("query"))
	}
	if values.Get("limit") != "25" {
		t.Fatalf("expected limit to be forwarded, got %q", values.Get("limit"))
	}
	if values.Get("start") != "1h" || values.Get("end") != "now" {
		t.Fatalf("expected start/end to be forwarded, got start=%q end=%q", values.Get("start"), values.Get("end"))
	}
}

func TestBuildVictoriaLogsQueryURLOmitsEmptyRange(t *testing.T) {
	rawURL, err := buildVictoriaLogsQueryURL("http://victoria-logs:9428/", logsQueryParams{
		Query: "foo",
		Limit: 10,
	})
	if err != nil {
		t.Fatalf("buildVictoriaLogsQueryURL returned error: %v", err)
	}

	parsed, err := url.Parse(rawURL)
	if err != nil {
		t.Fatalf("url.Parse returned error: %v", err)
	}

	values := parsed.Query()
	if values.Has("start") || values.Has("end") {
		t.Fatalf("expected empty range params to be omitted, got %v", values)
	}
	if parsed.Path != "/select/logsql/query" {
		t.Fatalf("unexpected path %q", parsed.Path)
	}
}

func TestBuildVictoriaLogsQueryURLRejectsInvalidBaseURL(t *testing.T) {
	if _, err := buildVictoriaLogsQueryURL("://bad", logsQueryParams{
		Query: "foo",
		Limit: 1,
	}); err == nil {
		t.Fatal("expected invalid base url error")
	}
}

func TestDecodeQueryResponse(t *testing.T) {
	body := strings.NewReader("{\"_time\":\"2026-03-15T08:00:00Z\"}\n{\"_time\":\"2026-03-15T08:01:00Z\"}\n")

	response, err := decodeQueryResponse(body)
	if err != nil {
		t.Fatalf("decodeQueryResponse returned error: %v", err)
	}

	if response.Count != 2 {
		t.Fatalf("expected count 2, got %d", response.Count)
	}
	if len(response.Logs) != 2 {
		t.Fatalf("expected 2 logs, got %d", len(response.Logs))
	}
	if response.Logs[0]["_time"] != "2026-03-15T08:00:00Z" {
		t.Fatalf("expected first timestamp to round-trip, got %#v", response.Logs[0]["_time"])
	}
}

func TestDecodeQueryResponseRejectsInvalidNDJSON(t *testing.T) {
	body := strings.NewReader("{not-json}\n")

	if _, err := decodeQueryResponse(body); err == nil {
		t.Fatal("expected invalid NDJSON error")
	}
}
