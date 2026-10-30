"use client";
import { Brand } from "@/components/ui/Brand";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Link from "next/link";
import { useGraph } from "@/components/providers/GraphProvider";
import { getNodePath } from "@/lib/graph-utils";

// ── Inline thin-line SVGs (no Lucide) ─────────────────────────────────────────

function IconMenu({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconX({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconLogOut({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function TopBar({
  mobileSidebarOpen = false,
  setMobileSidebarOpen,
}: {
  mobileSidebarOpen?: boolean;
  setMobileSidebarOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const { data: session } = useSession();

  const { nodes, selectedNodeId, setSelectedNodeId } = useGraph();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "?";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={cn(
        "cg-topbar sticky top-0 z-[300]",
        "flex h-[64px] shrink-0 items-center justify-between",
        "px-5",
        "bg-[var(--nav-backdrop)] backdrop-blur-[20px] saturate-[180%]",
        "border-b border-[var(--border)]",
        "[box-shadow:0_1px_0_rgba(255,255,255,0.04)]",
      )}
    >
      {/* ── Left: mobile menu + wordmark + breadcrumb ── */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          className="cg-mobile-menu-btn"
          onClick={() => {
            setMobileSidebarOpen?.((prev) => !prev);
          }}
          style={{
            display: "none", // overridden by CSS on mobile
            padding: "6px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--text-secondary)",
            borderRadius: "var(--radius-sm)",
          }}
          aria-label="Toggle menu"
          aria-expanded={mobileSidebarOpen}
          aria-controls="context-sidebar"
        >
          {mobileSidebarOpen ? <IconX size={18} /> : <IconMenu size={18} />}
        </button>

        {/* Wordmark */}
        <Link
          href="/dashboard"
          className="inline-flex items-center font-display text-[15px] font-bold tracking-tight text-[var(--text-primary)] transition-opacity duration-100 ease-out hover:opacity-75"
        >
          <Brand />
        </Link>

        {/* Breadcrumb — node path */}
        <div className="hidden sm:flex items-center gap-1.5 border-l border-[var(--border)] pl-4 ml-0.5">
          {selectedNode === null ? (
            <span className="text-[13px] tracking-[0.04em] text-[var(--text-muted)]">
              All Nodes
            </span>
          ) : (
            <div className="flex items-center gap-1">
              {getNodePath(nodes, selectedNode).map((n, i, arr) => (
                <React.Fragment key={n.id}>
                  {i < arr.length - 1 ? (
                    <>
                      <button
                        onClick={() => setSelectedNodeId(n.id)}
                        className="text-[13px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-[color] duration-100 cursor-pointer focus-visible:outline-none"
                      >
                        {n.title}
                      </button>
                      <span className="text-[13px] text-[var(--text-disabled)]">
                        ›
                      </span>
                    </>
                  ) : (
                    <span className="text-[13px] font-medium text-[var(--text-secondary)]">
                      {n.title}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: actions ── */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <ThemeToggle />

        {/* Avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={cn(
              "flex h-[44px] w-[44px] items-center justify-center rounded-full",
              "border border-[var(--border-strong)] bg-gradient-to-b from-[var(--card-raised)] to-[var(--card)]",
              "text-[13px] font-semibold text-[var(--text-primary)]",
              "[box-shadow:var(--shadow-xs)]",
              "transition-[border-color] duration-150",
              "hover:border-[rgba(255,255,255,0.22)]",
              "cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]",
            )}
            aria-label="User menu"
          >
            {userInitials}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-[38px] min-w-[160px] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card-raised)] p-1 [box-shadow:var(--shadow-lg)] z-50">
              {session?.user?.email && (
                <>
                  <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
                    <p className="text-[13px] font-medium text-[var(--text-primary)] truncate max-w-[140px]">
                      {session.user.name}
                    </p>
                    <p className="text-[13px] text-[var(--text-muted)] truncate max-w-[140px] mt-0.5">
                      {session.user.email}
                    </p>
                  </div>
                </>
              )}
              <button
                onClick={async () => {
                  setIsDropdownOpen(false);
                  await signOut();
                  router.push("/login");
                }}
                className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-[13px] text-[var(--text-secondary)] transition-[background-color,color] duration-100 hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-primary)] cursor-pointer focus-visible:outline-none focus-visible:bg-[rgba(255,255,255,0.05)]"
              >
                <IconLogOut size={13} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
