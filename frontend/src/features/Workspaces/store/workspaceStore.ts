import { create } from "zustand"

interface workspaceState {
    selectedWorkspaceId: string | null;
    setSelectedWorkspaceId: (workspaceId: string) => void;
    clearSelectedWorkpsaceId: () => void
}


export const useworkspaceStore = create<workspaceState>((set) => ({
    selectedWorkspaceId: null,
    setSelectedWorkspaceId: (workspaceId) => {
        set({
            selectedWorkspaceId: workspaceId
        })
    },
    clearSelectedWorkpsaceId: () => {
        set({
            selectedWorkspaceId: null
        })
    }
}

))


