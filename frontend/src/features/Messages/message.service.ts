import { api } from "@/lib/api";
import type {
    channelParams,
    ConversationDetail,
    Conversations,
    dmParams,
    Message,
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

    async postMessage(
        params: channelParams,
        content: string,
        files: File[] = [],
    ): Promise<Message> {
        const formData = new FormData();
        formData.append("content", content);
        files.forEach((file) => formData.append("attachments", file));

        const sentMessage = await api.post(
            `/workspace/${params.workspaceId}/channel/${params.channelId}/messages`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } },
        );

        return sentMessage.data.data;
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

    async postConversationMessage(
        params: dmParams,
        content: string,
        files: File[] = [],
    ): Promise<Message> {
        const formData = new FormData();
        formData.append("content", content);
        files.forEach((file) => formData.append("attachments", file));

        const sentMessage = await api.post(
            `/workspaces/${params.workspaceId}/conversations/${params.conversationId}/messages`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } },
        );

        return sentMessage.data.data;
    }

    async postReply(
        params: channelParams | dmParams,
        messageId: string,
        content: string,
        files: File[] = [],
    ): Promise<Message> {
        const formData = new FormData();
        formData.append("content", content);
        files.forEach((file) => formData.append("attachments", file));

        const url =
            "channelId" in params
                ? `/messages/${messageId}/replies`
                : `/workspaces/${params.workspaceId}/conversations/${params.conversationId}/messages/${messageId}`;

        const sentMessage = await api.post(url, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        return sentMessage.data.data;
    }
}

export const messageService = new MessageService();
