"use client";
import { useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, RefreshCw } from "lucide-react";
import { setupPrompt, type ImportRun } from "@/lib/setup";
import { ProviderLogo } from "./ProviderLogo";
import { ConnectionState } from "./ConnectionState";
import { CopyButton } from "@/components/ui/CopyButton";
import s from "./SetupClient.module.css";

export function ConnectionGuide({
  run,
  appUrl,
  connected,
  busy,
  refresh,
  back,
  refreshError,
}: {
  run: ImportRun;
  appUrl: string;
  connected: boolean;
  busy: boolean;
  refresh: () => void;
  back: () => void;
  refreshError?: boolean;
}) {
  const [step, setStep] = useState(0);
  const provider = run.provider === "chatgpt" ? "chatgpt" : "claude";
  const name = provider === "chatgpt" ? "ChatGPT" : "Claude";
  const url = `${appUrl}/api/mcp`;
  const settings =
    provider === "chatgpt"
      ? "https://chatgpt.com/plugins"
      : "https://claude.ai/customize/connectors";
  const titles = [
    "Add your connector",
    "Allow the connection",
    "Choose what to share",
  ];
  return (
    <>
      <button className={s.back} disabled={busy} onClick={back}>
        <ArrowLeft size={16} />
        Choose another AI
      </button>
      <div className={s.guideHeading}>
        <ProviderLogo provider={provider} />
        <h1>Connect {name}</h1>
        <ConnectionState
          name={name}
          connected={connected}
          error={refreshError}
        />
      </div>
      <ol className={s.stepTabs} aria-label="Connection steps">
        {titles.map((title, i) => (
          <li key={title}>
            <button
              aria-current={step === i ? "step" : undefined}
              disabled={busy}
              onClick={() => setStep(i)}
            >
              <span>{i + 1}</span>
              {title}
            </button>
          </li>
        ))}
      </ol>
      <section className={s.focusedGuide} aria-label={titles[step]}>
        <h2>{titles[step]}</h2>
        {step === 0 ? (
          <>
            <p>
              Copy these details, then open {name}&apos;s connector settings.
            </p>
            <label htmlFor="connector-name">Connector name</label>
            <div className={s.copyRow}>
              <input id="connector-name" readOnly value="ContextGraph" />
              <CopyButton
                value="ContextGraph"
                ariaLabel="Copy connector name"
                disabled={busy}
              />
            </div>
            <label htmlFor="server-url">Server URL</label>
            <div className={s.copyRow}>
              <input id="server-url" readOnly value={url} />
              <CopyButton
                value={url}
                ariaLabel="Copy server URL"
                disabled={busy}
              />
            </div>
            <a
              className={s.link}
              href={settings}
              target="_blank"
              rel="noreferrer"
            >
              Open {name} settings
              <ExternalLink size={16} />
            </a>
            <p className={s.small}>
              {provider === "claude"
                ? "In Customize → Connectors, choose + Add → Add custom connector. Paste the name and URL, then choose Continue."
                : "In Plugins, choose + → Add custom MCP server. Paste the name and public HTTPS URL under Connection."}
            </p>
          </>
        ) : step === 1 ? (
          <>
            <p>
              {provider === "claude"
                ? "Use OAuth and Sign in now. Choose Register automatically if Claude asks how to identify the OAuth client, then finish adding the connector."
                : "Select OAuth authentication. Review the warning, acknowledge it, and choose Create as a plugin. Install the plugin when prompted."}
            </p>
            <p>
              Sign in to ContextGraph if asked, review the permissions, and
              select <strong>Allow connection</strong>. Enable ContextGraph in a
              conversation so it can call your context tools.
            </p>
            <div className={s.statusRefresh}>
              <ConnectionState
                name={name}
                connected={connected}
                error={refreshError}
              />
              <button
                className={s.refreshCompact}
                disabled={busy}
                onClick={refresh}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
            <p className={s.small}>
              We confirm the connection when your AI calls ContextGraph. You can
              continue to copy the setup prompt while waiting.
            </p>
          </>
        ) : (
          <>
            <p>
              Start a conversation in {name} and enable ContextGraph{" "}
              {provider === "chatgpt"
                ? "by typing @ and selecting the plugin"
                : "from + → Connectors"}
              . Paste the prompt below.
            </p>
            <div className={s.statusRefresh}>
              <ConnectionState
                name={name}
                connected={connected}
                error={refreshError}
              />
              <button
                className={s.refreshCompact}
                disabled={busy}
                onClick={refresh}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
            <CopyButton
              className={s.primary}
              value={setupPrompt(run.id)}
              label="Copy setup prompt"
              ariaLabel="Copy setup prompt"
              disabled={busy}
            />
            <details>
              <summary>Read the prompt</summary>
              <textarea
                aria-label="Setup prompt"
                readOnly
                value={setupPrompt(run.id)}
              />
            </details>
            <div className={s.draftWaiting} role="status">
              <strong>Waiting for your approved context</strong>
              <p>
                Review the facts in {name}, then approve sending them. The draft
                will appear on this page automatically. You can also use Refresh
                above.
              </p>
              <p className={s.small}>
                You will review and save the received notes here before they
                join your graph. Notes are individual facts; nodes organize them
                in the graph.
              </p>
            </div>
          </>
        )}
        <div className={s.guideNavigation}>
          <button
            disabled={busy || step === 0}
            onClick={() => setStep(step - 1)}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          {step < 2 && (
            <button
              className={s.primary}
              disabled={busy}
              onClick={() => setStep(step + 1)}
            >
              Continue
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </section>
      <details className={s.guideHelp}>
        <summary>Account requirements & help</summary>
        <p className={s.small}>
          {provider === "claude"
            ? "Team and Enterprise accounts may need an owner to add the connector first. If automatic registration is unavailable, ask your workspace owner about OAuth client settings."
            : "Custom MCP availability and write access depend on your ChatGPT plan and workspace permissions. If you cannot add the plugin or send notes, use Claude or paste a memory export."}
        </p>
        <a
          href={
            provider === "chatgpt"
              ? "https://developers.openai.com/plugins/deploy/connect-chatgpt"
              : "https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp"
          }
          target="_blank"
          rel="noreferrer"
        >
          Official setup guide
          <ExternalLink size={14} />
        </a>
        <p className={s.small}>
          If an older prompt refers to a closed import, ask your AI to call
          contextgraph_setup again with that ID. It can find a new attempt you
          have started for this provider.
        </p>
      </details>
    </>
  );
}
