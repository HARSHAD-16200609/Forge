import { create } from "zustand";

const TYPING_EXPIRY_MS = 5_000;

type TypingUsers = Record<string, string>;
type TypingMap = Record<string, TypingUsers>;

interface TypingState {
    typing: TypingMap;
    setTyping: (entityId: string, userId: string, username: string) => void;
    stopTyping: (entityId: string, userId: string) => void;
    getUserNames: (entityId: string) => string[];
}

const expiryTimers = new Map<string, ReturnType<typeof setTimeout>>();

function timerKey(entityId: string, userId: string): string {
    return `${entityId}:${userId}`;
}

export const useTypingStore = create<TypingState>()((set, get) => ({
    typing: {},

    setTyping: (entityId, userId, username) => {
        set((state) => ({
            typing: {
                ...state.typing,
                [entityId]: { ...(state.typing[entityId] ?? {}), [userId]: username },
            },
        }));

        const existing = expiryTimers.get(timerKey(entityId, userId));
        if (existing) clearTimeout(existing);

        expiryTimers.set(
            timerKey(entityId, userId),
            setTimeout(() => {
                expiryTimers.delete(timerKey(entityId, userId));
                get().stopTyping(entityId, userId);
            }, TYPING_EXPIRY_MS),
        );
    },

    stopTyping: (entityId, userId) =>
        set((state) => {
            const users = state.typing[entityId];
            if (!users || !users[userId]) return state;
            const next = { ...users };
            delete next[userId];
            return {
                typing: {
                    ...state.typing,
                    [entityId]: next,
                },
            };
        }),

    getUserNames: (entityId) => Object.values(get().typing[entityId] ?? {}),
}));