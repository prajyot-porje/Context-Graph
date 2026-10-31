import Link from "next/link";
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 text-[var(--text-primary)]">
      <h1 className="font-display text-4xl font-normal mb-6">
        Your context, under your control
      </h1>
      <div className="space-y-6 text-[var(--text-secondary)] leading-relaxed">
        <p>
          ContextGraph stores the notes and context you save, your account
          details, connection activity, and pending import drafts. Connecting an
          AI does not give ContextGraph access to its native memory or chat
          history.
        </p>
        <p>
          Imports are drafts until you review and save them. Automatic capture
          can be paused in Settings. Captured notes may be sent to Gemini
          (Google) or OpenRouter and its selected model providers for filtering.
          Stored notes are sent to a connected AI when it requests context. Do
          not submit credentials or information you do not want shared.
        </p>
        <p>
          Account verification and password recovery emails are sent through
          Google Gmail. Google processes the recipient address and
          authentication email to deliver the message. Verification codes expire
          after five minutes.
        </p>
        <p>
          ContextGraph does not use your notes to train its own models. It is
          not end-to-end encrypted: the server must read notes to process and
          return them. External providers apply their own data policies.
        </p>
        <p>
          Active notes remain until you delete them. Pending import drafts
          expire after seven days and are cleared when your account is next
          accessed. Committed drafts are cleared immediately, retaining a
          receipt. Disconnecting a client stops its access but does not erase
          saved notes. You can delete individual notes or nodes in the
          dashboard. You can export saved nodes and notes from Settings. Full
          account deletion is not available in this release.
        </p>
        <p>
          Your display name and optional profile picture are stored with your
          account. Uploaded photos are cropped and resized before upload. Theme
          and default dashboard view preferences are stored on this device. They
          do not change your AI provider’s own settings.
        </p>
        <p>Last updated November 1, 2026.</p>
        <Link
          href="/entry"
          className="inline-flex min-h-11 items-center underline"
        >
          Return to ContextGraph
        </Link>
      </div>
    </main>
  );
}
