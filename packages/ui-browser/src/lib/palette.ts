import { readLocal, writeLocal } from "@/lib/persist";

export const TOKEN_KEYS = [
  "background", "foreground", "card", "card-foreground",
  "popover", "popover-foreground", "primary", "primary-foreground",
  "secondary", "secondary-foreground", "muted", "muted-foreground",
  "accent", "accent-foreground", "destructive", "destructive-foreground",
  "border", "input", "ring",
  "syntax-comment", "syntax-punctuation", "syntax-property", "syntax-number",
  "syntax-string", "syntax-keyword", "syntax-function", "syntax-variable",
  "syntax-deleted",
] as const;

export type Palette = Record<string, string>;

type Hsl = { h: number; s: number; l: number };

const parseHex = (hex: string): Hsl => {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  const body = m?.[1];
  if (body === undefined) throw new Error(`invalid hex: ${hex}`);
  const full = body.length === 3
    ? body.split("").map((c) => c + c).join("")
    : body;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let hue = 0;
  if (d !== 0) {
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h: Math.round(hue), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const hsl = (h: number, s: number, l: number) => `hsl(${String(h)} ${String(s)}% ${String(l)}%)`;

// Dracula Neon syntax, reused as the base palette for derived themes.
const BASE_SYNTAX: Palette = {
  "syntax-comment": "#6272a4",
  "syntax-punctuation": "#f8f8f2",
  "syntax-property": "#bd93f9",
  "syntax-number": "#bd93f9",
  "syntax-string": "#f1fa8c",
  "syntax-keyword": "#ff79c6",
  "syntax-function": "#50fa7b",
  "syntax-variable": "#ffb86c",
  "syntax-deleted": "#ff5555",
};

export const derivePalette = (primaryHex: string, secondaryHex: string): Palette => {
  const p = parseHex(primaryHex);
  const s = parseHex(secondaryHex);
  return {
    background: hsl(p.h, 28, 8),
    foreground: hsl(p.h, 15, 93),
    card: hsl(p.h, 26, 11),
    "card-foreground": hsl(p.h, 15, 93),
    popover: hsl(p.h, 26, 11),
    "popover-foreground": hsl(p.h, 15, 93),
    primary: primaryHex,
    "primary-foreground": hsl(p.h, 25, 10),
    secondary: secondaryHex,
    "secondary-foreground": hsl(s.h, 15, 93),
    muted: hsl(p.h, 20, 18),
    "muted-foreground": hsl(p.h, 12, 65),
    accent: hsl(s.h, 24, 20),
    "accent-foreground": hsl(s.h, 15, 93),
    destructive: "#ff5555",
    "destructive-foreground": hsl(p.h, 25, 10),
    border: hsl(p.h, 18, 24),
    input: hsl(p.h, 18, 24),
    ring: primaryHex,
    ...BASE_SYNTAX,
  };
};

const COLOR_RE = /^(#[0-9a-f]{3,8}|rgb|rgba|hsl|hsla|oklch)/i;

export const paletteFromConfig = (raw: string): Palette => {
  const trimmed = raw.trim();
  let obj: Record<string, unknown>;
  if (trimmed.startsWith("{")) {
    obj = JSON.parse(trimmed) as Record<string, unknown>;
  } else {
    obj = {};
    for (const decl of trimmed.split(";")) {
      const idx = decl.indexOf(":");
      if (idx < 0) continue;
      const key = decl.slice(0, idx).trim().replace(/^--/, "");
      const value = decl.slice(idx + 1).trim();
      if (key) obj[key] = value;
    }
  }
  const allowed = new Set<string>(TOKEN_KEYS);
  const out: Palette = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!allowed.has(k)) throw new Error(`unknown token: ${k}`);
    if (typeof v !== "string" || !COLOR_RE.test(v.trim())) {
      throw new Error(`invalid color for ${k}: ${String(v)}`);
    }
    out[k] = v.trim();
  }
  return out;
};

const STYLE_ID = "quack-custom-theme";
const THEMES_KEY = "askdiff:custom-themes";
const ACTIVE_KEY = "askdiff:custom-active";

const paletteToCss = (p: Palette): string => {
  const decls = TOKEN_KEYS.map((k) => (p[k] ? `  --${k}: ${p[k] ?? ""};` : ""))
    .filter(Boolean)
    .join("\n");
  return `:root[data-theme="custom"] {\n${decls}\n}`;
};

const injectCustomStyle = (p: Palette): void => {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = paletteToCss(p);
  const root = document.documentElement;
  root.setAttribute("data-theme", "custom");
  root.classList.add("dark");
};

/** Apply a custom palette for live preview, without persisting it. */
export const previewCustomTheme = (p: Palette): void => {
  injectCustomStyle(p);
};

/** Apply a custom palette and persist it as the active theme. */
export const activateCustomTheme = (p: Palette): void => {
  injectCustomStyle(p);
  writeLocal("askdiff:theme", "custom");
  writeLocal(ACTIVE_KEY, JSON.stringify(p));
};

/** Remove the injected custom style (when switching to a built-in theme). */
export const clearCustomStyle = (): void => {
  document.getElementById(STYLE_ID)?.remove();
};

export const loadCustomThemes = (): Record<string, Palette> => {
  const raw = readLocal(THEMES_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, Palette>;
  } catch {
    return {};
  }
};

export const saveCustomTheme = (name: string, p: Palette): void => {
  const all = loadCustomThemes();
  all[name] = p;
  writeLocal(THEMES_KEY, JSON.stringify(all));
};
