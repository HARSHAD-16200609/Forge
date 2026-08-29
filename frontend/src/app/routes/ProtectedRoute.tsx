import { Navigate, Outlet } from "react-router";

import useAuth from "@/features/auth/hooks/useAuth";
import Swirling from "@/components/ui/Swirling";

export function ProtectedRoute() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex min-h-svh items-center justify-center">
                <Swirling className="size-16 text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth/login" replace />;
    }

    return <Outlet />;
}