import { UserCard } from "@/features/auth/components/UserCard";
import useAuth from "@/features/auth/hooks/useAuth";
import { Outlet } from "react-router-dom";

function Settings() {
    const { user } = useAuth();


    return (
        <div>
   
            {user && <UserCard user={user} />}
            

            <Outlet />
        </div>
    );

}

export default Settings