import { describe, expect, it } from "@jest/globals";
import { clamp, nextMatching, stepIndex } from "./nav";

describe("clamp", () => {
  it("bounds a value", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
  });
});

describe("stepIndex", () => {
  it("moves within bounds without wrapping", () => {
    expect(stepIndex(3, 0, 1)).toBe(1);
    expect(stepIndex(3, 2, 1)).toBe(2); // clamped at end
    expect(stepIndex(3, 0, -1)).toBe(0); // clamped at start
    expect(stepIndex(3, 2, -1)).toBe(1);
  });

  it("handles empty and unset current", () => {
    expect(stepIndex(0, 0, 1)).toBe(-1);
    expect(stepIndex(4, -1, 1)).toBe(0);
    expect(stepIndex(4, -1, -1)).toBe(3);
  });
});

describe("nextMatching", () => {
  const items = [
    { id: "a", ok: false },
    { id: "b", ok: true },
    { id: "c", ok: false },
    { id: "d", ok: true },
  ];
  const ok = (x: { ok: boolean }) => x.ok;

  it("finds the next matching item forward, skipping non-matches", () => {
    expect(nextMatching(items, 0, 1, ok)).toBe(1);
    expect(nextMatching(items, 1, 1, ok)).toBe(3);
  });

  it("wraps around", () => {
    expect(nextMatching(items, 3, 1, ok)).toBe(1);
  });

  it("goes backward", () => {
    expect(nextMatching(items, 3, -1, ok)).toBe(1);
    expect(nextMatching(items, 1, -1, ok)).toBe(3);
  });

  it("returns -1 when nothing matches", () => {
    expect(nextMatching(items, 0, 1, () => false)).toBe(-1);
    expect(nextMatching([], 0, 1, ok)).toBe(-1);
  });

  it("does not return the starting index", () => {
    const one = [{ ok: true }];
    // single matching item, starting on it → wrap finds itself
    expect(nextMatching(one, 0, 1, ok)).toBe(0);
  });
});
