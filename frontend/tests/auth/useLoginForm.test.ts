import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AxiosError } from "axios";
import { useLoginForm } from "../../src/features/auth/hooks/useLoginForm";
import { api } from "../../src/lib/api";

vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock("../../src/lib/api", () => ({
    api: { post: vi.fn() },
}));

const mockNavigate = vi.fn();

describe("useLoginForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("navigates to /app on successful login", async () => {
        vi.mocked(api.post).mockResolvedValue({ data: { token: "abc" } });

        const { result } = renderHook(() => useLoginForm());

        await act(async () => {
            await result.current.onSubmit({ email: "user@test.com", password: "secret" });
        });

        expect(api.post).toHaveBeenCalledWith("/auth/login", {
            email: "user@test.com",
            password: "secret",
        });
        expect(mockNavigate).toHaveBeenCalledWith("/app");
    });

    it("sets a server error message when login fails", async () => {
        vi.mocked(api.post).mockRejectedValue(
            new AxiosError("Unauthorized", "ERR_BAD_REQUEST", undefined, undefined, {
                status: 401,
                data: { message: "Invalid credentials" },
            } as never),
        );

        const { result } = renderHook(() => useLoginForm());

        await act(async () => {
            await result.current.onSubmit({ email: "user@test.com", password: "wrong" });
        });

        expect(result.current.errors.email?.message).toBe("Invalid credentials");
    });

    it("sets a generic error message when the request fails unexpectedly", async () => {
        vi.mocked(api.post).mockRejectedValue(new Error("Network down"));

        const { result } = renderHook(() => useLoginForm());

        await act(async () => {
            await result.current.onSubmit({ email: "user@test.com", password: "secret" });
        });

        expect(result.current.errors.email?.message).toBe(
            "Something went wrong. Please try again.",
        );
    });
});
