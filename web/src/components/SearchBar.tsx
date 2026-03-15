import { useState } from "react";
import {
  DEFAULT_FORM_STATE,
  SEARCH_MODES,
  TIME_PRESETS,
  setCustomBoundary,
  setKeyword,
  setRawQuery,
  setSearchMode,
  setTimePreset,
} from "../logs/search";
import type { SearchFormState, SearchMode, TimePreset } from "../types/log";

interface SearchBarProps {
  loading: boolean;
  error: string | null;
  onSearch: (form: SearchFormState) => void;
}

export function SearchBar({ loading, error, onSearch }: SearchBarProps) {
  const [form, setForm] = useState<SearchFormState>(DEFAULT_FORM_STATE);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(form);
  };

  const setMode = (mode: SearchMode) => {
    setForm((current) => setSearchMode(current, mode));
  };

  const setPreset = (preset: TimePreset) => {
    setForm((current) => setTimePreset(current, preset, new Date()));
  };

  return (
    <form className="panel space-y-6 px-5 py-5 sm:px-6" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
            Query mode
          </div>
          <div className="mt-3 inline-flex rounded-full border border-white/70 bg-white/75 p-1 shadow-sm">
            {SEARCH_MODES.map((mode) => {
              const active = form.mode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  className={[
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    active
                      ? "bg-[var(--accent)] text-white shadow-sm"
                      : "text-[var(--muted)] hover:text-[var(--ink)]",
                  ].join(" ")}
                  onClick={() => setMode(mode)}
                >
                  {mode === "simple" ? "Simple" : "LogsQL"}
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-2 lg:max-w-xl">
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
            Time range
          </div>
          <div className="flex flex-wrap gap-2">
            {TIME_PRESETS.map((preset) => {
              const active = form.timePreset === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  className={[
                    "rounded-full border px-3 py-2 text-sm transition",
                    active
                      ? "border-transparent bg-[var(--accent-deep)] text-white shadow-sm"
                      : "border-white/80 bg-white/75 text-[var(--muted)] hover:border-[var(--accent)]/30 hover:text-[var(--ink)]",
                  ].join(" ")}
                  onClick={() => setPreset(preset.value)}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {form.timePreset === "custom" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--ink)]">Start</span>
            <input
              type="datetime-local"
              value={form.customStart}
              onChange={(event) =>
                setForm((current) =>
                  setCustomBoundary(current, "customStart", event.target.value),
                )
              }
              className="w-full rounded-2xl border border-white/80 bg-white/85 px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--ink)]">End</span>
            <input
              type="datetime-local"
              value={form.customEnd}
              onChange={(event) =>
                setForm((current) =>
                  setCustomBoundary(current, "customEnd", event.target.value),
                )
              }
              className="w-full rounded-2xl border border-white/80 bg-white/85 px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </label>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        {form.mode === "simple" ? (
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--ink)]">Keywords</span>
            <input
              type="text"
              value={form.keyword}
              onChange={(event) =>
                setForm((current) => setKeyword(current, event.target.value))
              }
              placeholder="provider model timeout"
              className="w-full rounded-[28px] border border-white/80 bg-white/85 px-5 py-4 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </label>
        ) : (
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--ink)]">LogsQL</span>
            <textarea
              rows={4}
              value={form.rawQuery}
              onChange={(event) =>
                setForm((current) => setRawQuery(current, event.target.value))
              }
              placeholder='llm.provider:openai AND "rate limit"'
              className="min-h-32 w-full rounded-[28px] border border-white/80 bg-white/85 px-5 py-4 font-mono text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </label>
        )}

        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[28px] bg-[linear-gradient(135deg,var(--accent-deep),var(--accent))] px-6 py-4 text-sm font-semibold text-white shadow-[0_20px_50px_-28px_rgba(8,145,178,0.7)] transition hover:translate-y-[-1px] hover:shadow-[0_24px_60px_-28px_rgba(8,145,178,0.85)] disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 text-sm text-[var(--muted)] lg:flex-row lg:items-center lg:justify-between">
        <p>
          Simple mode joins words with <code className="text-[var(--ink)]">AND</code>.
          Switch to LogsQL for field filters, operators, or phrase control.
        </p>
        {error ? <p className="font-medium text-rose-600">{error}</p> : null}
      </div>
    </form>
  );
}
