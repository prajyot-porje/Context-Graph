"use client";
import { Brand } from "@/components/ui/Brand";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  type ImportNote,
  type ImportRun,
  type Provider,
  type SetupStatus,
} from "@/lib/setup";
import s from "./SetupClient.module.css";
import { ImportReview } from "./ImportReview";
import { ConnectionGuide } from "./ConnectionGuide";
import { ProviderLogo } from "./ProviderLogo";

async function api<T>(
  url: string,
  body?: unknown,
  method = "POST",
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, {
    method: body === undefined ? "GET" : method,
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    signal,
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Something went wrong. Try again.");
  return data as T;
}
const names = {
  claude: "Claude",
  chatgpt: "ChatGPT",
  manual: "your own context",
  export: "a memory export",
};
export default function SetupClient({
  initial,
  appUrl,
}: {
  initial: SetupStatus;
  appUrl: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initial),
    [mode, setMode] = useState<
      "choose" | "manual" | "export" | "client" | "other"
    >(
      initial.run
        ? initial.run.provider === "manual"
          ? "manual"
          : initial.run.provider === "export"
            ? "export"
            : "client"
        : "choose",
    );
  const [items, setItems] = useState<ImportNote[]>(initial.run?.items ?? []);
  const [draft, setDraft] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const actionPending = useRef(false);
  const navigating = useRef(false);
  const revision = useRef(`${initial.run?.id}:${initial.run?.revision}`);
  const refreshSequence = useRef(0);
  const refreshController = useRef<AbortController | null>(null);
  const run = status.run;
  const review = run?.status === "review";
  const refresh = useCallback(async () => {
    const sequence = ++refreshSequence.current;
    refreshController.current?.abort();
    refreshController.current = new AbortController();
    const state = await api<SetupStatus>(
      "/api/setup/status",
      undefined,
      "GET",
      refreshController.current.signal,
    );
    if (sequence !== refreshSequence.current) return;
    setError("");
    const key = `${state.run?.id}:${state.run?.revision}`;
    if (key !== revision.current) {
      setItems(state.run?.items ?? []);
      revision.current = key;
    }
    setStatus(state);
  }, []);
  useEffect(() => {
    let closed = false,
      timer: ReturnType<typeof setTimeout>,
      delay = 2000;
    const tick = async () => {
      if (closed) return;
      if (!document.hidden && !actionPending.current) {
        try {
          await refresh();
          delay = Math.min(delay * 1.3, 10000);
        } catch (e) {
          if (!(e instanceof Error && e.name === "AbortError"))
            setError(
              "Could not refresh progress. Check your connection and try Refresh status.",
            );
        }
      }
      if (!closed) timer = setTimeout(tick, delay);
    };
    const focus = () => {
      if (!document.hidden && !actionPending.current)
        void refresh().catch(() => {});
    };
    if (run?.status === "waiting") timer = setTimeout(tick, delay);
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", focus);
    return () => {
      closed = true;
      refreshController.current?.abort();
      clearTimeout(timer);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", focus);
    };
  }, [run?.id, run?.status, refresh]);
  async function act(work: () => Promise<void>) {
    if (actionPending.current) return;
    actionPending.current = true;
    refreshSequence.current++;
    refreshController.current?.abort();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await work();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Try again.");
    } finally {
      if (!navigating.current) {
        setBusy(false);
        actionPending.current = false;
      }
    }
  }
  async function choose(provider: Provider) {
    await act(async () => {
      if (run?.status === "waiting" && run.provider !== provider)
        await api(`/api/imports/${run.id}`, { action: "cancel" });
      await api<ImportRun>("/api/imports", { provider });
      setMode(
        provider === "manual"
          ? "manual"
          : provider === "export"
            ? "export"
            : "client",
      );
      await refresh();
    });
  }
  async function copy(value: string, label = "Text") {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${label} copied.`);
    } catch {
      setError(
        "Clipboard access is unavailable. Select and copy the text below.",
      );
    }
  }
  async function cancel() {
    if (!run) return;
    await act(async () => {
      await api(`/api/imports/${run.id}`, { action: "cancel" });
      setMode("choose");
      await refresh();
    });
  }
  async function prepare() {
    await act(async () => {
      const notes = draft
        .split(/\n+/)
        .map((text) => text.trim())
        .filter(Boolean)
        .map((text) => ({ text, kind: "note", scope: "me", selected: true }));
      if (!notes.length)
        throw new Error(
          "Write at least one fact you want your AI tools to remember.",
        );
      if (notes.length > 100 || notes.some((n) => n.text.length > 2000))
        throw new Error(
          "Use up to 100 notes, each at most 2,000 characters. Split long paragraphs into separate lines.",
        );
      if (run?.status === "waiting")
        await api(`/api/imports/${run.id}`, { action: "cancel" });
      const result = await api<ImportRun>("/api/imports", {
        provider:
          mode === "manual" || run?.provider === "manual" ? "manual" : "export",
        notes,
      });
      setItems(result.items);
      revision.current = `${result.id}:${result.revision}`;
      await refresh();
    });
  }
  async function save() {
    if (!run) return;
    await act(async () => {
      if (items.some((n) => n.selected && !n.text.trim()))
        throw new Error(
          "Included notes need text. Fill in the empty note or deselect it.",
        );
      const updated = await api<ImportRun>(`/api/imports/${run.id}`, {
        action: "review",
        items: items.filter((n) => n.selected),
        revision: run.revision,
      });
      setStatus((previous) => ({ ...previous, run: updated }));
      revision.current = `${updated.id}:${updated.revision}`;
      const receipt = await api<ImportRun>(`/api/imports/${run.id}`, {
        action: "commit",
        revision: updated.revision,
      });
      setNotice(
        `${receipt.accepted} notes saved; ${receipt.skipped} duplicates skipped.`,
      );
      navigating.current = true;
      router.push("/dashboard");
      router.refresh();
    });
  }
  const activeConnections = status.connections.filter((c) => !c.revoked_at);
  const isConnected = (provider: string) =>
    activeConnections.some((c) => c.provider === provider);
  const observed = run ? isConnected(run.provider) : false;
  const choosing =
    mode === "choose" &&
    (!run ||
      (run.status === "waiting" &&
        run.provider !== "manual" &&
        run.provider !== "export"));
  const selected = items.filter((n) => n.selected).length;
  const manual =
    (mode === "manual" ||
      mode === "export" ||
      run?.provider === "manual" ||
      run?.provider === "export") &&
    !review;
  return (
    <main className={s.page}>
      <header
        className={s.header}
        onClickCapture={(e) => {
          if (busy) e.preventDefault();
        }}
        inert={busy}
      >
        <Link href={status.ready ? "/dashboard" : "/"} className={s.logo}>
          <Brand />
        </Link>
        <div className={s.headerActions}>
          {status.ready && <Link href="/dashboard">Back to dashboard</Link>}
          <Link href="/settings">Settings</Link>
          <ThemeToggle />
        </div>
      </header>
      <div className={s.flowLayout}>
        <div className={s.flowIntro}>
          <h1>Your context. Ready for your next AI.</h1>
          <p>
            {review
              ? "One final review before these notes join your context."
              : "Connect the tools you use. Choose what you carry forward."}
          </p>
        </div>
        <section className={s.main} aria-busy={busy}>
          <fieldset
            className={s.flowFields}
            disabled={busy}
            onClickCapture={(event) => {
              if (busy) event.preventDefault();
            }}
          >
            {error && (
              <div className={s.error} role="alert">
                {error}
              </div>
            )}
            <div className={s.notice} role="status" aria-live="polite">
              {notice}
            </div>
            {review ? (
              <>
                <h2>Choose what to remember</h2>
                <p>
                  Received from {names[run.provider]}. Correct anything
                  outdated, and leave out facts you do not want saved.
                </p>
                <p className={s.small}>
                  {items.length} proposed{" "}
                  {items.length === 1 ? "note" : "notes"} · existing context
                  will be preserved · duplicates are skipped on save
                </p>
                <ImportReview items={items} setItems={setItems} busy={busy} />
                <div className={s.actions}>
                  <button
                    className={s.primary}
                    disabled={busy || selected === 0}
                    onClick={save}
                  >
                    {busy
                      ? "Saving…"
                      : `Save ${selected} ${selected === 1 ? "note" : "notes"} & open dashboard`}
                    <ArrowRight size={16} />
                  </button>
                  <button disabled={busy} onClick={cancel}>
                    Discard import
                  </button>
                </div>
                {selected === 0 && (
                  <p>
                    Select a note to continue, or discard this import and create
                    your own context.
                  </p>
                )}
              </>
            ) : manual ? (
              <>
                <button className={s.back} disabled={busy} onClick={cancel}>
                  <ArrowLeft size={16} />
                  Choose another way
                </button>
                <h2>
                  {mode === "manual" || run?.provider === "manual"
                    ? "Create context graph"
                    : "Paste a memory export"}
                </h2>
                <p>
                  Write or paste facts you want available in your AI tools, one
                  note per line. You will review them before saving. No existing
                  memories will be replaced.
                </p>
                <label htmlFor="context-draft">Your context</label>
                <textarea
                  id="context-draft"
                  className={s.draft}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="For example: I build Next.js apps and prefer concise technical answers."
                />
                <button
                  className={s.primary}
                  disabled={busy || !draft.trim()}
                  onClick={prepare}
                >
                  {busy ? "Preparing…" : "Review notes"}
                  <ArrowRight size={16} />
                </button>
                <p className={s.small}>
                  This path preserves your text. It does not ask an AI to invent
                  a profile.
                </p>
              </>
            ) : mode === "other" ? (
              <>
                <button
                  className={s.back}
                  disabled={busy}
                  onClick={() => setMode("choose")}
                >
                  <ArrowLeft size={16} />
                  Choose another AI
                </button>
                <h2>Connect another AI</h2>
                <p>
                  Use any client that supports remote MCP with OAuth. Add a
                  server named ContextGraph with this URL.
                </p>
                <label htmlFor="other-url">Server URL</label>
                <div className={s.copyRow}>
                  <input id="other-url" readOnly value={`${appUrl}/api/mcp`} />
                  <button
                    onClick={() => copy(`${appUrl}/api/mcp`, "Server URL")}
                  >
                    Copy URL
                  </button>
                </div>
                <p>
                  Follow your client&apos;s OAuth sign-in flow. Once connected,
                  ask it to call ContextGraph&apos;s get_context tool to load
                  your saved context.
                </p>
                <p className={s.small}>
                  To bring in new notes from an unsupported client, paste the
                  facts here and review them before saving. Header API keys for
                  terminal clients are available in Settings.
                </p>
                <button className={s.primary} onClick={() => choose("export")}>
                  Paste a memory export
                  <ArrowRight size={16} />
                </button>
              </>
            ) : run && !choosing ? (
              <ConnectionGuide
                key={run.id}
                run={run}
                appUrl={appUrl}
                connected={observed}
                busy={busy}
                copy={copy}
                refresh={() => void act(refresh)}
                back={() => {
                  setMode("choose");
                  setNotice("");
                }}
              />
            ) : (
              <>
                <h2>
                  {status.ready
                    ? "Bring in more context"
                    : "Start with your AI"}
                </h2>
                <p>Choose one to get started. You can connect more than one.</p>
                <div className={s.providerCards}>
                  {(["claude", "chatgpt", "other"] as const).map((provider) => (
                    <button
                      key={provider}
                      disabled={busy}
                      className={s.providerCard}
                      onClick={() =>
                        provider === "other"
                          ? setMode("other")
                          : run?.provider === provider
                            ? setMode("client")
                            : void choose(provider)
                      }
                    >
                      <ProviderLogo provider={provider} size={40} />
                      <strong>
                        {provider === "other" ? "Another AI" : names[provider]}
                      </strong>
                      <span>
                        {provider === "other" ? (
                          "Use a compatible MCP client"
                        ) : isConnected(provider) ? (
                          <>
                            <Check size={14} />
                            Connected
                          </>
                        ) : provider === "claude" ? (
                          "Connect a remote connector"
                        ) : (
                          "Connect a custom MCP plugin"
                        )}
                      </span>
                      <ArrowRight size={20} />
                    </button>
                  ))}
                </div>
                {!!activeConnections.length && (
                  <p className={s.small} role="status">
                    {activeConnections.map((c) => c.client_name).join(", ")}{" "}
                    connected. Connections remain active when you add another
                    AI.
                  </p>
                )}
                {run?.status === "waiting" && (
                  <button
                    className={s.primary}
                    onClick={() => setMode("client")}
                  >
                    Continue with {names[run.provider]}
                    <ArrowRight size={16} />
                  </button>
                )}
                {status.ready && (
                  <Link className={s.link} href="/dashboard">
                    Continue to dashboard
                    <ArrowRight size={16} />
                  </Link>
                )}
                <div className={s.simpleAlternatives}>
                  <span>Prefer to start with your own notes?</span>
                  <button disabled={busy} onClick={() => choose("manual")}>
                    Create context graph
                    <ArrowRight size={16} />
                  </button>
                  <button disabled={busy} onClick={() => choose("export")}>
                    Paste a memory export
                    <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}
          </fieldset>
          <footer
            className={s.flowFooter}
            onClickCapture={(event) => {
              if (busy) event.preventDefault();
            }}
          >
            <span>Only notes you approve become saved context.</span>
            <Link href="/privacy">How your context is processed</Link>
          </footer>
        </section>
      </div>
    </main>
  );
}
