import { useWebSocket } from "./hooks/use-websocket";
import { useKeyboardShortcuts } from "./hooks/use-keyboard-shortcuts";
import { useStore } from "./lib/store";
import { TopBar } from "./components/TopBar";
import { StaleBanner } from "./components/StaleBanner";
import { FileTree } from "./components/FileTree";
import { DiffPane } from "./components/DiffPane";
import { StatusBar } from "./components/StatusBar";
import { Toaster } from "./components/Toaster";

export const App = () => {
  useWebSocket();
  useKeyboardShortcuts();
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed);

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <StaleBanner />
      <div className="flex min-h-0 flex-1">
        {/* Unmounted rather than hidden so the diff pane reclaims the width
            (its ResizeObserver re-measures) and the tree's own scroll state
            doesn't linger off-screen. */}
        {!sidebarCollapsed && <FileTree />}
        <main className="min-w-0 flex-1 overflow-auto">
          <DiffPane />
        </main>
      </div>
      <StatusBar />
      <Toaster />
    </div>
  );
};
