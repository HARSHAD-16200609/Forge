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
                                        username: true,
                                        avatar: true
                                    }
                                }
                            }, omit: {
                                id: true,
                                userId: true,
                                convoId: true,
                            }
                        }, messages: {
                            select: {
                                content: true,
                                sentAt: true
                            },
                            take: 1,
                            orderBy: {
                                sentAt: "desc"
                            },
                        }
                    },
                }
            }, omit: {
                id: true,
                convoId: true,
                userId: true
            }
        })
    }
    async conversationExists(convoId: string, userId: string) {
        return await prisma.conversationMember.findUnique(
            {
                where: {
                    userId_convoId: { convoId, userId }

                }
            }
        )
    }

    async getConversation(convoId: string, userId: string) {
        return await prisma.conversationMember.findUnique({
            where: {
                userId_convoId: { convoId, userId }
            },
            include: {
                conversation: {
                    include: {
                        members: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        username: true,
                                        avatar: true
                                    }
                                }
                            }, omit: {
                                id: true,
                                userId: true,
                                convoId: true,
                            }
                        }, messages: {
                            where: {
                                parentMsgId: null
                            },
                            take: 2,
                            orderBy: {
                                sentAt: "desc"
                            },
                            select: {
                                id: true,
                                content: true,
                                sentAt: true,
                                parentMsgId: true,
                                uploads: {
                                    select: {
                                        id:true,
                                        url: true,
                                    }
                                }, reactions: {
                                    select: {
                                        emoji: true,
                                        reactedBy:{
                                            select:{
                                                username:true,
                                                avatar:true
                                            }
                                        }
                                    }
                                }, replies: {
                                    select: {
                                        content: true
                                    }, orderBy: {
                                        sentAt: "desc"
                                    }
                                }, sender: {
                                    select: {
                                        username: true,
                                        avatar: true
                                    }
                                }
                            },

                        }
                    },
                }
            }, omit: {
                id: true,
                userId: true,
                convoId: true
            }
        }
        )

    }

}
export const conversationRepository = new ConversationRepository()