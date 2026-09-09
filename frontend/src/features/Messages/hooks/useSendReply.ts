import { useMutation } from "@tanstack/react-query";
import { messageService } from "../message.service";
import { realtimeActions } from "@/realtime/realtimeActions";
import type { WsMessageEntityType } from "../types";

export function useSendReply(
    workspaceId: string,
    entityId: string,
    entityType: WsMessageEntityType,
) {
    return useMutation({
        mutationFn: async ({
            messageId,
            content,
            files,
        }: {
            messageId: string;
            content: string;
            files: File[];
        }) => {
            const uploadIds = await messageService.uploadFiles(files);
            realtimeActions.sendReply(
                workspaceId,
                messageId,
                entityId,
                entityType,
                content,
                uploadIds,
            );
        },
    });
}