
import type { WorkspaceObject } from "../types";
import { workspaceService } from "../workpsace.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useWorkspaces() {
    return useQuery({
        queryKey: ["workspaces"],
        queryFn: () => workspaceService.getWorkspaces(),
        staleTime: 5 * 60 * 1000,
    });

}

export function useWorkspace(id: string) {
    return useQuery({
        queryKey: ["workspace", id],
        queryFn: () => workspaceService.getWorkspace(id),
        enabled: !!id,
    })
}

export function useCreateWorkspace() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: WorkspaceObject) => workspaceService.createWorkpace(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
        },
    });
}