"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CircleHelp,
  Download,
  KeyRound,
  LogOut,
  Monitor,
  Moon,
  Plug,
  RefreshCw,
  Shield,
  SlidersHorizontal,
  Sun,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { Brand } from "@/components/ui/Brand";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { CopyButton } from "@/components/ui/CopyButton";
import { ProviderLogo } from "@/components/connect/ProviderLogo";
import { useSession, signOut } from "@/lib/auth-client";
import { useThemePreference, type ThemePreference } from "@/lib/theme";
import { avatarChoices } from "@/lib/profile";
import type { UserProfile } from "@/lib/db";
import type { SetupStatus } from "@/lib/setup";
import s from "./SettingsClient.module.css";

const sections = [
  { id: "account", name: "Account", icon: UserRound },
  { id: "appearance", name: "Appearance", icon: Sun },
  { id: "connections", name: "Connected tools", icon: Plug },
  { id: "capture", name: "Context capture", icon: SlidersHorizontal },
  { id: "security", name: "Security", icon: Shield },
  { id: "data", name: "Data & privacy", icon: CircleHelp },
] as const;
type Section = (typeof sections)[number]["id"];
type WebSession = {
  id: string;
  createdAt: string;
  expiresAt: string;
  userAgent?: string | null;
  current: boolean;
};
type Confirmation = {
  kind: "disconnect" | "replace-key" | "revoke-key" | "drafts" | "sessions";
  id?: string;
  label?: string;
};
async function request<T>(
  url: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not save. Try again.");
  return data as T;
}
export default function SettingsClient({
  initialProfile,
  initialStatus,
}: {
  initialProfile: UserProfile;
  initialStatus: SetupStatus;
}) {
  const router = useRouter();
  const { refetch } = useSession();
  const { preference, setPreference } = useThemePreference();
  const [section, setSection] = useState<Section>("account");
  const [profile, setProfile] = useState(initialProfile),
    [name, setName] = useState(initialProfile.name),
    [image, setImage] = useState(initialProfile.image),
    [imageChanged, setImageChanged] = useState(false);
  const [status, setStatus] = useState(initialStatus),
    [sessions, setSessions] = useState<WebSession[]>([]),
    [prefix, setPrefix] = useState(""),
    [newKey, setNewKey] = useState("");
  const [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [confirmation, setConfirmation] = useState<Confirmation | null>(null),
    [loaded, setLoaded] = useState(false),
    [defaultView, setDefaultView] = useState("graph");
  const pending = useRef(false);
  const leaving = useRef(false);
  const upload = useRef<HTMLInputElement>(null);
  async function refresh() {
    const [next, key, active] = await Promise.all([
      request<SetupStatus>("/api/setup/status"),
      request<{ prefix: string | null }>("/api/apikey"),
      request<WebSession[]>("/api/settings/sessions"),
    ]);
    setStatus(next);
    setPrefix(key.prefix || "");
    setSessions(active);
    setLoaded(true);
  }
  useEffect(() => {
    void refresh().catch(() =>
      setError("Some settings could not load. Select Refresh to try again."),
    );
    const hash = () => {
      const value = location.hash.slice(1);
      if (sections.some((s) => s.id === value)) setSection(value as Section);
    };
    hash();
    window.addEventListener("hashchange", hash);
    const stored = localStorage.getItem("cg-default-view");
    if (stored === "notes") setDefaultView(stored);
    return () => window.removeEventListener("hashchange", hash);
  }, []);
  async function action(
    id: string,
    work: () => Promise<void>,
    success?: string,
  ) {
    if (pending.current) return;
    pending.current = true;
    setBusy(id);
    setError("");
    setNotice("");
    try {
      await work();
      setConfirmation(null);
      if (success) setNotice(success);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed. Try again.");
    } finally {
      if (!leaving.current) {
        pending.current = false;
        setBusy("");
      }
    }
  }
  async function choosePhoto(file?: File) {
    if (!file) return;
    await action("photo", async () => {
      if (
        file.size > 5_000_000 ||
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)
      )
        throw new Error("Choose a JPG, PNG or WebP image under 5 MB.");
      const bitmap = await createImageBitmap(file);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 96;
        canvas.height = 96;
        const context = canvas.getContext("2d");
        if (!context)
          throw new Error("Could not prepare this photo. Try another image.");
        const side = Math.min(bitmap.width, bitmap.height);
        context.drawImage(
          bitmap,
          (bitmap.width - side) / 2,
          (bitmap.height - side) / 2,
          side,
          side,
          0,
          0,
          96,
          96,
        );
        const value = canvas.toDataURL("image/jpeg", 0.82);
        if (value.length > 24000)
          throw new Error("Choose a simpler photo or use a built-in icon.");
        setImage(value);
        setImageChanged(true);
      } finally {
        bitmap.close();
      }
    });
  }
  async function confirm() {
    if (!confirmation) return;
    await action(
      "confirm",
      async () => {
        switch (confirmation.kind) {
          case "disconnect":
            await request(`/api/connections/${confirmation.id}`, "DELETE");
            break;
          case "replace-key": {
            const result = await request<{ key: string }>(
              "/api/apikey",
              "POST",
            );
            setNewKey(result.key);
            break;
          }
          case "revoke-key":
            await request("/api/apikey", "DELETE");
            setNewKey("");
            break;
          case "drafts":
            await request("/api/settings/drafts", "DELETE");
            break;
          case "sessions":
            await request("/api/settings/sessions", "DELETE", { others: true });
            break;
        }
        await refresh();
      },
      confirmation.kind === "replace-key"
        ? "New key created. Copy it now; it is shown only this time."
        : "Changes saved.",
    );
  }
  const confirmationText =
    confirmation?.kind === "disconnect"
      ? `Disconnect ${confirmation.label}? Its access will be revoked. Saved context stays in your graph.`
      : confirmation?.kind === "replace-key"
        ? "Replace your API key? Existing API-key clients will need the new key."
        : confirmation?.kind === "revoke-key"
          ? "Revoke this API key? Clients using it will lose access. Your saved context stays."
          : confirmation?.kind === "drafts"
            ? "Discard all unsaved import attempts and draft notes? Copied prompts for those attempts will stop working. Saved context is preserved."
            : "Sign out other website sessions? Connected OAuth tools using those sessions will also need to reconnect. API keys remain separate.";
  const current = sections.find((item) => item.id === section)!;
  return (
    <main className={s.page}>
      <header className={s.header} inert={!!busy}>
        <Link href="/entry" aria-label="ContextGraph home">
          <Brand />
        </Link>
        <Link className={s.back} href="/entry">
          <ArrowLeft size={16} />
          Back to context
        </Link>
      </header>
      <div className={s.shell}>
        <aside className={s.sidebar}>
          <h1>Settings</h1>
          <nav aria-label="Settings sections">
            {sections.map(({ id, name, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                aria-current={section === id ? "page" : undefined}
                aria-disabled={!!busy}
                onClick={(event) => {
                  if (busy) {
                    event.preventDefault();
                    return;
                  }
                  setSection(id);
                  setConfirmation(null);
                  setNotice("");
                  setError("");
                }}
              >
                <Icon size={18} />
                {name}
              </a>
            ))}
          </nav>
          <div className={s.sidebarProfile}>
            <UserAvatar name={profile.name} image={profile.image} size={32} />
            <span>
              {profile.name}
              <small>{profile.email}</small>
            </span>
          </div>
        </aside>
        <section
          className={s.content}
          aria-label={current.name}
          aria-busy={!!busy}
        >
          <fieldset
            className={s.fields}
            disabled={!!busy}
            onClickCapture={(event) => {
              if (busy) {
                event.preventDefault();
                event.stopPropagation();
              }
            }}
          >
            <div className={s.sectionHeading}>
              <h2>{current.name}</h2>
              <button
                type="button"
                className={s.iconButton}
                aria-label="Refresh settings"
                disabled={!!busy}
                onClick={() => void action("refresh", refresh)}
              >
                <RefreshCw size={18} />
              </button>
            </div>
            {error && (
              <p className={s.error} role="alert">
                {error}
              </p>
            )}
            {notice && (
              <p className={s.notice} role="status">
                {notice}
              </p>
            )}
            {section === "account" && (
              <>
                <div className={s.profileEditor}>
                  <div className={s.largeAvatar}>
                    <UserAvatar name={name} image={image} size={80} />
                  </div>
                  <div>
                    <h3>Profile picture</h3>
                    <p>A photo, an icon, or your initials.</p>
                    <div className={s.inlineActions}>
                      <button
                        disabled={!!busy}
                        onClick={() => upload.current?.click()}
                      >
                        <Upload size={16} />
                        Upload photo
                      </button>
                      <button
                        disabled={!!busy}
                        onClick={() => {
                          setImage(null);
                          setImageChanged(true);
                        }}
                      >
                        Use initials
                      </button>
                    </div>
                    <input
                      ref={upload}
                      className={s.hidden}
                      aria-label="Upload profile photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        void choosePhoto(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </div>
                </div>
                <div
                  className={s.avatarChoices}
                  aria-label="Built-in profile icons"
                >
                  {avatarChoices.map((icon) => (
                    <button
                      key={icon}
                      aria-label={`Use ${icon} icon`}
                      aria-pressed={image === `/avatars/${icon}.svg`}
                      disabled={!!busy}
                      onClick={() => {
                        setImage(`/avatars/${icon}.svg`);
                        setImageChanged(true);
                      }}
                    >
                      <UserAvatar image={`/avatars/${icon}.svg`} size={44} />
                    </button>
                  ))}
                </div>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void action(
                      "profile",
                      async () => {
                        const updated = await request<UserProfile>(
                          "/api/profile",
                          "PATCH",
                          { name, ...(imageChanged ? { image } : {}) },
                        );
                        setProfile(updated);
                        setName(updated.name);
                        setImage(updated.image);
                        setImageChanged(false);
                        await refetch();
                      },
                      "Profile saved.",
                    );
                  }}
                >
                  <label className={s.field}>
                    Display name
                    <input
                      required
                      maxLength={80}
                      value={name}
                      disabled={!!busy}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </label>
                  <div className={s.settingRow}>
                    <div>
                      <h3>Email address</h3>
                      <p>{profile.email}</p>
                    </div>
                    <span
                      className={profile.emailVerified ? s.connected : s.muted}
                    >
                      {profile.emailVerified ? (
                        <>
                          <Check size={16} />
                          Verified
                        </>
                      ) : (
                        "Not verified"
                      )}
                    </span>
                  </div>
                  <button
                    className={s.primary}
                    type="submit"
                    disabled={
                      !!busy || (!imageChanged && name === profile.name)
                    }
                  >
                    {busy === "profile" ? "Saving…" : "Save profile"}
                  </button>
                </form>
              </>
            )}
            {section === "appearance" && (
              <>
                <div className={s.settingRow}>
                  <div>
                    <h3>Theme</h3>
                    <p>Choose your appearance on this device.</p>
                  </div>
                </div>
                <div className={s.themeChoices}>
                  {(
                    [
                      { value: "light", name: "Light", icon: Sun },
                      { value: "dark", name: "Dark", icon: Moon },
                      { value: "system", name: "System", icon: Monitor },
                    ] as const
                  ).map(({ value, name, icon: Icon }) => (
                    <button
                      key={value}
                      aria-pressed={preference === value}
                      onClick={() => setPreference(value as ThemePreference)}
                    >
                      <Icon size={24} />
                      <span>{name}</span>
                      {preference === value && <Check size={16} />}
                    </button>
                  ))}
                </div>
                <div className={s.settingRow}>
                  <div>
                    <h3>Default dashboard view</h3>
                    <p>
                      Start with the graph or your saved notes on this device.
                    </p>
                  </div>
                  <select
                    aria-label="Default dashboard view"
                    value={defaultView}
                    onChange={(e) => {
                      setDefaultView(e.target.value);
                      localStorage.setItem("cg-default-view", e.target.value);
                    }}
                  >
                    <option value="graph">Graph</option>
                    <option value="notes">Notes</option>
                  </select>
                </div>
              </>
            )}
            {section === "connections" && (
              <>
                <div className={s.settingRow}>
                  <div>
                    <h3>Your AI tools</h3>
                    <p>Manage access without removing saved context.</p>
                  </div>
                  <Link className={s.buttonLink} href="/connect">
                    <Plug size={16} />
                    Connect an AI
                  </Link>
                </div>
                {status.connections.length ? (
                  status.connections.map((connection) => (
                    <div className={s.settingRow} key={connection.id}>
                      <div className={s.connectionIdentity}>
                        <ProviderLogo
                          provider={
                            connection.provider === "claude" ||
                            connection.provider === "chatgpt"
                              ? connection.provider
                              : "other"
                          }
                          size={28}
                        />
                        <div>
                          <h3>
                            {connection.provider === "chatgpt"
                              ? "ChatGPT"
                              : connection.provider === "claude"
                                ? "Claude"
                                : connection.client_name}
                          </h3>
                          <p>
                            {connection.client_name} · Last used{" "}
                            {new Date(connection.last_seen).toLocaleString()}
                          </p>
                          <span
                            className={
                              connection.revoked_at ? s.muted : s.connected
                            }
                          >
                            {connection.revoked_at ? (
                              "Disconnected"
                            ) : (
                              <>
                                <Check size={14} />
                                Connected
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      {!connection.revoked_at && (
                        <button
                          disabled={!!busy}
                          onClick={() =>
                            setConfirmation({
                              kind: "disconnect",
                              id: connection.id,
                              label: connection.client_name,
                            })
                          }
                        >
                          Disconnect
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className={s.empty}>
                    <Plug size={28} />
                    <h3>No connected tools yet</h3>
                    <p>Connect an AI to start using your saved context.</p>
                    <Link className={s.buttonLink} href="/connect">
                      Connect your first AI
                    </Link>
                  </div>
                )}
                <p className={s.caption}>
                  Names are reported by the connecting client. A connection is
                  confirmed by authenticated activity.
                </p>
              </>
            )}
            {section === "capture" && (
              <>
                <div className={s.settingRow}>
                  <div>
                    <h3>Automatic context capture</h3>
                    <p>
                      Let connected tools submit useful facts while you work.
                      Initial imports always need review.
                    </p>
                  </div>
                  <button
                    role="switch"
                    aria-label="Automatic context capture"
                    aria-checked={status.captureEnabled}
                    disabled={!!busy}
                    className={s.switch}
                    onClick={() =>
                      void action(
                        "capture",
                        async () => {
                          setStatus(
                            await request<SetupStatus>(
                              "/api/setup/status",
                              "PATCH",
                              { captureEnabled: !status.captureEnabled },
                            ),
                          );
                        },
                        status.captureEnabled
                          ? "Automatic capture paused."
                          : "Automatic capture enabled.",
                      )
                    }
                  >
                    <span />
                  </button>
                </div>
                <div className={s.settingRow}>
                  <div>
                    <h3>Processing queue</h3>
                    <p>
                      {status.pendingCount} pending · {status.failedCount} need
                      another attempt
                    </p>
                  </div>
                  {status.failedCount > 0 && (
                    <button
                      disabled={!!busy}
                      onClick={() =>
                        void action(
                          "retry",
                          async () => {
                            setStatus(
                              await request<SetupStatus>(
                                "/api/setup/status",
                                "PATCH",
                                { retry: true },
                              ),
                            );
                          },
                          "Failed notes queued for another attempt.",
                        )
                      }
                    >
                      Retry failed notes
                    </button>
                  )}
                </div>
                <div className={s.info}>
                  <h3>Notes and nodes</h3>
                  <p>
                    A note is an individual fact, preference, decision or
                    problem. Nodes organize those facts by context or project in
                    your graph. Connecting an AI never imports its entire chat
                    history.
                  </p>
                </div>
              </>
            )}
            {section === "security" && (
              <>
                <div className={s.settingRow}>
                  <div>
                    <h3>Password</h3>
                    <p>
                      Reset your password, or add one if you signed in with
                      Google.
                    </p>
                  </div>
                  <Link
                    className={s.buttonLink}
                    href={`/forgot-password?email=${encodeURIComponent(profile.email)}`}
                  >
                    Set or reset password
                  </Link>
                </div>
                <div className={s.settingRow}>
                  <div>
                    <h3>Website sessions</h3>
                    <p>
                      Signing out a session also ends OAuth access tied to it.
                    </p>
                  </div>
                  <button
                    disabled={
                      !!busy || !sessions.some((session) => !session.current)
                    }
                    onClick={() => setConfirmation({ kind: "sessions" })}
                  >
                    Sign out other sessions
                  </button>
                </div>
                {!loaded && (
                  <p className={s.caption}>Loading active sessions…</p>
                )}
                {sessions.map((session) => (
                  <div className={s.settingRow} key={session.id}>
                    <div>
                      <h3>
                        <Monitor size={16} />
                        {session.current ? "This browser" : "Browser session"}
                      </h3>
                      <p>
                        Signed in {new Date(session.createdAt).toLocaleString()}{" "}
                        · Expires{" "}
                        {new Date(session.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    {session.current ? (
                      <span className={s.connected}>Current</span>
                    ) : (
                      <button
                        disabled={!!busy}
                        onClick={() =>
                          void action(
                            "session",
                            async () => {
                              await request(
                                "/api/settings/sessions",
                                "DELETE",
                                {
                                  id: session.id,
                                },
                              );
                              await refresh();
                            },
                            "Session signed out.",
                          )
                        }
                      >
                        Sign out session
                      </button>
                    )}
                  </div>
                ))}
                <div className={s.settingRow}>
                  <div>
                    <h3>
                      <KeyRound size={16} />
                      API key
                    </h3>
                    <p>
                      {prefix
                        ? `Current key: ${prefix}…`
                        : "No API key created. Web connectors use OAuth."}
                    </p>
                  </div>
                  <button
                    disabled={!!busy || !loaded}
                    onClick={() =>
                      prefix
                        ? setConfirmation({ kind: "replace-key" })
                        : void action(
                            "key",
                            async () => {
                              const result = await request<{ key: string }>(
                                "/api/apikey",
                                "POST",
                              );
                              setNewKey(result.key);
                              await refresh();
                            },
                            "Key created. Copy it now; it is shown only this time.",
                          )
                    }
                  >
                    {prefix ? "Replace API key" : "Generate API key"}
                  </button>
                </div>
                {newKey && (
                  <div className={s.keyReveal}>
                    <label htmlFor="new-api-key">New API key</label>
                    <div className={s.copyRow}>
                      <input id="new-api-key" readOnly value={newKey} />
                      <CopyButton
                        value={newKey}
                        ariaLabel="Copy new API key"
                        disabled={!!busy}
                      />
                    </div>
                    <button onClick={() => setNewKey("")}>Hide key</button>
                  </div>
                )}
                {prefix && (
                  <button
                    className={s.danger}
                    disabled={!!busy}
                    onClick={() => setConfirmation({ kind: "revoke-key" })}
                  >
                    Revoke API key
                  </button>
                )}
                <div className={s.settingRow}>
                  <div>
                    <h3>Sign out</h3>
                    <p>End this website session.</p>
                  </div>
                  <button
                    disabled={!!busy}
                    onClick={() =>
                      void action("signout", async () => {
                        const result = await signOut();
                        if (result.error)
                          throw new Error("Could not sign out. Try again.");
                        leaving.current = true;
                        router.replace("/login");
                        router.refresh();
                      })
                    }
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              </>
            )}
            {section === "data" && (
              <>
                <div className={s.settingRow}>
                  <div>
                    <h3>Export your context</h3>
                    <p>
                      Download saved nodes and notes as JSON. Credentials and
                      unsaved drafts are excluded.
                    </p>
                  </div>
                  <button
                    disabled={!!busy}
                    onClick={() =>
                      void action(
                        "export",
                        async () => {
                          const response = await fetch("/api/settings/export", {
                            cache: "no-store",
                          });
                          if (!response.ok)
                            throw new Error(
                              "Could not export your context. Try again.",
                            );
                          const url = URL.createObjectURL(
                            await response.blob(),
                          );
                          const link = document.createElement("a");
                          link.href = url;
                          link.download = "contextgraph-export.json";
                          link.click();
                          setTimeout(() => URL.revokeObjectURL(url), 1000);
                        },
                        "Context export downloaded.",
                      )
                    }
                  >
                    <Download size={16} />
                    Export context
                  </button>
                </div>
                <div className={s.settingRow}>
                  <div>
                    <h3>Unsaved imports</h3>
                    <p>
                      Discard waiting attempts and drafts. Saved context stays
                      in your graph.
                    </p>
                  </div>
                  <button
                    className={s.danger}
                    disabled={!!busy}
                    onClick={() => setConfirmation({ kind: "drafts" })}
                  >
                    <Trash2 size={16} />
                    Discard unsaved imports
                  </button>
                </div>
                <div className={s.settingRow}>
                  <div>
                    <h3>Privacy & data processing</h3>
                    <p>
                      Understand storage, AI processing and draft retention.
                    </p>
                  </div>
                  <Link className={s.buttonLink} href="/privacy">
                    Read privacy policy
                  </Link>
                </div>
                <div className={s.info}>
                  <h3>You control what is saved</h3>
                  <p>
                    Review imports before saving. Pause routine capture in
                    Context capture. Delete individual notes and graph context
                    from the dashboard.
                  </p>
                  <p>
                    ContextGraph settings do not change ChatGPT or Claude&apos;s
                    own privacy, memory or training settings.
                  </p>
                </div>
              </>
            )}
            {confirmation && (
              <div
                className={s.confirmation}
                role="group"
                aria-label="Confirm settings change"
              >
                <p>{confirmationText}</p>
                <div className={s.inlineActions}>
                  <button
                    className={s.danger}
                    disabled={!!busy}
                    onClick={() => void confirm()}
                  >
                    {busy === "confirm" ? "Working…" : "Confirm change"}
                  </button>
                  <button
                    disabled={!!busy}
                    onClick={() => setConfirmation(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </fieldset>
        </section>
      </div>
    </main>
  );
}
