import { api } from "@/lib/api";

class ChannelService{
    async joinPublicChannel(workspaceId : string, channelId : string) : Promise<void>{

        await api.post(`/workspace/${workspaceId}/channels/${channelId}`)
  
    }
}

export const channelService = new ChannelService()