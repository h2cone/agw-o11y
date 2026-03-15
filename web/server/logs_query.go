package main

import (
	"encoding/json"
	"errors"
	"io"
	"net/url"
	"strconv"
	"strings"
)

type logsQueryParams struct {
	Query string
	Limit int
	Start string
	End   string
}

func parseLogsQueryParams(values url.Values) (logsQueryParams, error) {
	params := logsQueryParams{
		Query: strings.TrimSpace(values.Get("query")),
		Limit: defaultLimit,
		Start: strings.TrimSpace(values.Get("start")),
		End:   strings.TrimSpace(values.Get("end")),
	}

	if params.Query == "" {
		params.Query = defaultQuery
	}

	if rawLimit := strings.TrimSpace(values.Get("limit")); rawLimit != "" {
		parsedLimit, err := strconv.Atoi(rawLimit)
		if err != nil || parsedLimit <= 0 {
			return logsQueryParams{}, errors.New("limit must be a positive integer")
		}
		params.Limit = parsedLimit
	}

	return params, nil
}

func buildVictoriaLogsQueryURL(baseURL string, params logsQueryParams) (string, error) {
	upstreamURL, err := url.Parse(strings.TrimRight(baseURL, "/") + "/select/logsql/query")
	if err != nil {
		return "", err
	}

	query := upstreamURL.Query()
	query.Set("query", params.Query)
	query.Set("limit", strconv.Itoa(params.Limit))
	if params.Start != "" {
		query.Set("start", params.Start)
	}
	if params.End != "" {
		query.Set("end", params.End)
	}
	upstreamURL.RawQuery = query.Encode()

	return upstreamURL.String(), nil
}

func decodeQueryResponse(body io.Reader) (queryResponse, error) {
	logs, err := decodeNDJSON(body)
	if err != nil {
		return queryResponse{}, err
	}

	return queryResponse{
		Logs:  logs,
		Count: len(logs),
	}, nil
}

func decodeNDJSON(body io.Reader) ([]map[string]any, error) {
	decoder := json.NewDecoder(body)
	logs := make([]map[string]any, 0, defaultLimit)
	for {
		var entry map[string]any
		if err := decoder.Decode(&entry); err != nil {
			if errors.Is(err, io.EOF) {
				return logs, nil
			}
			return nil, err
		}
		logs = append(logs, entry)
	}
}
