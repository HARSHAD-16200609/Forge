import axios from "axios";
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

export interface UploadScope {
    workspaceId: string;
    channelId?: string;
    conversationId?: string;
}

interface UploadIntent {
    uploadId: string;
    provider: "S3" | "CLOUDINARY";
    uploadUrl: string;
    method: "PUT" | "POST";
    headers?: Record<string, string>;
    fields?: Record<string, string>;
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

    async uploadFiles(files: File[], scope: UploadScope): Promise<string[]> {
        if (files.length === 0) return [];

        const intentsResponse = await api.post<{ data: UploadIntent[] }>(
            "/uploads/intents",
            {
                workspaceId: scope.workspaceId,
                files: files.map((file) => ({
                    filename: file.name,
                    mimeType: file.type || "application/octet-stream",
                    fileSize: file.size,
                })),
                ...(scope.channelId ? { channelId: scope.channelId } : {}),
                ...(scope.conversationId
                    ? { conversationId: scope.conversationId }
                    : {}),
            },
        );

        const intents = intentsResponse.data.data;

        const uploadResults = await Promise.all(
            intents.map(async (intent, index) => {
                const file = files[index]!;
                const contentType = file.type || "application/octet-stream";

                if (intent.method === "PUT") {
                    await axios.put(intent.uploadUrl, file, {
                        headers: { "Content-Type": contentType },
                    });
                    return {};
                }

                const formData = new FormData();
                Object.entries(intent.fields ?? {}).forEach(([key, value]) =>
                    formData.append(key, String(value)),
                );
                formData.append("file", file);
                const response = await axios.post(intent.uploadUrl, formData);
                return {
                    publicId: response.data?.public_id,
                    secureUrl: response.data?.secure_url,
                };
            }),
        );

        const uploadIds: string[] = [];
        await Promise.all(
            intents.map(async (intent, index) => {
                await api.post(
                    `/uploads/${intent.uploadId}/complete`,
                    uploadResults[index] ?? {},
                );
                uploadIds.push(intent.uploadId);
            }),
        );

        return uploadIds;
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