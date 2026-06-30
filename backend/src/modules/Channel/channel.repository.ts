import { Visibility } from "../../../generated/prisma/enums";
import { prisma } from "../../config/prisma";
import { channelParamsDTO, createChannelDTO, updateChannelDTO } from "../../db/channel.schema";

class ChannelRepository {

    async createChannel(
        dto: createChannelDTO,
        workspaceId: string,
        workspaceMemberId: string
    ) {
        return prisma.$transaction(async (tx) => {

            const channel = await tx.channel.create({
                data: {
                    channelName: dto.channelName,
                    description: dto.description,
                    visibility: dto.visibility,
                    createdBy: {
                        connect: {
                            id: workspaceMemberId,
                        },
                    },
                    workspace: {
                        connect: {
                            id: workspaceId,
                        },
                    },
                },
            });

            await tx.channelMember.create({
                data: {
                    channelId: channel.id,
                    workspaceMemberId,
                    isCreator: true,
                },
            });

            return channel;
        });
    }
    async getAllChannels(workspaceId: string) {
        const channels = await prisma.channel.findMany({
            where: {
                workspaceId,
            },
            select: {
                id: true,
                channelName: true,
                description: true,
                visibility: true,
            }
        });
        return channels
    }
    async getVisibleChannelsForMember(workspaceId: string, workspaceMemberId: string) {
        const channels = await prisma.channel.findMany({
            where: {
                workspaceId,
                OR: [
                    {
                        visibility: Visibility.PUBLIC

                    },
                    {
                        visibility: Visibility.PRIVATE,
                        members: {
                            some: {
                                workspaceMemberId
                            }
                        }

                    }

                ]

            },
            select: {
                id: true,
                channelName: true,
                description: true,
                visibility: true,
            }
        });
        return channels
    }

    async getChannelById(channelId: string) {
        const channel = await prisma.channel.findUnique({
            where: {
                id: channelId,
            }, select: {
                id: true,
                visibility: true,
                channelName: true,
                description: true
            }
        });
        return channel
    }
    async getVisibleChannel(
        channelId: string,
        workspaceMemberId: string
    ) {
        return prisma.channel.findFirst({
            where: {
                id: channelId,
                OR: [
                    {
                        visibility: Visibility.PUBLIC,
                    },
                    {
                        visibility: Visibility.PRIVATE,
                        members: {
                            some: {
                                workspaceMemberId,
                            },
                        },
                    },
                ],
            },
            select: {
                id: true,
                visibility: true,
                channelName: true,
                description: true

            },
        });
    }
    async channelExists(channelId: string) {
        const id = await prisma.channel.findUnique({
            where: {
                id: channelId
            }
        })
        return id;
    }

    async updateChannel(newChannelDetails: updateChannelDTO, Channel: channelParamsDTO,) {
        const updatedChannel = await prisma.channel.update({
            where:
            {
                id: Channel.channelId
            },
            data: {

                ...(newChannelDetails.channelName !== undefined && {
                    channelName: newChannelDetails.channelName,
                }),
                ...(newChannelDetails.description !== undefined && {
                    description: newChannelDetails.description,
                }),
                ...(newChannelDetails.visibility !== undefined && {
                    visibility: newChannelDetails.visibility,
                }),

            }
        })
        return updatedChannel
    }


}

export const channelRepository = new ChannelRepository()