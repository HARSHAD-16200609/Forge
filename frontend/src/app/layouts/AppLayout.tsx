import { Bell, Moon, Search, Sun, TriangleAlert } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";

import logoUrl from "@/assets/forge.png";
import Frame760 from "@/components/SideBar";
import { PresenceAvatar } from "@/components/ui/presence-avatar";
import { buttonVariants } from "@/components/ui/button";
import { ErrorScreen } from "@/components/access/ErrorScreen";
import {
    WorkspaceAccessDenied,
    WorkspaceNotFound,
} from "@/components/access/AccessDeniedScreens";
import { getApiError } from "@/lib/errorMessage";
import useAuth from "@/features/auth/hooks/useAuth";
import { UserMenu } from "@/features/auth/components/UserMenu";
import {
    useWorkspace,
    useWorkspaces,
} from "@/features/Workspaces/hooks/useWorkspaces";
import { useWorkspaceStore } from "@/features/Workspaces/store/workspaceStore";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/ThemeProvider";
import { useUIStore } from "@/stores/uiStore";

export function AppLayout() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const Workspaces = useWorkspaces();
    const { selectedWorkspaceId } = useWorkspaceStore();
    const searchWorkspaceValue = useUIStore((s) => s.searchWorkspaceValue);
    const setSearchWorkspaceValue = useUIStore((s) => s.setSearchWorkspaceValue);

    const activeWorkspaceId =
        selectedWorkspaceId ?? Workspaces?.data?.[0]?.workspace?.id ?? null;

    const activeWorkspace = useWorkspace(activeWorkspaceId ?? "");

    const mainContent = () => {
        if (activeWorkspaceId && activeWorkspace.isError) {
            const { status } = getApiError(activeWorkspace.error);
            if (status === 403) return <WorkspaceAccessDenied />;
            if (status === 404) return <WorkspaceNotFound />;
            return (
                <ErrorScreen
                    statusCode={status !== undefined ? String(status) : undefined}
                    scope="ERROR"
                    icon={<TriangleAlert className="size-6" />}
                    title="Couldn't load this workspace"
                    highlight="workspace"
                    description="Something went wrong on our end. Try again in a moment."
                />
            );
        }
        return <Outlet />;
    };

    return (
        <div className="flex h-svh flex-col">
            <header className="aurora-header flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/15 px-4 text-white">
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

                <label className="relative hidden w-200 items-center md:flex">
                    <input
                        value={searchWorkspaceValue}
                        onChange={(e) => setSearchWorkspaceValue(e.target.value)}
                        className="h-8 w-full rounded-lg border border-white/35 bg-white/15 px-3 text-center text-sm text-white outline-none placeholder:text-white/70 focus:border-white/60 focus:bg-white/20 focus:ring-2 focus:ring-white/25"
                    />

                    {!searchWorkspaceValue && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1.5">
                            <Search className="size-3.5 text-white/70" />
                            <span className="text-sm text-white/70">
                                Search my workspace
                            </span>
                        </div>
                    )}
                </label>
                <div className="flex shrink-0 items-center gap-1.5">

                    <button
                        type="button"
                        aria-label="Notifications"
                        onClick={() => navigate("/app/notifications")}
                        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative hover:bg-white/15 hover:text-white")}
                    >
                        <Bell className="size-4" />
                    </button>

                    <button
                        type="button"
                        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                        onClick={toggleTheme}
                        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "hover:bg-white/15 hover:text-white")}
                    >
                        {theme === "dark" ? (
                            <Sun className="size-4" />
                        ) : (
                            <Moon className="size-4" />
                        )}
                    </button>

                    <span aria-hidden="true" className="border-white/25 mx-1 hidden h-6 border-r sm:block" />

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

                <main className="force-light min-h-0 flex-1">{mainContent()}</main>
            </div>
        </div>
    );
}