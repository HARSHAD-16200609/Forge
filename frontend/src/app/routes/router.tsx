import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "@/app/layouts/AppLayout";
import { Workspaces } from "@/app/pages/Workspaces";
import { HomePage } from "@/app/pages/HomePage";
import { ChannelHome } from "@/app/pages/ChannelHome";
import { Members } from "@/app/pages/Members";
import { Invites } from "@/app/pages/Invites";
import { Notifications } from "@/app/pages/Notifications";
import { Activity } from "@/app/pages/Activity";
import { Saved } from "@/app/pages/Saved";
import { Files } from "@/app/pages/Files";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { AuthCallbackPage } from "@/features/auth/pages/AuthCallbackPage";
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
                        index: true,
                        Component: ChannelHome,
                    },
                    {
                        path: "workspaces",
                        Component: Workspaces,
                    },
                    {
                        path: "members",
                        Component: Members,
                    },
                    {
                        path: "invites",
                        Component: Invites,
                    },
                    {
                        path: "notifications",
                        Component: Notifications,
                    },
                    {
                        path: "activity",
                        Component: Activity,
                    },
                    {
                        path: "saved",
                        Component: Saved,
                    },
                    {
                        path: "files",
                        Component: Files,
                    },
                    {
                        path: "settings",
                        Component: Settings,
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
            { path: "callback", Component: AuthCallbackPage },
        ],
    },
]);
