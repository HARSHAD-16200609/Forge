import { prisma } from "../../config/prisma";
import { MessageDTO } from "../../types/message";

class MessageRepository {

    async createMessage(message: MessageDTO) {
        return prisma.message.create({
            data: message,
            select: {
                id: true,
                content: true,
                sentAt: true,
                editedAt: true,
                sender: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
            },
        });
    }

    async getMessages(channelId: string, pagination: { cursor?: string | undefined, limit: number }) {
        const messages = await prisma.message.findMany({
            where: {
                channelId,
                deletedAt: null
            }, take: pagination.limit + 1, ...(pagination.cursor && {
                cursor: {
                    id: pagination.cursor,
                }, skip: 1
            }),
            orderBy: {
                sentAt: "desc"
            }, include: {
                sender: {
                    select: {
                        username: true,
                        avatar: true,
                    },
                },
            }, omit: {
                deletedAt: true,
                channelId: true,
                conversationId: true
            }
        })
        return messages

    }
    async getById(messageId: string) {
        const message = await prisma.message.findUnique({
            where: {
                id: messageId,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
                channel: {
                    select: {
                        id: true,
                        workspaceId: true,
                    },
                },
                replies: {
                    select: {
                        content: true,
                        sender: {
                            select: {
                                username: true,
                                avatar: true
                            }
                        }
                    }
                },reactions:{
                    select:{
                        emoji:true
                    }
                }
            }, omit: {
                conversationId: true
            }
        });
        return message
    }

    async editMessage(content: string, messageId: string) {
        const editedMessage = await prisma.message.update({
            where: {
                id: messageId
            }, data: {
                content,
                editedAt: new Date()
            }
        })
        return editedMessage
    }
    async deleteMessage(messageId: string) {
        const deletedMessage = await prisma.message.update({
            where: {
                id: messageId
            }, data: {
                deletedAt: new Date(),
                content: ""
            }
        })

    }

    async createReply(message: MessageDTO, parentMessageId: string) {
        if ("channelId" in message) {
            const reply = await prisma.message.create({
                data: {
                    ...message,
                    parentMsgId: parentMessageId
                }

            })
            return reply
        }
        else return

    }
    async addReaction(userId: string, messageId: string,emoji:string){
        const reaction = await prisma.reaction.create({
            data:{
                userId,
                messageId,
                emoji
            }
        })
        return emoji
    }

    async reactionExists(userId: string, messageId: string) {
        const reaction = await prisma.reaction.findFirst({
            where: {

                userId, messageId

            },
            select: {
                emoji:true
            }
        })
        return reaction

    }

    async toggleReaction(userId: string, messageId: string, emoji: string) {
         await prisma.reaction.delete({
            where: {
                userId_messageId_emoji: {
                    userId, messageId, emoji
                }
            }
        })
      
    }

    async updateReaction(userId: string, messageId: string, emoji: string) {
        const reaction = await prisma.reaction.update({
            where: {
                userId_messageId_emoji: {
                    userId, messageId, emoji
                }
            }, data: {
                emoji
            }
        })
        return reaction
    }
}

export const messageRepository = new MessageRepository()




