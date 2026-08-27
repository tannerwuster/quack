export type IconKey =
  | "react" | "typescript" | "javascript" | "json" | "css" | "html"
  | "markdown" | "yaml" | "shell" | "python" | "go" | "rust" | "java"
  | "image" | "svg" | "lock" | "npm" | "git" | "docker" | "env"
  | "toml" | "sql" | "font" | "text" | "file";

const BY_NAME: Record<string, IconKey> = {
  "package.json": "npm",
  "package-lock.json": "npm",
  "pnpm-lock.yaml": "npm",
  "dockerfile": "docker",
  ".gitignore": "git",
  ".gitattributes": "git",
  ".env": "env",
};

const BY_EXT: Record<string, IconKey> = {
  tsx: "react", jsx: "react",
  ts: "typescript", mts: "typescript", cts: "typescript",
  js: "javascript", mjs: "javascript", cjs: "javascript",
  json: "json", css: "css", scss: "css", html: "html",
  md: "markdown", mdx: "markdown",
  yaml: "yaml", yml: "yaml", toml: "toml",
  sh: "shell", bash: "shell", zsh: "shell",
  py: "python", go: "go", rs: "rust", java: "java",
  png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image",
  svg: "svg", lock: "lock", sql: "sql",
  woff: "font", woff2: "font", ttf: "font", otf: "font",
  txt: "text",
};

export const iconForFile = (name: string): IconKey => {
  const base = name.slice(name.lastIndexOf("/") + 1).toLowerCase();
  const byName = BY_NAME[base];
  if (byName) return byName;
  const dot = base.lastIndexOf(".");
  if (dot > 0) {
    const byExt = BY_EXT[base.slice(dot + 1)];
    if (byExt) return byExt;
  }
  return "file";
};
