import { useMutation } from "@tanstack/react-query";
import { realtimeActions } from "@/realtime/realtimeActions";
import type { WsMessageEntityType } from "../types";

export function useReact(
    entityType: WsMessageEntityType,
    workspaceId: string,
    entityId: string,
) {
    return useMutation({
        mutationFn: async ({ messageId, reaction }: { messageId: string; reaction: string }) => {
            realtimeActions.react(entityType, workspaceId, entityId, messageId, reaction);
        },
    });
}