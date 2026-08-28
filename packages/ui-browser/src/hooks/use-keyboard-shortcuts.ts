import { useEffect, useMemo, useRef } from "react";
import { parseDiff, type FileData } from "react-diff-view";
import { useStore } from "@/lib/store";
import { filePath } from "@/lib/selection";
import { matchesFilter, resolveCollapsed } from "@/lib/diff-utils";
import { stepIndex, nextMatching } from "@/lib/nav";
import { buildThreads } from "@/lib/threads";

const isEditable = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
};

const scrollToSelector = (selector: string) => {
  requestAnimationFrame(() => {
    const el = document.querySelector(selector);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  });
};

const cssEscape = (s: string): string =>
  typeof CSS !== "undefined" && CSS.escape ? CSS.escape(s) : s.replace(/["\\]/g, "\\$&");

// The filter input lives in the file tree, so "/" has to reveal a collapsed
// sidebar first — the tree focuses itself on mount off the same nonce.
const focusFilter = (s: ReturnType<typeof useStore.getState>) => {
  if (s.sidebarCollapsed) s.setSidebarCollapsed(false);
  s.requestFocusFilter();
};

/**
 * Global keyboard shortcuts for review navigation. Mounted once at the app
 * root. Ignores keystrokes while the user is typing in a field, and never
 * hijacks modifier combos (Cmd/Ctrl/Alt) so browser shortcuts still work.
 */
export const useKeyboardShortcuts = () => {
  const diff = useStore((s) => s.diff);
  const filterQuery = useStore((s) => s.filterQuery);
  const filterTypes = useStore((s) => s.filterTypes);

  const files = useMemo<FileData[]>(
    () =>
      diff
        ? parseDiff(diff.raw).filter((f) => matchesFilter(f, filterQuery, filterTypes))
        : [],
    [diff, filterQuery, filterTypes],
  );

  const filesRef = useRef(files);
  filesRef.current = files;
  const lastThreadKey = useRef<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // ⌘B / Ctrl+B toggles the file tree. Checked before the editable and
      // modifier guards below so it works the way it does in an IDE —
      // including while the cursor sits in the filter box or a composer.
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        useStore.getState().toggleSidebar();
        return;
      }

      if (isEditable(e.target)) {
        if (e.key === "Escape" && e.target instanceof HTMLElement) e.target.blur();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const s = useStore.getState();
      const list = filesRef.current;
      const paths = list.map((f) => filePath(f));

      const moveFile = (dir: 1 | -1) => {
        if (list.length === 0) return;
        const cur = s.selectedFile;
        const idx = cur ? paths.indexOf(cur) : -1;
        const ni = stepIndex(list.length, idx, dir);
        const path = paths[ni];
        if (path !== undefined) s.requestScrollTo(path);
      };

      const moveThread = (dir: 1 | -1) => {
        const threads = buildThreads(s.asks, s.askOrder, s.resolvedThreads, paths);
        if (threads.length === 0) {
          s.pushToast("No comments to jump to", "info");
          return;
        }
        const curIdx = lastThreadKey.current
          ? threads.findIndex((t) => t.key === lastThreadKey.current)
          : -1;
        const ni = nextMatching(threads, curIdx, dir, (t) => !t.resolved);
        if (ni < 0) {
          s.pushToast("No unresolved comments", "info");
          return;
        }
        const th = threads[ni];
        if (!th) return;
        lastThreadKey.current = th.key;
        s.setCollapsed(th.file, false);
        scrollToSelector(`[data-thread="${cssEscape(th.key)}"]`);
      };

      const currentFile = (): FileData | undefined => {
        const cur = s.selectedFile;
        return cur ? list.find((f) => filePath(f) === cur) : list[0];
      };

      switch (e.key) {
        case "j":
        case "]":
          e.preventDefault();
          moveFile(1);
          break;
        case "k":
        case "[":
          e.preventDefault();
          moveFile(-1);
          break;
        case "n":
          e.preventDefault();
          moveThread(1);
          break;
        case "p":
          e.preventDefault();
          moveThread(-1);
          break;
        case "v": {
          const f = currentFile();
          if (f) s.toggleViewed(filePath(f));
          break;
        }
        case "e": {
          const f = currentFile();
          if (f) {
            const path = filePath(f);
            s.setCollapsed(path, !resolveCollapsed(s.fileCollapsed[path], f));
          }
          break;
        }
        case "u":
          s.toggleViewMode();
          break;
        case "w":
          s.toggleWrap();
          break;
        case "/":
          // Shift+/ is "?" on most layouts, but some environments report
          // the key as "/" with shiftKey set — treat that as help too.
          e.preventDefault();
          if (e.shiftKey) s.setSettingsOpen(!s.settingsOpen);
          else focusFilter(s);
          break;
        case "?":
          e.preventDefault();
          s.setSettingsOpen(!s.settingsOpen);
          break;
        case "Escape":
          if (s.settingsOpen) s.setSettingsOpen(false);
          break;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, []);
};
