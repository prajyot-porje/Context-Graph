"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "@/lib/gsap";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { prefersReducedMotion } from "@/lib/gsap";
import { useGraph } from "@/components/providers/GraphProvider";
import { ContextStatus } from "./ContextStatus";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { selectedNodeId, setSelectedNodeId } = useGraph();
  const pathname = usePathname();
  const isSettings = pathname === "/settings";
  const isOnboarding = pathname === "/onboarding";

  // Derive a single stable key so the useEffect dep array never changes size
  const shellMode = isOnboarding
    ? "onboarding"
    : isSettings
      ? "settings"
      : "dashboard";

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  useEffect(() => {
    // Onboarding manages its own entrance animations
    if (shellMode === "onboarding") return;
    if (prefersReducedMotion()) return;

    const tl = gsap.timeline();

    tl.fromTo(
      ".cg-topbar",
      { opacity: 0, y: -8 },
      { opacity: 1, y: 0, duration: 0.25, ease: "cg-out" },
    );
    if (shellMode === "dashboard") {
      tl.fromTo(
        ".cg-sidebar",
        { opacity: 0, x: -16 },
        { opacity: 1, x: 0, duration: 0.3, ease: "cg-out" },
        0.05,
      );
    }
    tl.fromTo(".cg-main", { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.15);
    if (
      shellMode === "dashboard" &&
      document.querySelectorAll(".cg-sidebar-node").length > 0
    ) {
      tl.fromTo(
        ".cg-sidebar-node",
        { opacity: 0, x: -8 },
        { opacity: 1, x: 0, duration: 0.2, stagger: 0.04, ease: "cg-out" },
        0.2,
      );
    }

    return () => {
      tl.kill();
    };
  }, [shellMode]);

  // Onboarding bypasses the entire dashboard shell —
  // it renders its own header, progress bar, and navigation.
  if (isOnboarding) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-[var(--bg)] text-[var(--text-primary)]">
      <TopBar
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {!isSettings && (
          <Sidebar
            isOpen={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
            selectedNodeId={selectedNodeId}
            onSelectNode={(id) => {
              setSelectedNodeId(id);
              setMobileSidebarOpen(false);
            }}
            mobileSidebarOpen={mobileSidebarOpen}
            setMobileSidebarOpen={setMobileSidebarOpen}
          />
        )}

        {/* Main Area */}
        <main className="cg-main relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <ContextStatus />
          {children}
        </main>
      </div>
    </div>
  );
}
