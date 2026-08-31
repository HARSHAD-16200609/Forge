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
}

const MIN_WIDTH = 220;
const MAX_WIDTH = 420;
const DEFAULT_WIDTH = 320;

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
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
