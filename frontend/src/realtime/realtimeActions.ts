import { WsEvent, type WsMessageEntityType } from "@/features/Messages/types";
import { realtimeSocket } from "./socket";

export const realtimeActions = {
    subscribeChannel(workspaceId: string, channelId: string): void {
        realtimeSocket.send(WsEvent.ChannelSubscribe, { workspaceId, channelId });
    },

    unsubscribeChannel(workspaceId: string, channelId: string): void {
        realtimeSocket.send(WsEvent.ChannelUnsubscribe, { workspaceId, channelId });
    },

    subscribeConversation(conversationId: string): void {
        realtimeSocket.send(WsEvent.ConversationSubscribe, { conversationId });
    },

    unsubscribeConversation(conversationId: string): void {
        realtimeSocket.send(WsEvent.ConversationUnsubscribe, { conversationId });
    },

    sendChannelMessage(workspaceId: string, channelId: string, content: string, uploadIds: string[] = []): void {
        realtimeSocket.sendQueued(WsEvent.ChannelMessage, { workspaceId, channelId, content, uploadIds });
    },

    sendConversationMessage(workspaceId: string, conversationId: string, content: string, uploadIds: string[] = []): void {
        realtimeSocket.sendQueued(WsEvent.ConversationMessage, { workspaceId, conversationId, content, uploadIds });
    },

    sendReply(
        workspaceId: string,
        parentMsgId: string,
        entityId: string,
        entityType: WsMessageEntityType,
        content: string,
        uploadIds: string[] = [],
    ): void {
        const type = entityType === "channel" ? WsEvent.ChannelMessageReply : WsEvent.ConversationMessageReply;
        realtimeSocket.sendQueued(type, { workspaceId, parentMsgId, entityId, entityType, content, uploadIds });
    },

    updateChannelMessage(workspaceId: string, channelId: string, messageId: string, content: string): void {
        realtimeSocket.sendQueued(WsEvent.ChannelMessageUpdate, { workspaceId, channelId, messageId, content });
    },

    updateConversationMessage(workspaceId: string, conversationId: string, messageId: string, content: string): void {
        realtimeSocket.sendQueued(WsEvent.ConversationMessageUpdate, { workspaceId, conversationId, messageId, content });
    },

    deleteChannelMessage(workspaceId: string, channelId: string, messageId: string): void {
        realtimeSocket.sendQueued(WsEvent.ChannelMessageDelete, { workspaceId, channelId, messageId });
    },

    deleteConversationMessage(workspaceId: string, conversationId: string, messageId: string): void {
        realtimeSocket.sendQueued(WsEvent.ConversationMessageDelete, { workspaceId, conversationId, messageId });
    },

    react(entityType: WsMessageEntityType, workspaceId: string, entityId: string, messageId: string, reaction: string): void {
        const type = entityType === "channel" ? WsEvent.ChannelMessageReaction : WsEvent.ConversationMessageReaction;
        realtimeSocket.sendQueued(type, {
            workspaceId,
            entityId,
            entityType,
            messageId,
            reaction,
        });
    },

    typingStart(entityType: WsMessageEntityType, workspaceId: string, entityId: string): void {
        realtimeSocket.send(WsEvent.TypingStart, { workspaceId, entityId, entityType });
    },

    typingStop(entityType: WsMessageEntityType, workspaceId: string, entityId: string): void {
        realtimeSocket.send(WsEvent.TypingStop, { workspaceId, entityId, entityType });
    },

    presence(workspaceId: string): void {
        realtimeSocket.send(WsEvent.PresenceUpdate, { workspaceId });
    },

    ping(): void {
        realtimeSocket.send(WsEvent.Ping, { timestamp: Date.now() });
    },
};