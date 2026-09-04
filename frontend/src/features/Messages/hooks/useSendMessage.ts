import { useMutation, useQueryClient } from "@tanstack/react-query";
import { messageService } from "../message.service";

export function useSendMessage(workspaceId: string, channelId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ content, files }: { content: string; files: File[] }) =>
            messageService.postMessage({ workspaceId, channelId }, content, files),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["messages", channelId] });
        },
    });
}
