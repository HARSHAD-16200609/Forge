import { api } from "@/lib/api";
import type {  paginatedMessages } from "./types";


export interface getMessageParams {
    workspaceId: string;
    channelId: string;
    limit?: number;
    cursor?: string
}

class MessageService {
    async getMessages(params: getMessageParams): Promise<paginatedMessages> {
        const queryParams = new URLSearchParams();

        queryParams.set("limit", String(params.limit));

        if (params.cursor) {
            queryParams.set("cursor", params.cursor);
        }


        const response = await api.get(`/workspace/${params.workspaceId}/channel/${params.channelId}/messages?${queryParams.toString()}`)

        return response.data.data
    }

}

export const messageService = new MessageService()