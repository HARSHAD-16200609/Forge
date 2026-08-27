import { UserCard } from "@/features/auth/components/UserCard";
import { Outlet } from "react-router-dom";
import useAuth from "@/features/auth/hooks/useAuth";


export function DashboardPage() {
    const { user } = useAuth();

    return (
        <div>
            <h1>Dashboard</h1>

            {user && <UserCard user={user} />}

            <Outlet />
        </div>
    );
}