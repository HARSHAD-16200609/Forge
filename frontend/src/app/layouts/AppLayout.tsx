import { Outlet } from "react-router-dom";

export function AppLayout() {
    return (
        <div className="flex min-h-svh flex-col">
            <header className="border-border flex h-14 items-center border-b px-5">
                <h1 className="text-lg font-semibold tracking-tight">WorkSphere</h1>
            </header>

            <div className="flex flex-1">
                <aside className="w-60 shrink-0 border-r p-5">
                    <p className="text-muted-foreground text-sm">Sidebar</p>
                </aside>

                <main className="flex-1 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
