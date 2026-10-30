"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import type { SetupStatus } from "@/lib/setup";
import s from "@/components/connect/SetupClient.module.css";

export default function SettingsClient() {
  const { data: session } = useSession();
  const [state, setState] = useState<SetupStatus | null>(null),
    [key, setKey] = useState(""),
    [prefix, setPrefix] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  async function refresh() {
    const [status, info] = await Promise.all([
      fetch("/api/setup/status"),
      fetch("/api/apikey"),
    ]);
    if (!status.ok || !info.ok)
      throw new Error("Settings could not be loaded. Retry.");
    setState(await status.json());
    setPrefix((await info.json()).prefix || "");
  }
  useEffect(() => {
    void refresh().catch((e) => setError(e.message));
  }, []);
  async function action(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await work();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }
  async function request(url: string, method: string, body?: unknown) {
    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Request failed.");
    return data;
  }
  return (
    <main className={s.page}>
      <header className={s.header}>
        <Link className={s.logo} href="/entry">
          ContextGraph
        </Link>
        <Link href="/entry">Back to context</Link>
      </header>
      <div className={s.layout}>
        <aside className={s.aside}>
          <h1>Settings</h1>
          <p>Manage how your AI tools use your context.</p>
          <Link href="/connect">Connect an AI / import more</Link>
        </aside>
        <section className={s.main}>
          {error && (
            <div role="alert" className={s.error}>
              {error}
              <button onClick={() => action(refresh)}>Retry</button>
            </div>
          )}
          <p role="status">{notice}</p>
          <h2>Automatic capture</h2>
          <p>
            After setup, connected AI tools can suggest useful notes as you
            work. The server filters them. Initial imports always require
            review.
          </p>
          <button
            role="switch"
            aria-checked={state?.captureEnabled ?? false}
            disabled={busy || !state}
            onClick={() =>
              action(async () => {
                await request("/api/setup/status", "PATCH", {
                  captureEnabled: !state?.captureEnabled,
                });
              })
            }
          >
            {state?.captureEnabled
              ? "Pause automatic capture"
              : "Enable automatic capture"}
          </button>
          {!!state?.pendingCount && (
            <p>{state.pendingCount} notes are waiting to be processed.</p>
          )}
          {!!state?.failedCount && (
            <p>
              {state.failedCount} notes need another attempt.{" "}
              <button
                disabled={busy}
                onClick={() =>
                  action(async () => {
                    await request("/api/setup/status", "PATCH", {
                      retry: true,
                    });
                    setNotice("Notes queued for the next background drain.");
                  })
                }
              >
                Retry failed notes
              </button>
            </p>
          )}
          <div className={s.alternatives}>
            <h2>Connected tools</h2>
            <p>
              These are observed client connections. Client names are reported
              by the client. Disconnecting preserves your notes.
            </p>
            {state?.connections.length ? (
              state.connections.map((c) => (
                <div key={c.id} className={s.connection}>
                  <div>
                    <strong>{c.client_name}</strong>
                    <p>
                      {c.revoked_at
                        ? "Disconnected"
                        : `Last activity: ${new Date(c.last_seen).toLocaleString()}`}
                    </p>
                    {!c.revoked_at && (
                      <button
                        disabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              "Disconnect this client? Saved notes will remain.",
                            )
                          )
                            void action(async () => {
                              await request(
                                `/api/connections/${c.id}`,
                                "DELETE",
                              );
                            });
                        }}
                      >
                        Disconnect
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p>No authenticated client activity yet.</p>
            )}
          </div>
          <div className={s.alternatives}>
            <h2>API key for terminal clients</h2>
            <p>
              Claude and ChatGPT web use OAuth. Existing API-key clients can
              continue using the <code>x-api-key</code> header. Keys are shown
              in full only when generated.
            </p>
            <p>
              {prefix
                ? `Current key prefix: ${prefix}`
                : "No API key has been generated."}
            </p>
            <button
              disabled={busy}
              onClick={() => {
                if (
                  prefix &&
                  !window.confirm(
                    "Replace the API key? Existing API-key clients will need the new key.",
                  )
                )
                  return;
                void action(async () => {
                  const data = await request("/api/apikey", "POST");
                  setKey(data.key);
                  setNotice("Key created. Copy and store it now.");
                });
              }}
            >
              {prefix ? "Replace API key" : "Generate API key"}
            </button>
            {key && (
              <>
                <label htmlFor="new-api-key">New API key</label>
                <input id="new-api-key" readOnly value={key} />
                <button
                  onClick={() =>
                    action(async () => {
                      await navigator.clipboard.writeText(key);
                      setNotice("API key copied.");
                    })
                  }
                >
                  Copy new key
                </button>
              </>
            )}
          </div>
          <div className={s.alternatives}>
            <h2>Account</h2>
            <p>
              {session?.user?.name}
              <br />
              {session?.user?.email}
            </p>
            <p className={s.small}>
              Profile editing, full account deletion, and downloadable export
              are not available in this demo. Individual context and note
              deletion work in the dashboard.
            </p>
            <Link href="/privacy">Data processing & retention</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
