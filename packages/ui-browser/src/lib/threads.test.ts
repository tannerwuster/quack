import { describe, expect, it } from "@jest/globals";
import { buildThreads, unresolvedCount } from "./threads";
import { threadKey, type Ask } from "@/lib/store";

const ask = (id: string, file: string, fromLine: number, toLine: number): Ask => ({
  id,
  file,
  fromLine,
  toLine,
  chunk: "",
  question: "q",
  status: "done",
  response: "a",
});

describe("buildThreads", () => {
  it("groups asks at the same file+line into one thread", () => {
    const asks: Record<string, Ask> = {
      a: ask("a", "f.ts", 10, 12),
      b: ask("b", "f.ts", 10, 12),
    };
    const threads = buildThreads(asks, ["a", "b"], {});
    expect(threads).toHaveLength(1);
    expect(threads[0]?.askIds).toEqual(["a", "b"]);
  });

  it("marks a thread resolved from resolvedThreads", () => {
    const asks: Record<string, Ask> = { a: ask("a", "f.ts", 3, 3) };
    const key = threadKey("f.ts", 3);
    const threads = buildThreads(asks, ["a"], { [key]: true });
    expect(threads[0]?.resolved).toBe(true);
  });

  it("orders by file order then line", () => {
    const asks: Record<string, Ask> = {
      a: ask("a", "b.ts", 5, 5),
      b: ask("b", "a.ts", 20, 20),
      c: ask("c", "a.ts", 2, 2),
    };
    const threads = buildThreads(asks, ["a", "b", "c"], {}, ["a.ts", "b.ts"]);
    expect(threads.map((t) => t.key)).toEqual([
      threadKey("a.ts", 2),
      threadKey("a.ts", 20),
      threadKey("b.ts", 5),
    ]);
  });
});

describe("unresolvedCount", () => {
  it("counts unresolved threads", () => {
    const asks: Record<string, Ask> = {
      a: ask("a", "f.ts", 1, 1),
      b: ask("b", "f.ts", 2, 2),
    };
    const threads = buildThreads(asks, ["a", "b"], { [threadKey("f.ts", 1)]: true });
    expect(unresolvedCount(threads)).toBe(1);
  });
});
