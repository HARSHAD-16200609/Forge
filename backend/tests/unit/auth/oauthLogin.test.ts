import { afterEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("../../../src/modules/Auth/auth.repository", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../../../src/modules/Auth/auth.repository")>();
    return {
        ...actual,
        authRepository: {
            getOAuthUser: vi.fn(),
            findUserByEmail: vi.fn(),
            findUserByUsername: vi.fn(),
            createOAuthUserWithAccount: vi.fn(),
            createOAuthAccount: vi.fn(),
            createSession: vi.fn(),
        },
    };
});

import { authRepository } from "../../../src/modules/Auth/auth.repository";
import { authService } from "../../../src/modules/Auth/auth.service";
import type { OAuthProfile } from "../../../src/types/auth";

const profile: OAuthProfile = {
    provider: "Google",
    providerId: "google-sub-123",
    email: "johndoe@example.com",
    name: "John Doe",
    picture: null,
};

const userMetaData = { ip: "127.0.0.1", userAgent: "vitest" };

describe("authService.oauthLogin", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("creates a user, links an OAuth account and issues tokens on first sign-in", async () => {
        (authRepository.getOAuthUser as Mock).mockResolvedValue(null);
        (authRepository.findUserByEmail as Mock).mockResolvedValue(null);
        (authRepository.findUserByUsername as Mock).mockResolvedValue(null);
        (authRepository.createOAuthUserWithAccount as Mock).mockResolvedValue({
            id: "user-1",
            username: "johndoe",
            email: "johndoe@example.com",
            name: "John Doe",
        });
        (authRepository.createSession as Mock).mockResolvedValue({ id: "session-1" });

        const result = await authService.oauthLogin(profile, userMetaData);

        expect(authRepository.createOAuthUserWithAccount).toHaveBeenCalledOnce();
        expect(authRepository.createOAuthUserWithAccount).toHaveBeenCalledWith(
            expect.objectContaining({
                username: "johndoe",
                email: "johndoe@example.com",
                name: "John Doe",
            }),
            { provider: "Google", providerId: "google-sub-123" }
        );
        expect(authRepository.createOAuthAccount).not.toHaveBeenCalled();
        expect(authRepository.createSession).toHaveBeenCalledOnce();

        expect(result).toMatchObject({ userId: "user-1", email: "johndoe@example.com" });
        expect(result?.accessToken).toBeTypeOf("string");
        expect(result?.refreshToken).toBeTypeOf("string");
    });

    it("links an OAuth account to an existing user without creating a new user", async () => {
        (authRepository.getOAuthUser as Mock).mockResolvedValue(null);
        (authRepository.findUserByEmail as Mock).mockResolvedValue({
            id: "user-2",
            username: "johndoe",
            name: "John Doe",
        });
        (authRepository.createOAuthAccount as Mock).mockResolvedValue({
            id: "oauth-1",
            userId: "user-2",
        });
        (authRepository.createSession as Mock).mockResolvedValue({ id: "session-2" });

        const result = await authService.oauthLogin(profile, userMetaData);

        expect(authRepository.createOAuthUserWithAccount).not.toHaveBeenCalled();
        expect(authRepository.createOAuthAccount).toHaveBeenCalledOnce();
        expect(authRepository.createOAuthAccount).toHaveBeenCalledWith({
            provider: "Google",
            providerId: "google-sub-123",
            userId: "user-2",
        });
        expect(result).toMatchObject({ userId: "user-2" });
    });

    it("logs in an existing OAuth user without creating anything", async () => {
        (authRepository.getOAuthUser as Mock).mockResolvedValue({
            id: "oauth-2",
            userId: "user-3",
            user: {
                id: "user-3",
                username: "johndoe",
                email: "johndoe@example.com",
                name: "John Doe",
            },
        });
        (authRepository.createSession as Mock).mockResolvedValue({ id: "session-3" });

        const result = await authService.oauthLogin(profile, userMetaData);

        expect(authRepository.createOAuthUserWithAccount).not.toHaveBeenCalled();
        expect(authRepository.createOAuthAccount).not.toHaveBeenCalled();
        expect(authRepository.createSession).toHaveBeenCalledOnce();
        expect(result).toMatchObject({ userId: "user-3" });
    });

    it("generates a unique username by padding short email prefixes", async () => {
        (authRepository.getOAuthUser as Mock).mockResolvedValue(null);
        (authRepository.findUserByEmail as Mock).mockResolvedValue(null);
        (authRepository.findUserByUsername as Mock).mockResolvedValue(null);
        (authRepository.createOAuthUserWithAccount as Mock).mockResolvedValue({
            id: "user-4",
            username: "ab____",
            email: "ab@example.com",
            name: "AB",
        });
        (authRepository.createSession as Mock).mockResolvedValue({ id: "session-4" });

        await authService.oauthLogin({
            ...profile,
            email: "ab@example.com",
        }, userMetaData);

        expect(authRepository.createOAuthUserWithAccount).toHaveBeenCalledWith(
            expect.objectContaining({ username: "ab____" }),
            expect.anything()
        );
    });
});