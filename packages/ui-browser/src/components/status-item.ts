// Shared look for the interactive items sitting in the bottom status bar.
// Kept in its own module so the bar and the menus it hosts can both use it
// without importing each other.
export const statusItemClass =
  "flex h-full items-center gap-1.5 rounded-none px-2 text-[0.7rem] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring";
