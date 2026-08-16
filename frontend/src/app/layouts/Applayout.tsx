import { Outlet } from "react-router-dom";

export function AppLayout() {
    return (
        <div className="app-shell">
            <header className="app-header">
                <h1>WorkSphere</h1>
            </header>

            <div className="app-body">
                <aside className="app-sidebar">
                    <p>Sidebar</p>
                </aside>

                <main className="app-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
