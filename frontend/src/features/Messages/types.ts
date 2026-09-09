export type WsMessageEntityType = "channel" | "conversation";

export interface MessageSender {
    id: string;
    username: string;
    name: string;
    avatar: string | null;
}

export interface MessageAttachment {
    id: string;
    url: string;
    filename: string;
    mimeType: string;
    fileSize: number;
    fileType: string;
}

export interface MessageReaction {
    emoji: string;
    reactedBy: MessageSender;
}

export interface MessageReply {
    id: string;
    content: string;
    sentAt: string;
    sender: MessageSender;
}

export interface Message {
    id: string;
    content: string;
    sentAt: string;
    editedAt: string | null;
    deletedAt: string | null;
    parentMsgId: string | null;
    entity: { type: WsMessageEntityType; id: string };
    sender: MessageSender;
    uploads: MessageAttachment[];
    reactions: MessageReaction[];
    replies: MessageReply[];
}

export interface paginatedMessages {
    messages: Message[];
    hasMore: boolean;
    nextCursor?: string;
}

export interface Conversations {
    conversations: Conversation[];
}

export type Conversation = {
    lastMessage: {
        content: string;
        sentAt: string;
    };
    id: string;
    type: "GDM" | "DM";
    idempotencyKey: string;
    groupName?: string;
    workspaceId: string;
    createdAt: string;
    updatedAt: string;
    displayName: string;
    avatar: string;
    receiverId?: string;
};

export type dmParams = {
    workspaceId: string;
    conversationId: string;
};

export type channelParams = {
    workspaceId: string;
    channelId: string;
};

export type ConversationDetail = Conversation & {
    members: {
        user: { id: string; username: string; avatar: string | null };
    }[];
    messages: Message[];
    cursor?: string;
};

export const WsEvent = {
    ConversationSubscribe: "conversation.subscribe",
    ConversationUnsubscribe: "conversation.unsubscribe",
    ConversationMessage: "conversation.message.create",
    ConversationMessageCreated: "conversation.message.created",
    ConversationMessageUpdate: "conversation.message.update",
    ConversationMessageUpdated: "conversation.message.updated",
    ConversationMessageDelete: "conversation.message.delete",
    ConversationMessageDeleted: "conversation.message.deleted",
    ConversationMessageReaction: "conversation.message.reaction",
    ConversationMessageReply: "conversation.message.reply",

    ChannelSubscribe: "channel.subscribe",
    ChannelUnsubscribe: "channel.unsubscribe",
    ChannelMessage: "channel.message.create",
    ChannelMessageCreated: "channel.message.created",
    ChannelMessageUpdate: "channel.message.update",
    ChannelMessageUpdated: "channel.message.updated",
    ChannelMessageDelete: "channel.message.delete",
    ChannelMessageDeleted: "channel.message.deleted",
    ChannelMessageReaction: "channel.message.reaction",
    ChannelMessageReply: "channel.message.reply",

    TypingStart: "typing.start",
    TypingStop: "typing.stop",

    PresenceUpdate: "presence.update",

    Ping: "ping",
    Pong: "pong",

    error: "error",
} as const;

export type WsEvent = (typeof WsEvent)[keyof typeof WsEvent];

export interface WsEnvelope<T = unknown> {
    type: WsEvent;
    payload: T;
}

export interface WsResponse<T = unknown> {
    type: WsEvent;
    success: boolean;
    message?: string;
    statusCode: number;
    error?: { code: string; errorMessage: string };
    data?: T;
}

export interface SubscribeChannelPayload {
    workspaceId: string;
    channelId: string;
}

export interface SubscribeConversationPayload {
    conversationId: string;
}

export interface CreateChannelMessagePayload {
    workspaceId: string;
    channelId: string;
    content: string;
    uploadIds?: string[];
}

export interface CreateConversationMessagePayload {
    workspaceId: string;
    conversationId: string;
    content: string;
    uploadIds?: string[];
}

export interface CreateReplyPayload {
    workspaceId: string;
    parentMsgId: string;
    entityId: string;
    entityType: WsMessageEntityType;
    content: string;
    uploadIds?: string[];
}

export interface UpdateChannelMessagePayload {
    workspaceId: string;
    channelId: string;
    messageId: string;
    content: string;
}

export interface UpdateConversationMessagePayload {
    workspaceId: string;
    conversationId: string;
    messageId: string;
    content: string;
}

export interface DeleteChannelMessagePayload {
    workspaceId: string;
    channelId: string;
    messageId: string;
}

export interface DeleteConversationMessagePayload {
    workspaceId: string;
    conversationId: string;
    messageId: string;
}

export interface ReactionPayload {
    workspaceId: string;
    entityId: string;
    entityType: WsMessageEntityType;
    messageId: string;
    reaction: string;
}

export interface TypingPayload {
    workspaceId: string;
    entityId: string;
    entityType: WsMessageEntityType;
}

export interface PresencePayload {
    workspaceId: string;
}

export interface PingPayload {
    timestamp: number;
}

export interface ReactionDelta {
    userId: string;
    username: string;
    messageId: string;
    reaction: string;
    action: "added" | "removed";
}

export interface TypingIndicatorData {
    userId: string;
    entityId: string;
}

export interface PresenceItem {
    userId: string;
    username: string;
}

export interface PresenceRegisterData {
    workspaceId: string;
    online: PresenceItem[];
}

export interface PresenceBroadcastData {
    workspaceId: string;
    userId: string;
    username: string;
    status: "online" | "offline";
}