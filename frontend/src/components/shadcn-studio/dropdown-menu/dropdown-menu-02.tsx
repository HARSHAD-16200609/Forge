import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckIcon } from "lucide-react";
import { useWorkspace, useWorkspaces } from "@/features/Workspaces/hooks/useWorkspaces";
import { useWorkspaceStore } from "@/features/Workspaces/store/workspaceStore";

const DropdownMenuUserSwitcherDemo = () => {
    const { selectedWorkspaceId, setSelectedWorkspaceId, clearSelectedWorkspaceId } =
        useWorkspaceStore();

    const { data: workspaces } = useWorkspaces();

    const { data } = useWorkspace(selectedWorkspaceId ?? "");

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="bg-secondary flex items-center gap-2 rounded-lg px-3 py-2.5">
                <div className="flex flex-col gap-1 text-start leading-none">
                    <span className="max-w-[17ch] truncate text-sm leading-none font-semibold">
                        {data?.workspaceName}
                    </span>
                    <span className="text-muted-foreground max-w-[20ch] truncate text-xs">
                        {data?.visibility}
                    </span>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-66">
                <DropdownMenuLabel>My Workspaces</DropdownMenuLabel>
                {workspaces &&
                    workspaces.map((workspace) => (
                        <DropdownMenuItem
                            key={workspace.workspace.id}
                            onClick={() => {
                                if (selectedWorkspaceId) {
                                    clearSelectedWorkspaceId();
                                    setSelectedWorkspaceId(workspace.workspace.id);
                                }
                                setSelectedWorkspaceId(workspace.workspace.id);
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <div className="flex flex-col gap-1 text-start leading-none">
                                    <span className="max-w-[17ch] truncate text-sm leading-none font-semibold">
                                        {workspace.workspace.workspaceName}
                                    </span>
                                    <span className="text-muted-foreground max-w-[20ch] truncate text-xs">
                                        {}
                                    </span>
                                </div>
                            </div>
                            {selectedWorkspaceId === workspace.workspace.id && (
                                <CheckIcon className="ml-auto" />
                            )}
                        </DropdownMenuItem>
                    ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default DropdownMenuUserSwitcherDemo;
