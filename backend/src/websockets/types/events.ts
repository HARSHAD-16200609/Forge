
export const WsEvent = {
    ConversationSubscribe: "conversation.subscribe",
    ConversationUnsubscribe: "conversation.unsubscribe",

    MessageCreate: "message.create",
    MessageUpdate: "message.update",
    MessageDelete: "message.delete",

    TypingStart: "typing.start",
    TypingStop: "typing.stop",

    PresenceUpdate: "presence.update",

    Ping: "ping",
    Pong: "pong",
} as const;

export type WsEvent =
    typeof WsEvent[keyof typeof WsEvent];



    export type HandlerFunction = (event : WsEvent) =>void