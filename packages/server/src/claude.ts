import { spawn } from "node:child_process";
import { THEME_TOKEN_KEYS } from "@askdiff/protocol";
import type { AskMessage } from "@askdiff/protocol";

export class ClaudeCliError extends Error {
  constructor(message: string, override readonly cause?: unknown) {
    super(message);
    this.name = "ClaudeCliError";
  }
}

export interface StreamAnswerParams {
  cwd: string;
  sessionId: string;
  ask: AskMessage;
  signal: AbortSignal;
}

export async function* streamAnswer(
  params: StreamAnswerParams,
): AsyncGenerator<string, void, void> {
  const prompt = buildPrompt(params.ask);
  const model = params.ask.model ?? process.env["ASKDIFF_MODEL"];
  const args = buildArgs(params.sessionId, model);

  const child = spawn("claude", args, {
    cwd: params.cwd,
    stdio: ["pipe", "pipe", "pipe"],
    env: childEnv(),
  });

  const onAbort = () => {
    if (!child.killed) child.kill("SIGTERM");
  };
  params.signal.addEventListener("abort", onAbort);

  const stderrChunks: string[] = [];
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk: string) => {
    stderrChunks.push(chunk);
  });

  const exitPromise = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>(
    (resolve) => {
      child.on("close", (code, sig) => resolve({ code, signal: sig }));
    },
  );

  child.stdin.end(prompt);

  // The CLI reports API errors (billing, auth, invalid session, …) as a
  // `result` event with `is_error: true` — usually before exit. Capture
  // the message so the WS error is actionable instead of "exited 1".
  let apiError: string | null = null;
  const handleLine = (line: string): string | null => {
    const delta = extractTextDelta(line);
    if (delta !== null) return delta;
    const err = extractApiError(line);
    if (err !== null) apiError = err;
    return null;
  };

  try {
    child.stdout.setEncoding("utf8");
    let buffer = "";
    for await (const chunk of child.stdout) {
      buffer += chunk as string;
      let newline = buffer.indexOf("\n");
      while (newline >= 0) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        const delta = handleLine(line);
        if (delta !== null) yield delta;
        newline = buffer.indexOf("\n");
      }
    }
    if (buffer.length > 0) {
      const delta = handleLine(buffer);
      if (delta !== null) yield delta;
    }

    const { code } = await exitPromise;
    if (params.signal.aborted) return;
    if (apiError !== null) {
      throw new ClaudeCliError(apiError);
    }
    if (code !== 0) {
      const stderr = stderrChunks.join("").trim().slice(-500);
      throw new ClaudeCliError(
        `claude exited with code ${code}${stderr ? `: ${stderr}` : ""}`,
      );
    }
  } finally {
    params.signal.removeEventListener("abort", onAbort);
    if (!child.killed) child.kill("SIGTERM");
  }
}

// The parent Claude Code session is auth'd via subscription, but
// `ANTHROPIC_API_KEY` (or `ANTHROPIC_AUTH_TOKEN`) in the env makes the
// spawned CLI silently switch to API billing. Strip those so the
// subprocess falls back to whichever cached auth the user already has.
const childEnv = (): NodeJS.ProcessEnv => {
  const env = { ...process.env };
  delete env["ANTHROPIC_API_KEY"];
  delete env["ANTHROPIC_AUTH_TOKEN"];
  return env;
};

const buildArgs = (sessionId: string, model: string | undefined): string[] => {
  const args = [
    "-p",                          // print mode: non-interactive, exits after one response
    "--resume", sessionId,         // re-hydrate the session that wrote the code; new turns append to it
    "--output-format", "stream-json", // emit one JSON event per line for streaming parse
    "--include-partial-messages",  // emit content_block_delta events with token-by-token text
    "--verbose",                   // required by --output-format=stream-json under -p
  ];
  if (model) args.push("--model", model); // optional override; otherwise inherits the session's model
  return args;
}

const buildPrompt = (ask: AskMessage): string => {
  return `You are answering a question in askdiff, a read-only code-review diff viewer. This is a discussion turn, not an implementation turn.

**Do not modify the code.** Do not call Edit, Write, NotebookEdit, MultiEdit, or any Bash command that mutates the filesystem (no \`sed -i\`, \`>\`, \`mv\`, \`rm\`, \`git commit\`, \`git checkout\`, etc.). If the user asks you to "fix", "apply", "change", "refactor", "rename", "implement", or otherwise edit something, describe what the change should look like in your reply (prose, or a code block they can copy) but do not perform it. The user will apply changes themselves outside askdiff if they want to act on your suggestion.

Read-only inspection (Read, Grep, Glob, git read commands) is fine when needed, but your prior edits in this session are already in your context, so usually you can answer from memory.

Question about \`${ask.file}\` lines ${ask.from_line}-${ask.to_line}:

\`\`\`
${ask.chunk}
\`\`\`

${ask.question}`;
}

