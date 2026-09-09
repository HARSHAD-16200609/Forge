import { useMutation } from "@tanstack/react-query";
import { realtimeActions } from "@/realtime/realtimeActions";
import type { WsMessageEntityType } from "../types";

export function useDeleteMessage(
    entityType: WsMessageEntityType,
    workspaceId: string,
    entityId: string,
) {
    return useMutation({
        mutationFn: async ({ messageId }: { messageId: string }) => {
            if (entityType === "channel") {
                realtimeActions.deleteChannelMessage(workspaceId, entityId, messageId);
            } else {
                realtimeActions.deleteConversationMessage(workspaceId, entityId, messageId);
            }
        },
    });
}