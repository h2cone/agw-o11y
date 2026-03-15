interface LoadMoreButtonProps {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}

export function LoadMoreButton({
  disabled,
  loading,
  onClick,
}: LoadMoreButtonProps) {
  return (
    <div className="flex justify-center pt-2">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="rounded-full border border-white/80 bg-white/85 px-5 py-3 text-sm font-semibold text-[var(--ink)] shadow-sm transition hover:border-[var(--accent)]/25 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Loading…" : "Load More"}
      </button>
    </div>
  );
}
