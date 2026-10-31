"use client";
import { useEffect, useSyncExternalStore } from "react";
export type ThemePreference = "dark" | "light" | "system";
export function setThemePreference(preference: ThemePreference) {
  localStorage.setItem("cg-theme", preference);
  applyTheme(preference);
  window.dispatchEvent(new Event("cg-theme-change"));
}
function applyTheme(preference: ThemePreference) {
  document.documentElement.dataset.theme =
    preference === "system"
      ? window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark"
      : preference;
}
function snapshot() {
  const saved = localStorage.getItem("cg-theme");
  return `${saved === "dark" || saved === "light" ? saved : "system"}:${window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"}`;
}
function subscribe(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: light)");
  const change = () => callback();
  window.addEventListener("cg-theme-change", change);
  window.addEventListener("storage", change);
  media.addEventListener("change", change);
  return () => {
    window.removeEventListener("cg-theme-change", change);
    window.removeEventListener("storage", change);
    media.removeEventListener("change", change);
  };
}
export function useThemePreference() {
  const value = useSyncExternalStore(subscribe, snapshot, () => "system:dark");
  const [preference, system] = value.split(":") as [
    ThemePreference,
    "dark" | "light",
  ];
  useEffect(() => applyTheme(preference), [preference, system]);
  return {
    preference,
    theme: preference === "system" ? system : preference,
    setPreference: setThemePreference,
  };
}
