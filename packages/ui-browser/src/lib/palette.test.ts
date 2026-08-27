import { describe, expect, it } from "@jest/globals";
import { derivePalette, paletteFromConfig, TOKEN_KEYS } from "@/lib/palette";

describe("derivePalette", () => {
  it("returns every required token key", () => {
    const p = derivePalette("#bd93f9", "#50fa7b");
    for (const k of TOKEN_KEYS) expect(p[k]).toBeTruthy();
  });

  it("is deterministic", () => {
    expect(derivePalette("#bd93f9", "#50fa7b")).toEqual(
      derivePalette("#bd93f9", "#50fa7b"),
    );
  });

  it("accepts 3- and 6-digit hex", () => {
    expect(() => derivePalette("#abc", "#def")).not.toThrow();
    expect(() => derivePalette("#aabbcc", "#ddeeff")).not.toThrow();
  });

  it("rejects invalid hex", () => {
    expect(() => derivePalette("nope", "#50fa7b")).toThrow();
    expect(() => derivePalette("#bd93f9", "12345")).toThrow();
  });

  it("carries the seed colors through as primary/secondary", () => {
    const p = derivePalette("#bd93f9", "#50fa7b");
    expect(p.primary).toBe("#bd93f9");
    expect(p.secondary).toBe("#50fa7b");
  });

  it("produces hsl background and foreground", () => {
    const p = derivePalette("#bd93f9", "#50fa7b");
    expect(p.background).toMatch(/^hsl\(/);
    expect(p.foreground).toMatch(/^hsl\(/);
  });
});

describe("paletteFromConfig", () => {
  it("parses a JSON object of token→color", () => {
    const raw = JSON.stringify({
      background: "#000",
      foreground: "#fff",
      primary: "#bd93f9",
    });
    const p = paletteFromConfig(raw);
    expect(p.background).toBe("#000");
    expect(p.primary).toBe("#bd93f9");
  });

  it("parses CSS custom-property text", () => {
    const p = paletteFromConfig("--background: #000; --primary: #bd93f9;");
    expect(p.background).toBe("#000");
    expect(p.primary).toBe("#bd93f9");
  });

  it("throws on unknown keys", () => {
    expect(() =>
      paletteFromConfig(JSON.stringify({ notAToken: "#000" })),
    ).toThrow();
  });

  it("throws on non-color values", () => {
    expect(() =>
      paletteFromConfig(JSON.stringify({ background: "banana" })),
    ).toThrow();
  });
});
