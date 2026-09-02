import { useMutation, useQueryClient } from "@tanstack/react-query";
import { messageService } from "../message.service";

export function useSendConversationMessage(workspaceId: string, conversationId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ content, files }: { content: string; files: File[] }) =>
            messageService.postConversationMessage({ workspaceId, conversationId }, content, files),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["conversation-messages", conversationId] });
        },
    });
}
