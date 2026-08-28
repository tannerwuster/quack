// Apple platforms bind the IDE-style shortcuts to Cmd; everywhere else it's
// Ctrl. Matched off the UA string — iPadOS reports "Macintosh" there too, and
// it lands on the same Cmd binding, which is what we want.
export const isApplePlatform = (): boolean =>
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);

/** "⌘" on Apple platforms, "Ctrl+" elsewhere — for rendering shortcut hints. */
export const modKeyLabel = (): string => (isApplePlatform() ? "⌘" : "Ctrl+");
