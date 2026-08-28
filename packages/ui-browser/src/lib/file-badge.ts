export type FileBadge = { label: string; title: string; className: string };

export const fileBadge = (type: string): FileBadge => {
  switch (type) {
    case "add":
      return { label: "A", title: "Added", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" };
    case "delete":
      return { label: "D", title: "Deleted", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" };
    case "rename":
      return { label: "R", title: "Renamed", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" };
    case "copy":
      return { label: "C", title: "Copied", className: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" };
    default:
      return { label: "M", title: "Modified", className: "bg-muted text-foreground" };
  }
};
