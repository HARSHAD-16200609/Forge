
import { AxiosError } from "axios";
import type { WorkspaceObject } from "../types";
import { workspaceService } from "../workpsace.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useWorkspaces() {
    return useQuery({
        queryKey: ["workspaces"],
        queryFn: () => workspaceService.getWorkspaces(),
        staleTime: 5 * 60 * 1000,
        retry: (failureCount, error) => {

            if (error instanceof AxiosError && error.status === 401) {
                return false;
            }

            return failureCount < 3;
        },
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
            queryClient.invalidateQueries({ queryKey: ["workspace"] });
        },
    });
}

export function useDeleteWorkspace() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => workspaceService.deleteWorkspace(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });

            queryClient.invalidateQueries({ queryKey: ["workspace", id] });
        },

    })
}