import { createBrowserRouter } from "react-router";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { DashboardPage } from "../pages/DashBoard";
import { AppLayout } from "../layouts/Applayout";
import { Root } from "../pages/HomePage";

export const router = createBrowserRouter([
    {
        path: "/",
        Component: Root,
    },
    {
        path: "app",
        Component: AppLayout,
        children: [{ index: true, Component: DashboardPage }],
    },
    {
        path: "auth",
        children: [
            { path: "login", Component: LoginPage },
            { path: "register", Component: RegisterPage },
        ],
    },
]);
