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

    ChannelSubscribe: "channel.subscribe",
    ChannelUnsubscribe: "channel.unsubscribe",
    ChannelMessage: "channel.message.create",
    ChannelMessageCreated: "channel.message.created",
    ChannelMessageUpdate: "channel.message.update",
    ChannelMessageUpdated: "channel.message.updated",
    ChannelMessageDelete: "channel.message.delete",
    ChannelMessageDeleted: "channel.message.deleted",
    ChannelMessageReaction: "channel.message.reaction",

    


    TypingStart: "typing.start",
    TypingStop: "typing.stop",

    PresenceUpdate: "presence.update",

    Ping: "ping",
    Pong: "pong",

    error: "error",

} as const;

export type WsEvent =
    typeof WsEvent[keyof typeof WsEvent];

export type HandlerFunction = (event: WsEvent) => void