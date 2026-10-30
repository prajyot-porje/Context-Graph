"use client";

import { useEffect } from "react";
import { initLenis, destroyLenis } from "@/lib/lenis";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const Agentation = dynamic(
  () => import("agentation").then((mod) => mod.Agentation),
  { ssr: false },
);

export function LenisProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useEffect(() => {
    // App panels, forms and the graph own their scroll; do not intercept wheel events.
    if (
      pathname !== "/" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      destroyLenis();
      return;
    }
    initLenis();

    return () => {
      destroyLenis();
    };
  }, [pathname]);

  return (
    <>
      {children}
      {process.env.NODE_ENV === "development" &&
        process.env.NEXT_PUBLIC_AGENTATION_ENABLED === "true" && (
          <Agentation endpoint="http://localhost:4747" />
        )}
    </>
  );
}
