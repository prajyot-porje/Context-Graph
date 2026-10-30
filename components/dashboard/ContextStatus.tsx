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
  const connected = state?.connections.filter((c) => !c.revoked_at).length ?? 0;
  return (
    <nav
      aria-label="Context actions"
      className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-6 py-3 text-body-sm"
    >
      <p className="text-[var(--text-secondary)]" role="status">
        {state?.failedCount ? (
          <Link href="/settings" className="underline">
            {state.failedCount} notes need retry
          </Link>
        ) : state?.pendingCount ? (
          `${state.pendingCount} notes processing`
        ) : state ? (
          `${connected} AI connection${connected === 1 ? "" : "s"}`
        ) : (
          "Loading connections…"
        )}
      </p>
      <Link className="cg-nav-button" href="/connect">
        Manage connections
      </Link>
    </nav>
  );
}
