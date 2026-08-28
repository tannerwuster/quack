# Quack — Theming & UX Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand the forked `quack` tool to **Quack** and add a friendlier, more discoverable review UI — visible comment affordance, a resizable file tree with colored file-type icons, named themes (Dracula, CosmicGirl's Dracula Neon), and a custom-theme creator (deterministic derivation + optional Haiku refinement) — while keeping the code merge-friendly with upstream and the per-ask token cost lean.

**Architecture:** A pnpm monorepo (`cli`, `server`, `protocol`, `ui-browser`). The browser UI is React 19 + Tailwind v4 + Radix, styled entirely through CSS variables in one stylesheet, with a WebSocket link to a local server that shells out to the `claude` CLI. All work happens in `packages/ui-browser` except the Haiku theme call (server + protocol). Internal package names stay `quack`/`@quack/*` to keep `git pull upstream` painless; only the user-facing surface (slash command, wordmark) rebrands to Quack.

**Tech Stack:** TypeScript, React 19, Tailwind CSS v4, Radix UI (popover), zustand, react-diff-view v3.3.1, refractor/Prism, Vite 6, Jest (ts-jest, node env), pnpm workspaces.

**Spec:** `/Users/twuster/.claude/plans/here-is-the-cosmic-nested-teapot.md` (the approved design this plan implements).

## Global Constraints

- **Repo:** `/Users/twuster/Documents/Personal/quack`, branch `polish/theming-ux`. `origin` = `tannerwuster/quack`, `upstream` = `tannerwuster/quack`.
- **Keep internal names** `quack` / `@quack/*` unchanged — rebrand only the slash command, the TopBar wordmark, and the browser tab title. This minimizes upstream merge conflicts.
- **Persistence pattern:** hand-rolled `localStorage`, keys namespaced `quack:*` (unchanged, for pre-paint-script compatibility), each access wrapped in try/catch. Keys used: `quack:theme`, `quack:hint-dismissed`, `quack:sidebar-width`, `quack:custom-themes`.
- **Token discipline:** the per-ask prompt stays exactly as upstream (preamble + selected chunk + question; no full diff). The only new Claude call is a **non-resume** Haiku one-shot used solely when *creating* a theme.
- **Model id:** use the `haiku` alias, never a dated model id.
- **Commit style:** conventional-commit subjects; **no Claude co-author trailer**. Commit after each task.
- **Icon licensing:** vendored SVGs come from Material Icon Theme (MIT); record attribution in `packages/ui-browser/src/components/file-icons/LICENSE`.
- **Verify each task:** `pnpm --filter @quack/ui-browser typecheck` and `pnpm lint` must pass. Run `pnpm test` when a task adds/changes a `.ts` unit test. UI behavior is verified manually via the dev loop (Jest is node-env, `.ts`-only, and cannot run `.tsx` component tests).
- **Dev loop:** run `/quack-dev` (renamed in Task 1; was `/quack-dev`) from inside the repo → Vite HMR on the UI + a local WS server via `tsx`. Exercise changes against a real diff (e.g. a `uw-web` commit).

---

## File Structure

**New files:**
- `packages/ui-browser/src/lib/persist.ts` — tiny `readLocal`/`writeLocal` localStorage wrappers (DRY; used by hint, sidebar width, theme, custom themes).
- `packages/ui-browser/src/lib/file-icon.ts` — pure `iconForFile(name)` extension→icon-key map.
- `packages/ui-browser/src/lib/file-icon.test.ts` — unit tests for the map.
- `packages/ui-browser/src/components/file-icons/` — vendored colored SVG React components + an `index.tsx` registry + `LICENSE`.
- `packages/ui-browser/src/lib/palette.ts` — pure `derivePalette()`, `TOKEN_KEYS`, `paletteFromConfig()` (paste-config parse/validate), `applyCustomTheme()`, custom-theme persistence.
- `packages/ui-browser/src/lib/palette.test.ts` — unit tests for derivation + config validation.
- `packages/ui-browser/src/components/ThemePicker.tsx` — dropdown replacing `ThemeToggle`.
- `packages/ui-browser/src/components/ThemeEditor.tsx` — custom-theme creator (color inputs, preview, paste box, refine button, save).
- `docs/token-audit.md` — the Phase 5 written report.

**Modified files:**
- `.claude/skills/quack/` → `.claude/skills/quack/`, `.claude/skills/quack-dev/` → `.claude/skills/quack-dev/` (frontmatter `name:` + self-references).
- `packages/ui-browser/index.html` — tab title; pre-paint script reads theme *name* → `data-theme`.
- `packages/ui-browser/src/components/TopBar.tsx` — wordmark; mount `ThemePicker`.
- `packages/ui-browser/src/components/FilePane.tsx` — `renderGutter` for the `+` affordance.
- `packages/ui-browser/src/styles/globals.css` — gutter cursor/hover; `--syntax-*` variables; `[data-theme=…]` blocks.
- `packages/ui-browser/src/components/DiffPane.tsx` — one-time hint.
- `packages/ui-browser/src/components/FileTree.tsx` — controlled width; render file-type icon.
- `packages/ui-browser/src/App.tsx` — sidebar drag handle.
- `packages/ui-browser/src/hooks/use-theme.ts` — generalized `setTheme(name)`.
- `packages/ui-browser/src/components/StaleBanner.tsx` — `dark:` utilities → CSS variables.
- `packages/protocol/src/schemas.ts` — `generate-theme` request/response messages.
- `packages/server/src/claude.ts` — non-resume `generateTheme()` one-shot.
- `packages/server/src/index.ts` — dispatch `generate-theme`.

---

## Task 1: Rebrand surface to Quack

**Files:**
- Rename: `.claude/skills/quack/` → `.claude/skills/quack/`; `.claude/skills/quack-dev/` → `.claude/skills/quack-dev/`
- Modify: the two renamed `SKILL.md` files (frontmatter `name:` and any `/quack`/`/quack-dev` self-references in their bodies)
- Modify: `packages/ui-browser/index.html:9` (tab title)
- Modify: `packages/ui-browser/src/components/TopBar.tsx` (wordmark text)

**Interfaces:**
- Produces: dev command `/quack-dev` (used by all later tasks); wordmark string "quack".

- [ ] **Step 1: Rename the skill directories**

```bash
cd /Users/twuster/Documents/Personal/quack
git mv .claude/skills/quack .claude/skills/quack
git mv .claude/skills/quack-dev .claude/skills/quack-dev
```

