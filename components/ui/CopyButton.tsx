"use client";
import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({
  value,
  label = "Copy",
  ariaLabel,
  disabled = false,
  className,
}: {
  value: string;
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  useEffect(() => {
    if (state === "idle") return;
    const timer = setTimeout(() => setState("idle"), 2400);
    return () => clearTimeout(timer);
  }, [state]);
  return (
    <button
      type="button"
      disabled={disabled}
      className={className}
      aria-label={
        state === "idle"
          ? ariaLabel
          : state === "copied"
            ? `${ariaLabel || label}: copied`
            : "Copy failed. Select the text and copy it."
      }
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setState("copied");
        } catch {
          setState("failed");
        }
      }}
    >
      {state === "copied" ? (
        <Check size={16} className="text-[var(--accent)]" />
      ) : (
        <Copy size={16} />
      )}
      <span aria-live="polite">
        {state === "copied"
          ? "Copied"
          : state === "failed"
            ? "Copy failed"
            : label}
      </span>
    </button>
  );
}
