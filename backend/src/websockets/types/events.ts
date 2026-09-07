export const WsEvent = {
    ConversationSubscribe: "conversation.subscribe",
    ConversationUnsubscribe: "conversation.unsubscribe",

    ConversationMessage: "conversation.message.create",
    ChannelMessage: "channel.message.create",

    ConversationMessageCreated: "conversation.message.created",
    ChannelMessageCreated: "channel.message.created",

    ChannelMessageUpdate: "message.update",
    MessageDelete: "message.delete",

    TypingStart: "typing.start",
    TypingStop: "typing.stop",

    PresenceUpdate: "presence.update",

    Ping: "ping",
    Pong: "pong",

    error: "error",
    ChannelSubscribe:"channel.subscribe",
    ChannelUnsubscribe : "channel.unsubscribe",

} as const;

export type WsEvent =
    typeof WsEvent[keyof typeof WsEvent];

export type HandlerFunction = (event: WsEvent) => void