- [ ] **Step 2: Update skill frontmatter + self-references**

In `.claude/skills/quack/SKILL.md` and `.claude/skills/quack-dev/SKILL.md`, change the frontmatter `name:` (`quack`→`quack`, `quack-dev`→`quack-dev`) and any in-body mentions of the old slash command to the new one. Grep to confirm none missed:

```bash
grep -rn "quack-dev\|/quack" .claude/skills/quack .claude/skills/quack-dev
```
Expected after edits: only intentional references remain (e.g. explaining lineage), no stale command names.

- [ ] **Step 3: Rebrand the tab title**

In `packages/ui-browser/index.html`, change `<title>quack</title>` (line 9) to `<title>quack</title>`.

- [ ] **Step 4: Rebrand the TopBar wordmark**

In `packages/ui-browser/src/components/TopBar.tsx`, find the brand text `quack` (the left-most wordmark) and change it to `quack`. Grep to locate: `grep -n "quack" packages/ui-browser/src/components/TopBar.tsx`.

- [ ] **Step 5: Typecheck + lint**

Run: `pnpm --filter @quack/ui-browser typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 6: Manually verify the dev loop under the new command**

From a Claude Code session inside `/Users/twuster/Documents/Personal/quack`, run `/quack-dev` against a real diff. Confirm the browser opens, the tab title and TopBar read "quack".

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: rebrand user-facing surface to quack"
```

---

## Task 2: Visible gutter comment affordance

Make the (already-working) click-to-ask discoverable: a faint `+` in the gutter that brightens on hover, plus a pointer cursor. No click rewiring — the existing `gutterEvents` mouseup already opens the composer on a single click (`FilePane.tsx:47-63`).

**Files:**
- Modify: `packages/ui-browser/src/components/FilePane.tsx` (add `renderGutter` to `<Diff>`)
- Modify: `packages/ui-browser/src/styles/globals.css` (`.diff-gutter` cursor + hover)

**Interfaces:**
- Consumes: `changeNewLine` (`selection.ts:11`) to gate on commentable lines.

- [ ] **Step 1: Add `renderGutter` to `<Diff>`**

In `FilePane.tsx`, add a `renderGutter` prop to `<Diff>` (sibling of `gutterEvents`, around line 114). It renders the default line number plus a faint `+` on commentable lines only:

```tsx
renderGutter={({ change, side, renderDefault, wrapInAnchor }) => {
  const showPlus = side === "new" && changeNewLine(change) !== null;
  return wrapInAnchor(
    <>
      {renderDefault()}
      {showPlus && <span className="quack-add-comment" aria-hidden>+</span>}
    </>,
  );
}}
```

Note: confirm the exact v3.3.1 `renderGutter` argument shape at implementation (`{ change, side, inHoverState, renderDefault, wrapInAnchor }`); adjust destructuring if the installed types differ.

- [ ] **Step 2: Style the gutter + `+` glyph**

In `globals.css`, extend the existing `.diff-gutter` rule (currently lines 78-80) and add glyph styles:

```css
.diff-gutter {
  user-select: none;
  cursor: pointer;
}
.diff-gutter:hover {
  background-color: var(--accent);
}
.quack-add-comment {
  margin-left: 4px;
  opacity: 0.25;
  font-weight: 700;
}
.diff-gutter:hover .quack-add-comment {
  opacity: 1;
  color: var(--primary);
}
```

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm --filter @quack/ui-browser typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 4: Manually verify in the dev loop**

`/quack-dev` against a real diff. Confirm: every commentable line shows a faint `+`; hovering a gutter line brightens the `+`, shows a pointer cursor and hover background; clicking the line still opens the single-line composer; drag-over-range still works.

- [ ] **Step 5: Commit**

```bash
git add packages/ui-browser/src/components/FilePane.tsx packages/ui-browser/src/styles/globals.css
git commit -m "feat(ui): show a + affordance in the diff gutter"
```

---

## Task 3: localStorage helper + one-time hint

**Files:**
- Create: `packages/ui-browser/src/lib/persist.ts`
- Modify: `packages/ui-browser/src/components/DiffPane.tsx` (dismissible hint)

**Interfaces:**
- Produces: `readLocal(key): string | null`, `writeLocal(key, value): void` — reused by Tasks 4, 8, 11.

- [ ] **Step 1: Create the persistence helper**

`packages/ui-browser/src/lib/persist.ts`:

```ts
export const readLocal = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const writeLocal = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage may be unavailable (private mode, sandboxed iframe).
  }
};
```

- [ ] **Step 2: Add the one-time hint to DiffPane**

In `DiffPane.tsx`, at the top of the rendered files container (the `<div className="space-y-4 p-4">` at line 45), render a dismissible hint driven by `quack:hint-dismissed`:

```tsx
const [hintDismissed, setHintDismissed] = useState(
  () => readLocal("quack:hint-dismissed") === "1",
);
// ...inside the returned <div>, before files.map:
{!hintDismissed && (
  <div className="flex items-center justify-between rounded-md border bg-accent/40 px-3 py-2 text-xs text-muted-foreground">
    <span>Hover a line and click the <strong>+</strong> to ask Quack about it.</span>
    <button
      type="button"
      className="ml-3 rounded px-1.5 py-0.5 hover:bg-accent"
      onClick={() => {
        writeLocal("quack:hint-dismissed", "1");
        setHintDismissed(true);
      }}
    >
      Got it
    </button>
  </div>
)}
```

Add the `useState` import and `import { readLocal, writeLocal } from "@/lib/persist";`.

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm --filter @quack/ui-browser typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 4: Manually verify**

`/quack-dev`: the hint shows on first load; "Got it" dismisses it; reload → stays dismissed.

- [ ] **Step 5: Commit**

```bash
git add packages/ui-browser/src/lib/persist.ts packages/ui-browser/src/components/DiffPane.tsx
git commit -m "feat(ui): add a dismissible ask hint and persist helper"
```

---

## Task 4: Resizable file-tree sidebar

**Files:**
- Modify: `packages/ui-browser/src/components/FileTree.tsx` (controlled width)
- Modify: `packages/ui-browser/src/App.tsx` (drag handle between aside and main)

**Interfaces:**
- Consumes: `readLocal`/`writeLocal` (Task 3).

- [ ] **Step 1: Make the aside width controlled**

In `FileTree.tsx`, replace the fixed `w-64 shrink-0` on the `<aside>` (line 25) with a controlled width from `localStorage`, clamped to `[180, 520]`px:

