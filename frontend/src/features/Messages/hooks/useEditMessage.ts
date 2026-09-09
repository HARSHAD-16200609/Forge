import { useMutation } from "@tanstack/react-query";
import { realtimeActions } from "@/realtime/realtimeActions";
import type { WsMessageEntityType } from "../types";

export function useEditMessage(
    entityType: WsMessageEntityType,
    workspaceId: string,
    entityId: string,
) {
    return useMutation({
        mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
            if (entityType === "channel") {
                realtimeActions.updateChannelMessage(workspaceId, entityId, messageId, content);
            } else {
                realtimeActions.updateConversationMessage(
                    workspaceId,
                    entityId,
                    messageId,
                    content,
                );
            }
        },
    });
}