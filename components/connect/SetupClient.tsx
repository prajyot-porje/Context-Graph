"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  setupPrompt,
  type ImportNote,
  type ImportRun,
  type Provider,
  type SetupStatus,
} from "@/lib/setup";
import s from "./SetupClient.module.css";

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
    [mode, setMode] = useState<"choose" | "manual" | "export" | "client">(
      "choose",
    );
  const [items, setItems] = useState<ImportNote[]>(initial.run?.items ?? []);
  const [draft, setDraft] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const revision = useRef(`${initial.run?.id}:${initial.run?.revision}`);
  const refreshSequence=useRef(0);
  const refreshController=useRef<AbortController|null>(null);
  const run = status.run;
  const review = run?.status === "review";
  const refresh = useCallback(async () => {
    const sequence=++refreshSequence.current;
    refreshController.current?.abort();
    refreshController.current=new AbortController();
    const state = await api<SetupStatus>("/api/setup/status",undefined,'GET',refreshController.current.signal);
    if(sequence!==refreshSequence.current)return;
    setError('');
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
      if (!document.hidden) {
        try {
          await refresh();
          delay = Math.min(delay * 1.3, 10000);
        } catch (e) {
          if(!(e instanceof Error && e.name==='AbortError'))setError(
            "Could not refresh progress. Check your connection and try Refresh status.",
          );
        }
      }
      if (!closed) timer = setTimeout(tick, delay);
    };
    const focus = () => {
      if (!document.hidden) void refresh().catch(() => {});
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
    refreshSequence.current++;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await work();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Try again.");
    } finally {
      setBusy(false);
    }
  }
  async function choose(provider: Provider) {
    await act(async () => {
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
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice("Copied. Paste it into your selected AI conversation.");
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
        provider: mode === "manual" || run?.provider==='manual' ? "manual" : "export",
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
      if(items.some(n=>n.selected&&!n.text.trim()))throw new Error('Included notes need text. Fill in the empty note or deselect it.');
      const updated = await api<ImportRun>(`/api/imports/${run.id}`, {
        action: "review",
          items: items.filter(n=>n.selected),
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
      router.push("/dashboard");
      router.refresh();
    });
  }
  const client = run?.provider === "chatgpt" ? "ChatGPT" : "Claude";
  const providerLink =
    run?.provider === "chatgpt" ? "https://chatgpt.com" : "https://claude.ai";
  const observed = status.connections.filter((c) => !c.revoked_at && (!run || new Date(c.last_seen)>=new Date(run.created_at)));
  const selected = items.filter((n) => n.selected).length;
  const manual =
    (mode === "manual" ||
      mode === "export" ||
      run?.provider === "manual" ||
      run?.provider === "export") &&
    !review;
  return (
    <main className={s.page}>
      <header className={s.header}>
        <Link href={status.ready ? "/dashboard" : "/"} className={s.logo}>
          ContextGraph
        </Link>
        <div className={s.headerActions}>
          {status.ready && <Link href="/dashboard">Back to dashboard</Link>}
          <Link href="/settings">Settings</Link>
          <ThemeToggle />
        </div>
      </header>
      <div className={s.layout}>
        <aside className={s.aside}>
          <h1>
            Your context.
            <br />
            Ready for your next AI.
          </h1>
          <p>
            Connect a tool, choose what it shares, and carry useful context
            between conversations.
          </p>
          <ol className={s.progress} aria-label="Setup progress">
            {(manual || run?.provider==='manual' || run?.provider==='export'?['Choose a way','Prepare notes','Review & save notes']:[
              "Choose your AI",
              "Connect your account",
              "Approve what to share",
              "Review & save notes",
            ]).map((label, i) => {
              const secondary=manual || run?.provider==='manual' || run?.provider==='export';
              const step = review ? (secondary?2:3) : run ? (observed.length&&!secondary?2:1) : 0;
              return (
                <li key={label} aria-current={i === step ? "step" : undefined}>
                  <span>{i < step ? <Check size={16} /> : i + 1}</span>
                  {label}
                </li>
              );
            })}
          </ol>
          <p className={s.small}>
            Nothing is imported just by connecting. Your notes become active
            only after you review and save them here.
          </p>
          <Link href="/privacy" className={s.small}>
            How your context is processed
          </Link>
        </aside>
        <section className={s.main} aria-busy={busy}>
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
                Received from {names[run.provider]}. Correct anything outdated,
                and leave out facts you do not want saved.
              </p>
              <p className={s.small}>
                {items.length} proposed {items.length === 1 ? 'note' : 'notes'} · existing context will be
                preserved · duplicates are skipped on save
              </p>
              <div className={s.notes}>
                {items.map((note, index) => (
                  <div className={s.note} key={note.id ?? index}>
                    <label className={s.selection}>
                      <input
                        type="checkbox"
                        checked={note.selected}
                        onChange={(e) =>
                          setItems((old) =>
                            old.map((n, i) =>
                              i === index
                                ? { ...n, selected: e.target.checked }
                                : n,
                            ),
                          )
                        }
                      />
                      <span>Include note {index + 1}</span>
                    </label>
                    <label className={s.sr} htmlFor={`note-${index}`}>
                      Note {index + 1}
                    </label>
                    <textarea
                      id={`note-${index}`}
                      value={note.text}
                      maxLength={2000}
                      onChange={(e) =>
                        setItems((old) =>
                          old.map((n, i) =>
                            i === index ? { ...n, text: e.target.value } : n,
                          ),
                        )
                      }
                    />
                    <div className={s.noteMeta}>
                      <label>
                        Category
                        <select
                          value={note.kind}
                          onChange={(e) =>
                            setItems((old) =>
                              old.map((n, i) =>
                                i === index
                                  ? {
                                      ...n,
                                      kind: e.target
                                        .value as ImportNote["kind"],
                                    }
                                  : n,
                              ),
                            )
                          }
                        >
                          {[
                            "note",
                            "decision",
                            "preference",
                            "constraint",
                            "open_problem",
                          ].map((kind) => (
                            <option key={kind} value={kind}>
                              {kind.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Scope
                        <input
                          value={note.scope}
                          onChange={(e) =>
                            setItems((old) =>
                              old.map((n, i) =>
                                i === index
                                  ? { ...n, scope: e.target.value }
                                  : n,
                              ),
                            )
                          }
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <div className={s.actions}>
                <button
                  className={s.primary}
                  disabled={busy || selected === 0}
                  onClick={save}
                >
                  {busy ? "Saving…" : `Save ${selected} ${selected===1?'note':'notes'} & open dashboard`}
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
                This path preserves your text. It does not ask an AI to invent a
                profile.
              </p>
            </>
          ) : run ? (
            <>
              <button className={s.back} disabled={busy} onClick={cancel}>
                <ArrowLeft size={16} />
                Choose another AI
              </button>
              <h2>Connect {client}</h2>
              <p>
                Follow these steps in {client}, then return here to review your
                notes.
              </p>
              <ol className={s.instructions}>
                <li>
                  <strong>Add ContextGraph as a custom connector</strong>
                  <p>
                    {client === "ChatGPT"
                      ? "Open ChatGPT Plugins, add a custom MCP server, and install it in your account or workspace."
                      : "Open Customize → Connectors → Add custom connector."}
                  </p>
                  <label htmlFor="server-url">Server URL</label>
                  <div className={s.copyRow}>
                    <input
                      id="server-url"
                      readOnly
                      value={`${appUrl}/api/mcp`}
                    />
                    <button
                      aria-label="Copy server URL"
                      onClick={() => copy(`${appUrl}/api/mcp`)}
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </li>
                <li>
                  <strong>Sign in to your ContextGraph account</strong>
                  <p>
                    Choose OAuth authentication. Review read/write access, then
                    enable ContextGraph in the conversation. Your AI account may
                    require permission to add custom connectors.
                  </p>
                  <a
                    href={providerLink}
                    target="_blank"
                    rel="noreferrer"
                    className={s.link}
                  >
                    Open {client}
                    <ExternalLink size={14} />
                  </a>
                </li>
                <li>
                  <strong>Ask {client} to prepare your notes</strong>
                  <p>
                    Copy the prompt below into that conversation. Review the
                    facts there and approve sending only what you choose.
                  </p>
                  <button
                    className={s.primary}
                    onClick={() => copy(setupPrompt(run.id))}
                  >
                    <Copy size={16} />
                    Copy setup prompt
                  </button>
                  <details>
                    <summary>Show setup prompt</summary>
                    <textarea
                      aria-label="Setup prompt"
                      readOnly
                      value={setupPrompt(run.id)}
                    />
                  </details>
                </li>
              </ol>
              <div className={s.connection} role="status">
                <span className={s.dot} />
                <div>
                  <strong>
                    {observed.length
                      ? "Authenticated client activity received"
                      : "Waiting for an authenticated client"}
                  </strong>
                  <p>
                    {observed.length
                      ? "Connection activity is separate from an import. We are still waiting for your approved notes."
                      : "Your website session alone does not verify a client connection."}
                  </p>
                </div>
              </div>
              <button onClick={() => act(refresh)} disabled={busy}>
                <RefreshCw size={16} />
                Refresh status
              </button>
              <p className={s.small}>
                If the AI cannot access useful memories, supply a few facts in
                that conversation or{" "}
                <button className={s.inline} onClick={() => setMode("export")}>
                  paste an export here
                </button>
                . We cannot guarantee a complete native-memory export.
              </p>
              <p className={s.small}>
                Instructions checked October 30, 2026.{" "}
                <a
                  href={
                    client === "ChatGPT"
                      ? "https://developers.openai.com/api/docs/guides/custom-mcp-server"
                      : "https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp"
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Official setup guide
                </a>
                .
              </p>
            </>
          ) : (
            <>
              <h2>
                {status.ready ? "Bring in more context" : "Start with your AI"}
              </h2>
              <p>
                Choose the tool you already use. You stay in control of which
                facts it shares.
              </p>
              <div className={s.providers}>
                {(["claude", "chatgpt"] as const).map((provider) => (
                  <button
                    key={provider}
                    disabled={busy}
                    onClick={() => choose(provider)}
                  >
                    <div>
                      <strong>{names[provider]}</strong>
                      <span>
                        {provider === "claude"
                          ? "Connect a remote connector"
                          : "Connect a custom MCP plugin"}
                      </span>
                    </div>
                    <ArrowRight size={20} />
                  </button>
                ))}
              </div>
              <div className={s.alternatives}>
                <h3>Start another way</h3>
                <button disabled={busy} onClick={() => choose("manual")}>
                  Create context graph
                  <ArrowRight size={16} />
                </button>
                <button disabled={busy} onClick={() => choose("export")}>
                  Paste a memory export
                  <ArrowRight size={16} />
                </button>
                <p className={s.small}>
                  These options work without access to a client&apos;s memories.
                  You can connect an AI later.
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
