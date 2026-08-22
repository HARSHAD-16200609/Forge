import { Outlet } from "react-router-dom";

export function HomePage() {
    return (
        <div>
            <h1>Hello world</h1>
            <Outlet />
        </div>
    );
}
