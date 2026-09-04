import { Outlet } from "react-router-dom";
import { WorkspaceList } from "@/features/Workspaces/components/workspaces";

import { useWorkspaces } from "@/features/Workspaces/hooks/useWorkspaces";
import Swirling from "@/components/ui/Swirling";

export function Workspaces() {

    const { data: workspaces, isPending, isError } = useWorkspaces();

    if (isPending) {

        return (
            <div className="flex min-h-[300px] w-full items-center justify-center">
                <Swirling className="size-16 text-primary" />
            </div>
        );
    }

    if (isError) {

        return <div>Failed to load workspaces.</div>;
    }
    return (
        <div className="h-full overflow-y-auto p-6">
            <WorkspaceList workspaces={workspaces ?? []}></WorkspaceList>
    

            <Outlet />
        </div>
    );
}
