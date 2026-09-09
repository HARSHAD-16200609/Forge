import {
    QueryClient,
    useQueryClient,
    type InfiniteData,
} from "@tanstack/react-query";
import { useCallback, useEffect, useRef, type ReactNode } from "react";
import useAuth from "@/features/auth/hooks/useAuth";
import {
    WsEvent,
    type Conversations,
    type Message,
    type PresenceBroadcastData,
    type PresenceRegisterData,
    type ReactionDelta,
    type TypingIndicatorData,
    type WsResponse,
    type paginatedMessages,
} from "@/features/Messages/types";
import { useWorkspaceStore } from "@/features/Workspaces/store/workspaceStore";
import { useUIStore } from "@/stores/uiStore";
import {
    applyReactionDelta,
    updateConversationLastMessage,
    upsertMessage,
} from "./realtimeCache";
import { realtimeActions } from "./realtimeActions";
import { realtimeSocket } from "./socket";
import { usePresenceStore } from "./presenceStore";
import { useTypingStore } from "./typingStore";

const MESSAGE_FRAME_TYPES = new Set<string>([
    WsEvent.ChannelMessageCreated,
    WsEvent.ChannelMessageUpdated,
    WsEvent.ChannelMessageDeleted,
    WsEvent.ChannelMessageReply,
    WsEvent.ConversationMessageCreated,
    WsEvent.ConversationMessageUpdated,
    WsEvent.ConversationMessageDeleted,
    WsEvent.ConversationMessageReply,
]);

function isMessageFrame(type: string): boolean {
    return MESSAGE_FRAME_TYPES.has(type);
}

function updateInfinitePages(
    data: unknown,
    updater: (pages: paginatedMessages[]) => paginatedMessages[],
): unknown {
    const infinite = data as InfiniteData<paginatedMessages> | undefined;
    if (!infinite || !Array.isArray(infinite.pages)) return data;
    const pages = updater(infinite.pages);
    if (pages === infinite.pages) return data;
    return { ...infinite, pages };
}

