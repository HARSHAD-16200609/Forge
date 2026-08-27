import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { UserProfile } from "../types";

type UserCardProps = {
    user: UserProfile;
};

export function UserCard({ user }: UserCardProps) {
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
                    <Separator />
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">User ID</span>
                        <span className="truncate font-mono text-xs">
                            {user.id}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
