"use client";
import { Sun, Moon } from "lucide-react";
import { useThemePreference } from "@/lib/theme";
export function ThemeToggle({ minimal = false }: { minimal?: boolean }) {
  const { theme, setPreference } = useThemePreference();
  return (
    <button
      type="button"
      data-minimal-theme={minimal || undefined}
      className="cg-theme-toggle"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      onClick={() => setPreference(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? <Moon size={22} /> : <Sun size={22} />}
    </button>
  );
}
