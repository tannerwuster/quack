import type { ClientMessage, DiffFile } from "@askdiff/protocol";
import { create } from "zustand";
import { readLocal, writeLocal } from "@/lib/persist";

export type ViewMode = "split" | "unified";

/** Stable key identifying a comment thread: its file + anchor line. */
export const threadKey = (file: string, toLine: number): string =>
  `${file}#${String(toLine)}`;

export type ConnectionState =
  | { state: "idle" }
  | { state: "connecting" }
  | { state: "open" }
  | { state: "closed"; reason?: string }
  | { state: "error"; error: string };

export type AskStatus = "streaming" | "done" | "error" | "cancelled";

export type Ask = {
  id: string;
  file: string;
  fromLine: number;
  toLine: number;
  chunk: string;
  question: string;
  status: AskStatus;
  response: string;
  error?: string;
  // Optional model override sent with the ask (CLI alias: opus/sonnet/haiku).
  // Undefined means "inherit the review session's model".
  model?: string;
};

// A model the composer can send an ask on. `value: undefined` means no
// override — the server resumes the session on its own model. Aliases map
// to whatever the `claude` CLI resolves them to, so they stay current.
export type AskModelOption = { value: string | undefined; label: string; hint: string };
export const ASK_MODEL_OPTIONS: AskModelOption[] = [
  { value: undefined, label: "Session default", hint: "Inherit the review session's model" },
  { value: "opus", label: "Opus", hint: "Most capable" },
  { value: "sonnet", label: "Sonnet", hint: "Balanced speed & quality" },
  { value: "haiku", label: "Haiku", hint: "Fastest, lightest on tokens" },
];

export type AskInput = {
  file: string;
  fromLine: number;
  toLine: number;
  chunk: string;
  question: string;
};

export type ToastLevel = "error" | "info";
export type Toast = { id: string; message: string; level: ToastLevel };

type Store = {
  // connection
  conn: ConnectionState;
  protocol?: string;
  project?: string;
  // The Claude Code session this UI is attached to. Read-only — set
  // once when the server's `session` message arrives, never mutated
  // from the UI (there's no protocol surface for that anymore).
  sessionId: string | null;

  // diff
  diff?: {
    raw: string;
    files: DiffFile[];
    label?: string;
    // Set when the server detected the diff has drifted from the
    // working tree (only ever true for volatile/working-tree diffs).
    stale?: boolean;
    // Paths (relative to project cwd) that are newer than the diff
    // file's mtime, or that have been removed from disk.
    staleFiles?: string[];
  };
  selectedFile?: string;

  // per-file UI state (path → flag)
  fileViewed: Record<string, boolean>;
  fileCollapsed: Record<string, boolean>;

  // diff-view preferences (persisted)
  viewMode: ViewMode;
  wrapLines: boolean;

  // Model new asks are sent on (persisted). Undefined = session default.
  askModel: string | undefined;

  // comment threads the reviewer has resolved (threadKey → true). Persisted
  // so resolution survives reconnects/re-renders of the same diff.
  resolvedThreads: Record<string, boolean>;

  // file-tree / diff filtering
  filterQuery: string;
  // Change-type filters (react-diff-view file.type: add|delete|modify|rename|copy).
  // Empty set means "all types".
  filterTypes: string[];

  // keyboard-driven UI coordination
  helpOpen: boolean;
  // bumped by the "/" shortcut so the FileTree focuses its filter input
  focusFilterNonce: number;

  // file-tree sidebar: dir path → collapsed? (default expanded)
  treeCollapsed: Record<string, boolean>;

  // bumped to ask DiffPane to scroll a file into view
  scrollRequest?: { path: string; nonce: number };

  // asks
  asks: Record<string, Ask>;
  askOrder: string[];

  openAnchors: Record<string, { fromLine: number; toLine: number; chunk: string }>;

  // custom-theme generation (Haiku one-shot)
  themeGen?: {
    id: string;
    status: "pending" | "done" | "error";
    palette?: Record<string, string>;
    error?: string;
  };

  // toasts
  toasts: Toast[];

  setSend: (fn: (msg: ClientMessage) => void) => void;
  _send: (msg: ClientMessage) => void;

  // server-message hooks (called by ws.ts)
  setConn: (c: ConnectionState) => void;
  setProtocol: (p: string) => void;
  setProject: (p: string) => void;
  setSessionId: (sid: string) => void;
  setDiff: (
    raw: string,
    files: DiffFile[],
    label?: string,
    stale?: boolean,
    staleFiles?: string[],
  ) => void;
  toggleViewed: (path: string) => void;
  toggleCollapsed: (path: string) => void;
  setCollapsed: (path: string, collapsed: boolean) => void;
  toggleTreeNode: (path: string) => void;
  requestScrollTo: (path: string) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  toggleWrap: () => void;
  setAskModel: (model: string | undefined) => void;
  toggleResolved: (key: string) => void;
  setFilterQuery: (q: string) => void;
  toggleFilterType: (type: string) => void;
  clearFilter: () => void;
  setHelpOpen: (open: boolean) => void;
  requestFocusFilter: () => void;
  appendChunk: (askId: string, delta: string) => void;
  finishAsk: (askId: string, outcome: "done" | "error", message?: string) => void;
  pushToast: (message: string, level?: ToastLevel) => void;
  dismissToast: (id: string) => void;

  // user actions
  openComposer: (input: {
    file: string;
    fromLine: number;
    toLine: number;
    chunk: string;
  }) => void;
  closeComposer: (file: string, fromLine: number) => void;
  startAsk: (input: AskInput) => string;
  cancel: (askId: string) => void;
  retryAsk: (askId: string) => void;
  startThemeGen: (primary: string, secondary: string) => string;
  themeGenerated: (id: string, palette: Record<string, string>) => void;
  themeError: (id: string, message: string) => void;
};

