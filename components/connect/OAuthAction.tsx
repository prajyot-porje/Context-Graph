"use client";
import { Brand } from "@/components/ui/Brand";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  FilePlus2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import s from "./SetupClient.module.css";

export default function OAuthAction({
  query,
  consent,
  clientName,
  scopes,
  userEmail,
  capture,
}: {
  query: string;
  consent: boolean;
  clientName?: string;
  scopes?: string;
  userEmail?: string;
  capture?: { captureConsentedAt: string | null; captureEnabled: boolean };
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const started = useRef(false);
  const pending = useRef(false);
  const [autoCapture, setAutoCapture] = useState(false);
  const requestsWrite = (scopes || "").split(" ").includes("context:write");
  const send = useCallback(
    async (accept = true) => {
      if (pending.current) return;
      pending.current = true;
      setBusy(true);
      setError("");
      try {
        if (
          consent &&
          accept &&
          requestsWrite &&
          autoCapture &&
          !capture?.captureConsentedAt
        ) {
          const optIn = await fetch("/api/setup/status", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ consentCapture: true }),
          });
          if (!optIn.ok)
            throw new Error(
              "Capture permission could not be saved. Try again.",
            );
        }
        const response = await fetch(
          `/api/auth/oauth2/${consent ? "consent" : "continue"}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              consent
                ? { accept, oauth_query: query }
                : { postLogin: true, oauth_query: query },
            ),
          },
        );
        const data = await response.json();
        if (!response.ok || !data.url)
          throw new Error(
            data.message ||
              "Authorization could not continue. Return to your AI client and reconnect.",
          );
        window.location.assign(data.url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Authorization failed.");
        setBusy(false);
        pending.current = false;
      }
    },
    [consent, query, requestsWrite, autoCapture, capture],
  );
  useEffect(() => {
    if (!consent && !started.current) {
      started.current = true;
      void send();
    }
  }, [consent, send]); // provider validates the signed continuation
  return (
    <main className={s.page}>
      <div className={s.authLayout}>
        <section className={s.consentPanel} aria-busy={busy}>
          <Link
            href="/connect"
            className={s.logo}
            aria-disabled={busy}
            tabIndex={busy ? -1 : undefined}
            onClick={(e) => {
              if (busy) e.preventDefault();
            }}
          >
            <Brand />
          </Link>
          <h1>
            {consent
              ? "Allow access to your context?"
              : "Continuing authorization…"}
          </h1>
          {consent && (
            <>
              {userEmail && (
                <p className={s.small}>
                  Signed in as <strong>{userEmail}</strong>
                </p>
              )}
              <div className={s.requestingApp}>
                <span className={s.clientAvatar} aria-hidden="true">
                  {(clientName || "?").slice(0, 1).toUpperCase()}
                </span>
                <ArrowRight size={20} />
                <Brand />
              </div>
              <p>
                <strong>{clientName || "Unrecognized client"}</strong> is
                requesting access to your ContextGraph account.
              </p>
              <ul className={s.permissions}>
                {(scopes || "")
                  .split(" ")
                  .filter(Boolean)
                  .map((scope) => (
                    <li key={scope}>
                      {scope === "context:read" ? (
                        <BookOpen size={20} />
                      ) : scope === "context:write" ? (
                        <FilePlus2 size={20} />
                      ) : (
                        <RefreshCw size={20} />
                      )}
                      <div>
                        <strong>
                          {scope === "context:read"
                            ? "Read your saved context"
                            : scope === "context:write"
                              ? "Send and manage notes"
                              : scope === "offline_access"
                                ? "Stay connected"
                                : scope}
                        </strong>
                        <span>
                          {scope === "context:read"
                            ? "Use your approved notes in AI conversations."
                            : scope === "context:write"
                              ? "Imports need your review here. Ongoing capture can save notes when enabled; the client can also resolve or delete notes."
                              : scope === "offline_access"
                                ? "Renew access without asking you to sign in each time."
                                : "An additional permission requested by this client."}
                        </span>
                      </div>
                    </li>
                  ))}
              </ul>
              {requestsWrite &&
                (capture?.captureConsentedAt ? (
                  <p className={s.small}>
                    Automatic capture is{" "}
                    {capture.captureEnabled ? "enabled" : "paused"}. Your
                    account choice is remembered; this connection will not
                    change it. Manage it in Settings.
                  </p>
                ) : (
                  <div>
                    <label className={s.captureChoice}>
                      <input
                        type="checkbox"
                        checked={autoCapture}
                        disabled={busy}
                        onChange={(e) => setAutoCapture(e.target.checked)}
                      />
                      <span>Automatically save useful context</span>
                    </label>
                    <p className={s.small}>
                      Save preferences, decisions, constraints, unresolved
                      problems and tentative project ideas when your assistant
                      calls ContextGraph. This is a one-time account choice
                      across chats and devices. Pause or remove notes anytime.
                      Historical imports still need review; your host may ask
                      for tool approval.
                    </p>
                  </div>
                ))}
              <p className={s.small}>
                <ShieldCheck size={16} /> You can disconnect in Settings at any
                time. Your AI account and native memories are not shared with
                ContextGraph.
              </p>
              <details>
                <summary>About this request</summary>
                <p className={s.small}>
                  The requesting app supplies its name; it is not a verified
                  vendor identity. Approve only if you started this connection.
                </p>
                <code>{scopes || "No scopes supplied"}</code>
              </details>
              <div className={s.actions}>
                <button
                  className={s.primary}
                  disabled={busy || !query}
                  onClick={() => send(true)}
                >
                  {busy ? "Continuing…" : "Allow connection"}
                </button>
                <button disabled={busy || !query} onClick={() => send(false)}>
                  Decline
                </button>
              </div>
            </>
          )}
          {error && <p role="alert">{error}</p>}
          {error && !consent && (
            <button onClick={() => send()}>Retry authorization</button>
          )}
          <Link
            href="/privacy"
            aria-disabled={busy}
            tabIndex={busy ? -1 : undefined}
            onClick={(event) => {
              if (busy) event.preventDefault();
            }}
          >
            How your context is processed
          </Link>
        </section>
      </div>
    </main>
  );
}
