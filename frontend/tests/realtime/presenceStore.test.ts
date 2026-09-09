import { beforeEach, describe, expect, it } from "vitest";
import { usePresenceStore } from "@/realtime/presenceStore";

describe("usePresenceStore", () => {
    beforeEach(() => {
        usePresenceStore.setState({ roster: {} });
    });

    it("seeds a roster from the presence register payload", () => {
        usePresenceStore
            .getState()
            .seedRoster("ws-1", [
                { userId: "u1", username: "harshad" },
                { userId: "u2", username: "kim" },
            ]);

        expect(usePresenceStore.getState().isOnline("ws-1", "u1")).toBe(true);
        expect(usePresenceStore.getState().isOnline("ws-1", "u2")).toBe(true);
        expect(usePresenceStore.getState().isOnline("ws-1", "u3")).toBe(false);
    });

    it("keeps previously-offline users after seeding", () => {
        usePresenceStore.getState().applyPresence({
            workspaceId: "ws-1",
            userId: "u9",
            username: "dan",
            status: "offline",
        });
        usePresenceStore
            .getState()
            .seedRoster("ws-1", [
                { userId: "u1", username: "harshad" },
                { userId: "u2", username: "kim" },
            ]);

        expect(usePresenceStore.getState().isOnline("ws-1", "u9")).toBe(false);
        expect(usePresenceStore.getState().isOnline("ws-1", "u1")).toBe(true);
    });

    it("applies online/offline presence broadcasts", () => {
        usePresenceStore
            .getState()
            .seedRoster("ws-1", [{ userId: "u1", username: "harshad" }]);

        usePresenceStore.getState().applyPresence({
            workspaceId: "ws-1",
            userId: "u1",
            username: "harshad",
            status: "offline",
        });
        expect(usePresenceStore.getState().isOnline("ws-1", "u1")).toBe(false);

        usePresenceStore.getState().applyPresence({
            workspaceId: "ws-1",
            userId: "u1",
            username: "harshad",
            status: "online",
        });
        expect(usePresenceStore.getState().isOnline("ws-1", "u1")).toBe(true);
    });

    it("isolates rosters per workspace", () => {
        usePresenceStore
            .getState()
            .seedRoster("ws-1", [{ userId: "u1", username: "harshad" }]);
        usePresenceStore
            .getState()
            .seedRoster("ws-2", [{ userId: "u1", username: "harshad" }]);

        usePresenceStore.getState().applyPresence({
            workspaceId: "ws-1",
            userId: "u1",
            username: "harshad",
            status: "offline",
        });

        expect(usePresenceStore.getState().isOnline("ws-1", "u1")).toBe(false);
        expect(usePresenceStore.getState().isOnline("ws-2", "u1")).toBe(true);
    });

    it("clears a workspace roster", () => {
        usePresenceStore
            .getState()
            .seedRoster("ws-1", [{ userId: "u1", username: "harshad" }]);
        usePresenceStore.getState().clearWorkspace("ws-1");
        expect(usePresenceStore.getState().roster["ws-1"]).toBeUndefined();
    });
});