import { create } from "zustand";
import type { Message } from "@/features/Messages/types";

interface ThreadState {
    parent: Message | null;
    setThread: (parent: Message) => void;
    clearThread: () => void;
}

export const useThreadStore = create<ThreadState>()((set) => ({
    parent: null,
    setThread: (parent) => set({ parent }),
    clearThread: () => set({ parent: null }),
}));