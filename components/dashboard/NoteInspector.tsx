"use client";
import { useEffect, useRef } from "react";
import type { ContextEntry, ContextNode } from "@/types";
import { noteCategories } from "@/lib/graph-view";
export function NoteInspector({
  entry,
  node,
  onClose,
  onOpenContext,
}: {
  entry: ContextEntry;
  node?: ContextNode;
  onClose: () => void;
  onOpenContext: () => void;
}) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    close.current?.focus();
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("keydown", escape);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <aside
      className="cg-note-inspector"
      aria-label="Saved note details"
      data-lenis-prevent
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-heading-md">Saved note</h2>
        <button
          className="cg-nav-button"
          ref={close}
          onClick={onClose}
          aria-label="Close note details"
        >
          Close
        </button>
      </div>
      <p className="mt-6 text-body-sm text-[var(--text-secondary)]">
        {noteCategories[entry.kind]} · {node?.title || "Your context"}
      </p>
      <p className="my-6 whitespace-pre-wrap text-body-md [overflow-wrap:anywhere]">
        {entry.entry_text}
      </p>
      <p className="mb-6 text-body-sm text-[var(--text-secondary)]">
        Source: {entry.source || "Saved context"}
      </p>
      <button className="cg-nav-button" onClick={onOpenContext}>
        Open context & manage note
      </button>
    </aside>
  );
}
