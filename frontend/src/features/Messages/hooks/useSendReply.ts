import { useMutation, useQueryClient } from "@tanstack/react-query";
import { messageService } from "../message.service";
import type { channelParams, dmParams } from "../types";

export function useSendReply(params: channelParams | dmParams, queryKey: string[]) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            messageId,
            content,
            files,
        }: {
            messageId: string;
            content: string;
            files: File[];
        }) => messageService.postReply(params, messageId, content, files),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });
}
