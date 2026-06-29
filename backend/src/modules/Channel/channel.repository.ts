import { Visibility } from "../../../generated/prisma/enums";
import { prisma } from "../../config/prisma";
import { createChannelDTO } from "../../db/channel.schema";

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
    async getChannels(workspaceId: string, userId:string) {
        const channels = await prisma.channel.findMany({
            where: {
                workspaceId,
                OR: [
                    {
                        visibility: "PUBLIC",
                    },
                    {
                        visibility: "PRIVATE",
                        members: {
                            some: {
                                workspaceMember: {
                                    userId,
                                },
                            },
                        },
                    },
                ],
            },
        });
        return channels
    }

}

export const channelRepository = new ChannelRepository()