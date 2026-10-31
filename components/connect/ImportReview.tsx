"use client";
import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { kinds, type ImportNote } from "@/lib/setup";
import s from "./SetupClient.module.css";

const labels: Record<ImportNote["kind"], string> = {
  note: "Notes",
  preference: "Preferences",
  decision: "Decisions",
  constraint: "Constraints",
  open_problem: "Open problems",
  resolved: "Resolved",
};
export function ImportReview({
  items,
  setItems,
  busy,
}: {
  items: ImportNote[];
  setItems: React.Dispatch<React.SetStateAction<ImportNote[]>>;
  busy: boolean;
}) {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(0);
  const filtered = items
    .map((note, index) => ({ note, index }))
    .filter(
      ({ note }) =>
        (category === "all" || note.kind === category) &&
        `${note.text} ${note.scope}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
  const pages = Math.max(1, Math.ceil(filtered.length / 6));
  const current = Math.min(page, pages - 1);
  function update(index: number, patch: Partial<ImportNote>) {
    setItems((old) =>
      old.map((note, i) => (i === index ? { ...note, ...patch } : note)),
    );
  }
  return (
    <>
      <div className={s.reviewTools}>
        <label className={s.search}>
          <Search size={16} />
          <input
            aria-label="Search proposed notes"
            placeholder="Find a note…"
            value={search}
            disabled={busy}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </label>
        <label>
          Category
          <select
            aria-label="Filter note category"
            value={category}
            disabled={busy}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(0);
            }}
          >
            <option value="all">All categories ({items.length})</option>
            {kinds
              .filter((kind) => items.some((n) => n.kind === kind))
              .map((kind) => (
                <option key={kind} value={kind}>
                  {labels[kind]} ({items.filter((n) => n.kind === kind).length})
                </option>
              ))}
          </select>
        </label>
      </div>
      <div className={s.reviewBulk}>
        <span>
          {items.filter((n) => n.selected).length} of {items.length} included
        </span>
        <button
          disabled={busy || !filtered.length}
          onClick={() =>
            setItems((old) =>
              old.map((n, i) =>
                filtered.some((f) => f.index === i)
                  ? { ...n, selected: true }
                  : n,
              ),
            )
          }
        >
          Include results
        </button>
        <button
          disabled={busy || !filtered.length}
          onClick={() =>
            setItems((old) =>
              old.map((n, i) =>
                filtered.some((f) => f.index === i)
                  ? { ...n, selected: false }
                  : n,
              ),
            )
          }
        >
          Exclude results
        </button>
      </div>
      <div className={s.compactNotes}>
        {filtered.slice(current * 6, current * 6 + 6).map(({ note, index }) => (
          <div className={s.compactNote} key={note.id ?? index}>
            <div className={s.noteSummary}>
              <label className={s.selection}>
                <input
                  type="checkbox"
                  disabled={busy}
                  checked={note.selected}
                  aria-label={`Include note ${index + 1}`}
                  onChange={(e) =>
                    update(index, { selected: e.target.checked })
                  }
                />
              </label>
              <button
                className={s.noteExpand}
                disabled={busy}
                aria-expanded={expanded === index}
                aria-controls={`edit-note-${index}`}
                onClick={() => setExpanded(expanded === index ? null : index)}
              >
                <span>
                  <span className={s.notePreview}>
                    {note.text || "Empty note"}
                  </span>
                  <span className={s.noteCaption}>
                    {labels[note.kind]} · {note.scope}
                  </span>
                </span>
                <ChevronDown size={16} />
              </button>
            </div>
            {expanded === index && (
              <div className={s.noteEditor} id={`edit-note-${index}`}>
                <label htmlFor={`note-${index}`} className={s.sr}>
                  Note {index + 1}
                </label>
                <textarea
                  id={`note-${index}`}
                  disabled={busy}
                  value={note.text}
                  maxLength={2000}
                  onChange={(e) => update(index, { text: e.target.value })}
                />
                <div className={s.noteMeta}>
                  <label>
                    Category
                    <select
                      disabled={busy}
                      value={note.kind}
                      onChange={(e) =>
                        update(index, {
                          kind: e.target.value as ImportNote["kind"],
                        })
                      }
                    >
                      {kinds.map((kind) => (
                        <option key={kind} value={kind}>
                          {labels[kind]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Scope
                    <input
                      disabled={busy}
                      value={note.scope}
                      onChange={(e) => update(index, { scope: e.target.value })}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        ))}
        {!filtered.length && (
          <p>No matching notes. Try another category or search.</p>
        )}
      </div>
      <div className={s.pagination}>
        <span>
          {filtered.length
            ? `${current * 6 + 1}–${Math.min((current + 1) * 6, filtered.length)} of ${filtered.length}`
            : "0 notes"}
        </span>
        <button
          aria-label="Previous notes"
          disabled={busy || current === 0}
          onClick={() => setPage(current - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <span>
          Page {current + 1} of {pages}
        </span>
        <button
          aria-label="Next notes"
          disabled={busy || current >= pages - 1}
          onClick={() => setPage(current + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </>
  );
}