const pickKnown = (
  src: Record<string, boolean>,
  known: Set<string>,
): Record<string, boolean> => {
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(src)) {
    if (known.has(k)) out[k] = v;
  }
  return out;
};

const newId = () =>
  globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const VIEW_MODE_KEY = "askdiff:view-mode";
const WRAP_KEY = "askdiff:wrap-lines";
const RESOLVED_KEY = "askdiff:resolved-threads";
const ASK_MODEL_KEY = "askdiff:ask-model";

const initialAskModel = (): string | undefined => {
  const raw = readLocal(ASK_MODEL_KEY);
  // Only honor a value we actually offer; anything else falls back to the
  // session default so a stale/removed alias can't stick.
  return ASK_MODEL_OPTIONS.some((o) => o.value === raw) && raw ? raw : undefined;
};

const initialViewMode = (): ViewMode =>
  readLocal(VIEW_MODE_KEY) === "unified" ? "unified" : "split";

const initialWrap = (): boolean => readLocal(WRAP_KEY) === "1";

const initialResolved = (): Record<string, boolean> => {
  const raw = readLocal(RESOLVED_KEY);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, boolean>;
    }
  } catch {
    // ignore malformed persisted state
  }
  return {};
};

const toAskMessage = (ask: Ask): ClientMessage => ({
  type: "ask",
  id: ask.id,
  file: ask.file,
  from_line: ask.fromLine,
  to_line: ask.toLine,
  chunk: ask.chunk,
  question: ask.question,
  ...(ask.model ? { model: ask.model } : {}),
});

