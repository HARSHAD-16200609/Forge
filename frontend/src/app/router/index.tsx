import { createBrowserRouter, Outlet } from "react-router";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { DashboardPage } from "../pages/DashBoard";

function Root() {
    return (<div>
        <h1>Hello world</h1>
        <Outlet />
    </div>);
}

export const router = createBrowserRouter([
    {
        path: "/",
        Component: Root,
    },

            {
        path: "auth",
        children: [
            { path: "login", Component: LoginPage },
            { path: "register", Component: RegisterPage },
        ],
    },
    {
        path: "/dashboard",
        Component: DashboardPage,
    }



]);