```tsx
const [width, setWidth] = useState(() => {
  const raw = Number(readLocal("quack:sidebar-width"));
  return Number.isFinite(raw) && raw >= 180 && raw <= 520 ? raw : 256;
});
```
Change the `<aside>` to `className="flex shrink-0 flex-col border-r bg-card"` and add `style={{ width }}`. Export a way for `App.tsx` to drive resizing — simplest is to lift width into a small zustand slice OR expose the drag handle here. **Chosen approach:** keep width state in `FileTree` and render the drag handle as the last child of the `<aside>` (absolutely positioned on its right edge), so no cross-component wiring is needed.

- [ ] **Step 2: Add the drag handle inside the aside**

Make the `<aside>` `relative`, and append before its closing tag:

```tsx
<div
  role="separator"
  aria-orientation="vertical"
  onMouseDown={(e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = width;
    const onMove = (ev: MouseEvent) => {
      const next = Math.min(520, Math.max(180, startW + ev.clientX - startX));
      setWidth(next);
    };
    const onUp = (ev: MouseEvent) => {
      const next = Math.min(520, Math.max(180, startW + ev.clientX - startX));
      writeLocal("quack:sidebar-width", String(next));
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }}
  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/40"
/>
```

Add `import { readLocal, writeLocal } from "@/lib/persist";` and `useState`. (No change needed in `App.tsx` with this self-contained approach; leave the File Structure note as informational.)

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm --filter @quack/ui-browser typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 4: Manually verify**

`/quack-dev`: drag the sidebar's right edge — it resizes, long file names become visible, clamps at min/max, and the width persists across reload. `<main>` reflows correctly (it already has `min-w-0 flex-1`).

- [ ] **Step 5: Commit**

```bash
git add packages/ui-browser/src/components/FileTree.tsx
git commit -m "feat(ui): make the file-tree sidebar resizable and persistent"
```

---

## Task 5: File-type icon map (pure, TDD)

**Files:**
- Create: `packages/ui-browser/src/lib/file-icon.ts`
- Test: `packages/ui-browser/src/lib/file-icon.test.ts`
- Modify: `jest.config.cjs` (add `@/` moduleNameMapper so the test resolves the alias)

**Interfaces:**
- Produces: `type IconKey` (string union of vendored icon keys), `iconForFile(name: string): IconKey`. Consumed by Task 6.

- [ ] **Step 1: Add the `@/` alias to Jest**

In `jest.config.cjs`, add to `moduleNameMapper` (alongside the existing `@quack/protocol` mapping):

```js
"^@/(.*)$": "<rootDir>/packages/ui-browser/src/$1",
```

- [ ] **Step 2: Write the failing test**

`packages/ui-browser/src/lib/file-icon.test.ts`:

```ts
import { iconForFile } from "@/lib/file-icon";

describe("iconForFile", () => {
  it("maps common code extensions", () => {
    expect(iconForFile("App.tsx")).toBe("react");
    expect(iconForFile("index.ts")).toBe("typescript");
    expect(iconForFile("main.js")).toBe("javascript");
    expect(iconForFile("data.json")).toBe("json");
    expect(iconForFile("styles.css")).toBe("css");
    expect(iconForFile("README.md")).toBe("markdown");
  });

  it("matches by full filename before extension", () => {
    expect(iconForFile("Dockerfile")).toBe("docker");
    expect(iconForFile("package.json")).toBe("npm");
  });

  it("is case-insensitive on the extension", () => {
    expect(iconForFile("Photo.PNG")).toBe("image");
  });

  it("falls back to a generic file icon", () => {
    expect(iconForFile("mystery.xyz")).toBe("file");
    expect(iconForFile("noext")).toBe("file");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test -- file-icon`
Expected: FAIL (cannot find module `@/lib/file-icon`).

- [ ] **Step 4: Implement `iconForFile`**

`packages/ui-browser/src/lib/file-icon.ts` — a full-filename map checked first, then an extension map, then a generic fallback:

```ts
export type IconKey =
  | "react" | "typescript" | "javascript" | "json" | "css" | "html"
  | "markdown" | "yaml" | "shell" | "python" | "go" | "rust" | "java"
  | "image" | "svg" | "lock" | "npm" | "git" | "docker" | "env"
  | "toml" | "sql" | "font" | "text" | "file";

const BY_NAME: Record<string, IconKey> = {
  "package.json": "npm",
  "package-lock.json": "npm",
  "pnpm-lock.yaml": "npm",
  "dockerfile": "docker",
  ".gitignore": "git",
  ".gitattributes": "git",
  ".env": "env",
};

const BY_EXT: Record<string, IconKey> = {
  tsx: "react", jsx: "react",
  ts: "typescript", mts: "typescript", cts: "typescript",
  js: "javascript", mjs: "javascript", cjs: "javascript",
  json: "json", css: "css", scss: "css", html: "html",
  md: "markdown", mdx: "markdown",
  yaml: "yaml", yml: "yaml", toml: "toml",
  sh: "shell", bash: "shell", zsh: "shell",
  py: "python", go: "go", rs: "rust", java: "java",
  png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image",
  svg: "svg", lock: "lock", sql: "sql",
  woff: "font", woff2: "font", ttf: "font", otf: "font",
  txt: "text",
};

export const iconForFile = (name: string): IconKey => {
  const base = name.slice(name.lastIndexOf("/") + 1).toLowerCase();
  if (base in BY_NAME) return BY_NAME[base];
  const dot = base.lastIndexOf(".");
  if (dot > 0) {
    const ext = base.slice(dot + 1);
    if (ext in BY_EXT) return BY_EXT[ext];
  }
  return "file";
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test -- file-icon`
Expected: PASS (all cases).

- [ ] **Step 6: Lint**

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add jest.config.cjs packages/ui-browser/src/lib/file-icon.ts packages/ui-browser/src/lib/file-icon.test.ts
git commit -m "feat(ui): add pure file-type icon mapping with tests"
```

---

## Task 6: Vendor colored icons + render in the file tree

**Files:**
- Create: `packages/ui-browser/src/components/file-icons/index.tsx` (registry: `IconKey` → SVG component)
- Create: `packages/ui-browser/src/components/file-icons/LICENSE` (Material Icon Theme MIT attribution)
- Modify: `packages/ui-browser/src/components/FileTree.tsx` (render the icon in `FileRow`)

**Interfaces:**
- Consumes: `iconForFile`, `IconKey` (Task 5).
- Produces: `<FileTypeIcon icon={key} className="size-4" />`.

- [ ] **Step 1: Vendor the SVGs**

For each `IconKey` (except the generic `"file"`, which uses lucide's `File`), add a small colored SVG sourced from Material Icon Theme (https://github.com/material-extensions/vscode-material-icon-theme, MIT). Save the SVG markup as a React component in `index.tsx`. Record attribution in `file-icons/LICENSE` (copy the upstream MIT text + a "Icons: Material Icon Theme (MIT)" note).

`index.tsx` shape (three representative entries shown; add one per `IconKey` following the identical pattern — paste each icon's `<path>`/`viewBox` from the source SVG, keeping its original `fill` colors):

```tsx
import { File as GenericFile } from "lucide-react";
import type { IconKey } from "@/lib/file-icon";

