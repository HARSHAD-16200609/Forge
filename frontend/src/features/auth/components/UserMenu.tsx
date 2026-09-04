import type { ReactNode } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { UserCard } from "./UserCard";
import type { UserProfile } from "../types";

type UserMenuProps = {
    user: UserProfile;
    children: ReactNode;
};

export function UserMenu({ user, children }: UserMenuProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent
                align="start"
                side="top"
                sideOffset={12}
                className="border-0 bg-transparent p-0 shadow-none"
            >
                <UserCard user={user} />
            </PopoverContent>
        </Popover>
    );
}