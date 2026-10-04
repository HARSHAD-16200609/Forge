import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useUIStore } from "@/stores/uiStore";
import { channelService } from "../channel.service";
import type { CreateChannelPayload } from "../types";


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

export function useCreateChannel(workspaceId: string) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const setSelectedChannelId = useUIStore((s) => s.setSelectedChannelId);
    const setActiveSection = useUIStore((s) => s.setActiveSection);

    return useMutation({
        mutationFn: (payload: CreateChannelPayload) =>
            channelService.createChannel(workspaceId, payload),
        onSuccess: async (channel) => {
            // Await the refetch before selecting: the create response carries no
            // isMember flag, so selecting first renders the channel in preview mode.
            await queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });

            setSelectedChannelId(channel.id);
            setActiveSection("home");
            navigate("/app/home");
        },
    })
}
