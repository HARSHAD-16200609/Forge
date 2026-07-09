import { prisma } from "../../config/prisma";

class ConversationRepository {
    async findDMBetweenUsers(
        senderId: string,
        receiverId: string
    ) {
        return prisma.conversation.findFirst({
            where: {
                type: "DM",
                AND: [
                    {
                        members: {
                            some: {
                                userId: senderId,
                            },
                        },
                    },
                    {
                        members: {
                            some: {
                                userId: receiverId,
                            },
                        },
                    },
                ],
            },
            include: {
                _count: {
                    select: {
                        members: true,
                    },
                }, members: true
            },omit:{
                groupName:true
            }
        });
    }

    async createDM(senderId: string, receiverId: string) {
        return await prisma.conversation.create({
            data: {
                members: {
                    create: [
                        { userId: senderId },
                        { userId: receiverId }
                    ]
                }
            }, include: {
                members: true
            },
            omit: {
                groupName: true
            }
        })
    }
}

export const conversationRepository = new ConversationRepository()