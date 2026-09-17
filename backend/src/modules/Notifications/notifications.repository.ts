import { Prisma } from "../../../generated/prisma/client"
import { EntityType, NotificationType } from "../../../generated/prisma/enums"
import { prisma } from "../../config/prisma"

export type MentionContext =
    | { kind: "channel"; workspaceId: string; channelId: string; snippet?: string }
    | { kind: "conversation"; workspaceId: string; conversationId: string; snippet?: string }

export type NotificationFilter = "all" | "unread" | "mentions" | "activity" | "invites"

const notificationSelect = {
    id: true,
    type: true,
    entity: true,
    entityId: true,
    read: true,
    createdAt: true,
    receipentId: true,
    actorId: true,
    metadata: true,
    actor: {
        select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
        },
    },
} satisfies Prisma.notificationSelect

class NotificationRepository {
    private async eligibleRecipientIds(context: MentionContext): Promise<string[]> {
        if (context.kind === "channel") {
            const members = await prisma.channelMember.findMany({
                where: { channelId: context.channelId },
                select: { workspaceMember: { select: { userId: true } } },
            })
            return members.map((member) => member.workspaceMember.userId)
        }

        const members = await prisma.conversationMember.findMany({
            where: { convoId: context.conversationId },
            select: { userId: true },
        })
        return members.map((member) => member.userId)
    }

    async createMentions(
        messageId: string,
        actorId: string,
        mentionIds: string[],
        context: MentionContext,
    ): Promise<void> {
        if (mentionIds.length === 0) return

        const eligible = new Set(await this.eligibleRecipientIds(context))
        const recipients = mentionIds.filter((id) => id !== actorId && eligible.has(id))
        if (recipients.length === 0) return

        await prisma.notification.createMany({
            data: recipients.map((receipentId) => ({
                type: NotificationType.MENTION,
                entity: EntityType.MESSAGE,
                entityId: messageId,
                receipentId,
                actorId,
                metadata: context as Prisma.InputJsonObject,
            })),
        })
    }

    async list(receipentId: string, filter: NotificationFilter, pagination: { cursor: string | undefined; limit: number }) {
        const where: Prisma.notificationWhereInput = { receipentId }

        if (filter === "unread") {
            where.read = false
        } else if (filter === "mentions") {
            where.type = NotificationType.MENTION
        } else if (filter === "activity") {
            where.type = {
                notIn: [NotificationType.CHANNEL_INVITE, NotificationType.WORKSPACE_INVITE],
            }
        } else if (filter === "invites") {
            where.type = {
                in: [NotificationType.CHANNEL_INVITE, NotificationType.WORKSPACE_INVITE],
            }
        }

        const rows = await prisma.notification.findMany({
            where,
            take: pagination.limit + 1,
            ...(pagination.cursor
                ? {
                      cursor: { id: pagination.cursor },
                      skip: 1,
                  }
                : {}),
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            select: notificationSelect,
        })

        const hasMore = rows.length > pagination.limit
        const items = hasMore ? rows.slice(0, pagination.limit) : rows
        const last = items[items.length - 1]
        const nextCursor = hasMore && last ? last.id : undefined

        return { items, hasMore, nextCursor }
    }

    async findById(id: string, receipentId: string) {
        return prisma.notification.findFirst({
            where: { id, receipentId },
            select: { id: true, read: true },
        })
    }

    async markRead(id: string, receipentId: string) {
        return prisma.notification.updateMany({
            where: { id, receipentId },
            data: { read: true },
        })
    }

    async markAllRead(receipentId: string) {
        return prisma.notification.updateMany({
            where: { receipentId, read: false },
            data: { read: true },
        })
    }

    async unreadCount(receipentId: string): Promise<number> {
        return prisma.notification.count({
            where: { receipentId, read: false },
        })
    }
}

export const notificationRepository = new NotificationRepository()