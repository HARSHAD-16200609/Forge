import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WorkspaceState {
  selectedWorkspaceId: string | null;
  setSelectedWorkspaceId: (workspaceId: string) => void;
  clearSelectedWorkspaceId: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: "active-workspace-id",
    }
  )
);