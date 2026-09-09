import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTypingStore } from "@/realtime/typingStore";

describe("useTypingStore", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        useTypingStore.setState({ typing: {} });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("records a typing user for an entity", () => {
        useTypingStore.getState().setTyping("ch-1", "u1", "harshad");
        expect(useTypingStore.getState().getUserNames("ch-1")).toEqual(["harshad"]);
    });

    it("tracks multiple users per entity independently", () => {
        useTypingStore.getState().setTyping("ch-1", "u1", "harshad");
        useTypingStore.getState().setTyping("ch-1", "u2", "kim");
        useTypingStore.getState().setTyping("ch-2", "u1", "harshad");

        expect(useTypingStore.getState().getUserNames("ch-1")).toEqual(["harshad", "kim"]);
        expect(useTypingStore.getState().getUserNames("ch-2")).toEqual(["harshad"]);
    });

    it("expires typing after 5 seconds", () => {
        useTypingStore.getState().setTyping("ch-1", "u1", "harshad");
        vi.advanceTimersByTime(5_001);
        expect(useTypingStore.getState().getUserNames("ch-1")).toEqual([]);
    });

    it("resets the expiry when the same user types again", () => {
        useTypingStore.getState().setTyping("ch-1", "u1", "harshad");
        vi.advanceTimersByTime(3_000);
        useTypingStore.getState().setTyping("ch-1", "u1", "harshad");
        vi.advanceTimersByTime(3_000);
        expect(useTypingStore.getState().getUserNames("ch-1")).toEqual(["harshad"]);
        vi.advanceTimersByTime(2_001);
        expect(useTypingStore.getState().getUserNames("ch-1")).toEqual([]);
    });

    it("stopTyping removes only the given user", () => {
        useTypingStore.getState().setTyping("ch-1", "u1", "harshad");
        useTypingStore.getState().setTyping("ch-1", "u2", "kim");
        useTypingStore.getState().stopTyping("ch-1", "u1");
        expect(useTypingStore.getState().getUserNames("ch-1")).toEqual(["kim"]);
    });
});