import { prisma } from "../../config/prisma";
import { MessageDTO } from "../../types/message";

class MessageRepository {

    async createMessage(Message: MessageDTO) {
        return prisma.message.create({
            data: Message,
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
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
            },
        })
        return messages

    }
}

export const messageRepository = new MessageRepository()




