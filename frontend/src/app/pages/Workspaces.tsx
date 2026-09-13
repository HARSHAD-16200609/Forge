import { Outlet } from "react-router-dom";
import { WorkspaceList } from "@/features/Workspaces/components/workspaces";

import { useWorkspaces } from "@/features/Workspaces/hooks/useWorkspaces";
import { ErrorScreen } from "@/components/access/ErrorScreen";
import { Button } from "@/components/ui/button";
import { getApiError } from "@/lib/errorMessage";
import { TriangleAlert } from "lucide-react";
import Swirling from "@/components/ui/Swirling";

export function Workspaces() {

    const { data: workspaces, isPending, isError, error, refetch } = useWorkspaces();

    if (isPending) {

        return (
            <div className="flex min-h-[300px] w-full items-center justify-center">
                <Swirling className="size-16 text-primary" />
            </div>
        );
    }

    if (isError) {
        const { status, message } = getApiError(error);
        return (
            <ErrorScreen
                statusCode={status !== undefined ? String(status) : undefined}
                scope="ERROR"
                icon={<TriangleAlert className="size-6" />}
                title="Couldn't load your workspaces"
                description={message}
                actions={
                    <Button onClick={() => void refetch()}>
                        Try again
                    </Button>
                }
            />
        );
    }
    return (
        <div className="h-full overflow-y-auto p-6">
            <WorkspaceList workspaces={workspaces ?? []}></WorkspaceList>
    

            <Outlet />
        </div>
    );
}
