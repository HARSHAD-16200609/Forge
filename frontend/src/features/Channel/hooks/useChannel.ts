import { useMutation, useQueryClient } from "@tanstack/react-query";
import { channelService } from "../channel.service";


export function useJoinPublicChannel(workspaceId: string, channelId: string) {
    const queryClient = useQueryClient();

    return useMutation(
        {
            mutationFn: async () => {
                await channelService.joinPublicChannel(workspaceId, channelId)
                return
            },
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });
                queryClient.invalidateQueries({ queryKey: ["messages", workspaceId, channelId] });
            },
        }
    )

}