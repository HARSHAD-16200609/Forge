import { beforeEach, describe, expect, it } from "vitest";
import {
    consumeRedirectForOAuth,
    safeRedirect,
    storeRedirectForOAuth,
} from "../../src/features/auth/utils/redirect";

describe("safeRedirect", () => {
    it("allows relative paths", () => {
        expect(safeRedirect("/invite/wsi_abc123")).toBe("/invite/wsi_abc123");
    });

    it("falls back for missing, absolute, and protocol-relative targets", () => {
        expect(safeRedirect(null)).toBe("/app");
        expect(safeRedirect(undefined)).toBe("/app");
        expect(safeRedirect("")).toBe("/app");
        expect(safeRedirect("https://evil.example.com")).toBe("/app");
        expect(safeRedirect("//evil.example.com")).toBe("/app");
    });

    it("honours a custom fallback", () => {
        expect(safeRedirect(null, "/auth/login")).toBe("/auth/login");
    });
});

describe("oauth redirect round-trip", () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it("stores and consumes a safe redirect once", () => {
        storeRedirectForOAuth("/invite/wsi_abc123");

        expect(consumeRedirectForOAuth()).toBe("/invite/wsi_abc123");
        expect(consumeRedirectForOAuth()).toBe("/app");
    });

    it("falls back to /app when nothing was stored", () => {
        expect(consumeRedirectForOAuth()).toBe("/app");
    });

    it("sanitizes unsafe stored targets", () => {
        sessionStorage.setItem("forge:auth-redirect", "https://evil.example.com");

        expect(consumeRedirectForOAuth()).toBe("/app");
    });
});
