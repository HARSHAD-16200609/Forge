import { Outlet } from "react-router-dom";
import { WorkspaceList } from "@/features/Workspaces/components/workspaces";

import { useWorkspaces } from "@/features/Workspaces/hooks/useWorkspaces";
import Swirling from "@/components/ui/Swirling";
import { Button } from "@/components/ui/button";
import { CreateWorkspaceForm } from "@/features/Workspaces/components/CreateWorkspaceForm";
import { useState } from "react";

export function Workspaces() {
    const [showCreate, setShowCreate] = useState(false);
    const { data: workspaces, isPending, isError } = useWorkspaces();

    if (isPending) {
        // Loading Animation
        return (
            <div className="flex min-h-[300px] w-full items-center justify-center">
                <Swirling className="size-16 text-primary" />
            </div>
        );
    }

    if (isError) {
        // Error Dialog
        return <div>Failed to load workspaces.</div>;
    }
    return (
        <div className="h-full overflow-y-auto p-6">
            <WorkspaceList workspaces={workspaces ?? []}></WorkspaceList>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
                Create a new Workspace
            </Button>

            {showCreate && (
                <CreateWorkspaceForm
                    onDone={() => setShowCreate(false)}
                    onClose={() => setShowCreate(false)}
                />
            )}

            <Outlet />
        </div>
    );
}
