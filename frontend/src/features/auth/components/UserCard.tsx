import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import type { UserProfile } from "../types";
import { Button } from "@/components/ui/button";
import useAuth from "../hooks/useAuth";
// import {  useNavigate } from "react-router-dom";
import {  isAxiosError } from "axios";


type UserCardProps = {
    user: UserProfile;
};

export function UserCard({ user }: UserCardProps) {

    const { logout, setUser } = useAuth()
    const logoutUser =  () => {
        try {
            logout()
            setUser(null)
        } catch (error) {
    if(isAxiosError(error)){
        if(error.response?.status === 401) {
            console.log("Already logged out ")
        }

    }
        }
    }
    return (

        <Card className="w-full max-w-sm">
            <CardHeader className="items-center text-center">
                <img
                    src={user.avatar}
                    alt={`${user.avatar}'s avatar`}
                    className="size-20 self-center rounded-full object-cover ring-1 ring-foreground/10"
                />
                <CardTitle>{user.name}</CardTitle>
                <CardDescription>@{user.username}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Email</span>
                        <span className="truncate font-medium">
                            {user.email}
                        </span>
                    </div>
                   
                </div>
                <Button className="mt-2" onClick={logoutUser}>Logout</Button>
            </CardContent>
        </Card>
    );
}
