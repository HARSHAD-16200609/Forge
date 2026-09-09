import { api } from "@/lib/api";
import type {
    ConversationDetail,
    Conversations,
    dmParams,
    paginatedMessages,
} from "./types";

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