import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
    activeSection: string;
    setActiveSection: (section: string) => void;
    collapsedSections: Record<string, boolean>;
    toggleSection: (title: string) => void;
    expandSection: (title: string) => void;
    collapseSection: (title: string) => void;
    resetSections: () => void;
    searchValue: string;
    setSearchValue: (value: string) => void;
    sidebarWidth: number;
    setSidebarWidth: (width: number) => void;
    selectedChannelId: string | null;
    setSelectedChannelId: (id: string) => void;
    clearSelectedChannelId: () => void;
    selectedConversationId: string | null;
    selectedConversationType: "DM" | "GDM" | null;
    setSelectedConversation: (id: string, type: "DM" | "GDM") => void;
    clearSelectedConversation: () => void;
}

const MIN_WIDTH = 220;
const MAX_WIDTH = 420;
const DEFAULT_WIDTH = 320;

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            selectedChannelId: null,
            setSelectedChannelId: (id) =>
                set({
                    selectedChannelId: id,
                    selectedConversationId: null,
                    selectedConversationType: null,
                }),
            clearSelectedChannelId: () =>
                set({
                    selectedChannelId: null,
                }),
            selectedConversationId: null,
            selectedConversationType: null,
            setSelectedConversation: (id, type) =>
                set({
                    selectedConversationId: id,
                    selectedConversationType: type,
                    selectedChannelId: null,
                }),
            clearSelectedConversation: () =>
                set({
                    selectedConversationId: null,
                    selectedConversationType: null,
                }),
            activeSection: "home",
            setActiveSection: (section) =>
                set({
                    activeSection: section,
                }),

            collapsedSections: {},
            toggleSection: (title) =>
                set((state) => ({
                    collapsedSections: {
                        ...state.collapsedSections,
                        [title]: !state.collapsedSections[title],
                    },
                })),
            expandSection: (title) =>
                set((state) => ({
                    collapsedSections: { ...state.collapsedSections, [title]: false },
                })),
            collapseSection: (title) =>
                set((state) => ({
                    collapsedSections: { ...state.collapsedSections, [title]: true },
                })),
            resetSections: () => set({ collapsedSections: {} }),

            searchValue: "",
            setSearchValue: (value) =>
                set({
                    searchValue: value,
                }),

            sidebarWidth: DEFAULT_WIDTH,
            setSidebarWidth: (width) =>
                set({
                    sidebarWidth: Math.min(Math.max(width, MIN_WIDTH), MAX_WIDTH),
                }),
        }),

        {
            name: "ui-state",
        },
    ),
);
