import type { FileData } from "react-diff-view";
import { filePath } from "@/lib/selection";

export type DiffStat = { adds: number; dels: number };

/** Count inserted / deleted lines across all hunks of a file. */
export const countChanges = (file: FileData): DiffStat => {
  let adds = 0;
  let dels = 0;
  for (const hunk of file.hunks) {
    for (const change of hunk.changes) {
      if (change.type === "insert") adds++;
      else if (change.type === "delete") dels++;
    }
  }
  return { adds, dels };
};

/** Total changed lines — used for the large-file threshold. */
export const changedLineCount = (file: FileData): number => {
  const { adds, dels } = countChanges(file);
  return adds + dels;
};

// Files above this many changed lines start collapsed so a huge review
// stays fast and scannable; the reviewer expands the ones they care about.
export const LARGE_FILE_THRESHOLD = 500;

export const isLargeFile = (file: FileData): boolean =>
  changedLineCount(file) > LARGE_FILE_THRESHOLD;

// A file's collapsed state: explicit reviewer choice wins; otherwise large
// files start collapsed so a big review stays scannable.
export const resolveCollapsed = (
  explicit: boolean | undefined,
  file: FileData,
): boolean => explicit ?? isLargeFile(file);

const isZeroRevision = (rev: string | undefined): boolean =>
  rev === undefined || /^0+$/.test(rev);

/**
 * A file react-diff-view produced with no hunks: a binary file, a
 * mode-only change, or a pure rename. We can't render a text diff, so the
 * FilePane shows a graceful panel instead of an empty body.
 */
export const hasNoTextualChanges = (file: FileData): boolean =>
  file.hunks.length === 0;

export type NonTextReason = "binary" | "renamed" | "mode" | "empty";

export const nonTextReason = (file: FileData): NonTextReason => {
  if (file.type === "rename" || (file.oldPath && file.newPath && file.oldPath !== file.newPath && file.type !== "add" && file.type !== "delete")) {
    return "renamed";
  }
  // A new/removed/changed revision with no hunks is a binary blob.
  if (!isZeroRevision(file.newRevision) || !isZeroRevision(file.oldRevision)) {
    return "binary";
  }
  if (file.oldMode && file.newMode && file.oldMode !== file.newMode) {
    return "mode";
  }
  return "empty";
};

export const nonTextLabel = (reason: NonTextReason): string => {
  switch (reason) {
    case "binary":
      return "Binary file — no preview";
    case "renamed":
      return "Renamed — no content changes";
    case "mode":
      return "File mode changed";
    case "empty":
      return "No changes to display";
  }
};

/**
 * Does a file pass the active filter? `query` matches its path
 * case-insensitively; `types` (when non-empty) restricts by change type.
 */
export const matchesFilter = (
  file: FileData,
  query: string,
  types: readonly string[],
): boolean => {
  const q = query.trim().toLowerCase();
  if (q && !filePath(file).toLowerCase().includes(q)) return false;
  if (types.length > 0 && !types.includes(file.type)) return false;
  return true;
};
