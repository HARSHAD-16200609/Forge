import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ComposerState {
    drafts: Record<string, string>;
    saveDraft: (channelId: string, contentJson: string) => void;
    clearDraft: (channelId: string) => void;
    getDraft: (channelId: string) => string;
}

export const useComposerStore = create<ComposerState>()(
    persist(
        (set, get) => ({
            drafts: {},
            saveDraft: (channelId, contentJson) =>
                set((state) => ({ drafts: { ...state.drafts, [channelId]: contentJson } })),
            clearDraft: (channelId) =>
                set((state) => {
                    if (!state.drafts[channelId]) return state;
                    const drafts = { ...state.drafts };
                    delete drafts[channelId];
                    return { drafts };
                }),
            getDraft: (channelId) => get().drafts[channelId] ?? "",
        }),
        { name: "composer-drafts" },
    ),
);
