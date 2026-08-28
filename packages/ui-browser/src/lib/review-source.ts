// Parse the diff `label` the server sends into a structured description of
// *what* is being reviewed. The protocol only carries a short human string
// (see packages/protocol schemas: DiffMessage.label), set by the /quack
// skill — e.g. "Working tree", "staged", "HEAD~1..HEAD", "main…HEAD",
// "feature/x…HEAD", "abc123..def456". We turn that into a typed source so
// the review header can render the right affordances (and, for branch
// comparisons, a pull-request-shaped header) without inventing data the
// backend doesn't provide.

export type ReviewSource =
  | { kind: "working-tree" }
  | { kind: "staged" }
  // Two-dot range `A..B`: the changes between two commits.
  | { kind: "commit-range"; base: string; head: string }
  // Three-dot `A…B` (rendered with an ellipsis by the skill): PR/merge
  // semantics — B's changes relative to the merge-base with A. This is the
  // closest thing to a pull request the local protocol can express.
  | { kind: "branch-compare"; base: string; head: string }
  // Anything we don't recognize — shown verbatim so we never lie about it.
  | { kind: "unknown"; label: string };

const THREE_DOT = /^(.+?)(?:…|\.\.\.)(.+)$/; // A…B or A...B
const TWO_DOT = /^(.+?)\.\.(.+)$/; // A..B

export const parseReviewSource = (label: string | undefined): ReviewSource => {
  const raw = (label ?? "").trim();
  if (raw === "") return { kind: "working-tree" };

  const lower = raw.toLowerCase();
  if (lower === "working tree" || lower === "working-tree") {
    return { kind: "working-tree" };
  }
  if (lower === "staged" || lower === "index" || lower === "cached") {
    return { kind: "staged" };
  }

  const three = THREE_DOT.exec(raw);
  if (three?.[1] && three[2]) {
    return { kind: "branch-compare", base: three[1].trim(), head: three[2].trim() };
  }

  const two = TWO_DOT.exec(raw);
  if (two?.[1] && two[2]) {
    return { kind: "commit-range", base: two[1].trim(), head: two[2].trim() };
  }

  return { kind: "unknown", label: raw };
};

export type ReviewSourceDisplay = {
  /** Short kind label, e.g. "Working tree", "Pull request", "Commit range". */
  kind: string;
  /** lucide icon name hint the header maps to a component. */
  icon: "git-branch" | "git-pull-request" | "git-commit" | "file-diff";
  /** Primary ref/head shown prominently (branch or head sha), if any. */
  head?: string;
  /** Base ref shown as "compared against", if any. */
  base?: string;
  /** True when this looks like a pull-request-style branch comparison. */
  prShaped: boolean;
};

export const describeReviewSource = (src: ReviewSource): ReviewSourceDisplay => {
  switch (src.kind) {
    case "working-tree":
      return { kind: "Working tree", icon: "file-diff", prShaped: false };
    case "staged":
      return { kind: "Staged", icon: "file-diff", prShaped: false };
    case "commit-range":
      return {
        kind: "Commit range",
        icon: "git-commit",
        head: src.head,
        base: src.base,
        prShaped: false,
      };
    case "branch-compare":
      return {
        kind: "Pull request",
        icon: "git-pull-request",
        head: src.head,
        base: src.base,
        prShaped: true,
      };
    case "unknown":
      return { kind: src.label, icon: "git-branch", prShaped: false };
  }
};

// Optional pull-request metadata. The current protocol never populates
// this — it's the clean extension point the brief calls for. When a future
// server message carries PR details (title, number, author, status), the
// store can hold a `ReviewMeta` and the header will light up automatically.
export type ReviewMeta = {
  title?: string;
  number?: number;
  author?: string;
  status?: "open" | "draft" | "merged" | "closed";
  base?: string;
  head?: string;
  url?: string;
};
