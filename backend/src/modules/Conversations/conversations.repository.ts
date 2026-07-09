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
            }, omit: {
                groupName: true
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
    async getConversations(userId: string) {
        return await prisma.conversationMember.findMany({
            where: {
                userId
            },
            include: {

                conversation: {
                    include: {
                        members: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        username: true
                                    }
                                }
                            }, omit: {
                                id: true,
                                userId: true,
                                convoId: true,
                            }
                        }
                    }
                }
            }, omit: {
                id: true,
                convoId: true,
                userId: true
            }
        })
    }
}

export const conversationRepository = new ConversationRepository()