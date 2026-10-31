"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { AuthLayout } from "./AuthLayout";
import { PasswordInput } from "./PasswordInput";
import { GoogleIcon } from "./GoogleIcon";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

type Mode = "login" | "signup" | "recovery";
export function AuthForm({
  mode,
  destination = "/entry",
  googleEnabled = false,
  initialEmail = "",
  oauthError = false,
}: {
  mode: Mode;
  destination?: string;
  googleEnabled?: boolean;
  initialEmail?: string;
  oauthError?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code" | "password">("email");
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState(
    oauthError
      ? "Google sign-in could not finish. Try again, or use password recovery to verify your email first."
      : "",
  );
  const [notice, setNotice] = useState("");
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(
      () => setCooldown((v) => Math.max(0, v - 1)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [cooldown]);
  const cleanEmail = email.trim().toLowerCase();
  const link = (path: string) =>
    `${path}?${new URLSearchParams({ email: cleanEmail, from: destination })}`;
  async function api(action: string, fields: object) {
    const response = await fetch(`/api/account/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail, ...fields }),
    });
    const result: { error?: string; message?: string } = await response.json();
    if (!response.ok) {
      if (response.status === 429)
        setCooldown(
          Math.min(900, Number(response.headers.get("Retry-After")) || 60),
        );
      throw new Error(result.error || "Please try again.");
    }
    return result;
  }
  async function sendCode() {
    await api("send", { mode: mode === "signup" ? "signup" : "recovery" });
    setOtp("");
    setPassword("");
    setConfirmation("");
    setStep("code");
    setCooldown(60);
    setNotice(
      "If this email is eligible, a code has been sent. Check your inbox and spam folder. The code expires in 5 minutes.",
    );
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    let navigating = false;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "login") {
        const result = await authClient.signIn.email({
          email: cleanEmail,
          password,
        });
        if (result.error)
          throw new Error(
            "Unable to sign in. Check your email and password, or use password recovery to verify your email and set a password.",
          );
        navigating = true;
        setRedirecting(true);
        router.push(destination);
        router.refresh();
        return;
      }
      if (step === "email") {
        await sendCode();
        return;
      }
      if (step === "code") {
        await api("check", { otp });
        setStep("password");
        return;
      }
      if (password.length < 12 || password.length > 128)
        throw new Error("Use a password of 12–128 characters.");
      if (password !== confirmation) throw new Error("Passwords do not match.");
      await api("complete", { otp, password });
      // Only the server's successful, consuming reset authorizes this new login.
      const result = await authClient.signIn.email({
        email: cleanEmail,
        password,
      });
      navigating = true;
      setRedirecting(true);
      if (result.error) {
        router.push(link("/login"));
        router.refresh();
        return;
      }
      router.push(destination);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not connect. Please try again.",
      );
    } finally {
      if (!navigating) {
        pending.current = false;
        setBusy(false);
      }
    }
  }
  async function google() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: destination,
        errorCallbackURL: `/login?${new URLSearchParams({ from: destination, error: "google" })}`,
      });
      if (result.error)
        throw new Error("Google sign-in could not start. Please try again.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Google sign-in could not start.",
      );
      setBusy(false);
      pending.current = false;
    }
  }
  const title =
    step === "code"
      ? "Check your email"
      : step === "password"
        ? "Choose your password"
        : mode === "login"
          ? "Welcome back"
          : mode === "signup"
            ? "Create your account"
            : "Set or reset your password";
  return (
    <AuthLayout busy={busy}>
      <div className="flex w-full flex-col">
        <h1 className="cg-heading mb-4 font-display text-[32px] font-normal leading-tight tracking-[-0.04em] text-[var(--text-primary)]">
          {title}
        </h1>
        <p className="cg-subtext mb-8 text-[15px] leading-relaxed text-[var(--text-secondary)]">
          {step === "code" ? (
            <>
              Enter the six-digit code for{" "}
              <strong className="break-all">{cleanEmail}</strong>.
            </>
          ) : step === "password" ? (
            "Use at least 12 characters. You can paste a password from your password manager."
          ) : mode === "login" ? (
            "Sign in to your context graph."
          ) : mode === "signup" ? (
            "Verify your email, then choose a password."
          ) : (
            "Use this for a forgotten password or to add a password to your Google account."
          )}
        </p>
        {googleEnabled && step === "email" && mode !== "recovery" && (
          <>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={google}
              disabled={busy}
            >
              <GoogleIcon size={16} />
              Continue with Google
            </Button>
            <div className="my-6 flex items-center gap-4 text-[13px] text-[var(--text-secondary)]">
              <span className="h-px flex-1 bg-[var(--border)]" />
              or use email
              <span className="h-px flex-1 bg-[var(--border)]" />
            </div>
          </>
        )}
        <form
          onSubmit={submit}
          className="flex flex-col gap-4"
          aria-busy={busy}
        >
          {step === "email" && (
            <div className="cg-field">
              <Input
                label="Email"
                name="email"
                type="email"
                autoComplete="username"
                required
                maxLength={254}
                placeholder="you@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
            </div>
          )}
          {step === "code" && (
            <Input
              key="otp"
              label="Verification code"
              name="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              minLength={6}
              maxLength={6}
              required
              autoFocus
              placeholder="000000"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              disabled={busy}
            />
          )}
          {(mode === "login" || step === "password") && (
            <div className="cg-field">
              <PasswordInput
                key={step}
                label={mode === "login" ? "Password" : "New password"}
                name="password"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
                minLength={mode === "login" ? undefined : 12}
                maxLength={128}
                autoFocus={step === "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
              />
            </div>
          )}
          {step === "password" && (
            <PasswordInput
              label="Confirm password"
              name="confirmPassword"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              disabled={busy}
            />
          )}
          {error && (
            <p
              role="alert"
              className="rounded-[var(--radius-sm)] border border-[var(--error)] bg-[var(--surface)] p-4 text-[13px] leading-relaxed text-[var(--error)]"
            >
              {error}
            </p>
          )}
          {notice && (
            <p
              role="status"
              className="text-[13px] leading-relaxed text-[var(--text-secondary)]"
            >
              {notice}
            </p>
          )}
          <Button
            className="cg-submit mt-4 w-full"
            type="submit"
            disabled={busy || (step === "code" && otp.length !== 6)}
          >
            {busy ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                {redirecting ? "Opening your account…" : "Please wait"}
              </>
            ) : mode === "login" ? (
              "Sign in"
            ) : step === "email" ? (
              "Send verification code"
            ) : step === "code" ? (
              "Verify code"
            ) : (
              "Save password & sign in"
            )}
          </Button>
        </form>
        {step !== "email" && (
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              className="auth-text-action"
              disabled={busy || cooldown > 0}
              onClick={async () => {
                if (pending.current) return;
                pending.current = true;
                setBusy(true);
                setError("");
                try {
                  await sendCode();
                } catch (e) {
                  setError(
                    e instanceof Error ? e.message : "Could not send code.",
                  );
                } finally {
                  setBusy(false);
                  pending.current = false;
                }
              }}
            >
              {cooldown ? `Resend code in ${cooldown}s` : "Resend code"}
            </button>
            <button
              type="button"
              className="auth-text-action"
              disabled={busy}
              onClick={() => {
                setStep("email");
                setOtp("");
                setPassword("");
                setConfirmation("");
                setNotice("");
                setError("");
              }}
            >
              Use a different email
            </button>
          </div>
        )}
        <nav
          aria-label="Authentication options"
          className="mt-6 flex flex-col items-stretch gap-2 text-center"
          onClickCapture={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          {mode === "login" ? (
            <>
              <Link
                className="auth-text-action"
                href={link("/forgot-password")}
                aria-disabled={busy}
                tabIndex={busy ? -1 : undefined}
              >
                Forgot password or need to set one?
              </Link>
              <Link
                className="auth-text-action"
                href={link("/signup")}
                aria-disabled={busy}
                tabIndex={busy ? -1 : undefined}
              >
                Create an account
              </Link>
            </>
          ) : (
            <Link
              className="auth-text-action"
              href={link("/login")}
              aria-disabled={busy}
              tabIndex={busy ? -1 : undefined}
            >
              Back to sign in
            </Link>
          )}
        </nav>
      </div>
    </AuthLayout>
  );
}