function applyMessageFrame(
    queryClient: QueryClient,
    message: Message,
    type: string,
): void {
    if (message.entity.type === "channel") {
        queryClient.setQueryData(["messages", message.entity.id], (data) =>
            updateInfinitePages(data, (pages) => upsertMessage(pages, message) ?? pages),
        );
    } else {
        queryClient.setQueryData(["conversation-messages", message.entity.id], (data) =>
            updateInfinitePages(data, (pages) => upsertMessage(pages, message) ?? pages),
        );

        if (type === WsEvent.ConversationMessageCreated && !message.parentMsgId && !message.deletedAt) {
            queryClient.setQueriesData(
                {
                    predicate: (query) =>
                        query.queryKey.length === 1 &&
                        typeof query.queryKey[0] === "string",
                },
                (cache: Conversations | undefined) =>
                    updateConversationLastMessage(cache, message.entity.id, message),
            );
        }
    }
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
    const user = useAuth().user;
    const queryClient = useQueryClient();
    const selectedWorkspaceId = useWorkspaceStore((state) => state.selectedWorkspaceId);
    const selectedChannelId = useUIStore((state) => state.selectedChannelId);
    const selectedConversationId = useUIStore((state) => state.selectedConversationId);

    const prevChannelRef = useRef<string | null>(null);
    const prevConversationRef = useRef<string | null>(null);

    const handleFrame = useCallback(
        (frame: WsResponse) => {
            const type = frame.type;
            const data = frame.data;

            if (isMessageFrame(type) && data && typeof (data as Message).id === "string") {
                applyMessageFrame(queryClient, data as Message, type);
                return;
            }

            if (
                (type === WsEvent.ChannelMessageReaction ||
                    type === WsEvent.ConversationMessageReaction) &&
                data &&
                typeof (data as ReactionDelta).messageId === "string"
            ) {
                const delta = data as ReactionDelta;
                const keyPrefix =
                    type === WsEvent.ChannelMessageReaction
                        ? ["messages"]
                        : ["conversation-messages"];
                queryClient.setQueriesData({ queryKey: keyPrefix }, (data) =>
                    updateInfinitePages(data, (pages) => applyReactionDelta(pages, delta) ?? pages),
                );
                return;
            }

            if (type === WsEvent.PresenceUpdate && data && typeof data === "object") {
                const presence = data as PresenceRegisterData | PresenceBroadcastData;
                if ("online" in presence && Array.isArray(presence.online)) {
                    usePresenceStore
                        .getState()
                        .seedRoster(presence.workspaceId, presence.online);
                } else if ("status" in presence) {
                    usePresenceStore.getState().applyPresence(presence);
                }
                return;
            }

            if (
                (type === WsEvent.TypingStart || type === WsEvent.TypingStop) &&
                data &&
                typeof (data as TypingIndicatorData).entityId === "string"
            ) {
                const indicator = data as TypingIndicatorData;
                const workspaceId = useWorkspaceStore.getState().selectedWorkspaceId;
                const username =
                    (workspaceId
                        ? usePresenceStore.getState().roster[workspaceId]?.[
                              indicator.userId
                          ]?.username
                        : undefined) ?? indicator.userId;

                if (type === WsEvent.TypingStart) {
                    useTypingStore.getState().setTyping(indicator.entityId, indicator.userId, username);
                } else {
                    useTypingStore.getState().stopTyping(indicator.entityId, indicator.userId);
                }
                return;
            }
        },
        [queryClient],
    );

    useEffect(() => {
        const unsubscribe = realtimeSocket.onFrame(handleFrame);
        return unsubscribe;
    }, [handleFrame]);

    useEffect(() => {
        if (!user) {
            realtimeSocket.disconnect();
            return;
        }
        realtimeSocket.connect();
    }, [user]);

    const handleConnected = useCallback(() => {
        if (!selectedWorkspaceId) return;

        realtimeActions.presence(selectedWorkspaceId);

        if (selectedChannelId) {
            realtimeActions.subscribeChannel(selectedWorkspaceId, selectedChannelId);
            queryClient.invalidateQueries({ queryKey: ["messages", selectedChannelId] });
        }

        if (selectedConversationId) {
            realtimeActions.subscribeConversation(selectedConversationId);
            queryClient.invalidateQueries({
                queryKey: ["conversation-messages", selectedConversationId],
            });
        }

        queryClient.invalidateQueries({ queryKey: [selectedWorkspaceId] });
    }, [selectedWorkspaceId, selectedChannelId, selectedConversationId, queryClient]);

    useEffect(() => {
        let lastStatus = realtimeSocket.connectionStatus;

        const unsubscribe = realtimeSocket.onStatus((status) => {
            const becameOpen = lastStatus !== "open" && status === "open";
            lastStatus = status;
            if (becameOpen) void handleConnected();
        });

        return unsubscribe;
    }, [handleConnected]);

    useEffect(() => {
        const workspaceId = selectedWorkspaceId;
        if (!workspaceId) return;

        realtimeActions.presence(workspaceId);

        const prevChannel = prevChannelRef.current;
        if (prevChannel && prevChannel !== selectedChannelId) {
            realtimeActions.unsubscribeChannel(workspaceId, prevChannel);
        }
        if (selectedChannelId && selectedChannelId !== prevChannel) {
            realtimeActions.subscribeChannel(workspaceId, selectedChannelId);
        }
        prevChannelRef.current = selectedChannelId;

        const prevConversation = prevConversationRef.current;
        if (prevConversation && prevConversation !== selectedConversationId) {
            realtimeActions.unsubscribeConversation(prevConversation);
        }
        if (selectedConversationId && selectedConversationId !== prevConversation) {
            realtimeActions.subscribeConversation(selectedConversationId);
        }
        prevConversationRef.current = selectedConversationId;
    }, [selectedWorkspaceId, selectedChannelId, selectedConversationId]);

    useEffect(() => {
        return () => {
            prevChannelRef.current = null;
            prevConversationRef.current = null;
        };
    }, []);

    return children;
}