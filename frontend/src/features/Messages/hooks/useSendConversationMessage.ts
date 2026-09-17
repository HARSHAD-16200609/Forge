import { useMutation } from "@tanstack/react-query";
import { messageService } from "../message.service";
import { realtimeActions } from "@/realtime/realtimeActions";

export function useSendConversationMessage(workspaceId: string, conversationId: string) {
    return useMutation({
        mutationFn: async ({ content, files, mentions }: { content: string; files: File[]; mentions?: string[] }) => {
            const uploadIds = await messageService.uploadFiles(files);
            realtimeActions.sendConversationMessage(
                workspaceId,
                conversationId,
                content,
                uploadIds,
                mentions ?? [],
            );
        },
    });
}