import { describe, expect, it } from "@jest/globals";
import { parseDiff, type FileData } from "react-diff-view";
import {
  changedLineCount,
  countChanges,
  hasNoTextualChanges,
  isLargeFile,
  matchesFilter,
  nonTextLabel,
  nonTextReason,
} from "./diff-utils";

const parseOne = (raw: string): FileData => {
  const files = parseDiff(raw);
  const f = files[0];
  if (!f) throw new Error("no file parsed");
  return f;
};

const MODIFY = `diff --git a/src/foo.ts b/src/foo.ts
index 111..222 100644
--- a/src/foo.ts
+++ b/src/foo.ts
@@ -1,3 +1,3 @@
 const a = 1;
-const b = 2;
+const b = 3;
+const c = 4;
`;

const BINARY = `diff --git a/logo.png b/logo.png
new file mode 100644
index 0000000..93988ea
Binary files /dev/null and b/logo.png differ
`;

describe("countChanges", () => {
  it("counts inserts and deletes", () => {
    expect(countChanges(parseOne(MODIFY))).toEqual({ adds: 2, dels: 1 });
    expect(changedLineCount(parseOne(MODIFY))).toBe(3);
  });
});

describe("isLargeFile", () => {
  it("is false for small files", () => {
    expect(isLargeFile(parseOne(MODIFY))).toBe(false);
  });
});

describe("binary / non-text files", () => {
  it("detects a file with no hunks", () => {
    const file = parseOne(BINARY);
    expect(hasNoTextualChanges(file)).toBe(true);
    expect(nonTextReason(file)).toBe("binary");
    expect(nonTextLabel("binary")).toMatch(/no preview/i);
  });

  it("treats a normal modify as textual", () => {
    expect(hasNoTextualChanges(parseOne(MODIFY))).toBe(false);
  });
});

describe("matchesFilter", () => {
  const file = parseOne(MODIFY); // path src/foo.ts, type modify

  it("matches empty filter", () => {
    expect(matchesFilter(file, "", [])).toBe(true);
  });

  it("matches on path substring, case-insensitive", () => {
    expect(matchesFilter(file, "FOO", [])).toBe(true);
    expect(matchesFilter(file, "bar", [])).toBe(false);
  });

  it("restricts by change type when types are given", () => {
    expect(matchesFilter(file, "", ["modify"])).toBe(true);
    expect(matchesFilter(file, "", ["add"])).toBe(false);
    expect(matchesFilter(file, "", ["add", "modify"])).toBe(true);
  });
});
