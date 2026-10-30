"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import s from "./SetupClient.module.css";

export default function OAuthAction({
  query,
  consent,
  clientName,
  scopes,
}: {
  query: string;
  consent: boolean;
  clientName?: string;
  scopes?: string;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const started = useRef(false);
  const send = useCallback(
    async (accept = true) => {
      setBusy(true);
      setError("");
      try {
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
      }
    },
    [consent, query],
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
        <section className={s.main}>
          <Link href="/connect" className={s.logo}>
            ContextGraph
          </Link>
          <h1>
            {consent
              ? "Connect your AI to ContextGraph"
              : "Continuing authorization…"}
          </h1>
          {consent && (
            <>
              <p>Requesting app: <strong>{clientName || 'Unrecognized client'}</strong>. This name is supplied by the app, not a verified vendor identity.</p>
              <p>Requested permissions: <code>{scopes || 'No scopes supplied'}</code></p>
              <p>
                This connection can read your saved context and send new notes.
                Initial imports stay drafts until you review and save them on
                this website.
              </p>
              <p>
                You can pause automatic capture or disconnect in Settings.
                Connecting does not grant us access to your AI account or native
                memories.
              </p>
              <div className={s.actions}>
                <button
                  className={s.primary}
                  disabled={busy || !query}
                  onClick={() => send(true)}
                >
                  Allow connection
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
          <Link href="/privacy">How your context is processed</Link>
        </section>
      </div>
    </main>
  );
}
