import { Navigate, Outlet, useLocation } from "react-router";

import useAuth from "@/features/auth/hooks/useAuth";
import Swirling from "@/components/ui/Swirling";

export function ProtectedRoute() {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex min-h-svh items-center justify-center">
                <Swirling className="size-16 text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        const redirect = `${location.pathname}${location.search}`;
        return <Navigate to={`/auth/login?redirect=${encodeURIComponent(redirect)}`} replace />;
    }

    return <Outlet />;
}