import { useState } from "react";
import { writeLocal } from "@/lib/persist";

export type ThemeName = "light" | "dark" | "dracula" | "cosmicgirl";

export const THEMES: ThemeName[] = ["light", "dark", "dracula", "cosmicgirl"];

const STORAGE_KEY = "askdiff:theme";

const current = (): ThemeName => {
  const attr = document.documentElement.getAttribute("data-theme");
  return (THEMES as string[]).includes(attr ?? "") ? (attr as ThemeName) : "light";
};

export const useTheme = () => {
  const [theme, setThemeState] = useState<ThemeName>(current);

  const setTheme = (name: ThemeName) => {
    const root = document.documentElement;
    root.setAttribute("data-theme", name);
    root.classList.toggle("dark", name !== "light");
    writeLocal(STORAGE_KEY, name);
    setThemeState(name);
  };

  // Temporary: kept so ThemeToggle compiles until ThemePicker lands (Task 9).
  const toggle = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return { theme, setTheme, toggle, themes: THEMES };
};
