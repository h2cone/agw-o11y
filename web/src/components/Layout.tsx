import type { PropsWithChildren } from "react";

export function Layout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="panel relative overflow-hidden px-6 py-8 sm:px-8">
          <div className="absolute inset-y-0 right-0 hidden w-80 rounded-full bg-[radial-gradient(circle,rgba(17,151,147,0.16),transparent_70%)] md:block" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--muted)]">
                AgentGateway observability
              </p>
              <div>
                <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                  Access Logs
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
                  Browse recent requests, inspect structured LLM fields, and pivot between
                  quick keyword filters and raw LogsQL.
                </p>
              </div>
            </div>
            <div className="grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-2">
              <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em]">
                  Backing store
                </div>
                <div className="mt-1 font-medium text-[var(--ink)]">VictoriaLogs</div>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em]">
                  Flow
                </div>
                <div className="mt-1 font-medium text-[var(--ink)]">
                  AgentGateway → Vector → VictoriaLogs
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 py-6">{children}</main>
      </div>
    </div>
  );
}
