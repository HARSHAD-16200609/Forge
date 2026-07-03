import { Prisma, Role, Visibility } from "../../../generated/prisma/client";
import { channelParamsDTO, createChannelDTO, updateChannelDTO } from "../../db/channel.schema";
import { canWorkspace } from "../../utility/Authorization/Permissions";
import { BadRequestError, ConfilctError, ForbiddenError, NotFoundError, UnauthorizedAccessError } from "../../utility/errorHandling/customErrors";
import { workspaceRepository } from "../Workspace/workspace.repository";
import { deleteChannel } from "./channel.controller";
import { channelRepository } from "./channel.repository";

class ChannelService {

    async createChannel(channelData: createChannelDTO, workspaceId: string, userId: string) {

        const workspaceMember = await workspaceRepository.memberExists(userId, workspaceId)
        if (!workspaceMember) throw new ForbiddenError("You are not a member of this workspace")

        try {
            const channel = await channelRepository.createChannel(channelData, workspaceId, workspaceMember.id)

            return channel
        }
        catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") throw new ConfilctError("Channel Already Exists")
            throw err
        }
    }

    async getChannels(workspaceId: string, userId: string) {
        const workspaceMember = await workspaceRepository.memberExists(userId, workspaceId)
        if (!workspaceMember) throw new ForbiddenError("You are not a member of this workspace")

        try {

            if (workspaceMember.role === Role.ADMIN || workspaceMember.role === Role.OWNER) {
                const channels = await channelRepository.getAllChannels(workspaceId)
                if (channels.length === 0) throw new NotFoundError("No channel Found in this Workspace")
                return { Channels: channels }

            }

            const channels = await channelRepository.getVisibleChannelsForMember(workspaceId, workspaceMember.id)
            if (channels.length === 0) throw new NotFoundError("No channel Found in this Workspace")
            return { Channels: channels }

        }
        catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") throw new ConfilctError("No Channels Found")
            throw err
        }

    }
    async getChannel(Channel: channelParamsDTO, userId: string) {
        const workspaceMember = await workspaceRepository.memberExists(userId, Channel.workspaceId)
        if (!workspaceMember) throw new ForbiddenError("You are not a member of this workspace")

        const id = await channelRepository.channelExists(Channel.channelId, Channel.workspaceId)
        if (!id) throw new NotFoundError("Channel Not found")

        try {
            if (workspaceMember.role === Role.ADMIN || workspaceMember.role === Role.OWNER) {
                const channel = await channelRepository.getChannelById(Channel.channelId)
                return { Channels: channel }

            }

            const channel = await channelRepository.getVisibleChannel(Channel.channelId, workspaceMember.id)
            if (!channel) throw new NotFoundError("Channel Not Found")
            return { Channels: channel }

        }
        catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") throw new ConfilctError("No Channels Found")
            throw err
        }

    }

    async updateChannel(newChannelDetails: updateChannelDTO, userId: string, Channel: channelParamsDTO) {
        const workspaceMember = await workspaceRepository.memberExists(userId, Channel.workspaceId)
        if (!workspaceMember) throw new ForbiddenError("You are not a member of this workspace")
        const channel = await channelRepository.channelExists(Channel.channelId, Channel.workspaceId)
        if (!channel) throw new NotFoundError("Channel Not Found")
        try {
            const hasWorkspacePermission = canWorkspace(workspaceMember.role, "channel", "delete");
            const isChannelCreator = workspaceMember.id === channel.createdByWorkspaceMemberId;

            if (!hasWorkspacePermission && !isChannelCreator) {
                throw new ForbiddenError("You are not allowed to delete the channel.");
            }
            const updatedChannel = await channelRepository.updateChannel(newChannelDetails, Channel)
            return updatedChannel
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") throw new NotFoundError("Channel not Found")

            throw err
        }

    }
    async deleteChannel(Channel: channelParamsDTO, userId: string) {
        const workspaceMember = await workspaceRepository.memberExists(userId, Channel.workspaceId)
        const channel = await channelRepository.channelExists(Channel.channelId, Channel.workspaceId)
        if (!workspaceMember) throw new ForbiddenError("You are not a member of this workspace")
        if (!channel) throw new NotFoundError("Channel Not Found")
        if (channel.isDefault) throw new BadRequestError("Default channels can't be deleted")
        try {
            const hasWorkspacePermission = canWorkspace(workspaceMember.role, "channel", "delete");
            const isChannelCreator = workspaceMember.id === channel.createdByWorkspaceMemberId;

            if (!hasWorkspacePermission && !isChannelCreator) {
                throw new ForbiddenError("You are not allowed to delete the channel.");
            }
            await channelRepository.deleteChannel(Channel.channelId)

        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") throw new NotFoundError("Channel not Found")

            throw err
        }

    }
    async joinPubChannel(Channel: channelParamsDTO, userId: string) {
        const workspaceMember = await workspaceRepository.memberExists(userId, Channel.workspaceId)
        const channel = await channelRepository.channelExists(Channel.channelId, Channel.workspaceId)
        if (!workspaceMember) throw new ForbiddenError("You are not a member of this workspace")
        if (!channel) throw new NotFoundError("Channel Not Found")

        try {
            if (channel.visibility === Visibility.PRIVATE) throw new ForbiddenError("This is a private channel. An invitation is required to join.")
            const channelMember = await channelRepository.joinChannel(workspaceMember.id, Channel.channelId)
            return channelMember
        }
        catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new ConfilctError("You are Already an member of this Channel")
            }
            throw err
        }

    }
    async leaveChannel(Channel: channelParamsDTO, userId: string) {
        const workspaceMember = await workspaceRepository.memberExists(userId, Channel.workspaceId)
        const channel = await channelRepository.channelExists(Channel.channelId, Channel.workspaceId)

        if (!workspaceMember) throw new ForbiddenError("You are not a member of this workspace")
        if (!channel) throw new NotFoundError("Channel Not Found")

        const channelMember = await channelRepository.memberExists(workspaceMember.id, Channel.channelId)
        if (!channelMember) throw new BadRequestError("You are not an member of this Channel")
        if (channel.isDefault) {
            throw new BadRequestError("Can't Leave an Default Channel")
        }


        await channelRepository.leaveChannel(workspaceMember.id, channel.id)



    }

    async removeMember(Channel: channelParamsDTO, userId: string) {
        if (!Channel.memberId) {
            throw new BadRequestError("Invalid memberId");
        }

        const workspaceMember = await workspaceRepository.memberExists(
            userId,
            Channel.workspaceId
        );

        if (!workspaceMember) {
            throw new ForbiddenError(
                "You are not a member of this workspace"
            );
        }

        const channel = await channelRepository.channelExists(
            Channel.channelId,
            Channel.workspaceId
        );

        if (!channel) {
            throw new NotFoundError("Channel not found");
        }

        if (channel.isDefault) {
            throw new BadRequestError(
                "Members cannot be removed from the default channel"
            );
        }

        const memberToRemove =
            await workspaceRepository.getUserByworkspceMemberId(
                Channel.memberId
            );

        if (!memberToRemove) {
            throw new NotFoundError("Workspace member not found");
        }

        const channelMember = await channelRepository.memberExists(
            Channel.memberId,
            Channel.channelId
        );

        if (!channelMember) {
            throw new NotFoundError(
                "Member is not part of this channel"
            );
        }

        if (
            !canWorkspace(
                workspaceMember.role,
                "channelMember",
                "remove"
            )
        ) {
            throw new ForbiddenError(
                "You do not have permission to remove channel members"
            );
        }

        if (memberToRemove.role === Role.OWNER) {
            throw new ForbiddenError(
                "Workspace owner cannot be removed from the channel"
            );
        }

        if (
            workspaceMember.role === Role.ADMIN &&
            memberToRemove.role === Role.ADMIN
        ) {
            throw new ForbiddenError(
                "Admins cannot remove other admins from a channel"
            );
        }

        if (workspaceMember.id === Channel.memberId) {
            throw new BadRequestError(
                "Use the leave channel endpoint instead"
            );
        }

        await channelRepository.removeMember(
            Channel.memberId,
            Channel.channelId
        );
    }

}

export const channelService = new ChannelService()