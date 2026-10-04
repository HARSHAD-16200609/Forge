import { describe, expect, it } from "vitest";
import {
    CHANNEL_NAME_MAX,
    isValidChannelName,
    normalizeChannelName,
} from "../../src/features/Channel/types";

describe("normalizeChannelName", () => {
    it("trims surrounding whitespace", () => {
        expect(normalizeChannelName("  design  ")).toBe("design");
    });

    it("lowercases the name", () => {
        expect(normalizeChannelName("GENERAL")).toBe("general");
    });

    it("strips leading hash characters", () => {
        expect(normalizeChannelName("##design")).toBe("design");
    });

    it("collapses internal whitespace into single dashes", () => {
        expect(normalizeChannelName("design   review")).toBe("design-review");
    });

    it("handles hash, casing and spaces together", () => {
        expect(normalizeChannelName(" # Design Review ")).toBe("design-review");
    });

    it("returns an empty string for blank input", () => {
        expect(normalizeChannelName("   ")).toBe("");
    });

    it("returns an empty string for a lone hash", () => {
        expect(normalizeChannelName("#")).toBe("");
    });

    it("leaves an already normalized name untouched", () => {
        expect(normalizeChannelName("design-review")).toBe("design-review");
    });
});

describe("isValidChannelName", () => {
    it("accepts a normalized name", () => {
        expect(isValidChannelName("#Design Review")).toBe(true);
    });

    it("rejects a name that normalizes to nothing", () => {
        expect(isValidChannelName("#")).toBe(false);
    });

    it("rejects a name longer than the limit", () => {
        expect(isValidChannelName("a".repeat(CHANNEL_NAME_MAX + 1))).toBe(false);
    });

    it("accepts a name exactly at the limit", () => {
        expect(isValidChannelName("a".repeat(CHANNEL_NAME_MAX))).toBe(true);
    });
});