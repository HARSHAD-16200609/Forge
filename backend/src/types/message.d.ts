type ChannelMessageDTO = {
    channelId: string;
    senderId: string;
    content: string;
};

type ConversationMessageDTO = {
    conversationId: string;
    senderId: string;
    content: string;
};

export type MessageDTO = ChannelMessageDTO | ConversationMessageDTO;