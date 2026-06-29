import { Prisma, Visibility } from "../../../generated/prisma/client";
import { createChannelDTO } from "../../db/channel.schema";
import { ConfilctError, UnauthorizedAccessError } from "../../utility/errorHandling/customErrors";
import { workspaceRepository } from "../Workspace/workspace.repository";
import { channelRepository } from "./channel.repository";

class ChannelService {

    async createChannel(channelData: createChannelDTO, workspaceId: string, userId: string) {

        const member = await workspaceRepository.memberExists(userId, workspaceId)
        if (!member) throw new UnauthorizedAccessError("You are not a member of this workspace")

        try {
            const channel = await channelRepository.createChannel(channelData, workspaceId, member.id)

            return channel
        }
        catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") throw new ConfilctError("Channel Already Exists")
            throw err
        }
    }

    async getChannels(workspaceId: string, userId: string) {
        const member = await workspaceRepository.memberExists(userId, workspaceId)
        if (!member) throw new UnauthorizedAccessError("You are not a member of this workspace")



        try {

            const channels = await channelRepository.getChannels(workspaceId, userId)
            return channels

        }
        catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") throw new ConfilctError("No Channels Found")
            throw err
        }

    }

}

export const channelService = new ChannelService()