"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { NodeDetailPanel } from "./NodeDetailPanel";
import { NoteInspector } from "./NoteInspector";
import { useGraph } from "@/components/providers/GraphProvider";
import { buildGraphView, noteCategories } from "@/lib/graph-view";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
const ContextGraph3D = dynamic(
  () => import("@/components/graph/ContextGraph3D"),
  { ssr: false },
);
export default function DashboardClient() {
  const {
    nodes,
    setNodes,
    edges,
    entries,
    isLoading,
    error,
    refreshNodes,
    selectedNodeId,
    setSelectedNodeId,
  } = useGraph();
  const [listView, setListView] = useState(false),
    [zoomTrigger, setZoomTrigger] = useState(0),
    [showLabels, setShowLabels] = useState(true);
  const [noteId, setNoteId] = useState<string | null>(null),
    [displayedNodeId, setDisplayedNodeId] = useState<string | null>(null),
    [isClosing, setIsClosing] = useState(false);
  const view = useMemo(
    () => buildGraphView(nodes, entries, edges),
    [nodes, entries, edges],
  );
  const note = entries.find((e) => e.id === noteId);
  const closeNote = useCallback(() => setNoteId(null), []);
  useEffect(() => {
    if (selectedNodeId) {
      setNoteId(null);
      setDisplayedNodeId(selectedNodeId);
      setIsClosing(false);
    } else if (displayedNodeId) setIsClosing(true);
  }, [selectedNodeId, displayedNodeId]);
  const displayedNode = nodes.find((n) => n.id === displayedNodeId);
  function selectGraphItem(item: { id: string }) {
    const entry = view.entryByNode.get(item.id);
    if (entry) {
      setSelectedNodeId(null);
      setNoteId(entry.id);
    } else {
      setNoteId(null);
      setSelectedNodeId(view.scopeByGroup.get(item.id) || item.id);
    }
  }
  return (
    <div className="cg-dashboard-grid flex h-full w-full">
      <section
        className="flex min-h-0 min-w-0 flex-1 flex-col"
        aria-label="Context workspace"
      >
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] px-6 py-4">
          <div>
            <h1 className="text-display-sm">Your context</h1>
            <p
              className="text-body-sm text-[var(--text-secondary)]"
              aria-label="Graph summary"
            >
              {entries.filter((e) => e.kind !== "resolved").length} saved notes
              · {view.nodes.length} connected items
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="cg-nav-button"
              onClick={() => void refreshNodes()}
            >
              Refresh context
            </button>
            <button
              className="cg-nav-button"
              aria-pressed={listView}
              onClick={() => setListView((v) => !v)}
            >
              {listView ? "Graph view" : "Notes view"}
            </button>
          </div>
        </header>
        {error && (
          <p role="alert" className="px-6 py-3 text-body-sm">
            {error}
          </p>
        )}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {isLoading ? (
            <p role="status" className="p-6 text-body-md">
              Loading your context…
            </p>
          ) : !nodes.length ? (
            <div className="p-6">
              <Link href="/connect" className="cg-nav-button">
                Create context graph
              </Link>
            </div>
          ) : listView ? (
            <div
              className="h-full overflow-y-auto overscroll-contain px-6 py-6"
              data-lenis-prevent
              data-testid="notes-scroll"
            >
              {nodes.map((node) => (
                <section key={node.id} className="mb-8">
                  <h2 className="mb-4 text-heading-md">{node.title}</h2>
                  {node.content.trim() && (
                    <button
                      className="mb-4 w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 text-left text-body-md whitespace-pre-wrap [overflow-wrap:anywhere]"
                      onClick={() => setSelectedNodeId(node.id)}
                    >
                      {node.content}
                    </button>
                  )}
                  <div className="grid gap-3">
                    {entries
                      .filter((e) => e.node_id === node.id)
                      .map((entry) => (
                        <button
                          key={entry.id}
                          className="w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 text-left hover:border-[var(--border-strong)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                          onClick={() => {
                            setSelectedNodeId(null);
                            setNoteId(entry.id);
                          }}
                        >
                          <span className="mb-2 block text-body-sm text-[var(--text-secondary)]">
                            {noteCategories[entry.kind]}
                            {entry.source ? ` · ${entry.source}` : ""}
                          </span>
                          <span className="block whitespace-pre-wrap text-body-md [overflow-wrap:anywhere]">
                            {entry.entry_text}
                          </span>
                        </button>
                      ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <ErrorBoundary
              fallback={
                <div className="p-6">
                  <p>Graph could not load.</p>
                  <button
                    className="cg-nav-button mt-4"
                    onClick={() => setListView(true)}
                  >
                    Open notes view
                  </button>
                </div>
              }
            >
              <ContextGraph3D
                nodes={view.nodes}
                edges={view.edges}
                onNodeClick={selectGraphItem}
                selectedNodeId={note ? `note:${note.id}` : selectedNodeId}
                showLabels={showLabels}
                zoomTrigger={zoomTrigger}
              />
              <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-2">
                <button
                  className="cg-nav-button"
                  onClick={() => setZoomTrigger((v) => v + 1)}
                >
                  Fit graph
                </button>
                <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 px-3 text-body-sm">
                  <input
                    type="checkbox"
                    checked={showLabels}
                    onChange={(e) => setShowLabels(e.target.checked)}
                  />
                  Show labels
                </label>
              </div>
            </ErrorBoundary>
          )}
        </div>
      </section>
      {displayedNode && (
        <NodeDetailPanel
          node={displayedNode}
          isClosing={isClosing}
          onClose={() => setSelectedNodeId(null)}
          onClosed={() => {
            setIsClosing(false);
            setDisplayedNodeId(null);
          }}
          onNodeUpdate={(id, updates) => {
            setNodes((prev) =>
              prev.map((n) => (n.id === id ? { ...n, ...updates } : n)),
            );
            void refreshNodes();
          }}
          onNodeDelete={(id) => {
            setNodes((prev) => prev.filter((n) => n.id !== id));
            setSelectedNodeId(null);
            void refreshNodes();
          }}
        />
      )}
      {note && (
        <NoteInspector
          entry={note}
          node={nodes.find((n) => n.id === note.node_id)}
          onClose={closeNote}
          onOpenContext={() => {
            setNoteId(null);
            setSelectedNodeId(note.node_id);
          }}
        />
      )}
    </div>
  );
}
