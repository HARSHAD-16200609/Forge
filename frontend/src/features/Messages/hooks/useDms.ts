import { useQuery } from "@tanstack/react-query";
import { messageService } from "../message.service";
import { AxiosError } from "axios";
import type { dmParams } from "../types";

export function useDms(workspaceId: string) {
    return useQuery({
        queryKey: [workspaceId],
        queryFn: async () => {
            try {
                return await messageService.getDMs(workspaceId);
            } catch (err) {
                if (err instanceof AxiosError && err.status === 404) {
                    return { conversations: [] };
                }
                throw err;
            }
        },
        staleTime: 5 * 60 * 1000,
        retry: (failureCount, error) => {
            if (error instanceof AxiosError && error.status === 401) {
                return false;
            }

            return failureCount < 3;
        },
    });
}

export function useDm({ workspaceId, conversationId, enabled }: dmParams & { enabled?: boolean }) {
    return useQuery({
        queryKey: [workspaceId, conversationId],
        queryFn: () => messageService.getDM({ workspaceId, conversationId }),
        enabled,
    });
}
