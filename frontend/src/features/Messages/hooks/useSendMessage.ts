import { useMutation } from "@tanstack/react-query";
import { messageService } from "../message.service";
import { realtimeActions } from "@/realtime/realtimeActions";

export function useSendMessage(workspaceId: string, channelId: string) {
    return useMutation({
        mutationFn: async ({ content, files, mentions }: { content: string; files: File[]; mentions?: string[] }) => {
            const uploadIds = await messageService.uploadFiles(files);
            realtimeActions.sendChannelMessage(workspaceId, channelId, content, uploadIds, mentions ?? []);
        },
    });
}