const extractTextDelta = (line: string): string | null => {
  const trimmed = line.trim();
  if (trimmed.length === 0) return null;
  let obj: unknown;
  try {
    obj = JSON.parse(trimmed);
  } catch {
    return null;
  }
  if (!isRecord(obj)) return null;
  if (obj["type"] !== "stream_event") return null;
  const event = obj["event"];
  if (!isRecord(event)) return null;
  if (event["type"] !== "content_block_delta") return null;
  const delta = event["delta"];
  if (!isRecord(delta)) return null;
  if (delta["type"] !== "text_delta") return null;
  const text = delta["text"];
  return typeof text === "string" ? text : null;
};

const extractApiError = (line: string): string | null => {
  const trimmed = line.trim();
  if (trimmed.length === 0) return null;
  let obj: unknown;
  try {
    obj = JSON.parse(trimmed);
  } catch {
    return null;
  }
  if (!isRecord(obj)) return null;
  if (obj["type"] !== "result") return null;
  if (obj["is_error"] !== true) return null;
  const result = obj["result"];
  if (typeof result !== "string" || result.length === 0) return null;
  const status = obj["api_error_status"];
  return typeof status === "number" ? `${result} (api ${String(status)})` : result;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export interface GenerateThemeParams {
  cwd: string;
  primary: string;
  secondary: string;
  signal: AbortSignal;
}

// A cheap, NON-resume one-shot on Haiku: no --resume means a fresh
// throwaway context, so the review session's tokens are never loaded.
export async function generateTheme(
  params: GenerateThemeParams,
): Promise<Record<string, string>> {
  const prompt = buildThemePrompt(params.primary, params.secondary);
  const args = ["-p", "--model", "haiku"];

  const child = spawn("claude", args, {
    cwd: params.cwd,
    stdio: ["pipe", "pipe", "pipe"],
    env: childEnv(),
  });

  const onAbort = () => {
    if (!child.killed) child.kill("SIGTERM");
  };
  params.signal.addEventListener("abort", onAbort);

  const stderrChunks: string[] = [];
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk: string) => {
    stderrChunks.push(chunk);
  });

  const exitPromise = new Promise<number | null>((resolve) => {
    child.on("close", (code) => {
      resolve(code);
    });
  });

  child.stdin.end(prompt);

  let out = "";
  try {
    child.stdout.setEncoding("utf8");
    for await (const chunk of child.stdout) out += chunk as string;
    const code = await exitPromise;
    if (params.signal.aborted) throw new ClaudeCliError("theme generation aborted");
    if (code !== 0) {
      const stderr = stderrChunks.join("").trim().slice(-500);
      throw new ClaudeCliError(
        `claude exited with code ${String(code)}${stderr ? `: ${stderr}` : ""}`,
      );
    }
  } finally {
    params.signal.removeEventListener("abort", onAbort);
    if (!child.killed) child.kill("SIGTERM");
  }

  return parseThemeOutput(out);
}

const buildThemePrompt = (primary: string, secondary: string): string =>
  `You are a UI theme designer. Design a cohesive DARK theme palette from a primary and a secondary color.

Return ONLY a single JSON object — no prose, no markdown fences — whose keys are EXACTLY these CSS variable names (without the leading --):
${THEME_TOKEN_KEYS.join(", ")}.

Each value must be a valid CSS color (hex like #0e1419 or an hsl(...) string). Requirements:
- Dark background, light foreground; ensure strong contrast and readability.
- Use the primary color for --primary and --ring, the secondary for --accent.
- The --syntax-* values form a syntax-highlight palette that must stay legible on the background.

primary: ${primary}
secondary: ${secondary}`;

const parseThemeOutput = (out: string): Record<string, string> => {
  const match = /\{[\s\S]*\}/.exec(out);
  if (match === null) throw new ClaudeCliError("no JSON object in theme output");
  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch (err) {
    throw new ClaudeCliError("theme output was not valid JSON", err);
  }
  if (!isRecord(parsed)) throw new ClaudeCliError("theme output was not an object");
  const palette: Record<string, string> = {};
  for (const key of THEME_TOKEN_KEYS) {
    const v = parsed[key];
    if (typeof v === "string") palette[key] = v;
  }
  if (Object.keys(palette).length === 0) {
    throw new ClaudeCliError("theme output had no usable colors");
  }
  return palette;
};
