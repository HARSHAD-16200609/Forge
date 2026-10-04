import { api } from "@/lib/api";
import {
    normalizeChannelName,
    type CreateChannelPayload,
    type CreatedChannel,
} from "./types";

class ChannelService{
    async joinPublicChannel(workspaceId : string, channelId : string) : Promise<void>{

        await api.post(`/workspace/${workspaceId}/channels/${channelId}`)
  
    }

    async createChannel(workspaceId : string, payload : CreateChannelPayload) : Promise<CreatedChannel>{
        const description = payload.description?.trim()

        const response = await api.post(`/workspace/${workspaceId}/channels`, {
            channelName: normalizeChannelName(payload.channelName),
            ...(description ? { description } : {}),
            visibility: payload.visibility,
        })

        return response.data.data
    }
}

export const channelService = new ChannelService()