type IconProps = { className?: string };

const Typescript = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    {/* paste Material Icon Theme typescript.svg contents (keeps its blue fill) */}
  </svg>
);

const React_ = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    {/* paste react.svg contents (cyan) */}
  </svg>
);

const Json = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    {/* paste json.svg contents (yellow) */}
  </svg>
);

// … one component per IconKey …

const REGISTRY: Record<IconKey, (p: IconProps) => JSX.Element> = {
  typescript: Typescript,
  react: React_,
  json: Json,
  // … all other keys …
  file: ({ className }) => <GenericFile className={className} />,
};

export const FileTypeIcon = ({ icon, className }: { icon: IconKey; className?: string }) => {
  const Cmp = REGISTRY[icon];
  return <Cmp className={className} />;
};
```

- [ ] **Step 2: Render the icon in `FileRow`**

In `FileTree.tsx` `FileRow` (around lines 103-154), keep the existing A/M/D change-type badge but add the file-type icon as the leading glyph before the filename. Add imports `import { iconForFile } from "@/lib/file-icon";` and `import { FileTypeIcon } from "./file-icons";`, then inside the row (before the `<span className="truncate font-mono">` at line 137):

```tsx
<FileTypeIcon icon={iconForFile(file.name)} className="size-4 shrink-0" />
```

Keep the change-type badge (`badge.label`) — it conveys add/modify/delete, distinct from file type. Adjust the row `gap` if the two glyphs feel crowded.

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm --filter @quack/ui-browser typecheck && pnpm lint`
Expected: PASS. (If TS complains about `JSX.Element`, import `type { ReactElement }` and use that instead.)

- [ ] **Step 4: Manually verify**

`/quack-dev`: each file shows a recognizable colored type icon (`.tsx` React cyan, `.json` yellow, `.ts` blue, etc.); unknown extensions show the generic file icon; the A/M/D badge still appears.

- [ ] **Step 5: Commit**

```bash
git add packages/ui-browser/src/components/file-icons packages/ui-browser/src/components/FileTree.tsx
git commit -m "feat(ui): add colored file-type icons to the file tree"
```

---

## Task 7: Syntax colors → CSS variables

Refactor the duplicated hardcoded-hex `.token.*` blocks into a single variable-driven block, so each named theme can ship its own syntax palette. **No visual change** in light/dark after this task — it's a pure refactor that must reproduce the current colors.

**Files:**
- Modify: `packages/ui-browser/src/styles/globals.css`

- [ ] **Step 1: Define `--syntax-*` variables for light and dark**

In `:root` (after line 27) add the light syntax palette; in `.dark` (after line 181) add the dark one, using the exact hexes already present in the file:

