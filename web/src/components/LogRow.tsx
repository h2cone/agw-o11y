import { buildLogSummary } from "../logs/presentation";
import type { LogEntry } from "../types/log";

interface LogRowProps {
  entry: LogEntry;
  expanded: boolean;
  onToggle: () => void;
}

export function LogRow({ entry, expanded, onToggle }: LogRowProps) {
  const summary = buildLogSummary(entry);

  return (
    <button
      type="button"
      onClick={onToggle}
      className="group w-full rounded-[28px] border border-white/70 bg-white/82 p-5 text-left shadow-[0_20px_60px_-40px_rgba(15,23,42,0.5)] transition hover:border-[var(--accent)]/30 hover:shadow-[0_30px_80px_-40px_rgba(15,23,42,0.65)]"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={summary.providerBadgeClass}>{summary.provider}</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              {summary.model}
            </span>
            {summary.streaming ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                Streaming
              </span>
            ) : null}
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--ink)]">{summary.timestamp}</div>
            <div className="mt-1 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              {summary.message}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:min-w-80">
          <Metric label="In" value={summary.promptTokens} />
          <Metric label="Out" value={summary.completionTokens} />
          <Metric label="Total" value={summary.totalTokens} />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
        <span>{expanded ? "Hide details" : "Inspect details"}</span>
        <span className="text-[var(--accent-deep)] transition group-hover:translate-x-1">
          {expanded ? "−" : "+"}
        </span>
      </div>
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-[var(--panel-soft)] px-3 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-1 text-base font-semibold text-[var(--ink)]">{value || "—"}</div>
    </div>
  );
}
