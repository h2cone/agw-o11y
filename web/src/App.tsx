import { Layout } from "./components/Layout";
import { LoadMoreButton } from "./components/LoadMoreButton";
import { LogList } from "./components/LogList";
import { SearchBar } from "./components/SearchBar";
import { useLogBrowser } from "./hooks/useLogBrowser";

export default function App() {
  const {
    logs,
    loading,
    requestError,
    searchError,
    hasMore,
    expandedKey,
    summary,
    submitSearch,
    loadMore,
    toggleExpanded,
  } = useLogBrowser();

  return (
    <Layout>
      <div className="space-y-6">
        <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
          <SummaryCard
            label="Active filter"
            value={summary.activeFilter}
            caption={summary.activeFilterCaption}
          />
          <SummaryCard
            label="Time window"
            value={summary.timeWindow}
            caption={summary.timeWindowCaption}
          />
          <SummaryCard
            label="Returned rows"
            value={summary.returnedRows}
            caption={summary.returnedRowsCaption}
          />
        </section>

        <SearchBar loading={loading} error={searchError} onSearch={submitSearch} />

        {requestError ? (
          <div className="panel border border-rose-200 bg-rose-50/90 px-5 py-4 text-sm text-rose-700">
            {requestError}
          </div>
        ) : null}

        <LogList
          logs={logs}
          loading={loading}
          expandedKey={expandedKey}
          onToggle={toggleExpanded}
        />

        {logs.length > 0 ? (
          <LoadMoreButton disabled={!hasMore || loading} loading={loading} onClick={loadMore} />
        ) : null}
      </div>
    </Layout>
  );
}

function SummaryCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <section className="panel px-5 py-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
        {label}
      </div>
      <div className="mt-3 break-words text-xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
        {value}
      </div>
      <div className="mt-2 text-sm leading-6 text-[var(--muted)]">{caption}</div>
    </section>
  );
}
