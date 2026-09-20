import { api } from "@/lib/api";
import type {
    Conversation,
    ConversationDetail,
    Conversations,
    dmParams,
    paginatedMessages,
} from "./types";

export interface createDMServiceParams {
    workspaceId: string;
    receiverId: string;
    idempotencyKey: string;
}

export interface createGDMServiceParams {
    workspaceId: string;
    name: string;
    memberIds: string[];
    idempotencyKey: string;
}

export interface getMessageParams {
    workspaceId: string;
    channelId: string;
    limit?: number;
    cursor?: string;
}

export interface getConversationMessagesParams {
    workspaceId: string;
    conversationId: string;
    limit?: number;
    cursor?: string;
}

class MessageService {
    async getMessages(params: getMessageParams): Promise<paginatedMessages> {
        const queryParams = new URLSearchParams();

        queryParams.set("limit", String(params.limit));

        if (params.cursor) {
            queryParams.set("cursor", params.cursor);
        }

        const messages = await api.get(
            `/workspace/${params.workspaceId}/channel/${params.channelId}/messages?${queryParams.toString()}`,
        );

        return messages.data.data;
    }

    async getDMs(workspaceId: string): Promise<Conversations> {
        const conversations = await api.get(`/workspaces/${workspaceId}/conversations`);

        return conversations.data.data;
    }

    async getDM(params: dmParams): Promise<ConversationDetail> {
        const conversation = await api.get(
            `/workspaces/${params.workspaceId}/conversations/${params.conversationId}`,
        );

        return conversation.data.data;
    }

    async createDM(
        params: createDMServiceParams,
    ): Promise<ConversationDetail | Conversation> {
        const conversation = await api.post(
            `/workspaces/${params.workspaceId}/conversations`,
            {
                receiverId: params.receiverId,
                idempotencyKey: params.idempotencyKey,
            },
        );

        return conversation.data.data as ConversationDetail | Conversation;
    }

    async createGDM(params: createGDMServiceParams): Promise<Conversation> {
        const conversation = await api.post(
            `/workspaces/${params.workspaceId}/conversations/groups`,
            {
                name: params.name,
                memberIds: params.memberIds,
                idempotencyKey: params.idempotencyKey,
            },
        );

        return conversation.data.data;
    }

    async uploadFiles(files: File[]): Promise<string[]> {
        if (files.length === 0) return [];

        const formData = new FormData();
        files.forEach((file) => formData.append("attachments", file));

        const response = await api.post("/uploads", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        const uploads = response.data.data as { id: string }[];
        return uploads.map((upload) => upload.id);
    }

    async getConversationMessages(
        params: getConversationMessagesParams,
    ): Promise<paginatedMessages> {
        const queryParams = new URLSearchParams();
        queryParams.set("limit", String(params.limit));

        if (params.cursor) {
            queryParams.set("cursor", params.cursor);
        }

        const messages = await api.get(
            `/workspaces/${params.workspaceId}/conversations/${params.conversationId}/messages?${queryParams.toString()}`,
        );

        return messages.data.data;
    }
}

export const messageService = new MessageService();