export const useStore = create<Store>((set, get) => ({
  conn: { state: "idle" },
  sessionId: null,
  asks: {},
  askOrder: [],
  openAnchors: {},
  fileViewed: {},
  fileCollapsed: {},
  treeCollapsed: {},
  viewMode: initialViewMode(),
  wrapLines: initialWrap(),
  askModel: initialAskModel(),
  resolvedThreads: initialResolved(),
  filterQuery: "",
  filterTypes: [],
  helpOpen: false,
  focusFilterNonce: 0,
  toasts: [],
  _send: () => {
    get().pushToast("Not connected to askdiff server");
  },

  setSend: (fn) => set({ _send: fn }),
  setConn: (c) => set({ conn: c }),
  setProtocol: (p) => set({ protocol: p }),
  setProject: (p) => set({ project: p }),
  setSessionId: (sid) => set({ sessionId: sid }),

  setDiff: (raw, files, label, stale, staleFiles) => {
    const s = get();
    const prev = s.selectedFile;
    const stillExists = prev !== undefined && files.some((f) => f.path === prev);
    const next: Partial<Store> = {
      diff: {
        raw,
        files,
        ...(label !== undefined ? { label } : {}),
        ...(stale !== undefined ? { stale } : {}),
        ...(staleFiles !== undefined ? { staleFiles } : {}),
      },
    };
    if (stillExists) {
      next.selectedFile = prev;
    } else {
      const first = files[0]?.path;
      if (first !== undefined) next.selectedFile = first;
    }
    // Drop per-file UI flags for files no longer in the diff. Preserving
    // entries for files still present means review progress survives the
    // server re-sending the same diff (e.g. on reconnect).
    const paths = new Set(files.map((f) => f.path));
    next.fileViewed = pickKnown(s.fileViewed, paths);
    next.fileCollapsed = pickKnown(s.fileCollapsed, paths);
    set(next);
  },

  toggleViewed: (path) =>
    set((s) => {
      const willBeViewed = !(s.fileViewed[path] ?? false);
      return {
        fileViewed: { ...s.fileViewed, [path]: willBeViewed },
        // Marking a file viewed collapses it; unmarking expands it again.
        fileCollapsed: { ...s.fileCollapsed, [path]: willBeViewed },
      };
    }),

  toggleCollapsed: (path) =>
    set((s) => ({
      fileCollapsed: {
        ...s.fileCollapsed,
        [path]: !(s.fileCollapsed[path] ?? false),
      },
    })),

  setCollapsed: (path, collapsed) =>
    set((s) => ({
      fileCollapsed: { ...s.fileCollapsed, [path]: collapsed },
    })),

  setViewMode: (mode) => {
    writeLocal(VIEW_MODE_KEY, mode);
    set({ viewMode: mode });
  },
  toggleViewMode: () =>
    set((s) => {
      const next: ViewMode = s.viewMode === "split" ? "unified" : "split";
      writeLocal(VIEW_MODE_KEY, next);
      return { viewMode: next };
    }),
  toggleWrap: () =>
    set((s) => {
      const next = !s.wrapLines;
      writeLocal(WRAP_KEY, next ? "1" : "0");
      return { wrapLines: next };
    }),
  setAskModel: (model) => {
    writeLocal(ASK_MODEL_KEY, model ?? "");
    set({ askModel: model });
  },
  toggleResolved: (key) =>
    set((s) => {
      const next = { ...s.resolvedThreads, [key]: !(s.resolvedThreads[key] ?? false) };
      if (!next[key]) delete next[key];
      writeLocal(RESOLVED_KEY, JSON.stringify(next));
      return { resolvedThreads: next };
    }),
  setFilterQuery: (q) => set({ filterQuery: q }),
  toggleFilterType: (type) =>
    set((s) => ({
      filterTypes: s.filterTypes.includes(type)
        ? s.filterTypes.filter((t) => t !== type)
        : [...s.filterTypes, type],
    })),
  clearFilter: () => set({ filterQuery: "", filterTypes: [] }),
  setHelpOpen: (open) => set({ helpOpen: open }),
  requestFocusFilter: () =>
    set((s) => ({ focusFilterNonce: s.focusFilterNonce + 1 })),

  toggleTreeNode: (path) =>
    set((s) => ({
      treeCollapsed: {
        ...s.treeCollapsed,
        [path]: !(s.treeCollapsed[path] ?? false),
      },
    })),

  requestScrollTo: (path) =>
    set((s) => ({
      selectedFile: path,
      scrollRequest: { path, nonce: (s.scrollRequest?.nonce ?? 0) + 1 },
    })),

  appendChunk: (askId, delta) =>
    set((s) => {
      const ask = s.asks[askId];
      if (!ask || ask.status !== "streaming") return s;
      return {
        asks: { ...s.asks, [askId]: { ...ask, response: ask.response + delta } },
      };
    }),

  finishAsk: (askId, outcome, message) =>
    set((s) => {
      const ask = s.asks[askId];
      if (!ask || ask.status !== "streaming") return s;
      const status: AskStatus = outcome === "done" ? "done" : "error";
      return {
        asks: {
          ...s.asks,
          [askId]: {
            ...ask,
            status,
            ...(message !== undefined ? { error: message } : {}),
          },
        },
      };
    }),

  pushToast: (message, level = "error") =>
    set((s) => ({ toasts: [...s.toasts, { id: newId(), message, level }] })),
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  openComposer: ({ file, fromLine, toLine, chunk }) =>
    set((s) => ({
      openAnchors: {
        ...s.openAnchors,
        [`${file}:${String(fromLine)}`]: { fromLine, toLine, chunk },
      },
    })),
  closeComposer: (file, fromLine) =>
    set((s) => {
      const key = `${file}:${String(fromLine)}`;
      if (!(key in s.openAnchors)) return s;
      const next = { ...s.openAnchors };
      delete next[key];
      return { openAnchors: next };
    }),

  startAsk: (input) => {
    const id = newId();
    const model = get().askModel;
    const ask: Ask = {
      id,
      file: input.file,
      fromLine: input.fromLine,
      toLine: input.toLine,
      chunk: input.chunk,
      question: input.question,
      status: "streaming",
      response: "",
      ...(model ? { model } : {}),
    };
    set((s) => ({
      asks: { ...s.asks, [id]: ask },
      askOrder: [...s.askOrder, id],
    }));
    get()._send(toAskMessage(ask));
    return id;
  },

  cancel: (askId) => {
    const ask = get().asks[askId];
    if (!ask || ask.status !== "streaming") return;
    get()._send({ type: "cancel", id: askId });
    set((s) => ({
      asks: { ...s.asks, [askId]: { ...ask, status: "cancelled" } },
    }));
  },

  // Re-run an ask that errored or was cancelled: clear its response and
  // resend the original question under the same id (so it reuses the same
  // thread bubble rather than duplicating the question).
  retryAsk: (askId) => {
    const ask = get().asks[askId];
    if (!ask || ask.status === "streaming") return;
    const reset: Ask = { ...ask, status: "streaming", response: "" };
    delete reset.error;
    set((s) => ({ asks: { ...s.asks, [askId]: reset } }));
    get()._send(toAskMessage(reset));
  },

  startThemeGen: (primary, secondary) => {
    const id = newId();
    set({ themeGen: { id, status: "pending" } });
    get()._send({ type: "generate-theme", id, primary, secondary });
    return id;
  },

  themeGenerated: (id, palette) => {
    set((s) =>
      s.themeGen?.id === id ? { themeGen: { id, status: "done", palette } } : {},
    );
  },

  themeError: (id, message) => {
    set((s) =>
      s.themeGen?.id === id
        ? { themeGen: { id, status: "error", error: message } }
        : {},
    );
  },
}));
