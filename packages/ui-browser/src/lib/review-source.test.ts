import { describe, expect, it } from "@jest/globals";
import {
  describeReviewSource,
  parseReviewSource,
  type ReviewSource,
} from "./review-source";

describe("parseReviewSource", () => {
  it("treats empty/undefined as the working tree", () => {
    expect(parseReviewSource(undefined)).toEqual({ kind: "working-tree" });
    expect(parseReviewSource("")).toEqual({ kind: "working-tree" });
    expect(parseReviewSource("   ")).toEqual({ kind: "working-tree" });
  });

  it("recognizes the working-tree and staged labels (case-insensitive)", () => {
    expect(parseReviewSource("Working tree").kind).toBe("working-tree");
    expect(parseReviewSource("working-tree").kind).toBe("working-tree");
    expect(parseReviewSource("staged").kind).toBe("staged");
    expect(parseReviewSource("Cached").kind).toBe("staged");
  });

  it("parses two-dot commit ranges", () => {
    expect(parseReviewSource("HEAD~1..HEAD")).toEqual({
      kind: "commit-range",
      base: "HEAD~1",
      head: "HEAD",
    });
    expect(parseReviewSource("abc123..def456")).toEqual({
      kind: "commit-range",
      base: "abc123",
      head: "def456",
    });
  });

  it("parses three-dot branch comparisons as pull-request-shaped", () => {
    expect(parseReviewSource("main…HEAD")).toEqual({
      kind: "branch-compare",
      base: "main",
      head: "HEAD",
    });
    expect(parseReviewSource("feature/test...HEAD")).toEqual({
      kind: "branch-compare",
      base: "feature/test",
      head: "HEAD",
    });
  });

  it("prefers three-dot over two-dot when both could match", () => {
    // "A...B" contains ".." but must be read as a three-dot compare.
    expect(parseReviewSource("a...b").kind).toBe("branch-compare");
  });

  it("keeps unrecognized labels verbatim", () => {
    expect(parseReviewSource("my custom label")).toEqual({
      kind: "unknown",
      label: "my custom label",
    });
  });
});

describe("describeReviewSource", () => {
  it("marks branch comparisons PR-shaped with a pull-request icon", () => {
    const d = describeReviewSource({
      kind: "branch-compare",
      base: "main",
      head: "feature/x",
    });
    expect(d.prShaped).toBe(true);
    expect(d.icon).toBe("git-pull-request");
    expect(d.head).toBe("feature/x");
    expect(d.base).toBe("main");
  });

  it("does not mark working-tree/commit-range as PR-shaped", () => {
    const cases: ReviewSource[] = [
      { kind: "working-tree" },
      { kind: "staged" },
      { kind: "commit-range", base: "a", head: "b" },
    ];
    for (const c of cases) expect(describeReviewSource(c).prShaped).toBe(false);
  });
});
