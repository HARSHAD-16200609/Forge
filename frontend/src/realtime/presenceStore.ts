import { create } from "zustand";
import type { PresenceBroadcastData, PresenceItem } from "@/features/Messages/types";

interface PresenceUser {
    username: string;
    status: "online" | "offline";
}

type Roster = Record<string, Record<string, PresenceUser>>;

interface PresenceState {
    roster: Roster;
    seedRoster: (workspaceId: string, online: PresenceItem[]) => void;
    applyPresence: (presence: PresenceBroadcastData) => void;
    clearWorkspace: (workspaceId: string) => void;
    isOnline: (workspaceId: string, userId: string) => boolean;
}

export const usePresenceStore = create<PresenceState>()((set, get) => ({
    roster: {},

    seedRoster: (workspaceId, online) =>
        set((state) => {
            const users: Record<string, PresenceUser> = {};
            for (const item of online) {
                users[item.userId] = { username: item.username, status: "online" };
            }
            const prev = state.roster[workspaceId] ?? {};
            for (const [userId, info] of Object.entries(prev)) {
                if (info.status === "offline") users[userId] = info;
            }
            return { roster: { ...state.roster, [workspaceId]: users } };
        }),

    applyPresence: (presence) =>
        set((state) => {
            const entry: PresenceUser = {
                username: presence.username,
                status: presence.status,
            };
            return {
                roster: {
                    ...state.roster,
                    [presence.workspaceId]: {
                        ...(state.roster[presence.workspaceId] ?? {}),
                        [presence.userId]: entry,
                    },
                },
            };
        }),

    clearWorkspace: (workspaceId) =>
        set((state) => {
            const roster = { ...state.roster };
            delete roster[workspaceId];
            return { roster };
        }),

    isOnline: (workspaceId, userId) =>
        get().roster[workspaceId]?.[userId]?.status === "online",
}));