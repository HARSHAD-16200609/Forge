import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "@/app/layouts/AppLayout";
import { Workspaces } from "@/app/pages/Workspaces";
import { HomePage } from "@/app/pages/HomePage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { ProtectedRoute } from "./ProtectedRoute";
import Settings from "../pages/Settings";


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
                        path: "workspaces",
                        Component: Workspaces,

                    },
                    {
                        path: "settings",
                        Component: Settings
                    }

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
