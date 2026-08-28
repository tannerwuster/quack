import { threadKey, type Ask } from "@/lib/store";

export type Thread = {
  key: string;
  file: string;
  fromLine: number;
  toLine: number;
  askIds: string[];
  resolved: boolean;
};

/**
 * Group asks into comment threads anchored at (file, toLine). Threads are
 * ordered by the file's position in `fileOrder` (falling back to
 * first-seen), then by line — i.e. reading order down the review — so
 * next/prev-comment navigation feels natural.
 */
export const buildThreads = (
  asks: Record<string, Ask>,
  askOrder: readonly string[],
  resolvedThreads: Record<string, boolean>,
  fileOrder: readonly string[] = [],
): Thread[] => {
  const byKey = new Map<string, Thread>();
  for (const id of askOrder) {
    const ask = asks[id];
    if (!ask) continue;
    const key = threadKey(ask.file, ask.toLine);
    const existing = byKey.get(key);
    if (existing) {
      existing.askIds.push(id);
      existing.fromLine = Math.min(existing.fromLine, ask.fromLine);
    } else {
      byKey.set(key, {
        key,
        file: ask.file,
        fromLine: ask.fromLine,
        toLine: ask.toLine,
        askIds: [id],
        resolved: resolvedThreads[key] === true,
      });
    }
  }

  const fileRank = new Map<string, number>();
  fileOrder.forEach((path, i) => fileRank.set(path, i));
  const rankOf = (path: string) => fileRank.get(path) ?? Number.MAX_SAFE_INTEGER;

  return [...byKey.values()].sort((a, b) => {
    const fr = rankOf(a.file) - rankOf(b.file);
    if (fr !== 0) return fr;
    return a.toLine - b.toLine;
  });
};

export const unresolvedCount = (threads: readonly Thread[]): number =>
  threads.reduce((n, t) => (t.resolved ? n : n + 1), 0);
