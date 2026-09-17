import { ForbiddenError, NotFoundError } from "../../utility/errorHandling/customErrors"
import { channelRepository } from "../Channel/channel.repository"
import { workspaceRepository } from "../Workspace/workspace.repository"
import {
    notificationRepository,
    type MentionContext,
    type NotificationFilter,
} from "./notifications.repository"

function stripTags(value: string): string {
    const text = value.replace(/<[^>]*>/g, "")
    return text
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim()
}

export function mentionSnippet(contentJson: string): string {
    try {
        const parsed: unknown = JSON.parse(contentJson)
        const blocks =
            Array.isArray(parsed)
                ? (parsed as Array<{ data?: Record<string, unknown> }>)
                : parsed && typeof parsed === "object" && Array.isArray((parsed as { blocks?: unknown }).blocks)
                  ? ((parsed as { blocks: Array<{ data?: Record<string, unknown> }> }).blocks)
                  : []

        const parts: string[] = []
        for (const block of blocks) {
            const data = block?.data ?? {}
            if (typeof data.text === "string") parts.push(stripTags(data.text))
            if (typeof data.code === "string") parts.push(data.code)
            if (Array.isArray(data.items)) {
                for (const item of data.items) {
                    if (typeof item === "string") parts.push(stripTags(item))
                }
            }
        }

        return parts.join(" ").replace(/\s+/g, " ").trim().slice(0, 120)
    } catch {
        return ""
    }
}

class NotificationService {
    async createMentions(messageId: string, actorId: string, mentionIds: string[], context: MentionContext) {
        if (mentionIds.length === 0) return

        const wsMember = await workspaceRepository.memberExists(actorId, context.workspaceId)
        if (!wsMember) throw new ForbiddenError("You are not a member of this workspace")

        if (context.kind === "channel") {
            const channelMember = await channelRepository.memberExists(wsMember.id, context.channelId)
            if (!channelMember) throw new ForbiddenError("You are not a member of this channel")
        }

         if (mentionIds.length === 0) return
        await notificationRepository.createMentions(messageId, actorId, mentionIds, context)
    }

    async list(userId: string, filter: NotificationFilter, cursor: string | undefined, limit: number) {
        const result = await notificationRepository.list(userId, filter, { cursor, limit })
        if (result.items.length === 0) throw new NotFoundError("No Notifications Found")
        return result
    }

    async markRead(userId: string, notificationId: string) {
        const found = await notificationRepository.findById(notificationId, userId)
        if (!found) throw new NotFoundError("Notification not found")

        if (!found.read) {
            await notificationRepository.markRead(notificationId, userId)
        }

        return { id: notificationId, read: true }
    }

    async markAllRead(userId: string) {
        const result = await notificationRepository.markAllRead(userId)
        return { count: result.count }
    }

    async unreadCount(userId: string) {
        const count = await notificationRepository.unreadCount(userId)
        return { count }
    }
}

export const notificationService = new NotificationService()