```css
:root {
  /* …existing… */
  --syntax-comment: #6a737d; --syntax-punctuation: #24292e;
  --syntax-property: #005cc5; --syntax-string: #032f62;
  --syntax-operator: #d73a49; --syntax-keyword: #d73a49;
  --syntax-function: #6f42c1; --syntax-variable: #e36209;
  --syntax-deleted: #b31d28;
}
.dark {
  /* …existing… */
  --syntax-comment: #8b949e; --syntax-punctuation: #c9d1d9;
  --syntax-property: #7ee787; --syntax-number: #79c0ff;
  --syntax-string: #a5d6ff; --syntax-keyword: #ff7b72;
  --syntax-function: #d2a8ff; --syntax-variable: #ffa657;
  --syntax-deleted: #ffa198;
}
```
(Include `--syntax-number` in `:root` too — map it to the light "property/number" hex `#005cc5` to match today's light block, which colors `number` with `.token.number` = `#005cc5`.)

- [ ] **Step 2: Replace the `.token.*` hex with variables**

Collapse the two `.token.*` blocks (light 96-156, dark 206-257) into a **single** set of `.token.*` rules that reference the variables, e.g.:

```css
.token.comment, .token.prolog, .token.doctype, .token.cdata { color: var(--syntax-comment); font-style: italic; }
.token.punctuation { color: var(--syntax-punctuation); }
.token.property, .token.tag, .token.boolean, .token.constant, .token.symbol { color: var(--syntax-property); }
.token.number { color: var(--syntax-number); }
.token.selector, .token.attr-name, .token.string, .token.char, .token.builtin, .token.inserted { color: var(--syntax-string); }
.token.operator, .token.entity, .token.url, .token.atrule, .token.attr-value, .token.keyword { color: var(--syntax-keyword); background: transparent; }
.token.function, .token.class-name { color: var(--syntax-function); }
.token.regex, .token.important, .token.variable { color: var(--syntax-variable); }
.token.deleted { color: var(--syntax-deleted); }
.token.important, .token.bold { font-weight: 600; }
.token.italic { font-style: italic; }
```
Delete the now-redundant `.dark .token.*` block. Preserve any light-vs-dark grouping differences by keeping the variable assignments accurate (e.g. light grouped `boolean/number` with `property`; the `--syntax-number` var handles the one place they diverge).

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm --filter @quack/ui-browser typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 4: Manually verify no regression**

`/quack-dev`: toggle light and dark; syntax highlighting looks **identical** to before this task (compare against a screenshot/`git stash` if unsure).

- [ ] **Step 5: Commit**

```bash
git add packages/ui-browser/src/styles/globals.css
git commit -m "refactor(ui): drive syntax highlighting from CSS variables"
```

---

## Task 8: `data-theme` migration (multi-theme foundation)

Switch the theme mechanism from a binary `.dark` class to a named `data-theme` attribute, without breaking the FOUC-guard or the existing light/dark behavior. Convert the one file that uses `dark:` utilities.

**Files:**
- Modify: `packages/ui-browser/index.html` (pre-paint script)
- Modify: `packages/ui-browser/src/hooks/use-theme.ts` (`setTheme(name)`)
- Modify: `packages/ui-browser/src/components/StaleBanner.tsx` (`dark:` → variables)

**Interfaces:**
- Produces: `type ThemeName`, `useTheme(): { theme: ThemeName; setTheme(name: ThemeName): void; themes: ThemeName[] }`. Consumed by Task 9.

- [ ] **Step 1: Keep `.dark` semantics AND add `data-theme`**

Decision: `dark` and `dracula`/`cosmicgirl` are all dark-based. To keep Tailwind's `dark:` variant working during the transition and for any future `dark:` use, the pre-paint script and `setTheme` set **both** `data-theme="<name>"` and toggle the `.dark` class for dark-family themes.

Rewrite the `index.html` pre-paint script (lines 10-20):

```html
<script>
  (function () {
    try {
      var name = localStorage.getItem("quack:theme");
      var known = ["light", "dark", "dracula", "cosmicgirl"];
      if (known.indexOf(name) === -1) {
        name = (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
      }
      var root = document.documentElement;
      root.setAttribute("data-theme", name);
      if (name !== "light") root.classList.add("dark");
    } catch (e) {}
  })();
</script>
```

- [ ] **Step 2: Generalize `use-theme.ts`**

Replace the binary hook with a named one (mirroring the pre-paint logic and using `writeLocal`):

```ts
import { useState } from "react";
import { readLocal, writeLocal } from "@/lib/persist";

export type ThemeName = "light" | "dark" | "dracula" | "cosmicgirl";
export const THEMES: ThemeName[] = ["light", "dark", "dracula", "cosmicgirl"];
const STORAGE_KEY = "quack:theme";

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
  return { theme, setTheme, themes: THEMES };
};
```
Note: `readLocal` is imported for parity/future use; `current()` reads the DOM attribute the pre-paint script set. Keep `.dark` scoping in `globals.css` intact (dark-family themes still get `.dark`; `[data-theme="dracula"]` etc. layer on top in Task 9).

- [ ] **Step 3: Convert `StaleBanner.tsx` off `dark:` utilities**

Replace the `dark:`-based amber colors (lines ~14, ~21) with theme-agnostic classes using existing tokens (e.g. `bg-amber-100 text-amber-900` → a variable-based amber that works on any dark theme, such as `border-amber-500/40 bg-amber-500/10 text-amber-600`). Verify the banner is legible on light, dark, and (after Task 9) dracula/cosmicgirl.

- [ ] **Step 4: Typecheck + lint**

Run: `pnpm --filter @quack/ui-browser typecheck && pnpm lint`
Expected: PASS. (Note: `ThemeToggle.tsx` still imports the old hook shape — it is replaced in Task 9. If typecheck fails on it now, do Task 9 Step 1 immediately, or temporarily keep a `toggle` shim. Prefer proceeding straight to Task 9.)

- [ ] **Step 5: Manually verify**

`/quack-dev`: light and dark still work and persist; no FOUC on reload; the stale banner (force it by editing a reviewed file) is legible in both.

- [ ] **Step 6: Commit**

```bash
git add packages/ui-browser/index.html packages/ui-browser/src/hooks/use-theme.ts packages/ui-browser/src/components/StaleBanner.tsx
git commit -m "refactor(ui): drive theme via data-theme attribute"
```

---

## Task 9: Dracula + CosmicGirl themes + theme picker

**Files:**
- Modify: `packages/ui-browser/src/styles/globals.css` (`[data-theme]` blocks)
- Create: `packages/ui-browser/src/components/ThemePicker.tsx`
- Modify: `packages/ui-browser/src/components/TopBar.tsx` (mount `ThemePicker`, remove `ThemeToggle`)
- Delete: `packages/ui-browser/src/components/ThemeToggle.tsx`

**Interfaces:**
- Consumes: `useTheme`, `ThemeName`, `THEMES` (Task 8).

- [ ] **Step 1: Add theme blocks in `globals.css`**

After the `.dark` block, add Dracula and CosmicGirl. Both use the **Dracula Neon syntax palette**; CosmicGirl overrides only chrome per the reference config. Use Dracula's canonical colors for the UI tokens:

```css
[data-theme="dracula"] {
  --background: #282a36; --foreground: #f8f8f2;
  --card: #21222c; --card-foreground: #f8f8f2;
  --popover: #21222c; --popover-foreground: #f8f8f2;
  --primary: #bd93f9; --primary-foreground: #282a36;
  --secondary: #44475a; --secondary-foreground: #f8f8f2;
  --muted: #44475a; --muted-foreground: #a6accd;
  --accent: #44475a; --accent-foreground: #f8f8f2;
  --destructive: #ff5555; --destructive-foreground: #282a36;
  --border: #44475a; --input: #44475a; --ring: #bd93f9;
  /* Dracula Neon syntax */
  --syntax-comment: #6272a4; --syntax-punctuation: #f8f8f2;
  --syntax-property: #bd93f9; --syntax-number: #bd93f9;
  --syntax-string: #f1fa8c; --syntax-keyword: #ff79c6;
  --syntax-function: #50fa7b; --syntax-variable: #ffb86c;
  --syntax-deleted: #ff5555;
}
[data-theme="cosmicgirl"] {
  /* CosmicGirl's Dracula (Neon): Dracula syntax + teal-navy chrome */
  --background: #0E1419; --foreground: #f8f8f2;
  --card: #0E1419; --card-foreground: #f8f8f2;
  --popover: #0E1419; --popover-foreground: #f8f8f2;
  --primary: #574473; --primary-foreground: #f8f8f2;
  --secondary: #253340; --secondary-foreground: #f8f8f2;
  --muted: #253340; --muted-foreground: #a6accd;
  --accent: #253340; --accent-foreground: #f8f8f2;
  --destructive: #ff5555; --destructive-foreground: #0E1419;
  --border: #253340; --input: #253340; --ring: #574473;
  --syntax-comment: #6272a4; --syntax-punctuation: #f8f8f2;
  --syntax-property: #bd93f9; --syntax-number: #bd93f9;
  --syntax-string: #f1fa8c; --syntax-keyword: #ff79c6;
  --syntax-function: #50fa7b; --syntax-variable: #ffb86c;
  --syntax-deleted: #ff5555;
}
```
Also add diff hunk colors for these themes mirroring the existing `.dark .diff-code-insert/-delete` pattern (green/red tinted for a dark background) — scope them `[data-theme="dracula"] .diff-code-insert { … }` etc., or rely on the `.dark` versions since both set `.dark`. Simplest: keep the `.dark .diff-*` rules and let dracula/cosmicgirl inherit them (they all carry the `.dark` class).

- [ ] **Step 2: Build the `ThemePicker` dropdown**

`ThemePicker.tsx` — a Radix popover (already a dep, see `components/ui/popover.tsx`) with a labeled swatch per theme:

```tsx
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";
import { useTheme, type ThemeName } from "@/hooks/use-theme";

const LABELS: Record<ThemeName, string> = {
  light: "Light", dark: "Dark", dracula: "Dracula", cosmicgirl: "Cosmic Girl",
};

export const ThemePicker = () => {
  const { theme, setTheme, themes } = useTheme();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2" aria-label="Theme">
          <Palette className="size-4" />
          <span className="text-xs">{LABELS[theme]}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-40 p-1">
        {themes.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTheme(t)}
            className={"flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-accent" + (t === theme ? " font-medium" : "")}
          >
            {LABELS[t]}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};
```
(Task 11 adds saved custom themes to this list.)

- [ ] **Step 3: Swap `ThemeToggle` → `ThemePicker` in TopBar**

In `TopBar.tsx`, replace the `<ThemeToggle />` in the `ml-auto` cluster (line ~67) with `<ThemePicker />`; update imports; delete `ThemeToggle.tsx`.

- [ ] **Step 4: Typecheck + lint**

Run: `pnpm --filter @quack/ui-browser typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 5: Manually verify**

`/quack-dev`: the picker lists Light/Dark/Dracula/Cosmic Girl; selecting each recolors chrome **and** syntax; choice persists across reload with no FOUC; Cosmic Girl shows the deep teal-navy background with purple accents.

- [ ] **Step 6: Commit**

```bash
git add packages/ui-browser/src/styles/globals.css packages/ui-browser/src/components/ThemePicker.tsx packages/ui-browser/src/components/TopBar.tsx
git rm packages/ui-browser/src/components/ThemeToggle.tsx
git commit -m "feat(ui): add Dracula and Cosmic Girl themes with a theme picker"
```

---

## Task 10: Deterministic palette derivation + config parse (pure, TDD)

**Files:**
- Create: `packages/ui-browser/src/lib/palette.ts`
- Test: `packages/ui-browser/src/lib/palette.test.ts`

**Interfaces:**
- Produces: `TOKEN_KEYS: string[]` (the CSS-var names a custom theme must fill, without the `--` prefix); `type Palette = Record<string, string>`; `derivePalette(primaryHex, secondaryHex): Palette`; `paletteFromConfig(raw: string): Palette` (parse+validate JSON or `--k: v;` CSS text). Consumed by Tasks 11 and 13.

- [ ] **Step 1: Write the failing tests**

`packages/ui-browser/src/lib/palette.test.ts`:

```ts
import { derivePalette, paletteFromConfig, TOKEN_KEYS } from "@/lib/palette";

describe("derivePalette", () => {
  it("returns every required token key", () => {
    const p = derivePalette("#bd93f9", "#50fa7b");
    for (const k of TOKEN_KEYS) expect(p[k]).toBeTruthy();
  });
  it("is deterministic", () => {
    expect(derivePalette("#bd93f9", "#50fa7b")).toEqual(derivePalette("#bd93f9", "#50fa7b"));
  });
  it("accepts 3- and 6-digit hex", () => {
    expect(() => derivePalette("#abc", "#def")).not.toThrow();
  });
  it("rejects invalid hex", () => {
    expect(() => derivePalette("nope", "#50fa7b")).toThrow();
  });
  it("produces a dark background and light foreground by default", () => {
    const p = derivePalette("#bd93f9", "#50fa7b");
    expect(p.background).toMatch(/^hsl\(/);
    expect(p.foreground).toMatch(/^hsl\(/);
  });
});

describe("paletteFromConfig", () => {
  it("parses a JSON object of token→color", () => {
    const raw = JSON.stringify({ background: "#000", foreground: "#fff", primary: "#bd93f9" });
    const p = paletteFromConfig(raw);
    expect(p.background).toBe("#000");
    expect(p.primary).toBe("#bd93f9");
  });
  it("parses CSS custom-property text", () => {
    const p = paletteFromConfig("--background: #000; --primary: #bd93f9;");
    expect(p.background).toBe("#000");
    expect(p.primary).toBe("#bd93f9");
  });
  it("throws on unknown keys", () => {
    expect(() => paletteFromConfig(JSON.stringify({ notAToken: "#000" }))).toThrow();
  });
  it("throws on non-color values", () => {
    expect(() => paletteFromConfig(JSON.stringify({ background: "banana" }))).toThrow();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test -- palette`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `palette.ts`**

```ts
export const TOKEN_KEYS = [
  "background", "foreground", "card", "card-foreground", "popover", "popover-foreground",
  "primary", "primary-foreground", "secondary", "secondary-foreground",
  "muted", "muted-foreground", "accent", "accent-foreground",
  "destructive", "destructive-foreground", "border", "input", "ring",
  "syntax-comment", "syntax-punctuation", "syntax-property", "syntax-number",
  "syntax-string", "syntax-keyword", "syntax-function", "syntax-variable", "syntax-deleted",
] as const;

export type Palette = Record<string, string>;

const parseHex = (hex: string): { h: number; s: number; l: number } => {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`invalid hex: ${hex}`);
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
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

const hsl = (h: number, s: number, l: number) => `hsl(${h} ${s}% ${l}%)`;

// Base (Dracula Neon) syntax palette reused for derived themes.
const BASE_SYNTAX: Palette = {
  "syntax-comment": "#6272a4", "syntax-punctuation": "#f8f8f2",
  "syntax-property": "#bd93f9", "syntax-number": "#bd93f9",
  "syntax-string": "#f1fa8c", "syntax-keyword": "#ff79c6",
  "syntax-function": "#50fa7b", "syntax-variable": "#ffb86c",
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

const COLOR_RE = /^(#[0-9a-f]{3,8}|rgb|hsl|oklch)/i;

export const paletteFromConfig = (raw: string): Palette => {
  const trimmed = raw.trim();
  let obj: Record<string, unknown>;
  if (trimmed.startsWith("{")) {
    obj = JSON.parse(trimmed) as Record<string, unknown>;
  } else {
    obj = {};
    for (const decl of trimmed.split(";")) {
      const [k, v] = decl.split(":");
      if (!k || !v) continue;
      obj[k.trim().replace(/^--/, "")] = v.trim();
    }
  }
  const allowed = new Set<string>(TOKEN_KEYS);
  const out: Palette = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!allowed.has(k)) throw new Error(`unknown token: ${k}`);
    if (typeof v !== "string" || !COLOR_RE.test(v)) throw new Error(`invalid color for ${k}: ${String(v)}`);
    out[k] = v;
  }
  return out;
};
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm test -- palette`
Expected: PASS.

- [ ] **Step 5: Lint**

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/ui-browser/src/lib/palette.ts packages/ui-browser/src/lib/palette.test.ts
git commit -m "feat(ui): add deterministic palette derivation and config parsing"
```

---

## Task 11: Apply + persist custom themes + theme editor UI

**Files:**
- Modify: `packages/ui-browser/src/lib/palette.ts` (apply + persistence helpers)
- Create: `packages/ui-browser/src/components/ThemeEditor.tsx`
- Modify: `packages/ui-browser/src/components/ThemePicker.tsx` (list saved custom themes + "New theme…")
- Modify: `packages/ui-browser/src/hooks/use-theme.ts` (support applying a custom theme name)

**Interfaces:**
- Consumes: `derivePalette`, `paletteFromConfig`, `TOKEN_KEYS`, `Palette`, `readLocal`/`writeLocal`.
- Produces: `applyCustomTheme(p: Palette)`, `loadCustomThemes(): Record<string, Palette>`, `saveCustomTheme(name, p)`.

- [ ] **Step 1: Add apply + persistence to `palette.ts`**

```ts
import { readLocal, writeLocal } from "@/lib/persist";

const STYLE_ID = "quack-custom-theme";
const STORE_KEY = "quack:custom-themes";

export const applyCustomTheme = (p: Palette): void => {
  const css = `:root[data-theme="custom"] {\n${TOKEN_KEYS.map((k) => (p[k] ? `  --${k}: ${p[k]};` : "")).filter(Boolean).join("\n")}\n}`;
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = css;
};

export const loadCustomThemes = (): Record<string, Palette> => {
  const raw = readLocal(STORE_KEY);
  if (!raw) return {};
  try { return JSON.parse(raw) as Record<string, Palette>; } catch { return {}; }
};

export const saveCustomTheme = (name: string, p: Palette): void => {
  const all = loadCustomThemes();
  all[name] = p;
  writeLocal(STORE_KEY, JSON.stringify(all));
};
```

- [ ] **Step 2: Let `useTheme` apply a custom theme**

Extend `setTheme` so that when called with `"custom"` it also injects the saved custom palette. Simplest: add `applyCustomThemeByName(name)` that looks up `loadCustomThemes()`, calls `applyCustomTheme`, then sets `data-theme="custom"` + `.dark`. Keep the named-theme path unchanged. (Custom themes are always dark-family for v1.)

- [ ] **Step 3: Build `ThemeEditor.tsx`**

A popover/dialog with: two `<input type="color">` (primary, secondary) → live `derivePalette` preview applied via `applyCustomTheme`; a `<textarea>` paste box → `paletteFromConfig` on apply (show validation errors inline); a name field + Save (calls `saveCustomTheme`, then selects it); and a "Refine with Claude" button (wired in Task 13 — render it disabled/no-op here with a TODO-free placeholder that calls a passed `onRefine` prop defaulting to a no-op). Keep it self-contained; reachable from the picker.

- [ ] **Step 4: Surface saved themes in `ThemePicker`**

Read `loadCustomThemes()`, render each saved name below the built-ins (selecting calls the custom-apply path), and add a "＋ New theme…" row that opens `ThemeEditor`.

- [ ] **Step 5: Typecheck + lint**

Run: `pnpm --filter @quack/ui-browser typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 6: Manually verify**

`/quack-dev`: open "New theme…"; pick two colors → preview updates live; paste a valid config → applies; paste garbage → inline error, no apply; Save → the theme appears in the picker and persists across reload.

- [ ] **Step 7: Commit**

```bash
git add packages/ui-browser/src/lib/palette.ts packages/ui-browser/src/components/ThemeEditor.tsx packages/ui-browser/src/components/ThemePicker.tsx packages/ui-browser/src/hooks/use-theme.ts
git commit -m "feat(ui): custom theme creator with deterministic + paste-config paths"
```

---

## Task 12: Haiku theme generation (server + protocol)

**Files:**
- Modify: `packages/protocol/src/schemas.ts` (add `generate-theme` client msg + `theme-generated` / `theme-error` server msgs)
- Test: `packages/protocol/src/schemas.test.ts` (add cases for the new messages)
- Modify: `packages/server/src/claude.ts` (add non-resume `generateTheme()`)
- Modify: `packages/server/src/index.ts` (dispatch `generate-theme`)

**Interfaces:**
- Produces WS messages: client `{ type: "generate-theme", id, primary, secondary }`; server `{ type: "theme-generated", id, palette }` / `{ type: "theme-error", id, message }`. `palette` is `Record<string,string>` keyed by `TOKEN_KEYS`.

- [ ] **Step 1: Write failing protocol tests**

In `schemas.test.ts`, add: a valid `generate-theme` message parses; one missing `primary` fails; a `theme-generated` with a `palette` object parses. Run `pnpm test -- schemas` → FAIL.

- [ ] **Step 2: Add the schemas**

In `schemas.ts`, define the message schemas and add them to the client/server discriminated unions (at the unions near lines 41 and 104):

```ts
export const GenerateThemeSchema = z.object({
  type: z.literal("generate-theme"),
  id: z.string().min(1),
  primary: z.string().min(1),
  secondary: z.string().min(1),
});
export const ThemeGeneratedSchema = z.object({
  type: z.literal("theme-generated"),
  id: z.string().min(1),
  palette: z.record(z.string(), z.string()),
});
export const ThemeErrorSchema = z.object({
  type: z.literal("theme-error"),
  id: z.string().min(1),
  message: z.string(),
});
```
Add `GenerateThemeSchema` to the client union and the two others to the server union.

- [ ] **Step 3: Run protocol tests → PASS**

Run: `pnpm test -- schemas`. Expected: PASS.

- [ ] **Step 4: Implement `generateTheme()` in `claude.ts`**

A **non-resume** one-shot mirroring `streamAnswer`'s spawn but without `--resume`, pinned to `haiku`, reusing `childEnv()`. Read stdout to completion, extract the JSON palette, validate keys against the token list, return it:

```ts
export const generateTheme = async (
  primary: string,
  secondary: string,
  cwd: string,
): Promise<Record<string, string>> => {
  const prompt = [
    "You are a theme designer. Given a primary and secondary color, produce a cohesive DARK UI palette.",
    "Return ONLY a JSON object (no prose) whose keys are exactly these CSS variable names (without the leading --):",
    THEME_TOKEN_KEYS.join(", ") + ".",
    "Values must be valid CSS colors (hex or hsl()). Ensure strong contrast: dark background, light foreground.",
    `primary: ${primary}`,
    `secondary: ${secondary}`,
  ].join("\n");

  const args = ["-p", "--model", "haiku", "--output-format", "text"];
  const child = spawn("claude", args, { cwd, stdio: ["pipe", "pipe", "pipe"], env: childEnv() });
  child.stdin.end(prompt);
  let out = "";
  for await (const buf of child.stdout) out += String(buf);
  const match = /\{[\s\S]*\}/.exec(out);
  if (!match) throw new Error("no JSON in model output");
  const parsed = JSON.parse(match[0]) as Record<string, unknown>;
  const palette: Record<string, string> = {};
  for (const k of THEME_TOKEN_KEYS) {
    if (typeof parsed[k] === "string") palette[k] = parsed[k] as string;
  }
  return palette;
};
```
Define `THEME_TOKEN_KEYS` in the server (copy the list from `palette.ts`'s `TOKEN_KEYS`, or move it into `@quack/protocol` and import from both sides — preferred to keep one source of truth). Confirm `spawn`, `childEnv` are already imported in `claude.ts`.

- [ ] **Step 5: Dispatch in `index.ts`**

Add a `case "generate-theme"` next to the existing `case "ask"` (near line 210). On success send `theme-generated`; on throw send `theme-error` with the message. Do not touch the `ask` path.

- [ ] **Step 6: Typecheck + lint + tests**

Run: `pnpm --filter @quack/server typecheck 2>/dev/null || pnpm -r typecheck; pnpm lint; pnpm test -- schemas`
Expected: PASS.

- [ ] **Step 7: Manually verify the call is non-resume + cheap**

With `/quack-dev` running, trigger a generate (via a temporary manual WS message or after Task 13) and confirm in the server logs that the spawned `claude` args contain `--model haiku` and **no** `--resume`.

- [ ] **Step 8: Commit**

```bash
git add packages/protocol/src/schemas.ts packages/protocol/src/schemas.test.ts packages/server/src/claude.ts packages/server/src/index.ts
git commit -m "feat(server): add non-resume Haiku theme generation"
```

---

## Task 13: Wire "Refine with Claude" into the editor

**Files:**
- Modify: `packages/ui-browser/src/components/ThemeEditor.tsx` (send `generate-theme`, apply result)
- Modify: `packages/ui-browser/src/lib/store.ts` or the WS hook (send the message + route the response)

**Interfaces:**
- Consumes: the WS send path (`lib/ws.ts` / `store.ts`), `applyCustomTheme`, `derivePalette` (fallback).

- [ ] **Step 1: Send `generate-theme` on button click**

In `ThemeEditor`, the "Refine with Claude" button sends `{ type: "generate-theme", id, primary, secondary }` over the existing WS connection (follow how `startAsk` sends `ask` in `store.ts:270-288`). Track a pending `id`.

- [ ] **Step 2: Route the response**

Handle `theme-generated` (apply the returned palette via `applyCustomTheme`, update the preview) and `theme-error` (show the message inline and fall back to the deterministic `derivePalette` result) wherever incoming server messages are dispatched (the `use-websocket` hook / store reducer that already handles `chunk`/`diff`). Show a spinner on the button while pending.

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm --filter @quack/ui-browser typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 4: Manually verify end-to-end**

`/quack-dev`: in the editor, choose two colors → "Refine with Claude" → within a couple seconds the preview updates to a Claude-fitted palette; Save keeps it; killing the network / an error falls back to the deterministic palette with a visible message.

- [ ] **Step 5: Commit**

```bash
git add packages/ui-browser/src/components/ThemeEditor.tsx packages/ui-browser/src/lib/store.ts packages/ui-browser/src/hooks/use-websocket.ts
git commit -m "feat(ui): refine custom themes with a Haiku one-shot"
```

---

## Task 14: Token-audit report

**Files:**
- Create: `docs/token-audit.md`

- [ ] **Step 1: Write the report**

Document, with `file:line` evidence: the per-ask prompt is preamble + selected chunk + question (`claude.ts:121-135`), with no full-diff/file injection; the dominant token cost is `--resume` rehydrating the session transcript, which grows with the conversation and is the core "remembers everything" feature (not removable without breaking it); the only mitigations are keeping asks focused and starting a fresh session when a thread gets long; and the new theme generation is a **non-resume** Haiku one-shot that fires only on theme creation. Note the `QUACK_MODEL` env override (`claude.ts:22`) as a power-user lever to run asks on a cheaper model. Recommend no speculative refactor.

- [ ] **Step 2: Commit**

```bash
git add docs/token-audit.md
git commit -m "docs: add per-ask token audit"
```

---

## Self-Review Notes

- **Spec coverage:** rebrand (Task 1) ✓; discoverability — `+`/cursor (Task 2) + hint (Task 3) ✓; file tree — resizable (Task 4) + colored icons (Tasks 5-6) ✓; themes — variable refactor (Task 7) + data-theme (Task 8) + Dracula/CosmicGirl + picker (Task 9) ✓; custom themes — derive/config (Task 10) + apply/persist/editor (Task 11) + Haiku (Tasks 12-13) ✓; token audit (Task 14) ✓.
- **Type consistency:** `TOKEN_KEYS`/`Palette` defined in Task 10 and reused in 11/12/13; `ThemeName`/`useTheme` shape defined in Task 8 and consumed in 9/11; `iconForFile`/`IconKey` in Task 5 consumed in 6; `readLocal`/`writeLocal` in Task 3 consumed in 4/8/11. Consider moving `TOKEN_KEYS` into `@quack/protocol` (Task 12 Step 4) so server + UI share one definition.
- **Ordering:** Task 8 briefly leaves `ThemeToggle.tsx` referencing the old hook; resolved immediately in Task 9 (noted in Task 8 Step 4). If executed by separate subagents, run 8 and 9 back-to-back.
- **Known runtime confirmations** (call out during execution, not blockers): react-diff-view v3.3.1 `renderGutter` argument shape (Task 2); `claude` streaming vs `--output-format text` for the one-shot (Task 12).
