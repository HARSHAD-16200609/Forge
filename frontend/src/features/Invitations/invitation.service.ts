import { api } from "@/lib/api";

export type InviteKind = "workspace_invite" | "channel_invite" | "workspace_link";
export type InviteStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "REVOKED";

export interface InvitePreview {
    kind: InviteKind;
    status: InviteStatus;
    workspaceId: string;
    workspaceName: string;
    channelName?: string;
    inviterName?: string;
    email?: string;
    memberCount?: number;
    expiresAt: string;
}

export interface WorkspaceInvite {
    id: string;
    status: InviteStatus;
    sentAt: string;
    actorId: string;
    receiverId: string | null;
    workspaceId: string;
    receiverEmail: string;
    token: string;
    expiresAt: string;
    workspace?: { workspaceName: string };
}

export interface WorkspaceInviteLink {
    id: string;
    token: string;
    url: string;
    workspaceId: string;
    expiresAt: string;
    revokedAt: string | null;
    useCount: number;
    maxUses: number | null;
}

export interface WorkspaceInviteList {
    invites: WorkspaceInvite[];
    hasMore: boolean;
    total: number;
}

export interface createChannelInviteParams {
    workspaceId: string;
    channelId: string;
    receiverId: string;
}

interface ChannelInvite {
    id: string;
}

export interface CreateChannelInviteResult {
    invite: ChannelInvite;
    emailSent: boolean;
}

export interface CreateWorkspaceInviteResult {
    invite: WorkspaceInvite;
    emailSent: boolean;
}

class InvitationService {
    async createWorkspaceInvite(workspaceId: string, email: string): Promise<CreateWorkspaceInviteResult> {
        const response = await api.post(`/workspace/${workspaceId}/invites`, { email });

        return response.data.data;
    }

    async listSentWorkspaceInvites(status?: InviteStatus): Promise<WorkspaceInviteList> {
        const response = await api.get("/workspace/invites/list", {
            params: { type: "sent", ...(status ? { status } : {}) },
        });

        return response.data.data;
    }

    async cancelWorkspaceInvite(inviteId: string): Promise<unknown> {
        const response = await api.post(`/workspace-invites/${inviteId}/cancel`);

        return response.data.data;
    }

    async getWorkspaceInviteLink(workspaceId: string): Promise<WorkspaceInviteLink | null> {
        const response = await api.get(`/workspace/${workspaceId}/invite-link`);
        const data = response.data.data;

        return data?.token ? data : null;
    }

    async createWorkspaceInviteLink(workspaceId: string): Promise<WorkspaceInviteLink> {
        const response = await api.post(`/workspace/${workspaceId}/invite-link`);

        return response.data.data;
    }

    async revokeWorkspaceInviteLink(workspaceId: string): Promise<{ revoked: number }> {
        const response = await api.post(`/workspace/${workspaceId}/invite-link/revoke`);

        return response.data.data;
    }

    async previewInvite(token: string): Promise<InvitePreview> {
        const response = await api.get(`/invites/${token}`);

        return response.data.data;
    }

    async acceptInviteToken(token: string): Promise<unknown> {
        const response = await api.post(`/invites/${token}/accept`);

        return response.data.data;
    }

    async createChannelInvite(params: createChannelInviteParams): Promise<CreateChannelInviteResult> {
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
