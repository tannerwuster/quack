import { describe, expect, it } from "@jest/globals";
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

  it("resolves the basename from a path", () => {
    expect(iconForFile("packages/ui-browser/src/App.tsx")).toBe("react");
  });

  it("falls back to a generic file icon", () => {
    expect(iconForFile("mystery.xyz")).toBe("file");
    expect(iconForFile("noext")).toBe("file");
  });
});
