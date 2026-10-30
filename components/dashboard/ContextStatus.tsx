"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { SetupStatus } from "@/lib/setup";
export function ContextStatus() {
  const [state, setState] = useState<SetupStatus | null>(null);
  useEffect(() => {
    let active = true;
    const update = async () => {
      if (document.hidden) return;
      try {
        const r = await fetch("/api/setup/status");
        if (r.ok && active) setState(await r.json());
      } catch {}
    };
    void update();
    const timer = setInterval(update, 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);
  return (
    <nav
      aria-label="Context actions"
      className="flex flex-wrap items-center gap-4 border-b border-[var(--border)] bg-[var(--surface)] px-6 py-2 text-sm text-[var(--text-secondary)]"
    >
      <Link
        className="inline-flex min-h-11 items-center underline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        href="/connect"
      >
        Import memory / connect another AI
      </Link>
      <Link
        className="inline-flex min-h-11 items-center underline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        href="/settings"
      >
        Capture & connections
      </Link>
      <span role="status">
        {state
          ? state.failedCount
            ? `${state.failedCount} notes need retry in Settings`
            : state.pendingCount
              ? `${state.pendingCount} notes processing`
              : state.captureEnabled
                ? "Automatic capture enabled"
                : "Automatic capture paused"
          : ""}
      </span>
    </nav>
  );
}
