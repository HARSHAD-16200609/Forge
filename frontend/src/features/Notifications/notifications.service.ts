import { api } from "@/lib/api";

export type NotificationFilter = "unread" | "mentions" | "activity" | "invites";

export interface NotificationSender {
    id: string;
    username: string;
    name: string;
    avatar: string | null;
}

export interface AppNotification {
    id: string;
    type:
        | "MENTION"
        | "REPLY"
        | "REACTION"
        | "CHANNEL_INVITE"
        | "WORKSPACE_INVITE"
        | "DIRECT_MESSAGE"
        | null;
    entity: "MESSAGE" | "CHANNEL" | "WORKSPACE" | "CONVO" | null;
    entityId: string | null;
    read: boolean;
    createdAt: string;
    actorId: string | null;
    actor: NotificationSender | null;
    metadata: Record<string, unknown> | null;
}

export interface NotificationsPage {
    items: AppNotification[];
    hasMore: boolean;
    nextCursor?: string;
}

export interface MentionMetadata {
    kind: "channel" | "conversation";
    workspaceId: string;
    channelId?: string;
    conversationId?: string;
    snippet?: string;
}

class NotificationsService {
    async list(params: {
        filter: NotificationFilter;
        cursor?: string;
        limit?: number;
    }): Promise<NotificationsPage> {
        const query = new URLSearchParams();
        query.set("filter", params.filter);
        query.set("limit", String(params.limit ?? 20));
        if (params.cursor) query.set("cursor", params.cursor);

        const response = await api.get(`/notifications?${query.toString()}`);
        return response.data.data;
    }

    async markRead(id: string): Promise<void> {
        await api.patch(`/notifications/${id}/read`);
    }

    async markAllRead(): Promise<void> {
        await api.patch("/notifications/read-all");
    }

    async unreadCount(): Promise<number> {
        const response = await api.get("/notifications/unread-count");
        return response.data.data.count as number;
    }
}

export const notificationsService = new NotificationsService();