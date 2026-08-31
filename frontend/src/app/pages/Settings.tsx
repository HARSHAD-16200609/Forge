import { Outlet } from "react-router-dom";

function Settings() {
    return (
        <div className="h-full overflow-y-auto p-6">
            <Outlet />
        </div>
    );
}

export default Settings;
