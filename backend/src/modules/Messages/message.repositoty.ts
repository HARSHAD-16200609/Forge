import { fType } from "../../../generated/prisma/enums";
import { prisma } from "../../config/prisma";
import upload from "../../middlewares/multer.midleware";
import { MessageDTO } from "../../types/message";

class MessageRepository {

    async createMessage(messageObj: MessageDTO, attachments: {
        url: string,
        filename: string
        publicId: string,
        mimeType: string,
        fileSize: number,
        fileType: fType
    }[]) {
        return await prisma.$transaction(async (tx) => {

            const message = await tx.message.create({
                data: messageObj,
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
            const uploadData = attachments.map((attachment) => ({
                ...attachment,
                messageId: message.id,
            }));

            const uploads = await tx.upload.createMany({
                data: uploadData
            })

            return { message, uploads }

        })

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
                sentAt: "asc"
            }, include: {
                sender: {
                    select: {
                        username: true,
                        avatar: true,
                    },
                },
                parentMsg: {
                    select: {
                        sender: {
                            select: {
                                username: true,
                                avatar: true,
                            },
                        },
                        content: true,
                    },
                },
                uploads: {
                    select: {
                        filename: true,
                        url: true,
                        mimeType: true,
                        fileSize: true,
                        fileType: true,
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
                }, reactions: {
                    select: {
                        emoji: true
                    }
                },
                uploads: {
                    select: {
                        filename: true,
                        fileType: true,
                        url: true
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

    async createReply(
        message: MessageDTO,
        parentMessageId: string,
        attachments: {
            url: string;
            filename: string;
            publicId: string;
            mimeType: string;
            fileSize: number;
            fileType: fType;
        }[] = [],
    ) {
        return await prisma.$transaction(async (tx) => {
            const reply = await tx.message.create({
                data: {
                    ...message,
                    parentMsgId: parentMessageId,
                },
                select: {
                    id: true,
                    content: true,
                    parentMsgId: true,
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

            if (attachments.length > 0) {
                await tx.upload.createMany({
                    data: attachments.map((attachment) => ({
                        ...attachment,
                        messageId: reply.id,
                    })),
                });
            }

            return reply;
        });
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
    async getConversationMessages(conversationId: string, pagination: { cursor?: string | undefined, limit: number }) {
        const messages = await prisma.message.findMany({
            where: {
                conversationId,
                deletedAt: null
            }, take: pagination.limit + 1, ...(pagination.cursor && {
                cursor: {
                    id: pagination.cursor,
                }, skip: 1
            }),
            orderBy: {
                sentAt: "desc"
            }, include: {
                uploads: {
                    select: {
                        filename: true,
                        url: true,
                        mimeType: true,
                        fileSize: true,
                        fileType: true,
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
                    },
                }, parentMsg: {
                    select: {
                        sender: {
                            select: {
                                username: true,
                                avatar: true
                            }
                        },
                        content: true
                    },
                }, sender: {
                    select: {
                        username: true,
                        avatar: true
                    }
                }
            },
            omit: {
                senderId: true,
                deletedAt: true,
                channelId: true,
                conversationId: true
            }
        })
        return messages

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




