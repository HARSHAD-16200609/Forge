import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "@/app/layouts/AppLayout";
import { DashboardPage } from "@/app/pages/DashboardPage";
import { HomePage } from "@/app/pages/HomePage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { ProtectedRoute } from "./ProtectedRoute";

export const router = createBrowserRouter([
    {
        path: "/",
        Component: HomePage,
    },
    {
        Component: ProtectedRoute,
        children: [
            {
                path: "app",
                Component: AppLayout,
                children: [
                    {
                        index: true,
                        Component: DashboardPage,
                    },
                ],
            },
        ],
    },
    {
        path: "auth",
        children: [
            { path: "login", Component: LoginPage },
            { path: "register", Component: RegisterPage },
        ],
    },
]);
