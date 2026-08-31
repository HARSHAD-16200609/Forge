import { create } from "zustand";
import { persist } from "zustand/middleware";

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
    }
  )
);