import { getLogKey } from "../logs/presentation";
import { LogDetail } from "./LogDetail";
import { LogRow } from "./LogRow";
import type { LogEntry } from "../types/log";

interface LogListProps {
  logs: LogEntry[];
  loading: boolean;
  expandedKey: string | null;
  onToggle: (key: string) => void;
}

export function LogList({ logs, loading, expandedKey, onToggle }: LogListProps) {
  if (loading && logs.length === 0) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="panel h-36 animate-pulse bg-[linear-gradient(120deg,rgba(255,255,255,0.72),rgba(244,245,247,0.88),rgba(255,255,255,0.72))]"
          />
        ))}
      </div>
    );
  }

  if (!loading && logs.length === 0) {
    return (
      <div className="panel px-6 py-10 text-center">
        <div className="text-lg font-semibold text-[var(--ink)]">No logs found</div>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Try widening the time range or relaxing the current filter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((entry, index) => {
        const key = getLogKey(entry, index);
        const expanded = expandedKey === key;

        return (
          <div key={key} className="space-y-3">
            <LogRow entry={entry} expanded={expanded} onToggle={() => onToggle(key)} />
            {expanded ? <LogDetail entry={entry} onClose={() => onToggle(key)} /> : null}
          </div>
        );
      })}
    </div>
  );
}
