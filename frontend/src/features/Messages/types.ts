export interface Message {
    id: string;
    content: string;
    senderId: string;
    sentAt: string;
    editedAt: string;
    parentMsgId: string;
    sender: Sender;
    uploads?: MessageAttachment[];
}

export interface Sender {
    username: string;
    avatar: string;
}

export interface MessageAttachment {
    filename: string;
    url: string;
    mimeType: string;
    fileSize: number;
    fileType: string;
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
