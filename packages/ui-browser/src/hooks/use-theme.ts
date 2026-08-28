import { useState } from "react";
import { writeLocal } from "@/lib/persist";
import { clearCustomStyle } from "@/lib/palette";

export type ThemeName =
  | "light"
  | "dark"
  | "quack"
  | "duckhunt"
  | "dracula"
  | "cosmicgirl";

export const THEMES: ThemeName[] = [
  "light",
  "dark",
  "quack",
  "duckhunt",
  "dracula",
  "cosmicgirl",
];

const STORAGE_KEY = "quack:theme";

// May return a built-in name or "custom".
const current = (): string => document.documentElement.getAttribute("data-theme") ?? "light";

export const useTheme = () => {
  const [theme, setThemeState] = useState<string>(current);

  const setTheme = (name: ThemeName) => {
    clearCustomStyle();
    const root = document.documentElement;
    root.setAttribute("data-theme", name);
    root.classList.toggle("dark", name !== "light");
    writeLocal(STORAGE_KEY, name);
    setThemeState(name);
  };

  return { theme, setTheme, themes: THEMES };
};
