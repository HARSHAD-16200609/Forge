import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockEnv, mockSend } = vi.hoisted(() => ({
    mockEnv: {
        EMAIL_ENABLED: "true",
        RESEND_API_KEY: "re_test_key",
        MAIL_FROM: "Forge <test@mail.forrge.tech>",
    },
    mockSend: vi.fn(),
}));

vi.mock("../../../src/config/env", () => ({ env: mockEnv }));

vi.mock("resend", () => ({
    Resend: class {
        emails = { send: mockSend };
    },
}));

import { mailerService } from "../../../src/services/email/mailer";

const email = {
    to: "teammate@example.com",
    subject: "You're invited",
    html: "<p>hello</p>",
    text: "hello",
};

describe("mailerService", () => {
    beforeEach(() => {
        mockEnv.EMAIL_ENABLED = "true";
        mockEnv.RESEND_API_KEY = "re_test_key";
        mockSend.mockReset();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("sends via Resend and returns true on success", async () => {
        mockSend.mockResolvedValue({ data: { id: "email-1" }, error: null });

        const sent = await mailerService.sendEmail(email);

        expect(sent).toBe(true);
        expect(mockSend).toHaveBeenCalledWith(
            expect.objectContaining({
                from: "Forge <test@mail.forrge.tech>",
                to: "teammate@example.com",
            }),
        );
    });

    it("returns false without throwing when Resend reports an error", async () => {
        mockSend.mockResolvedValue({ data: null, error: { message: "rate limited" } });

        const sent = await mailerService.sendEmail(email);

        expect(sent).toBe(false);
    });

    it("returns false without throwing when the SDK throws", async () => {
        mockSend.mockRejectedValue(new Error("network down"));

        const sent = await mailerService.sendEmail(email);

        expect(sent).toBe(false);
    });

    it("skips sending when EMAIL_ENABLED is false", async () => {
        mockEnv.EMAIL_ENABLED = "false";

        const sent = await mailerService.sendEmail(email);

        expect(sent).toBe(false);
        expect(mockSend).not.toHaveBeenCalled();
    });

    it("skips sending when no API key is configured", async () => {
        mockEnv.RESEND_API_KEY = "";

        const sent = await mailerService.sendEmail(email);

        expect(sent).toBe(false);
        expect(mockSend).not.toHaveBeenCalled();
    });
});
