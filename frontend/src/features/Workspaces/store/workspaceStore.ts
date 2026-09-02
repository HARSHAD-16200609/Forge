import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useUIStore } from "@/stores/uiStore";

interface WorkspaceState {
    selectedWorkspaceId: string | null;
    setSelectedWorkspaceId: (workspaceId: string) => void;
    clearSelectedWorkspaceId: () => void;
    showCreateWorkspaceForm: boolean;
    setShowCreateWorkspaceForm: (show: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
    persist(
        (set) => ({
            showCreateWorkspaceForm: false,
            selectedWorkspaceId: null,

            setSelectedWorkspaceId: (workspaceId) => {
                useUIStore.getState().clearSelectedConversation();
                set({
                    selectedWorkspaceId: workspaceId,
                });
            },

            clearSelectedWorkspaceId: () => {
                set({
                    selectedWorkspaceId: null,
                });
            },

            setShowCreateWorkspaceForm: (show) => {
                set({
                    showCreateWorkspaceForm: show,
                });
            },
        }),
        {
            name: "active-workspace-id",
        },
    ),
);
