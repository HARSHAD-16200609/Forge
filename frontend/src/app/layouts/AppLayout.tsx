import {
    Bell,
    Moon,
    Search,
    Sun,
} from "lucide-react";
import { Outlet } from "react-router-dom";

import logoUrl from "@/assets/forge.png";
import Frame760 from "@/components/SideBar";
import { PresenceAvatar } from "@/components/ui/presence-avatar";
import { buttonVariants } from "@/components/ui/button";
import useAuth from "@/features/auth/hooks/useAuth";
import { UserMenu } from "@/features/auth/components/UserMenu";
import { useWorkspaces } from "@/features/Workspaces/hooks/useWorkspaces";
import { useWorkspaceStore } from "@/features/Workspaces/store/workspaceStore";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/ThemeProvider";
import { useUIStore } from "@/stores/uiStore";

export function AppLayout() {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const Workspaces = useWorkspaces();
    const { selectedWorkspaceId } = useWorkspaceStore();
    const searchValue = useUIStore((s) => s.searchValue);
    const setSearchValue = useUIStore((s) => s.setSearchValue);

    const activeWorkspaceId =
        selectedWorkspaceId ?? Workspaces?.data?.[0]?.workspace?.id ?? null;

    return (
        <div className="flex h-svh flex-col">
            <header className="border-border flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
                <div className="flex min-w-0 items-center gap-2.5">
                    <img
                        src={logoUrl}
                        alt="Forge"
                        className="size-7 shrink-0 object-contain"
                    />
                    <span className="hidden text-lg font-semibold tracking-tight sm:block">
                        Forge
                    </span>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                    <label className="relative hidden items-center md:flex">
                        <Search className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground" />
                        <input
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder="Search Forge"
                            className="h-8 w-40 rounded-lg border border-border/70 bg-muted/40 pr-3 pl-8 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-brand/40 focus:bg-background focus:ring-2 focus:ring-brand/15 lg:w-52"
                        />
                    </label>

                    <button
                        type="button"
                        aria-label="Notifications"
                        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}
                    >
                        <Bell className="size-4" />
                    </button>

                    <button
                        type="button"
                        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                        onClick={toggleTheme}
                        className={buttonVariants({ variant: "ghost", size: "icon" })}
                    >
                        {theme === "dark" ? (
                            <Sun className="size-4" />
                        ) : (
                            <Moon className="size-4" />
                        )}
                    </button>

                    <span aria-hidden="true" className="border-border mx-1 hidden h-6 border-r sm:block" />

                    {user && (
                        <UserMenu user={user}>
                            <button
                                type="button"
                                aria-label="Account"
                                className="size-8 rounded-full transition-transform hover:scale-105 active:scale-95"
                            >
                                <PresenceAvatar
                                    name={user.username}
                                    avatarUrl={user.avatar}
                                    size="sm"
                                    workspaceId={activeWorkspaceId}
                                    userId={user.id}
                                />
                            </button>
                        </UserMenu>
                    )}
                </div>
            </header>

            <div className="flex min-h-0 flex-1">
                <aside className="flex shrink-0 overflow-hidden">
                    <Frame760 />
                </aside>

                <main className="min-h-0 flex-1">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}