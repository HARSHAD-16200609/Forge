import { Outlet } from "react-router-dom";

export function AppLayout() {
    return (
        <div>
            <header>
                <h1>WorkSphere</h1>
            </header>

            <div>
                <aside>
                    <p>Sidebar</p>
                </aside>

                <main>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
