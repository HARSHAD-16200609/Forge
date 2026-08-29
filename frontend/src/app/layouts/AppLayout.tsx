import Frame760 from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

export function AppLayout() {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="flex h-svh flex-col">
            <header className="border-border flex h-14 shrink-0 items-center justify-between border-b px-5">
                <h1 className="text-lg font-semibold tracking-tight">WorkSphere</h1>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                    {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
                </Button>
            </header>

            <div className="flex min-h-0 flex-1">
                <aside className="flex shrink-0 overflow-hidden">
                    <Frame760 />
                </aside>

                <main className="min-h-0 flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
