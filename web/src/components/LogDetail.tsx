import {
  formatJsonBlock,
  getAdditionalLogFields,
  getPrimaryLogDetails,
  renderDisplayValue,
  safeStringify,
} from "../logs/presentation";
import type { LogEntry } from "../types/log";

interface LogDetailProps {
  entry: LogEntry;
  onClose: () => void;
}

export function LogDetail({ entry, onClose }: LogDetailProps) {
  const primaryDetails = getPrimaryLogDetails(entry);
  const otherEntries = getAdditionalLogFields(entry);

  return (
    <div className="rounded-[28px] border border-[var(--accent)]/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(250,248,245,0.92))] p-5 shadow-[0_25px_80px_-48px_rgba(15,23,42,0.65)]">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
            Event detail
          </div>
          <div className="mt-1 text-sm text-[var(--muted)]">
            Full structured payload with formatted request and response bodies.
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:border-slate-300 hover:bg-slate-50"
        >
          Collapse
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {primaryDetails.map((field) => (
          <InfoBlock key={field.label} label={field.label} value={field.value} />
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <JsonPanel title="Request body" value={entry["llm.request.body"]} defaultOpen />
        <JsonPanel title="Response body" value={entry["llm.response.body"]} />
      </div>

      {otherEntries.length > 0 ? (
        <div className="mt-5 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
            Additional fields
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {otherEntries.map((field) => (
              <InfoBlock key={field.label} label={field.label} value={field.value} />
            ))}
          </div>
        </div>
      ) : null}

      <details className="mt-5 rounded-[24px] border border-slate-200 bg-white/90 px-5 py-4">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--ink)]">
          Raw event JSON
        </summary>
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 px-4 py-4 text-xs leading-6 text-slate-100">
          {safeStringify(entry)}
        </pre>
      </details>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-[24px] border border-slate-100 bg-white/85 px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-2 break-words font-mono text-sm leading-6 text-[var(--ink)]">
        {renderDisplayValue(value)}
      </div>
    </div>
  );
}

function JsonPanel({
  title,
  value,
  defaultOpen = false,
}: {
  title: string;
  value: unknown;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className="rounded-[24px] border border-slate-200 bg-white/90 px-5 py-4"
      open={defaultOpen}
    >
      <summary className="cursor-pointer text-sm font-semibold text-[var(--ink)]">{title}</summary>
      <pre className="mt-4 max-h-96 overflow-auto rounded-2xl bg-slate-950 px-4 py-4 text-xs leading-6 text-slate-100">
        {formatJsonBlock(value)}
      </pre>
    </details>
  );
}
