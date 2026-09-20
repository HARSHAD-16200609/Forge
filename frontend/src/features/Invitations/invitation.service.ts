import { api } from "@/lib/api";

export interface createChannelInviteParams {
    workspaceId: string;
    channelId: string;
    receiverId: string;
}

interface ChannelInvite {
    id: string;
}

class InvitationService {
    async createChannelInvite(params: createChannelInviteParams): Promise<ChannelInvite> {
        const response = await api.post(
            `/workspace/${params.workspaceId}/channel/${params.channelId}/invites/`,
            { receiverId: params.receiverId },
        );

        return response.data.data;
    }

    async acceptChannelInvite(workspaceId: string, inviteId: string): Promise<unknown> {
        const response = await api.post(
            `/workspaces/${workspaceId}/channel-invites/${inviteId}/accept`,
        );

        return response.data.data;
    }

    async rejectChannelInvite(workspaceId: string, inviteId: string): Promise<unknown> {
        const response = await api.post(
            `/workspaces/${workspaceId}/channel-invites/${inviteId}/reject`,
        );

        return response.data.data;
    }
}

export const invitationService = new InvitationService();