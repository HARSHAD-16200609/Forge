import { prisma } from "../../config/prisma";
import { MessageDTO } from "../../types/message";
import { BadRequestError } from "../../utility/errorHandling/customErrors";
import { messageDetailsInclude, toWsMessageDTO, WsMessageDTO } from "../../websockets/types/wsMessageDTO";

class MessageRepository {

    async postMessage(messageObj: MessageDTO, uploadIds: string[], uploaderId: string): Promise<WsMessageDTO> {
        return await prisma.$transaction(async (tx) => {

            const message = await tx.message.create({
                data: messageObj,
                select: {
                    id: true,
                },
            });

            const attachments = await tx.upload.updateMany({
                data: {
                    messageId: message.id,

                }, where: {
                    id: {
                        in: uploadIds
                    },
                    messageId: null,
                    uploaderId: uploaderId

                },

            })
            if (attachments.count !== uploadIds.length) throw new BadRequestError("Some uipload Id's are invlaid or already attached")

            const created = await tx.message.findUnique({
                where: { id: message.id },
                include: messageDetailsInclude,
            })

            return toWsMessageDTO(created!)

        })


    }

    async getMessages(channelId: string, pagination: { cursor?: string | undefined, limit: number }): Promise<WsMessageDTO[]> {
        const messages = await prisma.message.findMany({
            where: {
                channelId,
            }, take: pagination.limit + 1, ...(pagination.cursor && {
                cursor: {
                    id: pagination.cursor,
                }, skip: 1
            }),
            orderBy: {
                sentAt: "desc"
            }, include: messageDetailsInclude
        })
        return messages.map(toWsMessageDTO)

    }
    async getById(messageId: string): Promise<WsMessageDTO | null> {
        const message = await prisma.message.findUnique({
            where: {
                id: messageId,
            },
            include: messageDetailsInclude,
            omit: {
                conversationId: false,
            },
        });

        return message ? toWsMessageDTO(message) : null
    }

    async editMessage(content: string, messageId: string): Promise<WsMessageDTO> {
        await prisma.message.update({
            where: {
                id: messageId
            }, data: {
                content,
                editedAt: new Date()
            }
        })
        const edited = await prisma.message.findUnique({
            where: { id: messageId },
            include: messageDetailsInclude,
        })
        return toWsMessageDTO(edited!)
    }

    async deleteMessage(messageId: string): Promise<WsMessageDTO> {
        await prisma.message.update({
            where: {
                id: messageId
            }, data: {
                deletedAt: new Date(),
                content: ""
            }
        })

        const tombstone = await prisma.message.findUnique({
            where: { id: messageId },
            include: messageDetailsInclude,
        })
        return toWsMessageDTO(tombstone!)
    }

    async createReply(message: MessageDTO, parentMessageId: string): Promise<WsMessageDTO> {
        const reply = await prisma.message.create({
            data: {
                ...message,
                parentMsgId: parentMessageId
            },
            select: { id: true }
        })

        const created = await prisma.message.findUnique({
            where: { id: reply.id },
            include: messageDetailsInclude,
        })
        return toWsMessageDTO(created!)
    }
    async addReaction(userId: string, messageId: string, emoji: string) {
        const reaction = await prisma.reaction.create({
            data: {
                userId,
                messageId,
                emoji
            }
        })
        return reaction
    }

    async reactionExists(userId: string, messageId: string) {
        const reaction = await prisma.reaction.findFirst({
            where: {

                userId, messageId

            },
            select: {
                emoji: true
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
        const reaction = await prisma.reaction.updateMany({
            where: {

                userId, messageId, emoji

            }, data: {
                emoji
            }
        })
        return reaction
    }

    async getMessageUploads(messageId: string, uploadIds: string[]) {
        const uploads = await prisma.message.findFirst({
            where: {
                id: messageId,
                uploads: {
                    some: {
                        id: {
                            in: uploadIds
                        }
                    }
                }
            }, select: {
                senderId: true, uploads: {
                    select: {
                        id: true
                    }
                }
            }
        })
        return uploads
    }
    async getDeletedMessages(limit: number = 100, deletionDeadline: Date) {

        const deletedMessages = await prisma.message.findMany({
            where: {
                deletedAt: {
                    lte: deletionDeadline
                }
            }, select: {
                id: true,
                uploads: {
                    select: {
                        id: true,
                        publicId: true,
                        mimeType: true
                    }
                }
            },
            take: limit
        })
        return deletedMessages

    }
    async hardDeleteMsgs(MessagesToBeDeleted: string[]) {
        const deletedMsgs = await prisma.message.deleteMany({
            where: {
                id: {
                    in: MessagesToBeDeleted,
                },
            },
        });
        return deletedMsgs
    }
    async getConversationMessages(conversationId: string, pagination: { cursor?: string | undefined, limit: number }): Promise<WsMessageDTO[]> {
        const messages = await prisma.message.findMany({
            where: {
                conversationId,
            }, take: pagination.limit + 1, ...(pagination.cursor && {
                cursor: {
                    id: pagination.cursor,
                }, skip: 1
            }),
            orderBy: {
                sentAt: "desc"
            }, include: messageDetailsInclude
        })
        return messages.map(toWsMessageDTO)
    }
    async messageExists(messageId: string) {
        return await prisma.message.findUnique({
            where: {
                id: messageId
            },
            select: {
                deletedAt: true,
                senderId: true,
                sentAt: true,
                channelId: true,
                conversationId: true,
                channel: {
                    select: {
                        workspaceId: true
                    }
                }
            }
        }

        )
    }
}

export const messageRepository = new MessageRepository()