"use client";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { setupPrompt, type ImportRun } from "@/lib/setup";
import { ProviderLogo } from "./ProviderLogo";
import s from "./SetupClient.module.css";

export function ConnectionGuide({
  run,
  appUrl,
  connected,
  busy,
  copy,
  refresh,
  back,
}: {
  run: ImportRun;
  appUrl: string;
  connected: boolean;
  busy: boolean;
  copy: (text: string, label?: string) => Promise<void>;
  refresh: () => void;
  back: () => void;
}) {
  const [step, setStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
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
      <div className={s.guideSplit}>
        <section className={s.guideContent} aria-label={titles[step]}>
          <h3>{titles[step]}</h3>
          {step === 0 ? (
            <>
              <p>
                Copy these details, then open {name}&apos;s connector settings.
              </p>
              <label htmlFor="connector-name">Connector name</label>
              <div className={s.copyRow}>
                <input id="connector-name" readOnly value="ContextGraph" />
                <button
                  disabled={busy}
                  aria-label="Copy connector name"
                  onClick={() => copy("ContextGraph", "Connector name")}
                >
                  <Copy size={16} />
                </button>
              </div>
              <label htmlFor="server-url">Server URL</label>
              <div className={s.copyRow}>
                <input id="server-url" readOnly value={url} />
                <button
                  disabled={busy}
                  aria-label="Copy server URL"
                  onClick={() => copy(url, "Server URL")}
                >
                  <Copy size={16} />
                </button>
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
                select <strong>Allow connection</strong>.
              </p>
              <p className={s.small}>
                Return here when you finish. We confirm the connection when your
                AI calls ContextGraph.
              </p>
              <button disabled={busy} onClick={refresh}>
                <RefreshCw size={16} />
                Refresh status
              </button>
            </>
          ) : (
            <>
              <p>
                Start a conversation in {name} and enable ContextGraph{" "}
                {provider === "chatgpt"
                  ? "by typing @ and selecting the plugin"
                  : "from + → Connectors"}
                . Paste this prompt.
              </p>
              <button
                className={s.primary}
                disabled={busy}
                onClick={() => copy(setupPrompt(run.id), "Setup prompt")}
              >
                <Copy size={16} />
                Copy setup prompt
              </button>
              <details>
                <summary>Read the prompt</summary>
                <textarea
                  aria-label="Setup prompt"
                  readOnly
                  value={setupPrompt(run.id)}
                />
              </details>
              <p>
                Check the proposed facts in {name} and approve only what you
                want to send. Your draft will appear here for a final review.
              </p>
              <p className={s.small}>
                No useful memories? Tell your AI a few facts, or go back and
                paste your own notes.
              </p>
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
        <aside
          className={s.walkthrough}
          aria-label="Illustrated setup preview"
          data-expanded={showPreview}
        >
          <div className={s.previewTop}>
            <ProviderLogo provider={provider} size={24} />
            <span>{name} · setup preview</span>
            <button
              type="button"
              className={s.previewToggle}
              aria-expanded={showPreview}
              aria-controls="setup-preview-body"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? "Hide" : "Show"}
            </button>
          </div>
          <div className={s.previewBody} id="setup-preview-body">
            {step === 0 ? (
              <>
                <h3>New custom connector</h3>
                <span>Name</span>
                <div>ContextGraph</div>
                <span>Remote MCP server URL</span>
                <div className={s.previewUrl}>{url}</div>
                <span className={s.previewAction}>
                  Continue <ArrowRight size={14} />
                </span>
              </>
            ) : step === 1 ? (
              <>
                <BrandPreview />
                <h3>Allow access?</h3>
                <p>
                  Read saved context
                  <br />
                  Send notes for review
                </p>
                <span className={s.previewAction}>
                  Allow connection <Check size={14} />
                </span>
              </>
            ) : (
              <>
                <h3>A conversation with {name}</h3>
                <div>Help me choose the context I want to carry forward.</div>
                <p>Review the facts with your AI before approving.</p>
                <span className={s.previewAction}>
                  Return here to review <ArrowRight size={14} />
                </span>
              </>
            )}
          </div>
          <p className={s.small}>
            Illustrated guide. Your app may look different.
          </p>
        </aside>
      </div>
      <div className={s.connection} role="status">
        <span className={s.dot} />
        <div>
          <strong>
            {connected ? `${name} connected` : `Waiting for ${name}`}
          </strong>
          <p>
            {connected
              ? "Client activity received. Your approved draft will appear here."
              : "Opening settings alone does not confirm a connection."}
          </p>
        </div>
      </div>
      <details>
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
          Instructions checked October 31, 2026. Connecting does not export your
          complete chat history or native memory.
        </p>
      </details>
    </>
  );
}
function BrandPreview() {
  return <span className={s.previewBrand}>ContextGraph</span>;
}
